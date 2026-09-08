// ============ ADMIN DASHBOARD ============
let allAppointments = [];
let allDoctors = [];
let allPatients = [];
let allDepartments = [];

(async function init() {
  const user = await guardDashboard('admin');
  if (!user) return;

  await loadStats();
  await loadAppointments();
  await loadDepartments();
  await loadDoctors();
  await loadPatients();

  document.getElementById('statusFilter').addEventListener('change', renderAppointments);
  document.getElementById('appointmentSearchInput').addEventListener('input', renderAppointments);
  document.getElementById('exportCsvBtn').addEventListener('click', exportAppointmentsCsv);
  document.getElementById('doctorSearchInput').addEventListener('input', renderDoctors);
  document.getElementById('patientSearchInput').addEventListener('input', renderPatients);
  document.getElementById('addDepartmentBtn').addEventListener('click', () => openDepartmentModal(null));
  document.getElementById('addDoctorBtn').addEventListener('click', () => openDoctorModal(null));
  document.getElementById('addPatientBtn').addEventListener('click', () => openPatientModal(null));

  document.getElementById('globalSearchInput').addEventListener('input', handleGlobalSearch);
  document.getElementById('printReportBtn').addEventListener('click', () => window.print());
})();

let searchDebounce;
function handleGlobalSearch(e) {
  clearTimeout(searchDebounce);
  const query = e.target.value.trim();
  const results = document.getElementById('globalSearchResults');
  if (query.length < 2) { results.innerHTML = ''; return; }

  searchDebounce = setTimeout(async () => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    results.innerHTML = data.results.map(r => `
      <div class="search-result-item"><span>${r.name}</span><span class="search-result-type">${r.type}</span></div>
    `).join('') || '<p class="slot-hint">No matches found.</p>';
  }, 250);
}

async function loadStats() {
  const res = await fetch('/api/stats');
  const s = await res.json();
  document.getElementById('statGrid').innerHTML = `
    <div class="stat-card"><span class="stat-card-label">Total Doctors</span><span class="stat-card-value">${s.totalDoctors}</span></div>
    <div class="stat-card"><span class="stat-card-label">Total Patients</span><span class="stat-card-value">${s.totalPatients}</span></div>
    <div class="stat-card"><span class="stat-card-label">Total Appointments</span><span class="stat-card-value">${s.totalAppointments}</span><span class="stat-card-sub">${s.pendingAppointments} pending</span></div>
    <div class="stat-card"><span class="stat-card-label">Departments</span><span class="stat-card-value">${s.totalDepartments}</span></div>
  `;

  const maxCount = Math.max(1, ...s.byStatus.map(row => row.c));
  const allStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
  const chart = document.getElementById('statusChart');
  if (chart) {
    chart.innerHTML = allStatuses.map(status => {
      const row = s.byStatus.find(r => r.status === status);
      const count = row ? row.c : 0;
      const pct = Math.round((count / maxCount) * 100);
      return `
        <div class="chart-row">
          <span class="chart-label">${status}</span>
          <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%"></div></div>
          <span class="chart-count">${count}</span>
        </div>
      `;
    }).join('');
  }
}

// ---- APPOINTMENTS ----
async function loadAppointments() {
  const res = await fetch('/api/appointments');
  const data = await res.json();
  allAppointments = data.appointments;
  renderAppointments();
}

function renderAppointments() {
  const statusVal = document.getElementById('statusFilter').value;
  const query = document.getElementById('appointmentSearchInput').value.trim().toLowerCase();
  const filtered = allAppointments.filter(a => {
    const matchesStatus = !statusVal || a.status === statusVal;
    const matchesQuery = a.patientName.toLowerCase().includes(query) || a.doctorName.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });
  const tbody = document.getElementById('appointmentsBody');

  tbody.innerHTML = filtered.map(a => `
    <tr>
      <td>${a.patientName}</td>
      <td>${a.doctorName}</td>
      <td>${a.department}</td>
      <td>${formatDate(a.date)} · ${a.time}</td>
      <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
      <td>
        <select class="status-select" data-id="${a.id}">
          ${['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => `<option value="${s}" ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>
  `).join('') || '<tr class="empty-row"><td colspan="6">No appointments found.</td></tr>';

  tbody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      await fetch(`/api/appointments/${sel.dataset.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: sel.value })
      });
      await loadAppointments();
      await loadStats();
    });
  });
}

// ---- DOCTORS ----
async function loadDoctors() {
  const res = await fetch('/api/doctors');
  const data = await res.json();
  allDoctors = data.doctors;
  renderDoctors();
}

