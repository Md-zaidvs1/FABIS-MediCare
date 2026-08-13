-- ============================================================================
-- FABIS MediCare - Multi-Tenant SaaS Database Architecture & RLS Security Rules
-- Target Platform: Supabase PostgreSQL & Storage Engine
-- Version: 3.0 Multi-Tenant Production Architecture
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. UTILITY & TENANT DETECTION FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_clinic_id()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        nullif(current_setting('request.jwt.claims', true)::json->>'clinic_id', ''),
        nullif(current_setting('request.jwt.claims', true)::json->'user_metadata'->>'clinic_id', ''),
        nullif(current_setting('request.headers', true)::json->>'x-clinic-id', ''),
        nullif(auth.jwt() ->> 'clinic_id', ''),
        nullif(auth.jwt() -> 'user_metadata' ->> 'clinic_id', ''),
        'clinic_default_emr'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2. SCHEMAS & TABLES (WITH MANDATORY clinic_id COLUMNS)
-- ----------------------------------------------------------------------------

-- Clinic Backups Table (Unified Disaster Recovery Payload per Tenant)
CREATE TABLE IF NOT EXISTS public.clinic_backups (
    clinic_id TEXT PRIMARY KEY,
    backup_payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr',
    mrn TEXT,
    name TEXT NOT NULL,
    age INT,
    gender TEXT,
    phone TEXT,
    email TEXT,
    medical_alerts JSONB DEFAULT '[]'::jsonb,
    dental_chart JSONB DEFAULT '{}'::jsonb,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr',
    patient_id TEXT,
    patient_name TEXT,
    patient_phone TEXT,
    date DATE,
    time_slot TEXT,
    procedure TEXT,
    chair TEXT,
    status TEXT DEFAULT 'Scheduled',
    check_in_time TIMESTAMP WITH TIME ZONE,
    treatment_start_time TIMESTAMP WITH TIME ZONE,
    treatment_end_time TIMESTAMP WITH TIME ZONE,
    completed_time TIMESTAMP WITH TIME ZONE,
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr',
    invoice_number TEXT,
    patient_id TEXT,
    patient_name TEXT,
    total_amount NUMERIC(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'Unpaid',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctors & Profiles Table
CREATE TABLE IF NOT EXISTS public.doctors (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr',
    name TEXT NOT NULL,
    profile_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chairs Table
CREATE TABLE IF NOT EXISTS public.chairs (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr',
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Available',
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr',
    patient_id TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clinical Media & Document Vault Table
CREATE TABLE IF NOT EXISTS public.clinical_media (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr',
    patient_id TEXT,
    title TEXT NOT NULL,
    category TEXT,
    file_path TEXT,
    file_url TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. SAFE MIGRATION & ALTER STATEMENTS (FOR EXISTING TABLES)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.clinic_backups ADD COLUMN IF NOT EXISTS clinic_id TEXT;
ALTER TABLE IF EXISTS public.patients ADD COLUMN IF NOT EXISTS clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr';
ALTER TABLE IF EXISTS public.appointments ADD COLUMN IF NOT EXISTS clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr';
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr';
ALTER TABLE IF EXISTS public.doctors ADD COLUMN IF NOT EXISTS clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr';
ALTER TABLE IF EXISTS public.chairs ADD COLUMN IF NOT EXISTS clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr';
ALTER TABLE IF EXISTS public.prescriptions ADD COLUMN IF NOT EXISTS clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr';
ALTER TABLE IF EXISTS public.clinical_media ADD COLUMN IF NOT EXISTS clinic_id TEXT NOT NULL DEFAULT 'clinic_default_emr';

-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES ON clinic_id (TENANT ISOLATION SPEED)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_clinic_id ON public.invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON public.doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_chairs_clinic_id ON public.chairs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON public.prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinical_media_clinic_id ON public.clinical_media(clinic_id);

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) ACTIVATION
-- ----------------------------------------------------------------------------
ALTER TABLE public.clinic_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_media ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 6. STRICT MULTI-TENANT RLS POLICIES (EVERY TABLE)
-- ----------------------------------------------------------------------------

-- Drop legacy non-tenant policies if existing
DROP POLICY IF EXISTS "Tenant isolation policy for clinic_backups" ON public.clinic_backups;
DROP POLICY IF EXISTS "Tenant isolation policy for patients" ON public.patients;
DROP POLICY IF EXISTS "Tenant isolation policy for appointments" ON public.appointments;
DROP POLICY IF EXISTS "Tenant isolation policy for invoices" ON public.invoices;
DROP POLICY IF EXISTS "Tenant isolation policy for doctors" ON public.doctors;
DROP POLICY IF EXISTS "Tenant isolation policy for chairs" ON public.chairs;
DROP POLICY IF EXISTS "Tenant isolation policy for prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Tenant isolation policy for clinical_media" ON public.clinical_media;

-- Clinic Backups Policy
CREATE POLICY "Tenant isolation policy for clinic_backups"
ON public.clinic_backups
FOR ALL
USING (clinic_id = public.current_clinic_id())
WITH CHECK (clinic_id = public.current_clinic_id());

-- Patients Policy
CREATE POLICY "Tenant isolation policy for patients"
ON public.patients
FOR ALL
USING (clinic_id = public.current_clinic_id())
WITH CHECK (clinic_id = public.current_clinic_id());

-- Appointments Policy
CREATE POLICY "Tenant isolation policy for appointments"
ON public.appointments
FOR ALL
USING (clinic_id = public.current_clinic_id())
WITH CHECK (clinic_id = public.current_clinic_id());

-- Invoices Policy
CREATE POLICY "Tenant isolation policy for invoices"
ON public.invoices
FOR ALL
USING (clinic_id = public.current_clinic_id())
WITH CHECK (clinic_id = public.current_clinic_id());

-- Doctors Policy
CREATE POLICY "Tenant isolation policy for doctors"
ON public.doctors
FOR ALL
USING (clinic_id = public.current_clinic_id())
WITH CHECK (clinic_id = public.current_clinic_id());

-- Chairs Policy
CREATE POLICY "Tenant isolation policy for chairs"
ON public.chairs
FOR ALL
USING (clinic_id = public.current_clinic_id())
WITH CHECK (clinic_id = public.current_clinic_id());

-- Prescriptions Policy
CREATE POLICY "Tenant isolation policy for prescriptions"
ON public.prescriptions
FOR ALL
USING (clinic_id = public.current_clinic_id())
WITH CHECK (clinic_id = public.current_clinic_id());

-- Clinical Media Policy
CREATE POLICY "Tenant isolation policy for clinical_media"
ON public.clinical_media
FOR ALL
USING (clinic_id = public.current_clinic_id())
WITH CHECK (clinic_id = public.current_clinic_id());

-- ----------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET & PATH-BASED ISOLATION RLS
-- ----------------------------------------------------------------------------

-- Ensure Storage Bucket Exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic_vault', 'clinic_vault', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Select/Download files strictly matching clinic_id folder prefix
CREATE POLICY "Tenant Isolated Storage Download Policy"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'clinic_vault' AND
    (storage.foldername(name))[1] = public.current_clinic_id()
);

-- Storage Policy: Upload files strictly into clinic_id folder prefix
CREATE POLICY "Tenant Isolated Storage Upload Policy"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'clinic_vault' AND
    (storage.foldername(name))[1] = public.current_clinic_id()
);

-- Storage Policy: Update files strictly in clinic_id folder prefix
CREATE POLICY "Tenant Isolated Storage Update Policy"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'clinic_vault' AND
    (storage.foldername(name))[1] = public.current_clinic_id()
);

-- Storage Policy: Delete files strictly in clinic_id folder prefix
CREATE POLICY "Tenant Isolated Storage Delete Policy"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'clinic_vault' AND
    (storage.foldername(name))[1] = public.current_clinic_id()
);
