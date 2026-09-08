// ============ WILLOW GROVE CLINIC — MANAGEMENT SYSTEM SERVER ============
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const { requireRole } = require('./middleware/auth');

// Initialize database (creates clinic-data.json + seed data on first run)
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hour session
}));

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// ============ ROLE-PROTECTED DASHBOARD PAGES ============
app.get('/patient-dashboard.html', requireRole('patient'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'patient-dashboard.html'));
});
app.get('/doctor-dashboard.html', requireRole('doctor'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'doctor-dashboard.html'));
});
app.get('/admin-dashboard.html', requireRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// ============ STATIC FILES ============
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`\nWillow Grove Clinic Management System running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop the server.\n');
});
