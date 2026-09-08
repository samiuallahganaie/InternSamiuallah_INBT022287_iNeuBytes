// ============ DATABASE SETUP (real SQLite, built into Node.js) ============
// Uses node:sqlite — a module built directly into Node.js itself (v22.5+),
// so it requires NO compilation and NO separate database server install.
// This gives a genuine relational database with foreign keys and real SQL,
// unlike a JSON-file store.

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new DatabaseSync(path.join(__dirname, '..', 'clinic.db'));
db.exec('PRAGMA foreign_keys = ON;');

// ============ SCHEMA ============
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'admin')),
    phone TEXT,
    profile_picture TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS doctor_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    department_id INTEGER,
    experience_years INTEGER DEFAULT 0,
    consultation_fee INTEGER DEFAULT 0,
    bio TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS patient_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    age INTEGER,
    gender TEXT,
    address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    department_id INTEGER,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    appointment_id INTEGER,
    note TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
  );
`);

// ============ SEED DATA (only runs if the users table is empty) ============
const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get();

if (count === 0) {
  const insertUser = db.prepare(`INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)`);
  const insertDept = db.prepare(`INSERT INTO departments (name, description) VALUES (?, ?)`);
  const insertDoctorProfile = db.prepare(`
    INSERT INTO doctor_profiles (user_id, department_id, experience_years, consultation_fee, bio) VALUES (?, ?, ?, ?, ?)
  `);

  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  insertUser.run('Shruti Kumari', 'admin@willowgrove.example', defaultPasswordHash, 'admin', '+91 90000 00001');

  const deptIds = {};
  const depts = [
    ['General Medicine', 'Routine checkups and chronic condition management.'],
    ['Cardiology', 'Heart health monitoring and diagnostics.'],
    ['Pediatrics', 'Child healthcare and vaccinations.']
  ];
  depts.forEach(([name, desc]) => {
    const info = insertDept.run(name, desc);
    deptIds[name] = info.lastInsertRowid;
  });

  const doctors = [
    ['Dr. Reema Mehta', 'reema.mehta@willowgrove.example', 'General Medicine', 12, 500],
    ['Dr. Arjun Kapoor', 'arjun.kapoor@willowgrove.example', 'Cardiology', 9, 900],
    ['Dr. Sara Noor', 'sara.noor@willowgrove.example', 'Pediatrics', 7, 450]
  ];
  doctors.forEach(([name, email, dept, exp, fee]) => {
    const info = insertUser.run(name, email, defaultPasswordHash, 'doctor', '+91 90000 00002');
    insertDoctorProfile.run(info.lastInsertRowid, deptIds[dept], exp, fee, `${name} specializes in ${dept.toLowerCase()}.`);
  });

  const patientInfo = insertUser.run('Priya Sharma', 'patient@willowgrove.example', defaultPasswordHash, 'patient', '+91 90000 00003');
  db.prepare(`INSERT INTO patient_profiles (user_id, age, gender) VALUES (?, ?, ?)`).run(patientInfo.lastInsertRowid, 34, 'Female');

  console.log('Database seeded with demo admin, doctors, and patient accounts.');
  console.log('  Admin login:   admin@willowgrove.example / password123');
  console.log('  Doctor login:  arjun.kapoor@willowgrove.example / password123');
  console.log('  Patient login: patient@willowgrove.example / password123');
}

module.exports = db;
