// Shared doctor dataset for the Doctor Appointment Booking System.
// In a real backend this would come from an API — here it's static data
// used by doctors.html, doctor-details.html, and booking.html.

const DOCTORS = [
  {
    id: "d1",
    name: "Dr. Reema Mehta",
    department: "General Medicine",
    experience: 12,
    fee: 500,
    initials: "RM",
    bio: "Focuses on preventive care and long-term relationships with patients and families.",
    slots: ["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"]
  },
  {
    id: "d2",
    name: "Dr. Arjun Kapoor",
    department: "Cardiology",
    experience: 9,
    fee: 900,
    initials: "AK",
    bio: "Specializes in early detection and non-invasive heart health monitoring.",
    slots: ["09:30 AM", "11:00 AM", "01:00 PM", "03:30 PM"]
  },
  {
    id: "d3",
    name: "Dr. Sara Noor",
    department: "Pediatrics",
    experience: 7,
    fee: 450,
    initials: "SN",
    bio: "Known among parents for making checkups genuinely fun for kids.",
    slots: ["10:00 AM", "10:30 AM", "12:00 PM", "02:30 PM", "05:00 PM"]
  },
  {
    id: "d4",
    name: "Dr. Kabir Anand",
    department: "Dermatology",
    experience: 6,
    fee: 600,
    initials: "KA",
    bio: "Treats acne, eczema, and general skin health with a conservative, evidence-based approach.",
    slots: ["09:00 AM", "11:00 AM", "01:30 PM", "04:00 PM"]
  },
  {
    id: "d5",
    name: "Dr. Neha Iyer",
    department: "Physiotherapy",
    experience: 5,
    fee: 400,
    initials: "NI",
    bio: "Builds post-injury recovery plans and works closely with patients on long-term mobility.",
    slots: ["08:30 AM", "10:00 AM", "12:30 PM", "03:00 PM"]
  },
  {
    id: "d6",
    name: "Dr. Vikram Rao",
    department: "General Medicine",
    experience: 15,
    fee: 550,
    initials: "VR",
    bio: "Senior physician handling chronic condition management and routine checkups.",
    slots: ["09:00 AM", "09:30 AM", "11:00 AM", "02:00 PM"]
  }
];

// Utility: fetch a doctor by id
function getDoctorById(id) {
  return DOCTORS.find(doc => doc.id === id) || null;
}

// Utility: unique department list for filter dropdowns
function getDepartments() {
  return [...new Set(DOCTORS.map(doc => doc.department))];
}
