// ============ AUTH MIDDLEWARE ============
// requireAuth: blocks access unless a session exists (user is logged in).
// requireRole: blocks access unless the logged-in user has one of the allowed roles.
// Both respond with JSON for API routes and redirect for page routes.

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  return res.redirect('/login.html');
}

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.session || !req.session.user) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ error: 'Not logged in.' });
      }
      return res.redirect('/login.html');
    }
    if (!allowedRoles.includes(req.session.user.role)) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ error: 'You do not have access to this resource.' });
      }
      return res.status(403).send('Access denied — this page is not available for your role.');
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
