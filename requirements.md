# Software Requirements Specification (SRS)
## FABIS MediCare - Professional Dental Practice & Clinic EMR Platform

**Document Version:** 2.5.0  
**Target Audience:** Clinical Administrators, Dental Practitioners, System Integrators, Technical Documentation Authors  
**Classification:** Confidential - Functional Requirements Specification  

---

## 1. System Overview & Vision

FABIS MediCare is a high-performance, enterprise-grade Electronic Medical Record (EMR) and Dental Practice Management System designed specifically for modern dental clinics, hospital dental departments, and multi-chair oral health chains. 

The platform optimizes clinic operational efficiency by unifying live patient queueing, appointment scheduling with real-time timeline tracking, interactive FDI/Pediatric adult dental charting, periodontal probe scoring, multi-phase treatment planning, instant prescription generation, GST-compliant dental billing, analytics, and automated cloud data synchronization.

---

## 2. User Roles & Permission Matrix

The system enforces role-based access control (RBAC) to ensure operational security and clinical confidentiality across six primary clinic personas:

| Capability / Module | Super Admin | Chief Doctor | Associate Dentist | Dental Hygienist | Receptionist | Billing Clerk |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard & Clinic Metrics** | Full Access | Full Access | View Assigned | View Assigned | View Queue | View Revenue |
| **Patient Registration & EMR** | Full Access | Full Access | Full Access | View & Notes | Full Access | View Demographics |
| **Appointment Scheduler** | Full Access | Full Access | View & Book | View Only | Full Access | View Schedule |
| **Interactive Dental Charting** | Full Access | Full Access | Full Access | Perio Only | No Access | No Access |
| **Treatment Planning** | Full Access | Full Access | Full Access | No Access | Read Only | View Estimates |
| **Prescription Modal** | Full Access | Full Access | Full Access | No Access | No Access | No Access |
| **Billing & Invoicing** | Full Access | Full Access | View Only | No Access | Collect & Print | Full Access |
| **Reports & Financials** | Full Access | Full Access | No Access | No Access | No Access | Billing Reports |
| **Clinic Settings & Masters** | Full Access | Modify | View Only | View Only | View Only | View Only |
| **Backup & Cloud Sync** | Full Access | Full Access | No Access | No Access | Manual Local | No Access |

---

## 3. Navigation Flow & System Architecture

### 3.1 Layout & Navigation Hierarchy
1. **Top Navigation Bar:**
   - Clinic Branding & Branch Indicator
   - Live Digital Clock (HH:MM:SS AM/PM) & Today's Full Date Display
   - Global Quick Search Bar (Patient Name, Phone, MRN, Appointment)
   - Role Switcher & Active User Profile Menu
   - Cloud Backup Sync Status Indicator (Supabase Connection Status)
2. **Primary Section Tabs:**
   - **Dashboard:** Clinic Live Control Center, Chair Utilization, Daily Financial Overview
   - **Appointment Scheduler:** Interactive Grid, Timeline, Multi-method Booking, Live Status Engine
   - **Patients Directory:** Master Patient Index, Medical History, Quick Register
   - **Clinical EMR Workspace:** Individual Patient Portal (Odontogram, Perio, Treatments, Prescriptions, Invoices, Timeline)
   - **Billing & Revenue:** Invoices Master, Payments Collection, Unpaid Balances
   - **Reports & Analytics:** Financial Growth, Chair Efficiency, Patient Retention
   - **Settings & Master Admin:** Clinic Branding, Fee Schedule, User Management, Cloud Backup & Restore

---

## 4. Module Functional Specifications

### 4.1 Live Running Clock & Date Header
- **Live System Time Display:** Continuously updates every second (`HH:MM:SS AM/PM`) using the client system time without layout shifts.
- **Full Date Banner:** Formatted display e.g., `Monday, 3 Aug 2026`.
- **Quick Date Controls:** Shortcuts to jump instantly to `Yesterday`, `Today`, `Tomorrow`, or select any custom date.

### 4.2 Working Calendar & Appointment Scheduler
- **Dual Date Entry Methods:**
  - *Method 1 (Date Picker):* Interactive native calendar popover allowing direct date navigation.
  - *Method 2 (Manual Typing):* Structured text input accepting `DD/MM/YYYY` format (e.g., `03/08/2026`), automatically converting to standard ISO storage formats.
- **Appointment Creation Options:**
  - Standard time slot picker (5-minute interval dropdowns).
  - Manual custom time input (e.g., `10:30 AM`).
  - Duration picker (15, 30, 45, 60, 90, 120 minutes).
  - Dental Chair assignment (Chair 1, Chair 2, Chair 3 / Surgical Suite).
  - Assigned Doctor selection and Procedure tagging.

### 4.3 Automated Appointment Status Engine
The system dynamically evaluates the relationship between scheduled appointment time, real-time clock, and clinical progress to assign and color-code status:
- **Scheduled (Gray/Dark):** Appointment booked for a future time slot.
- **Overdue (Red):** Current time exceeds scheduled appointment time by >5 minutes and patient has not checked in or started treatment.
- **Waiting (Yellow):** Patient checked in and marked as `Arrived` / `Waiting-List` in reception.
- **In Treatment (Blue):** Patient actively seated in chair (`In-Chair` / `In Consultation`).
- **Checked Out / Completed (Green):** Clinical treatment completed and invoice finalized.

