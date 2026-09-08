# Willow Grove Clinic — Management System (Major Project)

A full-stack clinic management system with role-based authentication for
Patients, Doctors, and Admins — built with Node.js, Express, and SQLite.

This is **Phase 1** of the Major Project: project setup, database schema,
and working registration/login for all three roles. Dashboards and
appointment management are built in later phases.

## Tech stack
- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`) — a single file, no separate
  database server required
- **Auth:** `express-session` for sessions, `bcryptjs` for password hashing
- **Frontend:** Plain HTML/CSS/JS (no framework)

## Setup instructions

1. **Install Node.js** if you don't have it already: https://nodejs.org (LTS version)

2. **Install dependencies** — open a terminal in this folder and run:
   ```
   npm install
   ```

3. **Create your environment file** — copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
   (On Windows, just duplicate the file and rename it, or run `copy .env.example .env`)

4. **Start the server:**
   ```
   npm start
   ```

5. Open your browser to **http://localhost:3000**

The database (`clinic.db`) is created automatically on first run, seeded
with demo accounts.

## Demo accounts
All demo accounts use the password `password123`:

| Role    | Email                              |
|---------|-------------------------------------|
| Admin   | admin@willowgrove.example           |
| Doctor  | arjun.kapoor@willowgrove.example    |
| Patient | patient@willowgrove.example         |

## Project structure
```
Major Project/
├── config/
│   └── db.js              # Database connection, schema, seed data
├── middleware/
│   └── auth.js             # requireAuth / requireRole middleware
├── routes/
│   └── authRoutes.js       # /api/auth/register, /login, /logout, /me
├── public/                 # Static frontend files
│   ├── css/style.css
│   ├── js/auth.js
│   ├── index.html
│   ├── login.html
│   └── register.html
├── server.js                # Express app entry point
├── package.json
├── .env.example
└── .gitignore
```

## What's implemented so far (Phase 1)
- Full database schema for users, departments, doctor/patient profiles,
  appointments, and notifications (ready for later phases)
- Registration with role selection (Patient / Doctor / Admin)
- Login with hashed password verification
- Session-based authentication
- Role-based access control middleware (dashboard routes are already
  protected, even before the dashboard pages themselves exist)
- Server-side validation on all auth inputs

## Coming in later phases
- Patient, Doctor, and Admin dashboards
- Appointment booking, rescheduling, and status management
- Department management
- Notifications
- Profile management (including password change, profile picture)
- Search, filtering, and CSV/PDF report export
