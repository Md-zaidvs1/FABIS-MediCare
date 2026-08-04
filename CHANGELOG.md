# Changelog - FABIS MediCare EMR

All notable changes to the FABIS MediCare Dental Practice Management & EMR Platform are documented in this file.

---

## [2.5.0] - 2026-08-03 (Production Ready Release)

### 🚀 Added
- **Live Digital Running Clock Header:** Real-time clock updating every second (`HH:MM:SS AM/PM`) and today's full date display (`Monday, 3 Aug 2026`).
- **Working Calendar & Flexible Date Selection:**
  - Date Picker popover allowing manual selection of any past, present, or future date.
  - Manual text input support accepting `DD/MM/YYYY` format (e.g., `03/08/2026`).
  - Quick date navigation buttons (`Yesterday`, `Today`, `Tomorrow`).
- **Automated Appointment Status Engine:**
  - Dynamic status calculation based on current time comparison against scheduled slot.
  - Automatic classification into **Scheduled (Gray)**, **Overdue (Red)**, **Waiting (Yellow)**, **In Treatment (Blue)**, and **Completed (Green)**.
- **Red Timeline Line Indicator:** Real-time moving timeline indicator across schedule grid.
- **Automated Operational Metrics:** Live counters for Current Patient in Chair, Next Patient, Overdue Count, and Waiting Room count.
- **Dual Method Appointment Creation:** Date picker or manual `DD/MM/YYYY` typing + 5-minute time slot dropdown or manual time entry.
- **Supabase Cloud Granular Timestamps:**
  - Full timestamp tracking: `createdAt`, `checkInTime`, `treatmentStartTime`, `treatmentEndTime`, `completedTime`, and `updatedAt`.
  - Comprehensive audit modal inspecting timestamp logs for any selected appointment.
- **System Documentation Package:**
  - Software Requirements Specification (`requirements.md`).
  - Installation & Deployment Guide (`INSTALLATION.md`).
  - Backup & Disaster Recovery Guide (`BACKUP_RESTORE.md`).
  - Production `.env.example` update with Supabase and login variables.

---

## [2.2.0] - 2026-07-15
### 🛠️ Added
- FDI Adult (Teeth 11–48) and Pediatric Deciduous (Teeth 51–85) Odontogram.
- Multi-phase treatment planning with phase-based tooth grouping.
- Periodontal probing depth chart module.

---

## [2.0.0] - 2026-06-01
### 🛠️ Added
- A4 Direct Prescription Generator with letterhead preview.
- Direct WhatsApp sharing integration for prescriptions and invoices.
- GST-compliant invoice generator with CGST/SGST/IGST tax calculation.

---

## [1.0.0] - 2026-04-10
### 🏁 Initial Release
- Core Patient Master Directory (MRN, Demographics, Medical Alerts).
- Basic appointment scheduler and local IndexedDB persistence layer.