### 4.4 Real-Time Schedule Line Indicator (Timeline)
- A prominent red indicator line ("Current Time Line") moves dynamically across the grid based on the current minute of the day.
- Allows clinicians to instantly spot running delays, upcoming slots, and overdue appointments visually.

### 4.5 Live Clinic Operational Metrics
- **Current Patient:** Displays active patient seated in chair with procedure details.
- **Next Patient:** Identifies the next scheduled patient in queue.
- **Overdue Counter:** Live badge displaying count of overdue appointments needing attention.
- **Waiting Room Counter:** Live count of checked-in patients waiting in reception.

### 4.6 Patient EMR & Clinical Charting Workspace
- **Master Patient Record:** MRN (Medical Record Number), Demographic Information, Emergency Contact, Medical Alerts (Diabetes, Hypertension, Allergies, Cardiac Conditions, Bleeding Disorders).
- **Interactive Dental Odontogram:**
  - Adult Permanent (Teeth 11–48 / Universal System) and Pediatric Deciduous (Teeth 51–85).
  - Visual condition logging: Caries (Red), Filled (Blue), Missing (Gray), Crown/Bridge (Gold/Purple), Root Canal Treated (Teal), Implant (Green), Impacted (Orange).
  - Surface-level condition tagging (Mesial, Distal, Occlusal, Buccal, Lingual).
- **Phased Treatment Planning:**
  - Phase 1: Urgent / Relief of Pain
  - Phase 2: Restorative & Endodontics
  - Phase 3: Prosthetics & Surgery
  - Phase 4: Maintenance & Recall
- **Periodontal Charting Module:** Six-point probing depth recording, Bleeding on Probing (BOP), Suppuration, Mobility (Class I–III), Furcation Involvement.

### 4.7 Prescription Generator & Communication
- **Preset Drug Database:** Pre-loaded with common dental medications (Amoxicillin, Augmentin, Ibuprofen, Paracetamol, Ketorolac, Chlorhexidine mouthwash, Metronidazole).
- **Custom Drug Additions:** Allows adding dosage, frequency (1-0-1, 1-1-1, 0-0-1), duration, and administration instructions (Before/After food).
- **Output Layouts:** Professional A4 Prescription format with Clinic Letterhead, Doctor Medical Council Registration Number, Patient MRN, and Rx symbol.
- **WhatsApp Direct Sharing:** Generates formatted prescription document links directly sent to patient WhatsApp number.

### 4.8 Billing, Invoicing & Financial Management
- **GST / Tax Handling:** Itemized dental procedure billing with customizable CGST/SGST/IGST tax percentage rules.
- **Multi-Payment Modes:** Cash, UPI / QR Code, Credit/Debit Card, Net Banking, Clinic Insurance Claim, Installments / EMI.
- **Invoice Status Tracking:** Draft, Unpaid, Partially Paid, Paid in Full, Refunded.
- **Printable Invoices:** Clean invoice output suitable for insurance submission and tax records.

### 4.9 Cloud Synchronization & Supabase Persistence
- **Dual Persistence Architecture:**
  - *Local Tier (IndexedDB):* Instant offline-first operational speed with zero latency.
  - *Cloud Tier (Supabase):* Automatic background synchronization to cloud PostgreSQL tables.
- **Granular Timestamp Auditing:** Every appointment record stores:
  - `createdAt`: Initial record creation timestamp.
  - `date` & `timeSlot`: Scheduled appointment time.
  - `checkInTime`: Timestamp when receptionist checked in patient.
  - `treatmentStartTime`: Timestamp when practitioner started treatment.
  - `treatmentEndTime`: Timestamp when treatment was completed.
  - `completedTime`: Final check-out timestamp.
  - `updatedAt`: Last modification timestamp.
- **Data Safety:** Complete data recovery across restarts, device switches, or browser cache clearing.

---

## 5. Business Rules & Validation Logic

1. **Duplicate Booking Prevention:** The system warns receptionists if booking the same dental chair for overlapping time intervals.
2. **Medical Alert Prompts:** Severe medical alerts (e.g., Penicillin Allergy, Anticoagulant use) trigger red banner warnings on EMR load and prescription creation.
3. **Invoice Finalization:** Invoices marked as `Paid` cannot be modified without administrator unlock privileges.
4. **MRN Format Integrity:** Patient MRN follows immutable standard prefix rules (e.g., `MRN-YYYY-XXXX`).
5. **Date Parsing Standard:** Manual date inputs must pass `DD/MM/YYYY` format validation before persisting.

---

## 6. High-Level Entity Relationship Overview

```
[Patient] 1 --- * [Appointment]
   |          --- * [Medical History Alert]
   |          --- * [Tooth Condition Record]
   |          --- * [Treatment Plan Item]
   |          --- * [Prescription]
   |          --- * [Invoice]
   
[Doctor User] 1 --- * [Appointment]
              1 --- * [Prescription]
              
[Invoice] 1 --- * [Invoice Item]
          1 --- * [Payment Receipt Transaction]
```

---

## 7. Document Acceptance & Signing

This specification serves as the formal functional blueprint for FABIS MediCare v2.5.0. All workflows documented above reflect the production-ready state of the system.
