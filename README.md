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
