#!/usr/bin/env node
/**
 * Agrega o actualiza un usuario en data/users.json con la contraseña hasheada (bcrypt).
 *
 * Uso:
 *   node scripts/add-user.js <email> <password>
 *
 * Después de correrlo, commiteá data/users.json y deployá. Al boot, el server
 * sincroniza los usuarios del JSON contra la SQLite.
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const [, , emailArg, passwordArg] = process.argv;

if (!emailArg || !passwordArg) {
  console.error('Uso: node scripts/add-user.js <email> <password>');
  process.exit(1);
}

const email = emailArg.toLowerCase().trim();
const password = passwordArg;

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Email inválido:', email);
  process.exit(1);
}

if (password.length < 8) {
  console.error('La contraseña tiene que tener al menos 8 caracteres');
  process.exit(1);
}

const file = path.join(__dirname, '..', 'data', 'users.json');
let list = [];
if (fs.existsSync(file)) {
  try {
    list = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(list)) list = [];
  } catch (e) {
    console.error('users.json corrupto, reiniciando');
    list = [];
  }
}

const password_hash = bcrypt.hashSync(password, 12);
const idx = list.findIndex((u) => (u.email || '').toLowerCase() === email);
if (idx >= 0) {
  list[idx] = { email, password_hash };
  console.log('Usuario actualizado:', email);
} else {
  list.push({ email, password_hash });
  console.log('Usuario creado:', email);
}

fs.writeFileSync(file, JSON.stringify(list, null, 2) + '\n', 'utf8');
console.log('users.json actualizado. Total usuarios:', list.length);
console.log('\nProximo paso: git add data/users.json && git commit && git push');
