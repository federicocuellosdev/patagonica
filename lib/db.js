const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'auth.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    action TEXT,
    ip TEXT,
    user_agent TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);

const seedFile = path.join(__dirname, '..', 'data', 'users.json');
if (fs.existsSync(seedFile)) {
  try {
    const list = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
    if (Array.isArray(list) && list.length > 0) {
      const upsert = db.prepare(`
        INSERT INTO users (email, password_hash) VALUES (?, ?)
        ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash
      `);
      const tx = db.transaction((users) => {
        users.forEach((u) => {
          if (u && u.email && u.password_hash) {
            upsert.run(String(u.email).toLowerCase().trim(), u.password_hash);
          }
        });
      });
      tx(list);
    }
  } catch (e) {
    console.error('[db] Error seeding users.json:', e.message);
  }
}

module.exports = db;
