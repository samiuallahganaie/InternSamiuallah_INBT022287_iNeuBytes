// ============ MOBILE NAV TOGGLE ============
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Close mobile menu after a nav link is tapped
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ============ SMOOTH SCROLL (fallback for older browsers) ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============ APPOINTMENT FORM VALIDATION ============
const form = document.getElementById('appointmentForm');
const successMsg = document.getElementById('formSuccess');

const validators = {
  patientName: value => value.trim().length >= 2 || 'Please enter your full name.',
  email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Enter a valid email address.',
  phone: value => /^[0-9+\-\s()]{7,15}$/.test(value) || 'Enter a valid phone number.',
  department: value => value !== '' || 'Please select a department.'
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

// Live validation as the user leaves each field
Object.keys(validators).forEach(field => {
  const input = document.getElementById(field);
  input.addEventListener('blur', () => validateField(field));
});

form.addEventListener('submit', function (e) {
  e.preventDefault();
  successMsg.textContent = '';

  const fields = Object.keys(validators);
  const results = fields.map(validateField);
  const allValid = results.every(Boolean);

  if (allValid) {
    successMsg.textContent = 'Thanks! Your request has been received — our front desk will confirm your slot within one business day.';
    form.reset();
    fields.forEach(field => showError(field, ''));
  } else {
    successMsg.textContent = '';
    const firstInvalid = fields.find((field, i) => !results[i]);
    document.getElementById(firstInvalid).focus();
  }
});