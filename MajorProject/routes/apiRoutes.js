// ============ CORE API ROUTES (SQL / node:sqlite) ============
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---- Email notification (demo only — no real email service is configured,
// this simulates what would be sent by logging it to the server console) ----
function sendDemoEmail(toEmail, subject, body) {
  console.log(`\n[DEMO EMAIL] To: ${toEmail}\nSubject: ${subject}\n${body}\n`);
}

function notify(userId, message) {
  db.prepare(`INSERT INTO notifications (user_id, message) VALUES (?, ?)`).run(userId, message);
  const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
  if (user) sendDemoEmail(user.email, 'Willow Grove Clinic Notification', message);
}

// ============ DEPARTMENTS ============
router.get('/departments', (req, res) => {
  res.json({ departments: db.prepare('SELECT * FROM departments ORDER BY name').all() });
});

router.post('/departments', requireRole('admin'), (req, res) => {
  const { name, description } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Please enter a valid department name.' });
  const info = db.prepare('INSERT INTO departments (name, description) VALUES (?, ?)').run(name.trim(), (description || '').trim());
  res.status(201).json({ department: db.prepare('SELECT * FROM departments WHERE id = ?').get(info.lastInsertRowid) });
});

router.put('/departments/:id', requireRole('admin'), (req, res) => {
  const { name, description } = req.body;
  const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Department not found.' });
  db.prepare('UPDATE departments SET name = ?, description = ? WHERE id = ?')
    .run(name ? name.trim() : existing.name, description !== undefined ? description.trim() : existing.description, req.params.id);
  res.json({ department: db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id) });
});

router.delete('/departments/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM departments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Department deleted.' });
});

// ============ DOCTORS ============
const DOCTOR_SELECT = `
  SELECT u.id, u.name, u.email, u.phone, dp.department_id AS departmentId,
         COALESCE(d.name, 'Unassigned') AS department,
         COALESCE(dp.experience_years, 0) AS experience,
         COALESCE(dp.consultation_fee, 0) AS fee,
         COALESCE(dp.bio, '') AS bio
  FROM users u
  LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
  LEFT JOIN departments d ON d.id = dp.department_id
  WHERE u.role = 'doctor'
`;

router.get('/doctors', (req, res) => {
  res.json({ doctors: db.prepare(DOCTOR_SELECT + ' ORDER BY u.name').all() });
});

router.post('/doctors', requireRole('admin'), (req, res) => {
  const { name, email, phone, departmentId, experience, fee, password } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Please enter a valid name.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email.' });

  const normalizedEmail = email.toLowerCase().trim();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password && password.length >= 6 ? password : 'welcome123', 10);
  const info = db.prepare('INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)')
    .run(name.trim(), normalizedEmail, passwordHash, 'doctor', phone ? phone.trim() : null);
  db.prepare('INSERT INTO doctor_profiles (user_id, department_id, experience_years, consultation_fee, bio) VALUES (?, ?, ?, ?, ?)')
    .run(info.lastInsertRowid, departmentId || null, Number(experience) || 0, Number(fee) || 0, '');

  res.status(201).json({ message: 'Doctor added.' });
});

router.put('/doctors/:id', requireRole('admin'), (req, res) => {
  const userId = req.params.id;
  const { name, phone, departmentId, experience, fee } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'doctor'").get(userId);
  if (!user) return res.status(404).json({ error: 'Doctor not found.' });

  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?')
    .run(name ? name.trim() : user.name, phone !== undefined ? phone.trim() : user.phone, userId);

  const profile = db.prepare('SELECT * FROM doctor_profiles WHERE user_id = ?').get(userId);
  if (profile) {
    db.prepare('UPDATE doctor_profiles SET department_id = ?, experience_years = ?, consultation_fee = ? WHERE user_id = ?')
      .run(departmentId || profile.department_id, experience !== undefined ? Number(experience) : profile.experience_years,
           fee !== undefined ? Number(fee) : profile.consultation_fee, userId);
  } else {
    db.prepare('INSERT INTO doctor_profiles (user_id, department_id, experience_years, consultation_fee) VALUES (?, ?, ?, ?)')
      .run(userId, departmentId || null, Number(experience) || 0, Number(fee) || 0);
  }
  res.json({ message: 'Doctor updated.' });
});

