// ============ SIDEBAR TOGGLE (mobile) ============
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarClose = document.getElementById('sidebarClose');

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => sidebar.classList.add('open'));
}
if (sidebarClose && sidebar) {
  sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));
}

// Highlight the active sidebar link based on current page filename
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.sidebar-nav a').forEach(link => {
  if (link.getAttribute('href') === currentPage) link.classList.add('active');
});

// ============ SHARED MODAL HELPERS ============
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalForm = document.getElementById('modalForm');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');

function openModal(title) {
  if (!modalOverlay) return;
  modalTitle.textContent = title;
  modalOverlay.hidden = false;
}
function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.hidden = true;
  modalForm.innerHTML = '';
}
if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalCancel) modalCancel.addEventListener('click', closeModal);
if (modalOverlay) {
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
}

function fieldHtml(id, label, type = 'text', value = '', extra = '') {
  return `
    <div>
      <label for="${id}">${label}</label>
      <input type="${type}" id="${id}" value="${value}" ${extra}>
      <span class="modal-error" id="err-${id}"></span>
    </div>`;
}
function selectHtml(id, label, options, value = '') {
  const opts = options.map(o => `<option value="${o}" ${o === value ? 'selected' : ''}>${o}</option>`).join('');
  return `
    <div>
      <label for="${id}">${label}</label>
      <select id="${id}">${opts}</select>
      <span class="modal-error" id="err-${id}"></span>
    </div>`;
}

// ============ DASHBOARD HOME PAGE ============
const statGrid = document.getElementById('statGrid');
if (statGrid) {
  const doctors = dashGetAll(DASH_KEYS.doctors);
  const patients = dashGetAll(DASH_KEYS.patients);
  const appointments = dashGetAll(DASH_KEYS.appointments);
  const departments = dashGetAll(DASH_KEYS.departments);

  statGrid.innerHTML = `
    <div class="stat-card">
      <span class="stat-card-label">Total Doctors</span>
      <span class="stat-card-value">${doctors.length}</span>
      <span class="stat-card-sub">across ${departments.length} departments</span>
    </div>
    <div class="stat-card">
      <span class="stat-card-label">Total Patients</span>
      <span class="stat-card-value">${patients.length}</span>
      <span class="stat-card-sub">registered in system</span>
    </div>
    <div class="stat-card">
      <span class="stat-card-label">Total Appointments</span>
      <span class="stat-card-value">${appointments.length}</span>
      <span class="stat-card-sub">${appointments.filter(a => a.status === 'Pending').length} pending</span>
    </div>
    <div class="stat-card">
      <span class="stat-card-label">Departments</span>
      <span class="stat-card-value">${departments.length}</span>
      <span class="stat-card-sub">active specialties</span>
    </div>
  `;

  const deptBreakdown = document.getElementById('deptBreakdown');
  if (deptBreakdown) {
    deptBreakdown.innerHTML = departments.map(dep => {
      const count = doctors.filter(d => d.department === dep.name).length;
      return `<div class="history-row"><strong>${dep.name}</strong><span>${count} doctor${count !== 1 ? 's' : ''}</span></div>`;
    }).join('');
  }

  const recentAppointments = document.getElementById('recentAppointmentsBody');
  if (recentAppointments) {
    const recent = [...appointments].slice(0, 5);
    recentAppointments.innerHTML = recent.map(a => `
      <tr>
        <td>${a.patientName}</td>
        <td>${a.doctorName}</td>
        <td>${a.date}</td>
        <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
      </tr>
    `).join('') || `<tr class="empty-row"><td colspan="4">No appointments yet.</td></tr>`;
  }
}

