import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import GlitchText from '../components/GlitchText';

const POLL_MS   = 3500;
const MAX_LEN   = 300;
const COOLDOWN  = 8;

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages]     = useState([]);
  const [pinned, setPinned]         = useState([]);
  const [input, setInput]           = useState('');
  const [sending, setSending]       = useState(false);
  const [cooldown, setCooldown]     = useState(0);
  const [error, setError]           = useState('');
  const [loadError, setLoadError]   = useState('');
  const [reported, setReported]     = useState(new Set());

  const lastIdRef    = useRef(-1);   // -1 = not yet loaded
  const bottomRef    = useRef(null);
  const pollRef      = useRef(null);
  const cdTimerRef   = useRef(null);
  const atBottomRef  = useRef(true);

  // ── initial load ──────────────────────────────────────────────────────────
  const loadInitial = useCallback(async () => {
    try {
      const [msgRes, pinRes] = await Promise.all([
        axios.get('/api/chat/messages'),
        axios.get('/api/chat/pinned'),
      ]);
      const msgs = msgRes.data.messages || [];
      setMessages(msgs);
      lastIdRef.current = msgs.length ? msgs[msgs.length - 1].id : 0;
      setPinned(pinRes.data.pinned || []);
    } catch {
      setLoadError('Could not connect to chat. Refresh to try again.');
    }
  }, []);

  // ── polling ───────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    if (lastIdRef.current < 0) return;
    try {
      const res = await axios.get(`/api/chat/messages?after=${lastIdRef.current}`);
      const newMsgs = res.data.messages || [];
      if (newMsgs.length) {
        setMessages(prev => [...prev, ...newMsgs]);
        lastIdRef.current = newMsgs[newMsgs.length - 1].id;
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadInitial();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadInitial, poll]);

  // ── auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (atBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ── cooldown ticker ───────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    cdTimerRef.current = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(cdTimerRef.current);
  }, [cooldown]);

  const handleScroll = e => {
    const el = e.currentTarget;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  // ── send ──────────────────────────────────────────────────────────────────
  const send = async () => {
    const text = input.trim();
    if (!text || sending || cooldown > 0) return;
    setSending(true);
    setError('');
    try {
      const res = await axios.post('/api/chat/messages', { content: text });
      setMessages(prev => [...prev, res.data]);
      lastIdRef.current = res.data.id;
      setInput('');
      setCooldown(COOLDOWN);
      atBottomRef.current = true;
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch (err) {
      const wait = err.response?.data?.wait;
      if (wait) setCooldown(wait);
      setError(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── admin / moderation actions ────────────────────────────────────────────
  const deleteMsg = async id => {
    try {
      await axios.delete(`/api/chat/messages/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
      setPinned(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  const reportMsg = async id => {
    if (reported.has(id)) return;
    try {
      await axios.post(`/api/chat/messages/${id}/report`);
      setReported(prev => new Set([...prev, id]));
    } catch {}
  };

  const pinMsg = async id => {
    try {
      await axios.patch(`/api/chat/messages/${id}/pin`);
      const res = await axios.get('/api/chat/pinned');
      setPinned(res.data.pinned || []);
      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, is_pinned: m.is_pinned ? 0 : 1 } : m)
      );
    } catch {}
  };

  const formatTime = ts => {
    const d = new Date(ts.endsWith('Z') ? ts : ts + 'Z');
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="page-chat">
      <div className="chat-layout">

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <GlitchText text="GARAGE CHAT" tag="h2" className="chat-title" />
            <span className="chat-subtitle">Global · Everyone on Glitch Garage</span>
          </div>
          <div className="chat-online-dot" title="Live" />
        </div>

        {/* Pinned announcements */}
        {pinned.length > 0 && (
          <div className="chat-pinned">
            {pinned.map(p => (
              <div key={p.id} className="chat-pin-bar">
                <span className="chat-pin-icon">📌</span>
                <span className="chat-pin-text">{p.content}</span>
                <span className="chat-pin-by">— {p.username}</span>
                {user?.is_admin && (
                  <button className="chat-pin-dismiss" onClick={() => pinMsg(p.id)} title="Unpin">✕</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="chat-messages" onScroll={handleScroll}>
          {loadError && <div className="chat-load-error">{loadError}</div>}
          {!loadError && messages.length === 0 && lastIdRef.current >= 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">🏁</div>
              <p>No messages yet — be the first to post!</p>
            </div>
          )}
          {messages.map((m, i) => {
            const prevMsg = messages[i - 1];
            const sameUser = prevMsg && prevMsg.user_id === m.user_id &&
              (new Date(m.created_at + 'Z') - new Date(prevMsg.created_at + 'Z')) < 5 * 60 * 1000;
            return (
              <MessageRow
                key={m.id}
                msg={m}
                compact={sameUser}
                isMe={m.user_id === user?.id}
                isAdmin={!!user?.is_admin}
                reported={reported.has(m.id)}
                onDelete={deleteMsg}
                onReport={reportMsg}
                onPin={pinMsg}
                formatTime={formatTime}
              />
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          {error && <div className="chat-send-error">{error}</div>}
          <div className="chat-input-row">
            <textarea
              className="chat-input"
              placeholder={
                cooldown > 0
                  ? `Wait ${cooldown}s before sending again…`
                  : 'Say something to the garage…'
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              maxLength={MAX_LEN}
              rows={2}
              disabled={sending || cooldown > 0}
            />
            <button
              className="chat-send-btn"
              onClick={send}
              disabled={sending || cooldown > 0 || !input.trim()}
            >
              {cooldown > 0 ? <span className="chat-cd">{cooldown}</span> : sending ? '…' : '→'}
            </button>
          </div>
          <div className="chat-input-footer">
            <span className={input.length > MAX_LEN * 0.85 ? 'chat-char-warn' : ''}>
              {input.length}/{MAX_LEN}
            </span>
            <span>Enter to send · Shift+Enter for new line</span>
          </div>
        </div>

      </div>
    </main>
  );
}

// ── Message row ────────────────────────────────────────────────────────────
function MessageRow({ msg, compact, isMe, isAdmin, reported, onDelete, onReport, onPin, formatTime }) {
  return (
    <div className={`chat-msg${isMe ? ' chat-msg-me' : ''}${compact ? ' chat-msg-compact' : ''}`}>
      <div className="chat-msg-avatar-col">
        {!compact && (
          <div className="chat-msg-avatar">
            {msg.username?.[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <div className="chat-msg-body">
        {!compact && (
          <div className="chat-msg-meta">
            <span className="chat-msg-user">{msg.username}</span>
            {msg.car_info && (
              <span className="chat-msg-car">🚗 {msg.car_info}</span>
            )}
            {msg.is_pinned ? <span className="chat-pin-badge">📌</span> : null}
            <span className="chat-msg-time">{formatTime(msg.created_at)}</span>
            {isAdmin && msg.report_count > 0 && (
              <span className="chat-report-count">⚠ {msg.report_count}</span>
            )}
          </div>
        )}
        {compact && (
          <span className="chat-msg-time chat-msg-time-inline">
            {formatTime(msg.created_at)}
          </span>
        )}
        <div className="chat-msg-text">{msg.content}</div>
      </div>
      <div className="chat-msg-actions">
        {!isMe && (
          <button
            className={`chat-act${reported ? ' chat-act-done' : ''}`}
            onClick={() => onReport(msg.id)}
            title={reported ? 'Reported' : 'Report'}
            disabled={reported}
          >
            {reported ? '✓' : '⚑'}
          </button>
        )}
        {isAdmin && (
          <>
            <button
              className="chat-act"
              onClick={() => onPin(msg.id)}
              title={msg.is_pinned ? 'Unpin' : 'Pin'}
            >📌</button>
            <button
              className="chat-act chat-act-del"
              onClick={() => onDelete(msg.id)}
              title="Delete"
            >✕</button>
          </>
        )}
      </div>
    </div>
  );
}
