// ============ DASHBOARD DATA LAYER ============
// Seed data + generic localStorage CRUD helpers shared across all dashboard pages.

const DASH_KEYS = {
  doctors: 'dashboard_doctors',
  patients: 'dashboard_patients',
  appointments: 'dashboard_appointments',
  departments: 'dashboard_departments'
};

const SEED_DOCTORS = [
  { id: 'doc_1', name: 'Dr. Reema Mehta', department: 'General Medicine', experience: 12, fee: 500, phone: '+91 98765 11111', email: 'reema.mehta@willowgrove.example' },
  { id: 'doc_2', name: 'Dr. Arjun Kapoor', department: 'Cardiology', experience: 9, fee: 900, phone: '+91 98765 22222', email: 'arjun.kapoor@willowgrove.example' },
  { id: 'doc_3', name: 'Dr. Sara Noor', department: 'Pediatrics', experience: 7, fee: 450, phone: '+91 98765 33333', email: 'sara.noor@willowgrove.example' },
  { id: 'doc_4', name: 'Dr. Kabir Anand', department: 'Dermatology', experience: 6, fee: 600, phone: '+91 98765 44444', email: 'kabir.anand@willowgrove.example' }
];

const SEED_PATIENTS = [
  { id: 'pat_1', name: 'Priya Sharma', age: 34, gender: 'Female', phone: '+91 91234 11111', email: 'priya.sharma@example.com' },
  { id: 'pat_2', name: 'Farhan Iqbal', age: 41, gender: 'Male', phone: '+91 91234 22222', email: 'farhan.iqbal@example.com' },
  { id: 'pat_3', name: 'Meera Joshi', age: 29, gender: 'Female', phone: '+91 91234 33333', email: 'meera.joshi@example.com' }
];

const SEED_APPOINTMENTS = [
  { id: 'apt_1', patientName: 'Priya Sharma', doctorName: 'Dr. Reema Mehta', department: 'General Medicine', date: '2026-08-25', time: '10:00 AM', status: 'Confirmed' },
  { id: 'apt_2', patientName: 'Farhan Iqbal', doctorName: 'Dr. Arjun Kapoor', department: 'Cardiology', date: '2026-08-26', time: '11:00 AM', status: 'Pending' },
  { id: 'apt_3', patientName: 'Meera Joshi', doctorName: 'Dr. Sara Noor', department: 'Pediatrics', date: '2026-08-22', time: '02:00 PM', status: 'Completed' }
];

const SEED_DEPARTMENTS = [
  { id: 'dep_1', name: 'General Medicine', headDoctor: 'Dr. Reema Mehta', description: 'Routine checkups and chronic condition management.' },
  { id: 'dep_2', name: 'Cardiology', headDoctor: 'Dr. Arjun Kapoor', description: 'Heart health monitoring and diagnostics.' },
  { id: 'dep_3', name: 'Pediatrics', headDoctor: 'Dr. Sara Noor', description: 'Child healthcare and vaccinations.' },
  { id: 'dep_4', name: 'Dermatology', headDoctor: 'Dr. Kabir Anand', description: 'Skin checks and minor procedures.' }
];

// Ensure each localStorage key has seed data on first load
function seedIfEmpty(key, seedData) {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(seedData));
  }
}
seedIfEmpty(DASH_KEYS.doctors, SEED_DOCTORS);
seedIfEmpty(DASH_KEYS.patients, SEED_PATIENTS);
seedIfEmpty(DASH_KEYS.appointments, SEED_APPOINTMENTS);
seedIfEmpty(DASH_KEYS.departments, SEED_DEPARTMENTS);

// ---- Generic CRUD helpers ----
function dashGetAll(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function dashSaveAll(key, records) {
  localStorage.setItem(key, JSON.stringify(records));
}

function dashAdd(key, record) {
  const records = dashGetAll(key);
  record.id = key.replace('dashboard_', '').slice(0, 3) + '_' + Date.now();
  records.push(record);
  dashSaveAll(key, records);
  return record;
}

function dashUpdate(key, id, updatedFields) {
  const records = dashGetAll(key);
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return null;
  records[index] = { ...records[index], ...updatedFields };
  dashSaveAll(key, records);
  return records[index];
}

function dashDelete(key, id) {
  const records = dashGetAll(key).filter(r => r.id !== id);
  dashSaveAll(key, records);
}

function dashGetById(key, id) {
  return dashGetAll(key).find(r => r.id === id) || null;
}

// Reset all dashboard data back to seed values (used by a "Reset Demo Data" control if added)
function dashResetAll() {
  localStorage.setItem(DASH_KEYS.doctors, JSON.stringify(SEED_DOCTORS));
  localStorage.setItem(DASH_KEYS.patients, JSON.stringify(SEED_PATIENTS));
  localStorage.setItem(DASH_KEYS.appointments, JSON.stringify(SEED_APPOINTMENTS));
  localStorage.setItem(DASH_KEYS.departments, JSON.stringify(SEED_DEPARTMENTS));
}