// ============ DOCTORS MANAGEMENT PAGE ============
const doctorsTableBody = document.getElementById('doctorsTableBody');
if (doctorsTableBody) {
  const searchInput = document.getElementById('doctorSearchInput');
  const addBtn = document.getElementById('addDoctorBtn');

  function renderDoctorsTable() {
    const query = (searchInput.value || '').trim().toLowerCase();
    const doctors = dashGetAll(DASH_KEYS.doctors).filter(d => d.name.toLowerCase().includes(query));
    doctorsTableBody.innerHTML = doctors.map(d => `
      <tr>
        <td>${d.name}</td>
        <td>${d.department}</td>
        <td>${d.experience} yrs</td>
        <td>₹${d.fee}</td>
        <td>${d.phone}</td>
        <td class="table-actions">
          <button class="btn btn-ghost btn-small" data-edit="${d.id}">Edit</button>
          <button class="btn btn-danger btn-small" data-delete="${d.id}">Delete</button>
        </td>
      </tr>
    `).join('') || `<tr class="empty-row"><td colspan="6">No doctors found.</td></tr>`;

    doctorsTableBody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openDoctorModal(btn.dataset.edit));
    });
    doctorsTableBody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this doctor?')) {
          dashDelete(DASH_KEYS.doctors, btn.dataset.delete);
          renderDoctorsTable();
        }
      });
    });
  }

  function openDoctorModal(id) {
    const doctor = id ? dashGetById(DASH_KEYS.doctors, id) : { name: '', department: '', experience: '', fee: '', phone: '', email: '' };
    openModal(id ? 'Edit Doctor' : 'Add Doctor');
    modalForm.innerHTML = `
      ${fieldHtml('f-name', 'Full name', 'text', doctor.name)}
      ${selectHtml('f-department', 'Department', ['General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology', 'Physiotherapy'], doctor.department)}
      ${fieldHtml('f-experience', 'Experience (years)', 'number', doctor.experience, 'min="0" max="60"')}
      ${fieldHtml('f-fee', 'Consultation fee (₹)', 'number', doctor.fee, 'min="0"')}
      ${fieldHtml('f-phone', 'Phone', 'tel', doctor.phone)}
      ${fieldHtml('f-email', 'Email', 'email', doctor.email)}
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="modalCancel2">Cancel</button>
        <button type="submit" class="btn btn-primary">${id ? 'Save changes' : 'Add doctor'}</button>
      </div>
    `;
    document.getElementById('modalCancel2').addEventListener('click', closeModal);

    modalForm.onsubmit = function (e) {
      e.preventDefault();
      const name = document.getElementById('f-name').value.trim();
      const phone = document.getElementById('f-phone').value.trim();
      const email = document.getElementById('f-email').value.trim();
      let valid = true;
      if (name.length < 2) { document.getElementById('err-f-name').textContent = 'Enter a valid name.'; valid = false; }
      else document.getElementById('err-f-name').textContent = '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('err-f-email').textContent = 'Enter a valid email.'; valid = false; }
      else document.getElementById('err-f-email').textContent = '';
      if (!/^[0-9+\-\s()]{7,15}$/.test(phone)) { document.getElementById('err-f-phone').textContent = 'Enter a valid phone.'; valid = false; }
      else document.getElementById('err-f-phone').textContent = '';
      if (!valid) return;

      const record = {
        name,
        department: document.getElementById('f-department').value,
        experience: Number(document.getElementById('f-experience').value) || 0,
        fee: Number(document.getElementById('f-fee').value) || 0,
        phone,
        email
      };
      if (id) dashUpdate(DASH_KEYS.doctors, id, record);
      else dashAdd(DASH_KEYS.doctors, record);
      closeModal();
      renderDoctorsTable();
    };
  }

  searchInput.addEventListener('input', renderDoctorsTable);
  addBtn.addEventListener('click', () => openDoctorModal(null));
  renderDoctorsTable();
}

