const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB, rowToObject } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const db = getDB();
    const hashed = await bcrypt.hash(password, 12);
    const isAdmin = email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase() ? 1 : 0;

    const result = await db.execute({
      sql: 'INSERT INTO users (email, username, password, is_admin) VALUES (?, ?, ?, ?)',
      args: [email.toLowerCase(), username, hashed, isAdmin]
    });

    const userId = Number(result.lastInsertRowid);
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: userId, email: email.toLowerCase(), username, is_admin: isAdmin }
    });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const db = getDB();
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email.toLowerCase()]
    });
    const user = rowToObject(result);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.is_active) return res.status(401).json({ error: 'Account deactivated' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, username: user.username, is_admin: user.is_admin }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, (req, res) => {
  const { id, email, username, is_admin, created_at } = req.user;
  res.json({ user: { id, email, username, is_admin, created_at } });
});

module.exports = router;
