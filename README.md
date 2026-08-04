# FABIS MediCare - Professional Dental Practice & Clinic EMR Platform

![FABIS MediCare](https://img.shields.io/badge/Version-2.5.0-0284C7?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-slate?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-React_18_%7C_Vite_%7C_Tailwind-38BDF8?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-IndexedDB_%2B_Supabase_Cloud-3ECF8E?style=for-the-badge)

**FABIS MediCare** is an enterprise-grade, full-featured Electronic Medical Record (EMR) and Practice Management System built for dental clinics, hospital dental suites, and oral healthcare chains. It streamlines patient queue management, clinical charting, treatment planning, prescription issuing, GST billing, and real-time appointment scheduling.

---

## 🌟 Key Features & Functional Highlights

### 🕒 1. Live Working Clock & Scheduler Section
- **Real-Time System Clock:** Live digital clock (`HH:MM:SS AM/PM`) and today's full date display (`Monday, 3 Aug 2026`).
- **Flexible Working Calendar:** Date Picker modal + Manual text entry in `DD/MM/YYYY` format.
- **Automated Status Engine:** Automatically evaluates current time and marks appointments as **Scheduled**, **Overdue (Red)**, **Waiting (Yellow)**, **In Treatment (Blue)**, or **Completed (Green)**.
- **Red Timeline Line Indicator:** A moving "Current Time" line across the calendar grid for quick visual time assessment.
- **Live Clinic Operational Metrics:** Instant view of Current Patient in Chair, Next Patient in Queue, Overdue Count, and Waiting Room count.

### 🦷 2. Interactive Dental EMR & Clinical Charting
- **FDI & Adult/Pediatric Odontogram:** Interactive permanent (Teeth 11–48) and deciduous (Teeth 51–85) charts with tooth surface condition tagging.
- **Multi-Phase Treatment Planning:** Organize care into Phase 1 (Pain Relief), Phase 2 (Restorative/Endo), Phase 3 (Prosthetics/Surgery), and Phase 4 (Maintenance).
- **Periodontal Probing Chart:** 6-point probing depth recording, Bleeding on Probing (BOP), and tooth mobility classes.

### 📝 3. Prescription & Communication Engine
- **Preset Dental Drugs:** Quick selector for standard antibiotics, analgesics, mouthwashes, and anti-inflammatory drugs.
- **A4 Direct Prescription Layout:** Print-ready letterhead with doctor council numbers, patient details, and Rx instructions.
- **Direct WhatsApp Sharing:** Instantly send prescription PDFs and visit summaries directly to patient WhatsApp numbers.

### 💳 4. Billing, Invoicing & Financial Reports
- **GST Compliant Invoicing:** Detailed line-item billing with custom tax rules (CGST/SGST).
- **Multi-Payment Modes:** Cash, UPI/QR Code, Credit Card, Net Banking, and EMI Installments.
- **Revenue Analytics:** Income tracking, aging accounts, chair utilization statistics, and procedure breakdown reports.

### ☁️ 5. Supabase Cloud Sync & Offline State
- **Hybrid Storage Architecture:** Local-first speed with IndexedDB + background Supabase cloud auto-sync.
- **Granular Timestamp Auditing:** Tracks `createdAt`, `checkInTime`, `treatmentStartTime`, `treatmentEndTime`, `completedTime`, and `updatedAt` for full audit trails.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons
- **Animations:** Motion (`motion/react`)
- **Persistence:** Browser IndexedDB (Local Tier) + Supabase Client (Cloud Tier)
- **Document Generation:** HTML5 Canvas, jsPDF, Print Stylesheets

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### 1. Installation
```bash
# Clone repository
git clone https://github.com/your-org/fabis-medicare-emr.git
cd fabis-medicare-emr

# Install dependencies
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your Supabase credentials in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📄 Documentation Index

- [Functional Requirements Specification](requirements.md)
- [Installation & Deployment Guide](INSTALLATION.md)
- [Backup & Cloud Synchronization Guide](BACKUP_RESTORE.md)
- [Version Changelog](CHANGELOG.md)

---

## 🔒 License & Support

Proprietary Software — Developed for FABIS MediCare Dental Systems. All Rights Reserved.
