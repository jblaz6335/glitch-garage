require('dotenv').config({ override: true });
// Disable strict TLS cert verification — Anthropic API cert chain varies across environments (Railway Linux).
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./db/database');

const authRoutes = require('./routes/auth');
const buildsRoutes = require('./routes/builds');
const adminRoutes = require('./routes/admin');
const junkyardsRoutes = require('./routes/junkyards');
const groupsRoutes = require('./routes/groups');
const assistantRoutes = require('./routes/assistant');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Global rate limiter (100 requests per 15 min per IP)
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
}));

app.use('/api/auth', authRoutes);
app.use('/api/builds', buildsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/junkyards', junkyardsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});


// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\x1b[36m🔧 Glitch Garage API running on port ${PORT}\x1b[0m`);
      console.log(`\x1b[35m   Admin email: ${process.env.ADMIN_EMAIL || '(not set)'}\x1b[0m`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
