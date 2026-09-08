// ============ SHARED DASHBOARD HELPERS ============

async function guardDashboard(requiredRole) {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();

    if (!data.user) {
      window.location.href = '/login.html';
      return null;
    }
    if (data.user.role !== requiredRole) {
      document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif;">Access denied — this dashboard is not available for your role.</p>';
      return null;
    }

    const nameEl = document.getElementById('profileName');
    const avatarEl = document.getElementById('profileAvatar');
    if (nameEl) nameEl.textContent = data.user.name;
    if (avatarEl) avatarEl.textContent = data.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return data.user;
  } catch (err) {
    window.location.href = '/login.html';
    return null;
  }
}

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarClose = document.getElementById('sidebarClose');
if (sidebarToggle && sidebar) sidebarToggle.addEventListener('click', () => sidebar.classList.add('open'));
if (sidebarClose && sidebar) sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// ============ NOTIFICATIONS (shared by patient & doctor dashboards) ============
async function loadAndRenderNotifications() {
  const list = document.getElementById('notificationsList');
  const badge = document.getElementById('notificationBadge');
  if (!list) return;

  const res = await fetch('/api/notifications');
  const data = await res.json();
  const unreadCount = data.notifications.filter(n => !n.is_read).length;

  if (badge) {
    badge.textContent = unreadCount;
    badge.hidden = unreadCount === 0;
  }

  if (data.notifications.length === 0) {
    list.innerHTML = '<p class="slot-hint">No notifications yet.</p>';
    return;
  }

  list.innerHTML = data.notifications.map(n => `
    <div class="notification-item ${n.is_read ? '' : 'unread'}">
      <p>${n.message}</p>
      <span class="notification-time">${new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  `).join('');
}

const markAllReadBtn = document.getElementById('markAllReadBtn');
if (markAllReadBtn) {
  markAllReadBtn.addEventListener('click', async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
    await loadAndRenderNotifications();
  });
}

// ============ PROFILE + CHANGE PASSWORD (shared by patient & doctor) ============
let selectedProfilePicture = undefined; // undefined = unchanged, null = removed, string = new base64

async function loadProfileForm() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  const res = await fetch('/api/profile');
  const data = await res.json();
  const p = data.profile;

  if (document.getElementById('p-name')) document.getElementById('p-name').value = p.name || '';
  if (document.getElementById('p-phone')) document.getElementById('p-phone').value = p.phone || '';
  if (document.getElementById('p-age')) document.getElementById('p-age').value = p.age || '';
  if (document.getElementById('p-gender')) document.getElementById('p-gender').value = p.gender || 'Female';
  if (document.getElementById('p-address')) document.getElementById('p-address').value = p.address || '';
  if (document.getElementById('p-experience')) document.getElementById('p-experience').value = p.experience || 0;
  if (document.getElementById('p-fee')) document.getElementById('p-fee').value = p.fee || 0;
  if (document.getElementById('p-bio')) document.getElementById('p-bio').value = p.bio || '';

  const preview = document.getElementById('p-picture-preview');
  if (preview) {
    if (p.profilePicture) {
      preview.src = p.profilePicture;
      preview.hidden = false;
    } else {
      preview.hidden = true;
    }
  }

  const pictureInput = document.getElementById('p-picture');
  if (pictureInput) {
    pictureInput.addEventListener('change', () => {
      const file = pictureInput.files[0];
      if (!file) return;
      if (file.size > 1.5 * 1024 * 1024) {
        alert('Please choose an image under 1.5MB.');
        pictureInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        selectedProfilePicture = reader.result;
        if (preview) { preview.src = reader.result; preview.hidden = false; }
      };
      reader.readAsDataURL(file);
    });
  }

  const removeBtn = document.getElementById('p-picture-remove');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      selectedProfilePicture = null;
      if (preview) preview.hidden = true;
      if (pictureInput) pictureInput.value = '';
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const banner = document.getElementById('profileBanner');
    const payload = { name: document.getElementById('p-name').value.trim(), phone: document.getElementById('p-phone').value.trim() };
    if (document.getElementById('p-age')) payload.age = document.getElementById('p-age').value;
    if (document.getElementById('p-gender')) payload.gender = document.getElementById('p-gender').value;
    if (document.getElementById('p-address')) payload.address = document.getElementById('p-address').value.trim();
    if (document.getElementById('p-experience')) payload.experience = document.getElementById('p-experience').value;
    if (document.getElementById('p-fee')) payload.fee = document.getElementById('p-fee').value;
    if (document.getElementById('p-bio')) payload.bio = document.getElementById('p-bio').value.trim();
    if (selectedProfilePicture !== undefined) payload.profilePicture = selectedProfilePicture;

    const putRes = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const putData = await putRes.json();
    banner.textContent = putRes.ok ? 'Profile saved.' : (putData.error || 'Something went wrong.');
    banner.className = 'form-banner show ' + (putRes.ok ? 'success' : 'error');
    if (putRes.ok) {
      const nameEl = document.getElementById('profileName');
      if (nameEl) nameEl.textContent = payload.name;
      selectedProfilePicture = undefined;
    }
  });
}

function wirePasswordForm() {
  const form = document.getElementById('passwordForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const banner = document.getElementById('passwordBanner');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    const res = await fetch('/api/auth/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    banner.textContent = res.ok ? 'Password updated.' : (data.error || 'Something went wrong.');
    banner.className = 'form-banner show ' + (res.ok ? 'success' : 'error');
    if (res.ok) form.reset();
  });
}
