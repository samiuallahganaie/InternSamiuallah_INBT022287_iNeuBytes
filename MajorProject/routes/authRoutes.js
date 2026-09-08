// ============ AUTH ROUTES ============
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Please enter a valid full name.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (!['patient', 'doctor', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role selected.' });

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)`)
    .run(name.trim(), normalizedEmail, passwordHash, role, phone ? phone.trim() : null);

  if (role === 'patient') {
    db.prepare(`INSERT INTO patient_profiles (user_id) VALUES (?)`).run(info.lastInsertRowid);
  }

  const user = { id: Number(info.lastInsertRowid), name: name.trim(), email: normalizedEmail, role };
  req.session.user = user;
  res.status(201).json({ user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const normalizedEmail = email.toLowerCase().trim();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!row) return res.status(401).json({ error: 'Invalid email or password.' });

  if (!bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  req.session.user = user;
  res.json({ user });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out.' });
  });
});

router.get('/me', (req, res) => {
  res.json({ user: (req.session && req.session.user) || null });
});

// ---- Change password (any logged-in role) ----
router.post('/change-password', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in.' });
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  if (!bcrypt.compareSync(currentPassword || '', row.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, row.id);
  res.json({ message: 'Password updated.' });
});

module.exports = router;