router.delete('/doctors/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id); // cascades to doctor_profiles
  res.json({ message: 'Doctor deleted.' });
});

// ============ PATIENTS (admin) ============
const PATIENT_SELECT = `
  SELECT u.id, u.name, u.email, u.phone, pp.age, pp.gender
  FROM users u
  LEFT JOIN patient_profiles pp ON pp.user_id = u.id
  WHERE u.role = 'patient'
`;

router.get('/patients', requireRole('admin'), (req, res) => {
  res.json({ patients: db.prepare(PATIENT_SELECT + ' ORDER BY u.name').all() });
});

router.post('/patients', requireRole('admin'), (req, res) => {
  const { name, email, phone, age, gender, password } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Please enter a valid name.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email.' });

  const normalizedEmail = email.toLowerCase().trim();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }
  const passwordHash = bcrypt.hashSync(password && password.length >= 6 ? password : 'welcome123', 10);
  const info = db.prepare('INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)')
    .run(name.trim(), normalizedEmail, passwordHash, 'patient', phone ? phone.trim() : null);
  db.prepare('INSERT INTO patient_profiles (user_id, age, gender) VALUES (?, ?, ?)')
    .run(info.lastInsertRowid, Number(age) || null, gender || null);

  res.status(201).json({ message: 'Patient added.' });
});

router.put('/patients/:id', requireRole('admin'), (req, res) => {
  const userId = req.params.id;
  const { name, phone, age, gender } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'patient'").get(userId);
  if (!user) return res.status(404).json({ error: 'Patient not found.' });

  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?')
    .run(name ? name.trim() : user.name, phone !== undefined ? phone.trim() : user.phone, userId);

  const profile = db.prepare('SELECT * FROM patient_profiles WHERE user_id = ?').get(userId);
  if (profile) {
    db.prepare('UPDATE patient_profiles SET age = ?, gender = ? WHERE user_id = ?')
      .run(age !== undefined ? Number(age) : profile.age, gender !== undefined ? gender : profile.gender, userId);
  } else {
    db.prepare('INSERT INTO patient_profiles (user_id, age, gender) VALUES (?, ?, ?)').run(userId, Number(age) || null, gender || null);
  }
  res.json({ message: 'Patient updated.' });
});

router.delete('/patients/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'Patient deleted.' });
});

// ============ APPOINTMENTS ============
const APPOINTMENT_SELECT = `
  SELECT a.id, a.patient_id AS patientId, pu.name AS patientName,
         a.doctor_id AS doctorId, du.name AS doctorName,
         COALESCE(d.name, 'Unassigned') AS department,
         a.appointment_date AS date, a.appointment_time AS time,
         a.status, a.notes
  FROM appointments a
  JOIN users pu ON pu.id = a.patient_id
  JOIN users du ON du.id = a.doctor_id
  LEFT JOIN departments d ON d.id = a.department_id
`;

router.get('/appointments', requireAuth, (req, res) => {
  const { role, id } = req.session.user;
  let sql = APPOINTMENT_SELECT;
  let rows;
  if (role === 'patient') rows = db.prepare(sql + ' WHERE a.patient_id = ? ORDER BY a.appointment_date DESC').all(id);
  else if (role === 'doctor') rows = db.prepare(sql + ' WHERE a.doctor_id = ? ORDER BY a.appointment_date DESC').all(id);
  else rows = db.prepare(sql + ' ORDER BY a.appointment_date DESC').all();
  res.json({ appointments: rows });
});

