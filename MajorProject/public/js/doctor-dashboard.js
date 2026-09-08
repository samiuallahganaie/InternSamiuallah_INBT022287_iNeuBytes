// ============ DOCTOR DASHBOARD ============
let allAppointments = [];

(async function init() {
  const user = await guardDashboard('doctor');
  if (!user) return;
  await loadAppointments();
  await loadAndRenderNotifications();
  await loadProfileForm();
  wirePasswordForm();
  document.getElementById('statusFilter').addEventListener('change', renderAppointments);
  document.getElementById('appointmentSearchInput').addEventListener('input', renderAppointments);
})();

async function loadAppointments() {
  const res = await fetch('/api/appointments');
  const data = await res.json();
  allAppointments = data.appointments;
  renderStats();
  renderAppointments();
  renderMyPatients();
}

function renderStats() {
  const total = allAppointments.length;
  const pending = allAppointments.filter(a => a.status === 'Pending').length;
  const confirmed = allAppointments.filter(a => a.status === 'Confirmed').length;
  const completed = allAppointments.filter(a => a.status === 'Completed').length;

  document.getElementById('statGrid').innerHTML = `
    <div class="stat-card"><span class="stat-card-label">Total</span><span class="stat-card-value">${total}</span></div>
    <div class="stat-card"><span class="stat-card-label">Pending</span><span class="stat-card-value">${pending}</span></div>
    <div class="stat-card"><span class="stat-card-label">Confirmed</span><span class="stat-card-value">${confirmed}</span></div>
    <div class="stat-card"><span class="stat-card-label">Completed</span><span class="stat-card-value">${completed}</span></div>
  `;
}

function renderAppointments() {
  const statusVal = document.getElementById('statusFilter').value;
  const query = document.getElementById('appointmentSearchInput').value.trim().toLowerCase();
  const filtered = allAppointments.filter(a => {
    const matchesStatus = !statusVal || a.status === statusVal;
    const matchesQuery = a.patientName.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });
  const tbody = document.getElementById('appointmentsBody');

  tbody.innerHTML = filtered.map(a => `
    <tr>
      <td>${a.patientName}</td>
      <td>${a.department}</td>
      <td>${formatDate(a.date)} · ${a.time}</td>
      <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
      <td>
        <select class="status-select" data-id="${a.id}">
          ${['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => `<option value="${s}" ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td>${a.status === 'Completed' ? `<button class="btn btn-ghost btn-small" data-record="${a.id}">Add note</button>` : '—'}</td>
    </tr>
  `).join('') || '<tr class="empty-row"><td colspan="6">No appointments found.</td></tr>';

  tbody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      await fetch(`/api/appointments/${sel.dataset.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: sel.value })
      });
      await loadAppointments();
    });
  });

  tbody.querySelectorAll('[data-record]').forEach(btn => {
    btn.addEventListener('click', () => openRecordModal(Number(btn.dataset.record)));
  });
}

function renderMyPatients() {
  const byPatient = {};
  allAppointments.forEach(a => {
    if (!byPatient[a.patientId]) byPatient[a.patientId] = { name: a.patientName, visits: 0, lastDate: a.date };
    byPatient[a.patientId].visits++;
    if (a.date > byPatient[a.patientId].lastDate) byPatient[a.patientId].lastDate = a.date;
  });
  const patients = Object.values(byPatient);
  const tbody = document.getElementById('myPatientsBody');

  tbody.innerHTML = patients.map(p => `
    <tr><td>${p.name}</td><td>${p.visits}</td><td>${formatDate(p.lastDate)}</td></tr>
  `).join('') || '<tr class="empty-row"><td colspan="3">No patients yet.</td></tr>';
}

// ---- Medical record modal ----
const modalOverlay = document.getElementById('modalOverlay');
const modalForm = document.getElementById('modalForm');
const modalBanner = document.getElementById('modalBanner');
document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

function closeModal() {
  modalOverlay.hidden = true;
  modalForm.innerHTML = '';
}

function openRecordModal(appointmentId) {
  modalBanner.textContent = '';
  modalOverlay.hidden = false;
  modalForm.innerHTML = `
    <div>
      <label for="f-note">Diagnosis / prescription notes</label>
      <textarea id="f-note" rows="4" placeholder="e.g. Prescribed rest and hydration, follow up in 1 week"></textarea>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" id="cancelBtn">Cancel</button>
      <button type="submit" class="btn btn-primary">Save record</button>
    </div>
  `;
  document.getElementById('cancelBtn').addEventListener('click', closeModal);

  modalForm.onsubmit = async function (e) {
    e.preventDefault();
    const note = document.getElementById('f-note').value.trim();
    if (note.length < 2) { modalBanner.textContent = 'Please enter a note.'; return; }

    const res = await fetch('/api/medical-records', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, note })
    });
    const data = await res.json();
    if (!res.ok) { modalBanner.textContent = data.error || 'Something went wrong.'; return; }

    closeModal();
  };
}
