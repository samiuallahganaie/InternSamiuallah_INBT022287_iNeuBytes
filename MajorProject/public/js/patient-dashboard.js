// ============ PATIENT DASHBOARD ============
let selectedSlot = null;
const FIXED_SLOTS = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];

(async function init() {
  const user = await guardDashboard('patient');
  if (!user) return;

  await loadDoctors();
  renderSlots();
  await loadAppointments();
  await loadAndRenderNotifications();
  await loadRecords();
  await loadProfileForm();
  wirePasswordForm();

  document.getElementById('dateInput').min = new Date().toISOString().split('T')[0];
})();

async function loadRecords() {
  const res = await fetch('/api/medical-records');
  const data = await res.json();
  const list = document.getElementById('recordsList');

  if (data.records.length === 0) {
    list.innerHTML = '<p class="slot-hint">No medical records yet.</p>';
    return;
  }

  list.innerHTML = data.records.map(r => `
    <div class="notification-item">
      <p><strong>${r.doctorName}</strong> — ${r.note}</p>
      <span class="notification-time">${new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    </div>
  `).join('');
}

async function loadDoctors() {
  const res = await fetch('/api/doctors');
  const data = await res.json();
  const select = document.getElementById('doctorSelect');
  select.innerHTML = '<option value="" disabled selected>Choose a doctor</option>' +
    data.doctors.map(d => `<option value="${d.id}">${d.name} — ${d.department} (₹${d.fee})</option>`).join('');
}

function renderSlots() {
  const grid = document.getElementById('slotGrid');
  grid.innerHTML = '';
  FIXED_SLOTS.forEach(slot => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot-btn';
    btn.textContent = slot;
    btn.addEventListener('click', () => {
      selectedSlot = slot;
      document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    grid.appendChild(btn);
  });
}

async function loadAppointments() {
  const res = await fetch('/api/appointments');
  const data = await res.json();
  const tbody = document.getElementById('appointmentsBody');

  if (data.appointments.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No appointments yet — book one above.</td></tr>';
    return;
  }

  tbody.innerHTML = data.appointments.map(a => `
    <tr>
      <td>${a.doctorName}</td>
      <td>${a.department}</td>
      <td>${formatDate(a.date)} · ${a.time}</td>
      <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
      <td>${['Pending', 'Confirmed'].includes(a.status) ? `<button class="btn btn-ghost btn-small" data-reschedule="${a.id}">Reschedule</button>` : '—'}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-reschedule]').forEach(btn => {
    btn.addEventListener('click', () => openRescheduleModal(Number(btn.dataset.reschedule)));
  });
}

function openRescheduleModal(appointmentId) {
  const newDate = prompt('New date (YYYY-MM-DD):');
  if (!newDate) return;
  const newTime = prompt('New time slot (e.g. 11:00 AM):');
  if (!newTime) return;

  fetch(`/api/appointments/${appointmentId}/reschedule`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: newDate, time: newTime })
  }).then(async res => {
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Reschedule failed.'); return; }
    await loadAppointments();
    await loadAndRenderNotifications();
  });
}

const bookingForm = document.getElementById('bookingForm');
const banner = document.getElementById('bookingBanner');

bookingForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  banner.className = 'form-banner';

  const doctorId = document.getElementById('doctorSelect').value;
  const date = document.getElementById('dateInput').value;
  const notes = document.getElementById('notesInput').value;

  if (!doctorId) return showFormBanner('Please select a doctor.', 'error');
  if (!date) return showFormBanner('Please select a date.', 'error');
  if (!selectedSlot) return showFormBanner('Please select a time slot.', 'error');

  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId, date, time: selectedSlot, notes })
    });
    const data = await res.json();

    if (!res.ok) return showFormBanner(data.error || 'Booking failed.', 'error');

    showFormBanner('Appointment requested! It will show as Pending until confirmed.', 'success');
    bookingForm.reset();
    selectedSlot = null;
    document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
    await loadAppointments();
    await loadAndRenderNotifications();
  } catch (err) {
    showFormBanner('Could not reach the server.', 'error');
  }
});

function showFormBanner(message, type) {
  banner.textContent = message;
  banner.className = 'form-banner show ' + type;
}
