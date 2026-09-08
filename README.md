# InternSamiuallah_INBT022287_iNeuBytes

**Name:** Samiuallah Ganaie
**Regd No:** INBT022287
**Course ID:** WBINB20726
**Program:** Virtual iNeuBytes Internship Program (VIIP)
**Mentor:** Mayank Kumar (IIT Dhanbad) — Full-stack Web Developer
**Domain:** Web Development
**Duration:** 45 Days (18-08-2026 to 02-10-2026)

---

## About this repository

This repository contains all deliverables for the iNeuBytes 45-Day Web Development Internship, including 3 micro-assessment tasks and 1 Major Project.

## Folder structure

## Task 1 – Healthcare / Clinic Landing Page

A responsive clinic landing page built with semantic HTML, custom CSS, and vanilla JavaScript.

**Features:**
- Responsive navigation with mobile menu toggle
- Hero section with call-to-action
- About, Services, Why Choose Us, Doctor Highlights, Testimonials sections
- Appointment enquiry form with client-side validation
- Contact section with embedded Google Map
- Fully responsive across mobile, tablet, and desktop

**Files:** `Task 1/index.html`, `Task 1/style.css`, `Task 1/script.js`

## Task 2 – Doctor Appointment Booking System
A multi-page doctor appointment booking system with search, filtering, real-time slot booking, and appointment history — built with semantic HTML, custom CSS, and vanilla JavaScript, using localStorage for data persistence.

**Features:**
- Home page with department browsing
- Doctor listing with search-by-name and department filter
- Individual doctor profile pages (experience, fee, available time slots)
- Appointment booking form with live-updating summary and full validation
- Confirmation page with booking banner and persistent appointment history (localStorage)
- Fully responsive across mobile, tablet, and desktop

**Files:** `Task 2/index.html`, `Task 2/doctors.html`, `Task 2/doctor-details.html`, `Task 2/booking.html`, `Task 2/confirmation.html`, `Task 2/style.css`, `Task 2/script.js`, `Task 2/doctors-data.js`

## Task 3 – Healthcare Management Dashboard

A full admin dashboard for managing clinic operations — doctors, patients, appointments, and departments — with a persistent sidebar/top-nav shell, live statistics, and complete CRUD functionality backed by localStorage.

**Features:**
- Dashboard home with live stat cards (Total Doctors, Patients, Appointments, Departments) and department breakdown
- Doctor Management — add, edit, delete, search
- Patient Management — add, edit, delete, search
- Appointment Management — search, filter by status, inline status updates
- Department Management — add, edit, delete
- Auto-seeded demo data on first load
- Fully responsive with a collapsible mobile sidebar

**Files:** `Task 3/index.html`, `Task 3/doctors.html`, `Task 3/patients.html`, `Task 3/appointments.html`, `Task 3/departments.html`, `Task 3/dashboard-style.css`, `Task 3/dashboard-script.js`, `Task 3/dashboard-data.js`

## Major Project – Healthcare / Clinic Management System

