const express = require('express');
const { getDB, rowToObject, rowsToObjects } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const db = getDB();
    const [
      totalUsersR, activeUsersR, totalBuildsR, todayBuildsR,
      totalTokensR, todayTokensR, cacheReadR
    ] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM users'),
      db.execute('SELECT COUNT(*) as count FROM users WHERE is_active = 1'),
      db.execute('SELECT COUNT(*) as count FROM builds'),
      db.execute("SELECT COUNT(*) as count FROM builds WHERE date(created_at) = date('now')"),
      db.execute('SELECT COALESCE(SUM(tokens_input + tokens_output), 0) as total FROM api_usage'),
      db.execute("SELECT COALESCE(SUM(tokens_input + tokens_output), 0) as total FROM api_usage WHERE date(created_at) = date('now')"),
      db.execute('SELECT COALESCE(SUM(tokens_cache_read), 0) as total FROM api_usage')
    ]);

    res.json({
      totalUsers: rowToObject(totalUsersR).count,
      activeUsers: rowToObject(activeUsersR).count,
      totalBuilds: rowToObject(totalBuildsR).count,
      todayBuilds: rowToObject(todayBuildsR).count,
      totalTokens: rowToObject(totalTokensR).total,
      todayTokens: rowToObject(todayTokensR).total,
      cacheReadTokens: rowToObject(cacheReadR).total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const db = getDB();
    const result = await db.execute(`
      SELECT
        u.id, u.email, u.username, u.is_admin, u.is_active, u.created_at,
        COUNT(DISTINCT b.id) as total_builds,
        COALESCE(SUM(au.tokens_input + au.tokens_output), 0) as total_tokens
      FROM users u
      LEFT JOIN builds b ON u.id = b.user_id
      LEFT JOIN api_usage au ON u.id = au.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users: rowsToObjects(result) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    const db = getDB();
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [req.params.id]
    });
    const user = rowToObject(result);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.is_admin) return res.status(403).json({ error: 'Cannot deactivate admin users' });
    await db.execute({ sql: 'UPDATE users SET is_active = 0 WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

router.patch('/users/:id/activate', async (req, res) => {
  try {
    const db = getDB();
    await db.execute({ sql: 'UPDATE users SET is_active = 1 WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

router.get('/builds', async (req, res) => {
  try {
    const db = getDB();
    const result = await db.execute(`
      SELECT b.id, b.year, b.make, b.model, b.budget, b.tokens_used, b.created_at,
             u.username, u.email
      FROM builds b
      JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
      LIMIT 100
    `);
    res.json({ builds: rowsToObjects(result) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load builds' });
  }
});

module.exports = router;
