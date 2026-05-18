const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { getDB, rowToObject, rowsToObjects } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FREE_BUILDS_PER_DAY = 2;

const SYSTEM_PROMPT = `You are Glitch Garage AI, an expert automotive performance and modification consultant with encyclopedic knowledge of car tuning, modification platforms, aftermarket parts, and enthusiast culture. You help car enthusiasts plan and execute builds within their budget.

When given a car and budget, you MUST return ONLY valid JSON with NO markdown code blocks, NO preamble, NO trailing text. Return exactly this JSON structure:

{
  "vehicle": {
    "year": "string",
    "make": "string",
    "model": "string",
    "overview": "2-3 sentence description of this car's modification potential and community reputation"
  },
  "budget": {
    "summary": "2-3 sentences describing this build tier's philosophy and what the driver will experience",
    "total_cost": 0,
    "estimated_hp_gain": null,
    "difficulty": "Easy|Medium|Hard|Pro",
    "time_estimate": "e.g. 2-4 weekends",
    "pros": ["list of 2-3 pros"],
    "cons": ["list of 1-2 cons"],
    "modifications": [
      {
        "name": "specific part or modification name",
        "description": "what it does, why it's worth it, expected gains",
        "cost": 0,
        "install_notes": "brief install tip or caveat",
        "sources": [
          { "name": "RockAuto", "url": "https://www.rockauto.com/en/catalog/[make],[model]", "type": "new" },
          { "name": "eBay Motors", "url": "https://www.ebay.com/sch/i.html?_nkw=[part+year+make+model]&_sacat=6030", "type": "used" }
        ]
      }
    ]
  },
  "midrange": {
    "summary": "...",
    "total_cost": 0,
    "estimated_hp_gain": null,
    "difficulty": "Easy|Medium|Hard|Pro",
    "time_estimate": "...",
    "pros": [...],
    "cons": [...],
    "modifications": [...]
  },
  "fullsend": {
    "summary": "...",
    "total_cost": 0,
    "estimated_hp_gain": null,
    "difficulty": "Easy|Medium|Hard|Pro",
    "time_estimate": "...",
    "pros": [...],
    "cons": [...],
    "modifications": [...]
  },
  "notes": "optional overall caveat or disclaimer (can be null)"
}

STRICT RULES:
- budget tier: spend 20-35% of budget on best bang-for-buck mods (3-5 mods)
- midrange tier: spend 50-70% of budget on balanced performance (4-6 mods)
- fullsend tier: spend 85-100% of budget on maximum performance (5-8 mods)
- Use REAL part names, real brands, and accurate current market prices
- estimated_hp_gain should be a realistic integer (or null if not applicable)
- total_cost must equal sum of all mod cost values
- Source URLs: construct real search URLs with the part name, year, make, model as search terms
- Sources: RockAuto, Amazon, eBay Motors, Summit Racing, brand-specific sites (type: new/used/junkyard)
- Tailor ALL recommendations specifically to this car's known platform and enthusiast community
- Only return valid JSON, nothing else`;

router.get('/remaining', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.execute({
      sql: "SELECT COUNT(*) as count FROM builds WHERE user_id = ? AND date(created_at) = date('now')",
      args: [req.user.id]
    });
    const { count } = rowToObject(result);
    res.json({ remaining: Math.max(0, FREE_BUILDS_PER_DAY - count), limit: FREE_BUILDS_PER_DAY });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get remaining builds' });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.execute({
      sql: 'SELECT id, year, make, model, budget, zip_code, tokens_used, result, created_at FROM builds WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      args: [req.user.id]
    });
    res.json({ builds: rowsToObjects(result) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.execute({
      sql: 'SELECT * FROM builds WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });
    const build = rowToObject(result);
    if (!build) return res.status(404).json({ error: 'Build not found' });
    try {
      res.json({ ...build, result: JSON.parse(build.result) });
    } catch {
      res.json(build);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load build' });
  }
});

router.post('/generate', authenticate, async (req, res) => {
  const { year, make, model, budget, zip_code, goals, notes } = req.body;

  if (!year || !make || !model || !budget) {
    return res.status(400).json({ error: 'Year, make, model, and budget are required' });
  }
  const budgetNum = parseFloat(budget);
  if (isNaN(budgetNum) || budgetNum < 100 || budgetNum > 1000000) {
    return res.status(400).json({ error: 'Budget must be between $100 and $1,000,000' });
  }

  try {
    const db = getDB();

    const countResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM builds WHERE user_id = ? AND date(created_at) = date('now')",
      args: [req.user.id]
    });
    const todayBuilds = rowToObject(countResult).count;

    if (todayBuilds >= FREE_BUILDS_PER_DAY) {
      return res.status(429).json({
        error: `Daily limit reached. You get ${FREE_BUILDS_PER_DAY} free builds per day. Come back tomorrow!`
      });
    }

    let userMessage = `Generate 3-tier build plans for a ${year} ${make} ${model} with a total budget of $${budgetNum.toLocaleString()}.`;
    if (goals) userMessage += ` Build goal: ${goals}.`;
    if (notes) userMessage += ` Additional notes: ${notes}`;
    if (zip_code) userMessage += ` Owner is near zip code ${zip_code}.`;
    userMessage += ' Return JSON only.';

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-7',
      max_tokens: 8192,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [{ role: 'user', content: userMessage }]
    });

    const rawContent = response.content[0].text;
    let buildData;

    // Strip markdown code fences (Haiku/Sonnet sometimes wrap output in ```json ... ```)
    const stripped = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    try {
      buildData = JSON.parse(stripped);
    } catch {
      // Last resort: grab the outermost {...} block
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        buildData = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Unparseable response:', rawContent.slice(0, 300));
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    const usage = response.usage;
    const tokensUsed = (usage.input_tokens || 0) + (usage.output_tokens || 0);

    const buildResult = await db.execute({
      sql: 'INSERT INTO builds (user_id, year, make, model, budget, zip_code, result, tokens_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [req.user.id, String(year), make, model, budgetNum, zip_code || null, JSON.stringify(buildData), tokensUsed]
    });

    await db.execute({
      sql: 'INSERT INTO api_usage (user_id, endpoint, tokens_input, tokens_output, tokens_cache_read, tokens_cache_creation) VALUES (?, ?, ?, ?, ?, ?)',
      args: [
        req.user.id, 'builds/generate',
        usage.input_tokens || 0,
        usage.output_tokens || 0,
        usage.cache_read_input_tokens || 0,
        usage.cache_creation_input_tokens || 0
      ]
    });

    res.json({
      buildId: Number(buildResult.lastInsertRowid),
      build: buildData,
      meta: {
        tokensUsed,
        cacheHit: (usage.cache_read_input_tokens || 0) > 0,
        buildsToday: todayBuilds + 1,
        buildsRemaining: Math.max(0, FREE_BUILDS_PER_DAY - todayBuilds - 1)
      }
    });
  } catch (err) {
    console.error('Build generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate build plan. Please try again.' });
  }
});

module.exports = router;
