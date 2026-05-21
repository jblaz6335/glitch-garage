import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const WELCOME = {
  role: 'assistant',
  content: "Hey! I'm Garage Doc 🔧 — your AI car assistant.\n\nAsk me about warning lights, diagnostic codes (like P0420), weird noises, or anything going wrong with your ride. I'll explain what it means, what causes it, and how to fix it."
};

export default function AssistantWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  if (!user) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Send history minus the welcome message
      const history = newMessages
        .slice(1, -1) // exclude welcome + latest user msg
        .map(m => ({ role: m.role, content: m.content }));

      const res = await axios.post('/api/assistant/chat', { message: text, history });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.error || '⚠️ Something went wrong. Try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => setMessages([WELCOME]);

  return (
    <div className="assistant-wrap">
      {/* Expanded chat panel */}
      {open && (
        <div className="assistant-panel">
          <div className="assistant-header">
            <div className="assistant-header-left">
              <span className="assistant-icon">🔧</span>
              <div>
                <div className="assistant-title">GARAGE DOC</div>
                <div className="assistant-subtitle">AI Car Assistant</div>
              </div>
            </div>
            <div className="assistant-header-right">
              <button className="assistant-clear" onClick={clearChat} title="Clear chat">↺</button>
              <button className="assistant-close" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          <div className="assistant-messages">
            {messages.map((m, i) => (
              <div key={i} className={`assistant-msg assistant-msg-${m.role}`}>
                {m.role === 'assistant' && <span className="assistant-msg-icon">🔧</span>}
                <div className="assistant-msg-text">
                  {m.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="assistant-msg assistant-msg-assistant">
                <span className="assistant-msg-icon">🔧</span>
                <div className="assistant-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="assistant-input-row">
            <textarea
              ref={inputRef}
              className="assistant-input"
              placeholder="Ask about a code, symptom, or noise..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              maxLength={1000}
              disabled={loading}
            />
            <button
              className="assistant-send"
              onClick={send}
              disabled={loading || !input.trim()}
            >
              {loading ? '...' : '→'}
            </button>
          </div>
          <div className="assistant-footer">Press Enter to send · Shift+Enter for new line</div>
        </div>
      )}

      {/* Toggle button */}
      <button
        className={`assistant-toggle ${open ? 'assistant-toggle-open' : ''}`}
        onClick={() => setOpen(v => !v)}
        title="Garage Doc — AI Car Assistant"
      >
        {open ? '✕' : '🔧'}
        {!open && <span className="assistant-toggle-label">GARAGE DOC</span>}
      </button>
    </div>
  );
}
