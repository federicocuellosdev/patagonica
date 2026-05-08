const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../lib/db');

const router = express.Router();

const JWT_SECRET = process.env.REPORTE_PATAGONICA_JWT_SECRET;
const TOKEN_TTL = '7d';

const getUserStmt = db.prepare('SELECT email, password_hash FROM users WHERE email = ?');
const logStmt = db.prepare(
  'INSERT INTO auth_logs (email, action, ip, user_agent) VALUES (?, ?, ?, ?)'
);

function logAttempt(email, action, req) {
  try {
    logStmt.run(email, action, req.ip || null, req.get('user-agent') || null);
  } catch (e) {
    console.error('[auth] log error', e.message);
  }
}

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  if (!JWT_SECRET) {
    console.error('[auth] REPORTE_PATAGONICA_JWT_SECRET no configurado');
    return res.status(500).json({ error: 'Servidor mal configurado' });
  }

  const user = getUserStmt.get(email);
  if (!user) {
    logAttempt(email, 'login_unknown', req);
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    logAttempt(email, 'login_bad_password', req);
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  logAttempt(email, 'login_ok', req);
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: TOKEN_TTL });
  res.json({ ok: true, token, email });
});

router.get('/verify', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ ok: true, email: decoded.email, exp: decoded.exp });
  } catch (e) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
});

module.exports = router;
