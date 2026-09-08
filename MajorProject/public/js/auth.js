// ============ SHARED AUTH HELPERS ============

function showBanner(el, message, type) {
  el.textContent = message;
  el.className = 'form-banner show ' + type;
}

function redirectForRole(role) {
  if (role === 'patient') window.location.href = '/patient-dashboard.html';
  else if (role === 'doctor') window.location.href = '/doctor-dashboard.html';
  else if (role === 'admin') window.location.href = '/admin-dashboard.html';
  else window.location.href = '/';
}

// ============ LOGIN FORM ============
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  const banner = document.getElementById('loginBanner');

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    banner.className = 'form-banner';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showBanner(banner, 'Please enter both email and password.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        showBanner(banner, data.error || 'Login failed.', 'error');
        return;
      }

      showBanner(banner, 'Login successful — redirecting…', 'success');
      setTimeout(() => redirectForRole(data.user.role), 500);
    } catch (err) {
      showBanner(banner, 'Could not reach the server. Is it running?', 'error');
    }
  });
}

// ============ REGISTER FORM ============
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const banner = document.getElementById('registerBanner');

  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    banner.className = 'form-banner';

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;

    if (name.length < 2) return showBanner(banner, 'Please enter your full name.', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showBanner(banner, 'Please enter a valid email.', 'error');
    if (password.length < 6) return showBanner(banner, 'Password must be at least 6 characters.', 'error');
    if (password !== confirmPassword) return showBanner(banner, 'Passwords do not match.', 'error');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role })
      });
      const data = await res.json();

      if (!res.ok) {
        showBanner(banner, data.error || 'Registration failed.', 'error');
        return;
      }

      showBanner(banner, 'Account created — redirecting…', 'success');
      setTimeout(() => redirectForRole(data.user.role), 500);
    } catch (err) {
      showBanner(banner, 'Could not reach the server. Is it running?', 'error');
    }
  });
}
