# FABIS MediCare - Installation & Deployment Guide

This guide provides instructions for setting up, configuring, and deploying FABIS MediCare Dental EMR & Practice Management Platform.

---

## 1. System Requirements

### Hardware Requirements (Minimum)
- **CPU:** Dual-core 2.0 GHz processor or higher
- **RAM:** 4 GB RAM minimum (8 GB recommended)
- **Disk Space:** 1 GB free disk space
- **Display:** 1280x720 minimum screen resolution (1920x1080 recommended)

### Software Requirements
- **Node.js:** v18.16.0 or higher
- **npm:** v9.0.0 or higher
- **Supported Browsers:** Google Chrome v110+, Microsoft Edge v110+, Safari v16+

---

## 2. Local Setup & Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/fabis-medicare.git
cd fabis-medicare
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Variable Configuration
Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and set the required variables:

```env
# Gemini AI Key (Optional for AI Clinical Assistant)
GEMINI_API_KEY="your-gemini-api-key"

# App Base URL
APP_URL="http://localhost:3000"

# Supabase Cloud Project Configuration
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Default Initial Administrator Credentials
DEFAULT_ADMIN_EMAIL="admin@fabismedicare.com"
DEFAULT_ADMIN_PASSWORD="AdminSecurePassword123!"

# Default Initial Doctor Credentials
DEFAULT_DOCTOR_EMAIL="doctor@fabismedicare.com"
DEFAULT_DOCTOR_PASSWORD="DoctorSecurePassword123!"
```

---

## 3. Supabase Database Setup

FABIS MediCare automatically initializes its database tables in IndexedDB locally and mirrors them to Supabase Cloud if configured.

### Supabase Multi-Tenant SaaS Schema & RLS Setup (Production SQL)
Run the production multi-tenant SQL migration script located at `/supabase_multi_tenant_schema.sql` in your Supabase SQL Editor. Every table is isolated by `clinic_id` with Row-Level Security (RLS) policies and path-isolated storage rules enabled:

```sql
-- Refer to /supabase_multi_tenant_schema.sql for the complete script
-- Enables clinic_id on all tables (patients, appointments, invoices, clinic_backups, doctors, chairs, prescriptions, clinical_media)
-- Enables Row Level Security (RLS) and storage policies for bucket 'clinic_vault'
```

---

## 4. Running the Development Server

Start the local Vite development server:

```bash
npm run dev
```

The application will launch on **`http://localhost:3000`**.

---

## 5. Building for Production

### Step 1: Execute Type Check & Linter
```bash
npm run lint
```

### Step 2: Build Application
```bash
npm run build
```
This generates optimized static production assets inside the `dist/` directory.

### Step 3: Run Production Server
```bash
npm run start
```

---

## 6. Docker Container Deployment

You can build and deploy FABIS MediCare as a Docker container:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 3000
COPY nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
```

Build and run container:
```bash
docker build -t fabis-medicare:v2.5.0 .
docker run -d -p 3000:3000 fabis-medicare:v2.5.0
```

---

## 7. Verification & Health Check

After deployment, navigate to `http://<your-server-ip>:3000` and verify:
1. Top live digital clock updates every second.
2. Clicking "Book Appointment" allows date selection via picker or typing `DD/MM/YYYY`.
3. Check-In, Start Treatment, and Finish actions update timestamps and status badges correctly.
4. Cloud sync icon in header displays green indicator.