function renderDoctors() {
  const query = document.getElementById('doctorSearchInput').value.trim().toLowerCase();
  const filtered = allDoctors.filter(d => d.name.toLowerCase().includes(query));
  const tbody = document.getElementById('doctorsBody');

  tbody.innerHTML = filtered.map(d => `
    <tr>
      <td>${d.name}</td><td>${d.department}</td><td>${d.experience} yrs</td><td>₹${d.fee}</td><td>${d.phone || '—'}</td>
      <td class="table-actions">
        <button class="btn btn-ghost btn-small" data-edit="${d.id}">Edit</button>
        <button class="btn btn-danger btn-small" data-delete="${d.id}">Delete</button>
      </td>
    </tr>
  `).join('') || '<tr class="empty-row"><td colspan="6">No doctors found.</td></tr>';

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openDoctorModal(allDoctors.find(d => d.id === Number(btn.dataset.edit))));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Delete this doctor? This cannot be undone.')) {
        await fetch(`/api/doctors/${btn.dataset.delete}`, { method: 'DELETE' });
        await loadDoctors();
        await loadStats();
      }
    });
  });
}

function openDoctorModal(doctor) {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalForm = document.getElementById('modalForm');
  const modalBanner = document.getElementById('modalBanner');
  modalBanner.textContent = '';
  modalTitle.textContent = doctor ? 'Edit Doctor' : 'Add Doctor';
  modalOverlay.hidden = false;

  const deptOptions = allDepartments.map(d => `<option value="${d.id}" ${doctor && doctor.departmentId === d.id ? 'selected' : ''}>${d.name}</option>`).join('');

  modalForm.innerHTML = `
    <div><label for="f-name">Full name</label><input type="text" id="f-name" value="${doctor ? doctor.name : ''}"></div>
    ${!doctor ? '<div><label for="f-email">Email</label><input type="email" id="f-email"></div>' : ''}
    <div><label for="f-department">Department</label><select id="f-department"><option value="">Unassigned</option>${deptOptions}</select></div>
    <div><label for="f-experience">Experience (years)</label><input type="number" id="f-experience" min="0" max="60" value="${doctor ? doctor.experience : 0}"></div>
    <div><label for="f-fee">Consultation fee (₹)</label><input type="number" id="f-fee" min="0" value="${doctor ? doctor.fee : 0}"></div>
    <div><label for="f-phone">Phone</label><input type="tel" id="f-phone" value="${doctor ? (doctor.phone || '') : ''}"></div>
    ${!doctor ? '<div><label for="f-password">Password (optional \u2014 defaults to welcome123)</label><input type="password" id="f-password"></div>' : ''}
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" id="cancelBtn">Cancel</button>
      <button type="submit" class="btn btn-primary">${doctor ? 'Save changes' : 'Add doctor'}</button>
    </div>
  `;
  document.getElementById('cancelBtn').addEventListener('click', closeModal);

  modalForm.onsubmit = async function (e) {
    e.preventDefault();
    const name = document.getElementById('f-name').value.trim();
    if (name.length < 2) { modalBanner.textContent = 'Please enter a valid name.'; return; }

    const payload = {
      name,
      departmentId: document.getElementById('f-department').value || null,
      experience: document.getElementById('f-experience').value,
      fee: document.getElementById('f-fee').value,
      phone: document.getElementById('f-phone').value.trim()
    };

    let res;
    if (doctor) {
      res = await fetch(`/api/doctors/${doctor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      payload.email = document.getElementById('f-email').value.trim();
      payload.password = document.getElementById('f-password').value;
      res = await fetch('/api/doctors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    const data = await res.json();
    if (!res.ok) { modalBanner.textContent = data.error || 'Something went wrong.'; return; }

    closeModal();
    await loadDoctors();
    await loadStats();
  };
}

// ---- PATIENTS ----
async function loadPatients() {
  const res = await fetch('/api/patients');
  const data = await res.json();
  allPatients = data.patients;
  renderPatients();
}

function renderPatients() {
  const query = document.getElementById('patientSearchInput').value.trim().toLowerCase();
  const filtered = allPatients.filter(p => p.name.toLowerCase().includes(query));
  const tbody = document.getElementById('patientsBody');

  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td>${p.name}</td><td>${p.age || '—'}</td><td>${p.gender || '—'}</td><td>${p.phone || '—'}</td><td>${p.email}</td>
      <td class="table-actions">
        <button class="btn btn-ghost btn-small" data-edit="${p.id}">Edit</button>
        <button class="btn btn-danger btn-small" data-delete="${p.id}">Delete</button>
      </td>
    </tr>
  `).join('') || '<tr class="empty-row"><td colspan="6">No patients found.</td></tr>';

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openPatientModal(allPatients.find(p => p.id === Number(btn.dataset.edit))));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Delete this patient? This cannot be undone.')) {
        await fetch(`/api/patients/${btn.dataset.delete}`, { method: 'DELETE' });
        await loadPatients();
        await loadStats();
      }
    });
  });
}

