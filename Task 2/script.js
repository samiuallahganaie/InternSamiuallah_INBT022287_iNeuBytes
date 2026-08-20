// ============ MOBILE NAV TOGGLE (shared across all pages) ============
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
  });
}

// ============ LOCAL STORAGE HELPERS ============
const STORAGE_KEY = 'willowgrove_appointments';

function getAppointments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAppointment(appointment) {
  const appointments = getAppointments();
  appointments.unshift(appointment); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// ============ HOME PAGE: department cards ============
const departmentGrid = document.getElementById('departmentGrid');
if (departmentGrid && typeof getDepartments === 'function') {
  getDepartments().forEach(dept => {
    const count = DOCTORS.filter(d => d.department === dept).length;
    const card = document.createElement('article');
    card.className = 'service-card';
    card.innerHTML = `
      <h3>${dept}</h3>
      <p>${count} specialist${count > 1 ? 's' : ''} available for booking.</p>
      <a href="doctors.html?department=${encodeURIComponent(dept)}" class="btn btn-ghost btn-small">View doctors</a>
    `;
    departmentGrid.appendChild(card);
  });
}

// ============ DOCTORS LISTING PAGE ============
const doctorGrid = document.getElementById('doctorGrid');
if (doctorGrid) {
  const searchInput = document.getElementById('doctorSearch');
  const departmentFilter = document.getElementById('departmentFilter');
  const emptyState = document.getElementById('emptyState');

  // Populate department filter options
  getDepartments().forEach(dept => {
    const opt = document.createElement('option');
    opt.value = dept;
    opt.textContent = dept;
    departmentFilter.appendChild(opt);
  });

  // Pre-select department from URL query (?department=...)
  const urlParams = new URLSearchParams(window.location.search);
  const presetDept = urlParams.get('department');
  if (presetDept) departmentFilter.value = presetDept;

  function renderDoctors() {
    const query = searchInput.value.trim().toLowerCase();
    const dept = departmentFilter.value;

    const filtered = DOCTORS.filter(doc => {
      const matchesName = doc.name.toLowerCase().includes(query);
      const matchesDept = dept === '' || doc.department === dept;
      return matchesName && matchesDept;
    });

    doctorGrid.innerHTML = '';
    emptyState.hidden = filtered.length > 0;

    filtered.forEach(doc => {
      const card = document.createElement('article');
      card.className = 'doctor-card-full';
      card.innerHTML = `
        <div class="doctor-card-top">
          <div class="doctor-avatar">${doc.initials}</div>
          <div>
            <h3>${doc.name}</h3>
            <p class="doctor-role">${doc.department}</p>
          </div>
        </div>
        <div class="doctor-meta">
          <span><strong>${doc.experience}</strong> yrs experience</span>
          <span><strong>₹${doc.fee}</strong> fee</span>
        </div>
        <div class="doctor-card-actions">
          <a href="doctor-details.html?id=${doc.id}" class="btn btn-ghost btn-small">View profile</a>
          <a href="booking.html?doctor=${doc.id}" class="btn btn-primary btn-small">Book now</a>
        </div>
      `;
      doctorGrid.appendChild(card);
    });
  }

  searchInput.addEventListener('input', renderDoctors);
  departmentFilter.addEventListener('change', renderDoctors);
  renderDoctors();
}

// ============ DOCTOR DETAILS PAGE ============
const profileCard = document.getElementById('profileCard');
if (profileCard) {
  const params = new URLSearchParams(window.location.search);
  const doctor = getDoctorById(params.get('id'));

  if (doctor) {
    document.title = `${doctor.name} — Willow Grove Clinic`;
    profileCard.innerHTML = `
      <div class="doctor-avatar doctor-avatar-lg">${doctor.initials}</div>
      <div class="profile-info">
        <p class="eyebrow">${doctor.department}</p>
        <h1>${doctor.name}</h1>
        <p>${doctor.bio}</p>
        <dl>
          <dt>Experience</dt><dd>${doctor.experience} years</dd>
          <dt>Consultation fee</dt><dd>₹${doctor.fee}</dd>
        </dl>
        <p class="eyebrow">Available time slots</p>
        <div class="slot-pills">
          ${doctor.slots.map(s => `<span class="slot-pill">${s}</span>`).join('')}
        </div>
        <a href="booking.html?doctor=${doctor.id}" class="btn btn-primary">Book with ${doctor.name.replace('Dr. ', 'Dr. ')}</a>
      </div>
    `;
  } else {
    profileCard.innerHTML = `<p>Doctor not found. <a href="doctors.html">Browse all doctors</a>.</p>`;
  }
}

// ============ BOOKING PAGE ============
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
  const doctorSelect = document.getElementById('doctorSelect');
  const dateInput = document.getElementById('appointmentDate');
  const slotGrid = document.getElementById('slotGrid');
  let selectedSlot = null;

  // Populate doctor dropdown
  DOCTORS.forEach(doc => {
    const opt = document.createElement('option');
    opt.value = doc.id;
    opt.textContent = `${doc.name} — ${doc.department}`;
    doctorSelect.appendChild(opt);
  });

  // Pre-select doctor from URL (?doctor=id)
  const params = new URLSearchParams(window.location.search);
  const presetDoctor = params.get('doctor');
  if (presetDoctor) doctorSelect.value = presetDoctor;

  // Restrict date input to today or later
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;

  function renderSlots() {
    const doctor = getDoctorById(doctorSelect.value);
    selectedSlot = null;
    updateSummary();

    if (!doctor) {
      slotGrid.innerHTML = '<p class="slot-hint">Choose a doctor to see available time slots.</p>';
      return;
    }
    slotGrid.innerHTML = '';
    doctor.slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-btn';
      btn.textContent = slot;
      btn.addEventListener('click', () => {
        selectedSlot = slot;
        document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        showError('timeSlot', '');
        updateSummary();
      });
      slotGrid.appendChild(btn);
    });
  }

  function updateSummary() {
    const doctor = getDoctorById(doctorSelect.value);
    document.getElementById('sumDoctor').textContent = doctor ? doctor.name : '—';
    document.getElementById('sumDepartment').textContent = doctor ? doctor.department : '—';
    document.getElementById('sumDate').textContent = dateInput.value ? formatDate(dateInput.value) : '—';
    document.getElementById('sumTime').textContent = selectedSlot || '—';
    document.getElementById('sumFee').textContent = doctor ? `₹${doctor.fee}` : '—';
  }

  doctorSelect.addEventListener('change', renderSlots);
  dateInput.addEventListener('change', updateSummary);
  renderSlots();

  // ---- Validation ----
  const validators = {
    doctorSelect: value => value !== '' || 'Please select a doctor.',
    appointmentDate: value => value !== '' || 'Please select a date.',
    patientName: value => value.trim().length >= 2 || 'Please enter the patient\'s full name.',
    patientEmail: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Enter a valid email address.',
    patientPhone: value => /^[0-9+\-\s()]{7,15}$/.test(value) || 'Enter a valid phone number.',
    patientAge: value => (value !== '' && Number(value) > 0 && Number(value) <= 120) || 'Enter a valid age.'
  };

  function showError(field, message) {
    const errorEl = document.getElementById('err-' + field);
    const inputEl = document.getElementById(field);
    if (errorEl) errorEl.textContent = message || '';
    if (inputEl) inputEl.classList.toggle('invalid', Boolean(message));
  }

  function validateField(field) {
    const input = document.getElementById(field);
    const result = validators[field](input.value);
    const message = result === true ? '' : result;
    showError(field, message);
    return message === '';
  }

  Object.keys(validators).forEach(field => {
    const input = document.getElementById(field);
    input.addEventListener('blur', () => validateField(field));
  });

  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const fields = Object.keys(validators);
    const results = fields.map(validateField);
    const slotValid = selectedSlot !== null;
    showError('timeSlot', slotValid ? '' : 'Please select a time slot.');

    if (!results.every(Boolean) || !slotValid) {
      const firstInvalidField = fields.find((f, i) => !results[i]);
      if (firstInvalidField) document.getElementById(firstInvalidField).focus();
      return;
    }

    const doctor = getDoctorById(doctorSelect.value);
    const appointment = {
      id: 'apt_' + Date.now(),
      doctorId: doctor.id,
      doctorName: doctor.name,
      department: doctor.department,
      fee: doctor.fee,
      date: dateInput.value,
      time: selectedSlot,
      patientName: document.getElementById('patientName').value.trim(),
      patientEmail: document.getElementById('patientEmail').value.trim(),
      patientPhone: document.getElementById('patientPhone').value.trim(),
      patientAge: document.getElementById('patientAge').value,
      notes: document.getElementById('notes').value.trim(),
      status: 'Confirmed',
      bookedAt: new Date().toISOString()
    };

    saveAppointment(appointment);
    window.location.href = `confirmation.html?id=${appointment.id}`;
  });
}

// ============ CONFIRMATION / HISTORY PAGE ============
const historyList = document.getElementById('historyList');
if (historyList) {
  const appointments = getAppointments();
  const params = new URLSearchParams(window.location.search);
  const justBookedId = params.get('id');

  // Show confirmation banner if arriving right after a booking
  if (justBookedId) {
    const justBooked = appointments.find(a => a.id === justBookedId);
    if (justBooked) {
      const banner = document.getElementById('confirmationBanner');
      const text = document.getElementById('confirmationText');
      text.textContent = `${justBooked.doctorName} · ${formatDate(justBooked.date)} at ${justBooked.time}. A confirmation has been noted against ${justBooked.patientName}'s appointment.`;
      banner.hidden = false;
    }
  }

  const historyEmpty = document.getElementById('historyEmpty');
  historyEmpty.hidden = appointments.length > 0;

  appointments.forEach(apt => {
    const card = document.createElement('article');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="history-card-main">
        <h3>${apt.doctorName} — ${apt.department}</h3>
        <p>${formatDate(apt.date)} at ${apt.time} · Patient: ${apt.patientName} · Fee: ₹${apt.fee}</p>
      </div>
      <span class="history-status">${apt.status}</span>
    `;
    historyList.appendChild(card);
  });
}