A full-stack clinic management system with role-based authentication for Patients, Doctors, and Admins — built with Node.js, Express, and a real SQLite database (via Node's built-in `node:sqlite` module, requiring no external database server or compilation).

**Features:**
- Secure registration & login with role-based access control (Patient / Doctor / Admin)
- Standalone public pages: Home, Departments, Appointments info, Contact
- **Patient dashboard:** book appointments, reschedule, view history, medical records, notifications, profile management with picture upload, change password
- **Doctor dashboard:** manage appointments and status, view "My Patients," add medical record notes, notifications, profile management
- **Admin dashboard:** full CRUD for doctors, patients, and departments; appointment oversight; live statistics with a status breakdown chart; global search; CSV export and print/PDF reports
- Email notifications (demo, logged server-side)
- Relational database with proper foreign keys (users, departments, doctor/patient profiles, appointments, notifications, medical records)
- Password hashing, session-based authentication, server-side validation

**Setup:** see `Major Project/SETUP.md` for installation and demo account details.

**Files:** `Major Project/server.js`, `Major Project/config/db.js`, `Major Project/routes/`, `Major Project/middleware/`, `Major Project/public/`

---

### Submission links
Google Doc report and demo videos are submitted via the iNeuBytes portal as per program guidelines.
# Willow Grove Clinic — Management System (Major Project)

A full-stack clinic management system with role-based authentication for
Patients, Doctors, and Admins — built with Node.js, Express, and SQLite.

## Tech stack
- **Backend:** Node.js + Express
- **Database:** SQLite via `node:sqlite` — a module built directly into
  Node.js itself (v22.5+). No separate database server or native
  compilation required.
- **Auth:** `express-session` for sessions, `bcryptjs` for password hashing
- **Frontend:** Plain HTML/CSS/JS (no framework)

## Setup instructions

1. **Install Node.js** if you don't have it already: https://nodejs.org (v22.5 or later)

2. **Install dependencies** — open a terminal in this folder and run:
   ```
   npm install
   ```

3. **Create your environment file** — copy `.env.example` to `.env`:
   ```
   Copy-Item .env.example .env      # Windows PowerShell
   cp .env.example .env             # Mac/Linux
   ```

4. **Start the server:**
   ```
   npm start
   ```
   This runs `node --experimental-sqlite server.js`. The flag is required
   because SQLite support in Node.js is still marked experimental (the
   underlying functionality is stable and safe to use here).

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
│   └── db.js              # SQLite connection, schema, seed data
├── middleware/
│   └── auth.js             # requireAuth / requireRole middleware
├── routes/
│   ├── authRoutes.js       # /api/auth/* — register, login, logout, me, change-password
│   └── apiRoutes.js        # /api/* — departments, doctors, patients, appointments,
│                            #          notifications, medical records, profile, stats, search
├── public/                 # Static frontend files
│   ├── css/
│   ├── js/
│   ├── index.html, login.html, register.html
│   ├── departments.html, appointment-info.html, contact.html
│   ├── patient-dashboard.html, doctor-dashboard.html, admin-dashboard.html
├── server.js                # Express app entry point
├── package.json
├── .env.example
└── .gitignore
```

## Database schema

Six tables, connected by foreign keys:

- **users** `(id, name, email, password_hash, role, phone, profile_picture, created_at)`
  — `role` is one of `patient` / `doctor` / `admin`
- **departments** `(id, name, description, created_at)`
- **doctor_profiles** `(id, user_id → users, department_id → departments, experience_years, consultation_fee, bio)`
  — one-to-one extension of a `doctor` user
- **patient_profiles** `(id, user_id → users, age, gender, address)`
  — one-to-one extension of a `patient` user
- **appointments** `(id, patient_id → users, doctor_id → users, department_id → departments, appointment_date, appointment_time, status, notes, created_at)`
  — `status` is one of `Pending` / `Confirmed` / `Completed` / `Cancelled`
- **notifications** `(id, user_id → users, message, is_read, created_at)`
- **medical_records** `(id, patient_id → users, doctor_id → users, appointment_id → appointments, note, created_at)`

Deleting a user cascades to their profile, appointments, notifications,
and medical records via `ON DELETE CASCADE`.

## API documentation

All endpoints are prefixed `/api`. Endpoints marked 🔒 require a logged-in
session; 🔒admin / 🔒doctor / 🔒patient require that specific role.

**Auth** (`/api/auth`)
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create an account (role: patient/doctor/admin) |
| POST | `/login` | Log in, starts a session |
| POST | `/logout` | Ends the session |
| GET | `/me` | Returns the current session user (or null) |
| POST | `/change-password` 🔒 | Change your own password |

**Departments**
| Method | Path | Description |
|---|---|---|
| GET | `/departments` | List all departments (public) |
| POST | `/departments` 🔒admin | Create a department |
| PUT | `/departments/:id` 🔒admin | Edit a department |
| DELETE | `/departments/:id` 🔒admin | Delete a department |

**Doctors**
| Method | Path | Description |
|---|---|---|
| GET | `/doctors` | List all doctors with department/fee/experience (public) |
| POST | `/doctors` 🔒admin | Create a doctor account + profile |
| PUT | `/doctors/:id` 🔒admin | Edit a doctor's details |
| DELETE | `/doctors/:id` 🔒admin | Delete a doctor |

**Patients** (all 🔒admin)
| Method | Path | Description |
|---|---|---|
| GET | `/patients` | List all patients |
| POST | `/patients` | Create a patient account + profile |
| PUT | `/patients/:id` | Edit a patient's details |
| DELETE | `/patients/:id` | Delete a patient |

**Appointments**
| Method | Path | Description |
|---|---|---|
| GET | `/appointments` 🔒 | List appointments — filtered to own for patient/doctor, all for admin |
| POST | `/appointments` 🔒patient | Book a new appointment |
| PATCH | `/appointments/:id/status` 🔒doctor/🔒admin | Update appointment status |
| PATCH | `/appointments/:id/reschedule` 🔒patient | Change date/time of own Pending/Confirmed appointment |

**Notifications** (🔒)
| Method | Path | Description |
|---|---|---|
| GET | `/notifications` | List own notifications, newest first |
| PATCH | `/notifications/read-all` | Mark all own notifications as read |

**Medical records**
| Method | Path | Description |
|---|---|---|
| GET | `/medical-records` 🔒 | List own records (patient), authored records (doctor), or all (admin) |
| POST | `/medical-records` 🔒doctor | Add a note against one of your own appointments |

**Profile** (🔒)
| Method | Path | Description |
|---|---|---|
| GET | `/profile` | Get your own profile, including role-specific fields |
| PUT | `/profile` | Update your profile (name, phone, role-specific fields, profile picture) |

**Admin utilities**
| Method | Path | Description |
|---|---|---|
| GET | `/stats` 🔒admin | Dashboard counts + appointment status breakdown |
| GET | `/search?q=` 🔒admin | Global search across doctors, patients, departments |

## Future enhancements
- Real email delivery (current notifications are demo-only, logged to the server console)
- File-based profile picture storage instead of embedding images in the database, for larger images
- Doctor-configurable time slots (currently a fixed set of slots for all doctors)
- Pagination for large tables (doctors, patients, appointments)
- True PDF generation (current export uses the browser's print dialog)
- Automated test suite (current testing was manual + scripted HTTP checks during development)
- Deployment configuration for a hosting platform (left optional per project scope)