router.post('/appointments', requireRole('patient'), (req, res) => {
  const { doctorId, date, time, notes } = req.body;
  if (!doctorId || !date || !time) return res.status(400).json({ error: 'Doctor, date, and time are required.' });

  const doctor = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'doctor'").get(doctorId);
  if (!doctor) return res.status(400).json({ error: 'Selected doctor was not found.' });
  const profile = db.prepare('SELECT department_id FROM doctor_profiles WHERE user_id = ?').get(doctorId);

  const info = db.prepare(`
    INSERT INTO appointments (patient_id, doctor_id, department_id, appointment_date, appointment_time, status, notes)
    VALUES (?, ?, ?, ?, ?, 'Pending', ?)
  `).run(req.session.user.id, doctorId, profile ? profile.department_id : null, date, time, (notes || '').trim());

  notify(doctor.id, `New appointment request from ${req.session.user.name} on ${date} at ${time}.`);

  res.status(201).json({ appointment: db.prepare(APPOINTMENT_SELECT + ' WHERE a.id = ?').get(info.lastInsertRowid) });
});

router.patch('/appointments/:id/status', requireRole('doctor', 'admin'), (req, res) => {
  const { status } = req.body;
  const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status value.' });

  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });
  if (req.session.user.role === 'doctor' && apt.doctor_id !== req.session.user.id) {
    return res.status(403).json({ error: 'You can only update your own appointments.' });
  }

  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, apt.id);
  const doctor = db.prepare('SELECT name FROM users WHERE id = ?').get(apt.doctor_id);
  notify(apt.patient_id, `Your appointment with ${doctor.name} on ${apt.appointment_date} has been ${status}.`);

  res.json({ appointment: db.prepare(APPOINTMENT_SELECT + ' WHERE a.id = ?').get(apt.id) });
});

// Patient: reschedule their own Pending/Confirmed appointment to a new date/time
router.patch('/appointments/:id/reschedule', requireRole('patient'), (req, res) => {
  const { date, time } = req.body;
  if (!date || !time) return res.status(400).json({ error: 'New date and time are required.' });

  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });
  if (apt.patient_id !== req.session.user.id) return res.status(403).json({ error: 'You can only reschedule your own appointments.' });
  if (!['Pending', 'Confirmed'].includes(apt.status)) {
    return res.status(400).json({ error: 'Only Pending or Confirmed appointments can be rescheduled.' });
  }

  db.prepare(`UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = 'Pending' WHERE id = ?`)
    .run(date, time, apt.id);
  const doctor = db.prepare('SELECT id, name FROM users WHERE id = ?').get(apt.doctor_id);
  notify(doctor.id, `${req.session.user.name} rescheduled their appointment to ${date} at ${time}.`);

  res.json({ appointment: db.prepare(APPOINTMENT_SELECT + ' WHERE a.id = ?').get(apt.id) });
});

// ============ NOTIFICATIONS ============
router.get('/notifications', requireAuth, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.session.user.id);
  res.json({ notifications });
});

router.patch('/notifications/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.session.user.id);
  res.json({ message: 'All notifications marked as read.' });
});

// ============ MEDICAL RECORDS ============
const RECORD_SELECT = `
  SELECT r.id, r.patient_id AS patientId, pu.name AS patientName,
         r.doctor_id AS doctorId, du.name AS doctorName,
         r.note, r.created_at AS date
  FROM medical_records r
  JOIN users pu ON pu.id = r.patient_id
  JOIN users du ON du.id = r.doctor_id
`;

router.get('/medical-records', requireAuth, (req, res) => {
  const { role, id } = req.session.user;
  let rows;
  if (role === 'patient') rows = db.prepare(RECORD_SELECT + ' WHERE r.patient_id = ? ORDER BY r.created_at DESC').all(id);
  else if (role === 'doctor') rows = db.prepare(RECORD_SELECT + ' WHERE r.doctor_id = ? ORDER BY r.created_at DESC').all(id);
  else rows = db.prepare(RECORD_SELECT + ' ORDER BY r.created_at DESC').all();
  res.json({ records: rows });
});

router.post('/medical-records', requireRole('doctor'), (req, res) => {
  const { appointmentId, note } = req.body;
  if (!note || note.trim().length < 2) return res.status(400).json({ error: 'Please enter a note.' });

  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });
  if (apt.doctor_id !== req.session.user.id) return res.status(403).json({ error: 'You can only add records for your own appointments.' });

  const info = db.prepare('INSERT INTO medical_records (patient_id, doctor_id, appointment_id, note) VALUES (?, ?, ?, ?)')
    .run(apt.patient_id, apt.doctor_id, apt.id, note.trim());

  res.status(201).json({ record: db.prepare(RECORD_SELECT + ' WHERE r.id = ?').get(info.lastInsertRowid) });
});

