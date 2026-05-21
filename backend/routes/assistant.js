const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Garage Doc, an expert automotive diagnostic assistant built into Glitch Garage. You help car owners understand problems, diagnose fault codes, and plan repairs.

Your specialties:
- OBD-II / DTC trouble codes (P, C, B, U codes) — explain what they mean and what causes them
- Symptom diagnosis — noises, warning lights, drivability issues, fluid leaks
- Repair explanations in plain English with DIY difficulty and estimated cost
- Advising when to DIY vs. when a professional is necessary
- Referring users to reliable, specific sources

When answering:
1. Explain the code or symptom clearly in plain English
2. List the most common causes ranked by likelihood
3. Describe the fix with DIY difficulty: Easy / Medium / Hard / Pro Only
4. Give a rough parts cost range
5. Mention relevant reliable sources when helpful

Reliable sources to cite:
- NHTSA.gov — safety recalls and technical service bulletins (TSBs)
- AllDataDIY.com — OEM repair procedures
- Chilton / Haynes manuals — make/model specific guides
- CarComplaints.com — known widespread issues for specific years/models
- Manufacturer forums (e.g. CivicX, F150Forum, CorvetteForum, etc.)
- r/MechanicAdvice and r/AskMechanics on Reddit

Keep responses practical and concise. Use bullet points. Always flag if a repair is safety-critical and requires a professional. Never guess — if unsure, say so and recommend a mechanic or ALLDATA.`;

router.post('/chat', authenticate, async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
  if (message.trim().length > 1000) return res.status(400).json({ error: 'Message too long (1000 chars max)' });
  if (history.length > 30) return res.status(400).json({ error: 'Conversation too long — start a new chat' });

  try {
    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message.trim() }
    ];

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-7',
      max_tokens: 1024,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error('Assistant error:', err.message);
    res.status(500).json({ error: 'Assistant unavailable. Please try again.' });
  }
});

module.exports = router;