function openPatientModal(patient) {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalForm = document.getElementById('modalForm');
  const modalBanner = document.getElementById('modalBanner');
  modalBanner.textContent = '';
  modalTitle.textContent = patient ? 'Edit Patient' : 'Add Patient';
  modalOverlay.hidden = false;

  modalForm.innerHTML = `
    <div><label for="f-name">Full name</label><input type="text" id="f-name" value="${patient ? patient.name : ''}"></div>
    ${!patient ? '<div><label for="f-email">Email</label><input type="email" id="f-email"></div>' : ''}
    <div><label for="f-age">Age</label><input type="number" id="f-age" min="0" max="120" value="${patient ? (patient.age || '') : ''}"></div>
    <div><label for="f-gender">Gender</label><select id="f-gender">
      <option value="Female" ${patient && patient.gender === 'Female' ? 'selected' : ''}>Female</option>
      <option value="Male" ${patient && patient.gender === 'Male' ? 'selected' : ''}>Male</option>
      <option value="Other" ${patient && patient.gender === 'Other' ? 'selected' : ''}>Other</option>
    </select></div>
    <div><label for="f-phone">Phone</label><input type="tel" id="f-phone" value="${patient ? (patient.phone || '') : ''}"></div>
    ${!patient ? '<div><label for="f-password">Password (optional \u2014 defaults to welcome123)</label><input type="password" id="f-password"></div>' : ''}
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" id="cancelBtn">Cancel</button>
      <button type="submit" class="btn btn-primary">${patient ? 'Save changes' : 'Add patient'}</button>
    </div>
  `;
  document.getElementById('cancelBtn').addEventListener('click', closeModal);

  modalForm.onsubmit = async function (e) {
    e.preventDefault();
    const name = document.getElementById('f-name').value.trim();
    if (name.length < 2) { modalBanner.textContent = 'Please enter a valid name.'; return; }

    const payload = {
      name,
      age: document.getElementById('f-age').value,
      gender: document.getElementById('f-gender').value,
      phone: document.getElementById('f-phone').value.trim()
    };

    let res;
    if (patient) {
      res = await fetch(`/api/patients/${patient.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      payload.email = document.getElementById('f-email').value.trim();
      payload.password = document.getElementById('f-password').value;
      res = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    const data = await res.json();
    if (!res.ok) { modalBanner.textContent = data.error || 'Something went wrong.'; return; }

    closeModal();
    await loadPatients();
    await loadStats();
  };
}

// ---- DEPARTMENTS ----
async function loadDepartments() {
  const res = await fetch('/api/departments');
  const data = await res.json();
  allDepartments = data.departments;
  renderDepartments();
}

function renderDepartments() {
  const tbody = document.getElementById('departmentsBody');
  tbody.innerHTML = allDepartments.map(d => `
    <tr>
      <td>${d.name}</td>
      <td>${d.description || '—'}</td>
      <td class="table-actions">
        <button class="btn btn-ghost btn-small" data-edit="${d.id}">Edit</button>
        <button class="btn btn-danger btn-small" data-delete="${d.id}">Delete</button>
      </td>
    </tr>
  `).join('') || '<tr class="empty-row"><td colspan="3">No departments found.</td></tr>';

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openDepartmentModal(allDepartments.find(d => d.id === Number(btn.dataset.edit))));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Delete this department?')) {
        await fetch(`/api/departments/${btn.dataset.delete}`, { method: 'DELETE' });
        await loadDepartments();
        await loadStats();
      }
    });
  });
}

function openDepartmentModal(dept) {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalForm = document.getElementById('modalForm');
  const modalBanner = document.getElementById('modalBanner');
  modalBanner.textContent = '';
  modalTitle.textContent = dept ? 'Edit Department' : 'Add Department';
  modalOverlay.hidden = false;

  modalForm.innerHTML = `
    <div><label for="f-name">Department name</label><input type="text" id="f-name" value="${dept ? dept.name : ''}"></div>
    <div><label for="f-desc">Description</label><textarea id="f-desc" rows="3">${dept ? (dept.description || '') : ''}</textarea></div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" id="cancelBtn">Cancel</button>
      <button type="submit" class="btn btn-primary">${dept ? 'Save changes' : 'Add department'}</button>
    </div>
  `;
  document.getElementById('cancelBtn').addEventListener('click', closeModal);

  modalForm.onsubmit = async function (e) {
    e.preventDefault();
    const name = document.getElementById('f-name').value.trim();
    if (name.length < 2) { modalBanner.textContent = 'Please enter a valid department name.'; return; }
    const description = document.getElementById('f-desc').value.trim();

    if (dept) {
      await fetch(`/api/departments/${dept.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description }) });
    } else {
      await fetch('/api/departments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description }) });
    }
    closeModal();
    await loadDepartments();
    await loadDoctors(); // department names may have changed
    await loadStats();
  };
}

// ---- MODAL SHARED ----
const modalOverlay = document.getElementById('modalOverlay');
document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

function closeModal() {
  modalOverlay.hidden = true;
  document.getElementById('modalForm').innerHTML = '';
}

// ---- CSV EXPORT ----
function exportAppointmentsCsv() {
  const statusVal = document.getElementById('statusFilter').value;
  const query = document.getElementById('appointmentSearchInput').value.trim().toLowerCase();
  const filtered = allAppointments.filter(a => {
    const matchesStatus = !statusVal || a.status === statusVal;
    const matchesQuery = a.patientName.toLowerCase().includes(query) || a.doctorName.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  const headers = ['Patient', 'Doctor', 'Department', 'Date', 'Time', 'Status'];
  const rows = filtered.map(a => [a.patientName, a.doctorName, a.department, a.date, a.time, a.status]);
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `appointments-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
