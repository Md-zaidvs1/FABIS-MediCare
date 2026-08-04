# FABIS MediCare - Backup, Restore & Data Persistence Guide

FABIS MediCare employs a **dual-layer storage architecture** designed for high availability, zero latency, and disaster recovery.

---

## 1. Storage Architecture Overview

### Tier 1: Local IndexedDB Engine (Primary Operational Layer)
- **Engine:** Browser-native IndexedDB database (`FABIS_MediCare_EMR_DB`).
- **Characteristics:** Zero-latency client reads/writes, 100% offline functionality.
- **Data Scope:** Patient Master Index, Appointments, Dental Charting, Prescriptions, Invoices, Periodontal Probe Records, and System Logs.

### Tier 2: Supabase Cloud Synchronization (Disaster Recovery & Multi-Device Layer)
- **Engine:** PostgreSQL hosted on Supabase Cloud Infrastructure.
- **Sync Model:** Automatic background background-push on write + snapshot synchronization.
- **Capabilities:** Automatic restore when logging in from a new browser, device, or after clearing browser history.

---

## 2. Granular Timestamp Auditing in Supabase

Every appointment and patient record maintains an immutable audit trail of timestamps to track clinic operations accurately:

| Timestamp Field | Recorded Trigger Event | Storage Format |
| :--- | :--- | :--- |
| `createdAt` | When appointment is first booked | ISO-8601 UTC String |
| `date` & `timeSlot` | Scheduled appointment slot | `YYYY-MM-DD` & `HH:MM AM/PM` |
| `checkInTime` | When patient arrives & reception clicks **Check In** | ISO-8601 UTC String |
| `treatmentStartTime` | When doctor clicks **Start Treatment** | ISO-8601 UTC String |
| `treatmentEndTime` | When doctor clicks **Finish & Check Out** | ISO-8601 UTC String |
| `completedTime` | When invoice is settled / patient checks out | ISO-8601 UTC String |
| `updatedAt` | Any modification to status, chair, or procedure | ISO-8601 UTC String |

---

## 3. Manual Local Backup & Export Procedure

Clinic administrators can export complete encrypted JSON snapshots of clinic data at any time.

### How to Create a Manual Backup File:
1. Navigate to **Settings & Admin** module in top navigation.
2. Select **Cloud Sync & Data Backup** tab.
3. Click **Export Local Database (.JSON)**.
4. Save the generated file (e.g., `FABIS_MediCare_Backup_2026-08-03.json`) to a secure external drive or cloud drive.

---

## 4. Manual Restore Procedure

If browser storage is wiped or migrating to a new clinic workstation:

1. Navigate to **Settings & Admin** -> **Cloud Sync & Data Backup**.
2. Click **Select Backup File (.JSON)**.
3. Choose the target `.json` snapshot file.
4. Click **Restore Database**.
5. The system will validate JSON schema, write records to IndexedDB, trigger Supabase sync, and reload the application.

---

## 5. Cloud Auto-Recovery Procedure

If a user launches FABIS MediCare on a brand new browser without local data:
1. System checks IndexedDB upon initialization.
2. If IndexedDB is empty, system queries configured Supabase Cloud database.
3. If cloud records are found, FABIS MediCare automatically downloads the remote snapshot and populates the local IndexedDB.
4. Clinical operations continue seamlessly with zero data loss.

---

## 6. Best Practices for Clinic Administrators

1. **Daily Exports:** Perform a manual JSON export at the end of each clinic shift.
2. **Supabase Health Checks:** Ensure the header Cloud Sync icon indicates green (`Cloud Sync Active`).
3. **Browser Storage Restrictions:** Avoid clearing browser site data without verifying that Supabase Cloud Sync is active or a manual backup `.json` exists.
