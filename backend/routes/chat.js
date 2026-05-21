const express = require('express');
const { getDB, rowToObject, rowsToObjects } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const COOLDOWN_MS = 8000;   // 8 seconds between messages
const MAX_LENGTH  = 300;    // max chars per message
const PAGE_SIZE   = 75;     // messages on initial load

// GET /api/chat/messages          → initial load (last PAGE_SIZE, chronological)
// GET /api/chat/messages?after=N  → poll for messages with id > N
router.get('/messages', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const after = req.query.after !== undefined ? Number(req.query.after) : null;

    let sql, args;
    if (after !== null) {
      sql = `
        SELECT gcm.id, gcm.user_id, gcm.content, gcm.car_info,
               gcm.created_at, gcm.is_pinned, u.username,
               (SELECT COUNT(*) FROM chat_reports WHERE message_id = gcm.id) AS report_count
        FROM global_chat_messages gcm
        JOIN users u ON u.id = gcm.user_id
        WHERE gcm.is_deleted = 0 AND gcm.id > ?
        ORDER BY gcm.created_at ASC
        LIMIT 100`;
      args = [after];
    } else {
      sql = `
        SELECT gcm.id, gcm.user_id, gcm.content, gcm.car_info,
               gcm.created_at, gcm.is_pinned, u.username,
               (SELECT COUNT(*) FROM chat_reports WHERE message_id = gcm.id) AS report_count
        FROM global_chat_messages gcm
        JOIN users u ON u.id = gcm.user_id
        WHERE gcm.is_deleted = 0
        ORDER BY gcm.created_at DESC
        LIMIT ?`;
      args = [PAGE_SIZE];
    }

    const result = await db.execute({ sql, args });
    let messages = rowsToObjects(result);
    if (after === null) messages = messages.reverse(); // oldest → newest
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// GET /api/chat/pinned
router.get('/pinned', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.execute({
      sql: `SELECT gcm.id, gcm.content, gcm.created_at, u.username
            FROM global_chat_messages gcm
            JOIN users u ON u.id = gcm.user_id
            WHERE gcm.is_pinned = 1 AND gcm.is_deleted = 0
            ORDER BY gcm.created_at DESC`,
      args: []
    });
    res.json({ pinned: rowsToObjects(result) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load pinned' });
  }
});

// POST /api/chat/messages
router.post('/messages', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
  if (content.trim().length > MAX_LENGTH)
    return res.status(400).json({ error: `Max ${MAX_LENGTH} characters` });

  try {
    const db = getDB();

    // Cooldown check
    const lastResult = await db.execute({
      sql: `SELECT created_at FROM global_chat_messages
            WHERE user_id = ? AND is_deleted = 0
            ORDER BY created_at DESC LIMIT 1`,
      args: [req.user.id]
    });
    const last = rowToObject(lastResult);
    if (last) {
      const elapsed = Date.now() - new Date(last.created_at + 'Z').getTime();
      if (elapsed < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({ error: `Slow down — wait ${wait}s`, wait });
      }
    }

    // Attach most recent car to the message
    const buildResult = await db.execute({
      sql: `SELECT year, make, model FROM builds WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      args: [req.user.id]
    });
    const build = rowToObject(buildResult);
    const car_info = build ? `${build.year} ${build.make} ${build.model}` : null;

    const insertResult = await db.execute({
      sql: `INSERT INTO global_chat_messages (user_id, content, car_info) VALUES (?, ?, ?)`,
      args: [req.user.id, content.trim(), car_info]
    });

    res.status(201).json({
      id: Number(insertResult.lastInsertRowid),
      user_id: req.user.id,
      username: req.user.username,
      content: content.trim(),
      car_info,
      created_at: new Date().toISOString().replace('Z', ''),
      is_pinned: 0,
      report_count: 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// DELETE /api/chat/messages/:id  — admin soft-delete
router.delete('/messages/:id', authenticate, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admins only' });
  try {
    const db = getDB();
    await db.execute({
      sql: `UPDATE global_chat_messages SET is_deleted = 1, is_pinned = 0 WHERE id = ?`,
      args: [req.params.id]
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// POST /api/chat/messages/:id/report
router.post('/messages/:id/report', authenticate, async (req, res) => {
  try {
    const db = getDB();
    await db.execute({
      sql: `INSERT OR IGNORE INTO chat_reports (message_id, reporter_id) VALUES (?, ?)`,
      args: [req.params.id, req.user.id]
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report' });
  }
});

// PATCH /api/chat/messages/:id/pin  — admin toggle
router.patch('/messages/:id/pin', authenticate, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admins only' });
  try {
    const db = getDB();
    await db.execute({
      sql: `UPDATE global_chat_messages
            SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END
            WHERE id = ? AND is_deleted = 0`,
      args: [req.params.id]
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pin' });
  }
});

module.exports = router;