// ============ PROFILE (any logged-in user) ============
router.get('/profile', requireAuth, (req, res) => {
  const { id, role } = req.session.user;
  const user = db.prepare('SELECT id, name, email, phone, role, profile_picture AS profilePicture FROM users WHERE id = ?').get(id);

  if (role === 'patient') {
    const profile = db.prepare('SELECT age, gender, address FROM patient_profiles WHERE user_id = ?').get(id);
    return res.json({ profile: { ...user, ...profile } });
  }
  if (role === 'doctor') {
    const profile = db.prepare('SELECT experience_years AS experience, consultation_fee AS fee, bio FROM doctor_profiles WHERE user_id = ?').get(id);
    return res.json({ profile: { ...user, ...profile } });
  }
  res.json({ profile: user });
});

router.put('/profile', requireAuth, (req, res) => {
  const { id, role } = req.session.user;
  const { name, phone, age, gender, address, experience, fee, bio, profilePicture } = req.body;

  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Please enter a valid name.' });

  if (profilePicture !== undefined) {
    db.prepare('UPDATE users SET name = ?, phone = ?, profile_picture = ? WHERE id = ?')
      .run(name.trim(), (phone || '').trim(), profilePicture, id);
  } else {
    db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name.trim(), (phone || '').trim(), id);
  }
  req.session.user.name = name.trim();

  if (role === 'patient') {
    const existing = db.prepare('SELECT * FROM patient_profiles WHERE user_id = ?').get(id) || {};
    db.prepare('UPDATE patient_profiles SET age = ?, gender = ?, address = ? WHERE user_id = ?')
      .run(age !== undefined ? Number(age) || null : existing.age,
           gender !== undefined ? gender : existing.gender,
           address !== undefined ? address.trim() : existing.address,
           id);
  }
  if (role === 'doctor') {
    const existing = db.prepare('SELECT * FROM doctor_profiles WHERE user_id = ?').get(id) || {};
    db.prepare('UPDATE doctor_profiles SET experience_years = ?, consultation_fee = ?, bio = ? WHERE user_id = ?')
      .run(experience !== undefined ? Number(experience) : existing.experience_years,
           fee !== undefined ? Number(fee) : existing.consultation_fee,
           bio !== undefined ? bio.trim() : existing.bio,
           id);
  }

  res.json({ message: 'Profile updated.' });
});

// ============ ADMIN STATS ============
router.get('/stats', requireRole('admin'), (req, res) => {
  const totalDoctors = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'doctor'").get().c;
  const totalPatients = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'patient'").get().c;
  const totalAppointments = db.prepare('SELECT COUNT(*) AS c FROM appointments').get().c;
  const pendingAppointments = db.prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'Pending'").get().c;
  const totalDepartments = db.prepare('SELECT COUNT(*) AS c FROM departments').get().c;
  const byStatus = db.prepare('SELECT status, COUNT(*) AS c FROM appointments GROUP BY status').all();

  res.json({ totalDoctors, totalPatients, totalAppointments, pendingAppointments, totalDepartments, byStatus });
});

// ============ GLOBAL SEARCH (admin) ============
router.get('/search', requireRole('admin'), (req, res) => {
  const q = `%${(req.query.q || '').toLowerCase()}%`;
  const doctors = db.prepare(`SELECT id, name, 'doctor' AS type FROM users WHERE role = 'doctor' AND LOWER(name) LIKE ?`).all(q);
  const patients = db.prepare(`SELECT id, name, 'patient' AS type FROM users WHERE role = 'patient' AND LOWER(name) LIKE ?`).all(q);
  const departments = db.prepare(`SELECT id, name, 'department' AS type FROM departments WHERE LOWER(name) LIKE ?`).all(q);
  res.json({ results: [...doctors, ...patients, ...departments] });
});

module.exports = router;