// ============ PATIENTS MANAGEMENT PAGE ============
const patientsTableBody = document.getElementById('patientsTableBody');
if (patientsTableBody) {
  const searchInput = document.getElementById('patientSearchInput');
  const addBtn = document.getElementById('addPatientBtn');

  function renderPatientsTable() {
    const query = (searchInput.value || '').trim().toLowerCase();
    const patients = dashGetAll(DASH_KEYS.patients).filter(p => p.name.toLowerCase().includes(query));
    patientsTableBody.innerHTML = patients.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.age}</td>
        <td>${p.gender}</td>
        <td>${p.phone}</td>
        <td>${p.email}</td>
        <td class="table-actions">
          <button class="btn btn-ghost btn-small" data-edit="${p.id}">Edit</button>
          <button class="btn btn-danger btn-small" data-delete="${p.id}">Delete</button>
        </td>
      </tr>
    `).join('') || `<tr class="empty-row"><td colspan="6">No patients found.</td></tr>`;

    patientsTableBody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openPatientModal(btn.dataset.edit));
    });
    patientsTableBody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this patient?')) {
          dashDelete(DASH_KEYS.patients, btn.dataset.delete);
          renderPatientsTable();
        }
      });
    });
  }

  function openPatientModal(id) {
    const patient = id ? dashGetById(DASH_KEYS.patients, id) : { name: '', age: '', gender: 'Female', phone: '', email: '' };
    openModal(id ? 'Edit Patient' : 'Add Patient');
    modalForm.innerHTML = `
      ${fieldHtml('f-name', 'Full name', 'text', patient.name)}
      ${fieldHtml('f-age', 'Age', 'number', patient.age, 'min="0" max="120"')}
      ${selectHtml('f-gender', 'Gender', ['Female', 'Male', 'Other'], patient.gender)}
      ${fieldHtml('f-phone', 'Phone', 'tel', patient.phone)}
      ${fieldHtml('f-email', 'Email', 'email', patient.email)}
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="modalCancel2">Cancel</button>
        <button type="submit" class="btn btn-primary">${id ? 'Save changes' : 'Add patient'}</button>
      </div>
    `;
    document.getElementById('modalCancel2').addEventListener('click', closeModal);

    modalForm.onsubmit = function (e) {
      e.preventDefault();
      const name = document.getElementById('f-name').value.trim();
      const phone = document.getElementById('f-phone').value.trim();
      const email = document.getElementById('f-email').value.trim();
      const age = document.getElementById('f-age').value;
      let valid = true;
      if (name.length < 2) { document.getElementById('err-f-name').textContent = 'Enter a valid name.'; valid = false; }
      else document.getElementById('err-f-name').textContent = '';
      if (!(age > 0 && age <= 120)) { document.getElementById('err-f-age').textContent = 'Enter a valid age.'; valid = false; }
      else document.getElementById('err-f-age').textContent = '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('err-f-email').textContent = 'Enter a valid email.'; valid = false; }
      else document.getElementById('err-f-email').textContent = '';
      if (!/^[0-9+\-\s()]{7,15}$/.test(phone)) { document.getElementById('err-f-phone').textContent = 'Enter a valid phone.'; valid = false; }
      else document.getElementById('err-f-phone').textContent = '';
      if (!valid) return;

      const record = { name, age: Number(age), gender: document.getElementById('f-gender').value, phone, email };
      if (id) dashUpdate(DASH_KEYS.patients, id, record);
      else dashAdd(DASH_KEYS.patients, record);
      closeModal();
      renderPatientsTable();
    };
  }

  searchInput.addEventListener('input', renderPatientsTable);
  addBtn.addEventListener('click', () => openPatientModal(null));
  renderPatientsTable();
}

// ============ APPOINTMENTS MANAGEMENT PAGE ============
const appointmentsTableBody = document.getElementById('appointmentsTableBody');
if (appointmentsTableBody) {
  const searchInput = document.getElementById('appointmentSearchInput');
  const statusFilter = document.getElementById('appointmentStatusFilter');

  function renderAppointmentsTable() {
    const query = (searchInput.value || '').trim().toLowerCase();
    const statusVal = statusFilter.value;
    const appointments = dashGetAll(DASH_KEYS.appointments).filter(a => {
      const matchesQuery = a.patientName.toLowerCase().includes(query) || a.doctorName.toLowerCase().includes(query);
      const matchesStatus = statusVal === '' || a.status === statusVal;
      return matchesQuery && matchesStatus;
    });

    appointmentsTableBody.innerHTML = appointments.map(a => `
      <tr>
        <td>${a.patientName}</td>
        <td>${a.doctorName}</td>
        <td>${a.department}</td>
        <td>${a.date} · ${a.time}</td>
        <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
        <td class="table-actions">
          <select class="status-select" data-id="${a.id}">
            ${['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => `<option value="${s}" ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>
    `).join('') || `<tr class="empty-row"><td colspan="6">No appointments found.</td></tr>`;

    appointmentsTableBody.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', () => {
        dashUpdate(DASH_KEYS.appointments, sel.dataset.id, { status: sel.value });
        renderAppointmentsTable();
      });
    });
  }

  searchInput.addEventListener('input', renderAppointmentsTable);
  statusFilter.addEventListener('change', renderAppointmentsTable);
  renderAppointmentsTable();
}

// ============ DEPARTMENTS MANAGEMENT PAGE ============
const departmentsTableBody = document.getElementById('departmentsTableBody');
if (departmentsTableBody) {
  const addBtn = document.getElementById('addDepartmentBtn');

  function renderDepartmentsTable() {
    const departments = dashGetAll(DASH_KEYS.departments);
    const doctors = dashGetAll(DASH_KEYS.doctors);
    departmentsTableBody.innerHTML = departments.map(d => {
      const count = doctors.filter(doc => doc.department === d.name).length;
      return `
        <tr>
          <td>${d.name}</td>
          <td>${d.headDoctor}</td>
          <td>${count}</td>
          <td>${d.description}</td>
          <td class="table-actions">
            <button class="btn btn-ghost btn-small" data-edit="${d.id}">Edit</button>
            <button class="btn btn-danger btn-small" data-delete="${d.id}">Delete</button>
          </td>
        </tr>
      `;
    }).join('') || `<tr class="empty-row"><td colspan="5">No departments found.</td></tr>`;

    departmentsTableBody.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openDepartmentModal(btn.dataset.edit));
    });
    departmentsTableBody.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this department?')) {
          dashDelete(DASH_KEYS.departments, btn.dataset.delete);
          renderDepartmentsTable();
        }
      });
    });
  }

  function openDepartmentModal(id) {
    const dept = id ? dashGetById(DASH_KEYS.departments, id) : { name: '', headDoctor: '', description: '' };
    openModal(id ? 'Edit Department' : 'Add Department');
    modalForm.innerHTML = `
      ${fieldHtml('f-name', 'Department name', 'text', dept.name)}
      ${fieldHtml('f-head', 'Head doctor', 'text', dept.headDoctor)}
      <div>
        <label for="f-desc">Description</label>
        <textarea id="f-desc" rows="3">${dept.description}</textarea>
        <span class="modal-error" id="err-f-desc"></span>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="modalCancel2">Cancel</button>
        <button type="submit" class="btn btn-primary">${id ? 'Save changes' : 'Add department'}</button>
      </div>
    `;
    document.getElementById('modalCancel2').addEventListener('click', closeModal);

    modalForm.onsubmit = function (e) {
      e.preventDefault();
      const name = document.getElementById('f-name').value.trim();
      let valid = true;
      if (name.length < 2) { document.getElementById('err-f-name').textContent = 'Enter a valid department name.'; valid = false; }
      else document.getElementById('err-f-name').textContent = '';
      if (!valid) return;

      const record = {
        name,
        headDoctor: document.getElementById('f-head').value.trim(),
        description: document.getElementById('f-desc').value.trim()
      };
      if (id) dashUpdate(DASH_KEYS.departments, id, record);
      else dashAdd(DASH_KEYS.departments, record);
      closeModal();
      renderDepartmentsTable();
    };
  }

  addBtn.addEventListener('click', () => openDepartmentModal(null));
  renderDepartmentsTable();
}
