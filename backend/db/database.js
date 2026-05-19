const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/glitch-garage.db');

let db;

function getDB() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Use absolute path — libsql requires file: URL
    const absPath = path.resolve(DB_PATH);
    db = createClient({ url: `file:${absPath}` });
  }
  return db;
}

/**
 * Convert a libsql ResultSet into an array of plain objects.
 * libsql rows are array-like with positional access; named properties
 * may be non-enumerable so we use the columns array to be safe.
 */
function rowsToObjects(result) {
  return result.rows.map(row =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]]))
  );
}

/**
 * Return the first row as a plain object, or null if empty.
 */
function rowToObject(result) {
  if (!result.rows.length) return null;
  return Object.fromEntries(result.columns.map((col, i) => [col, result.rows[0][i]]));
}

async function initDB() {
  const db = getDB();

  // Enable WAL mode and foreign keys
  await db.execute('PRAGMA journal_mode = WAL');
  await db.execute('PRAGMA foreign_keys = ON');

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS builds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      year TEXT NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      budget REAL NOT NULL,
      zip_code TEXT,
      result TEXT NOT NULL,
      tokens_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      endpoint TEXT NOT NULL,
      tokens_input INTEGER DEFAULT 0,
      tokens_output INTEGER DEFAULT 0,
      tokens_cache_read INTEGER DEFAULT 0,
      tokens_cache_creation INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      invite_code TEXT UNIQUE NOT NULL,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      active_build_id INTEGER,
      active_tier TEXT DEFAULT 'budget',
      joined_at TEXT DEFAULT (datetime('now')),
      UNIQUE(group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (active_build_id) REFERENCES builds(id)
    );

    CREATE TABLE IF NOT EXISTS build_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      tier TEXT NOT NULL,
      mod_index INTEGER NOT NULL,
      completed_at TEXT DEFAULT (datetime('now')),
      UNIQUE(build_id, user_id, tier, mod_index),
      FOREIGN KEY (build_id) REFERENCES builds(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS group_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      build_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (build_id) REFERENCES builds(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  console.log('Database initialized');
}

module.exports = { getDB, initDB, rowToObject, rowsToObjects };
