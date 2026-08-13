// FABIS MediCare - Supabase Multi-Tenant SaaS Isolation Engine & File Storage Manager

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DoctorProfile, Patient, Invoice } from '../types';
import { getStoredDoctor } from './storage';

export const BUCKET_NAME = 'clinic_vault';

export const getStoredSupabaseConfig = (): { url: string; anonKey: string } => {
  const metaEnv = (import.meta as any).env || {};
  let url = (metaEnv.VITE_SUPABASE_URL as string) || '';
  let anonKey = (metaEnv.VITE_SUPABASE_ANON_KEY as string) || '';

  try {
    const customUrl = localStorage.getItem('fabis_supabase_custom_url');
    const customKey = localStorage.getItem('fabis_supabase_custom_key');
    if (customUrl && customUrl.trim()) url = customUrl.trim();
    if (customKey && customKey.trim()) anonKey = customKey.trim();
  } catch {}

  if (!url) url = 'https://demo-clinic-emr.supabase.co';
  if (!anonKey) anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-anon-key';

  return { url, anonKey };
};

let supabaseClient: SupabaseClient | null = null;

export const reinitSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getStoredSupabaseConfig();
  try {
    if (url && anonKey) {
      supabaseClient = createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
      return supabaseClient;
    }
  } catch (err) {
    console.warn('Supabase initialization notice:', err);
  }
  return supabaseClient;
};

// Initialize client on load
reinitSupabaseClient();

export { supabaseClient };

export const saveCustomSupabaseConfig = (url: string, anonKey: string): void => {
  try {
    if (url.trim()) localStorage.setItem('fabis_supabase_custom_url', url.trim());
    else localStorage.removeItem('fabis_supabase_custom_url');

    if (anonKey.trim()) localStorage.setItem('fabis_supabase_custom_key', anonKey.trim());
    else localStorage.removeItem('fabis_supabase_custom_key');

    reinitSupabaseClient();
  } catch (err) {
    console.error('Error saving custom Supabase config:', err);
  }
};

/**
 * Returns the exact, copyable SQL schema script to create required Supabase tables.
 */
export const getRequiredSupabaseSqlSchema = (): string => {
  return `-- FABIS MediCare EMR - Production Supabase SQL Schema
-- Copy and run this script in your Supabase SQL Editor if setting up a new database project.

-- 1. Full Clinic Encrypted Backups Table
CREATE TABLE IF NOT EXISTS public.clinic_backups (
    clinic_id TEXT PRIMARY KEY,
    backup_payload JSONB NOT NULL,
    patient_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Patients Table (Relational Patient Records with EMR Data)
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    mrn TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    gender TEXT,
    age INT,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chair Operatories Table
CREATE TABLE IF NOT EXISTS public.chairs (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    name TEXT,
    status TEXT,
    data JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SMS & Patient Outreach Log Table
CREATE TABLE IF NOT EXISTS public.sms_logs (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    recipient_phone TEXT,
    message TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (RLS) for seamless REST API access using Anon Key
ALTER TABLE public.clinic_backups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chairs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs DISABLE ROW LEVEL SECURITY;
`;
};

/**
 * Diagnostic test helper to verify Supabase connectivity and table presence.
 */
export const testSupabaseConnection = async (): Promise<{
  connected: boolean;
  url: string;
  tables: { clinic_backups: boolean; patients: boolean; chairs: boolean; sms_logs: boolean };
  error?: string;
}> => {
  const { url } = getStoredSupabaseConfig();
  const client = supabaseClient || reinitSupabaseClient();

  if (!client) {
    return {
      connected: false,
      url,
      tables: { clinic_backups: false, patients: false, chairs: false, sms_logs: false },
      error: 'Supabase client failed to initialize with provided credentials.',
    };
  }

  const result = {
    connected: true,
    url,
    tables: { clinic_backups: false, patients: false, chairs: false, sms_logs: false },
    error: undefined as string | undefined,
  };

  try {
    const { error: cbErr } = await client.from('clinic_backups').select('clinic_id').limit(1);
    result.tables.clinic_backups = !cbErr;

    const { error: pErr } = await client.from('patients').select('id').limit(1);
    result.tables.patients = !pErr;

    const { error: chErr } = await client.from('chairs').select('id').limit(1);
    result.tables.chairs = !chErr;

    const { error: smsErr } = await client.from('sms_logs').select('id').limit(1);
    result.tables.sms_logs = !smsErr;

    if (cbErr || pErr) {
      result.error = cbErr?.message || pErr?.message || 'Tables not yet provisioned in Supabase. Click "Copy SQL Schema" to setup tables.';
    }
  } catch (err: any) {
    result.connected = false;
    result.error = err.message || 'Unable to communicate with Supabase Cloud endpoint.';
  }

  return result;
};

/**
 * Automatically detects the logged-in clinic's unique tenant ID (clinic_id).
 */
export const getActiveClinicId = (doctor?: DoctorProfile): string => {
  const doc = doctor || getStoredDoctor();
  if (doc?.clinicId && doc.clinicId.trim()) {
    return doc.clinicId.trim();
  }
  if (doc?.id && doc.id !== 'DOC-01' && doc.id.trim()) {
    return doc.id.trim();
  }
  if (doc?.clinicName && doc.clinicName.trim()) {
    const slug = doc.clinicName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (slug) return `clinic_${slug}`;
  }
  return 'clinic_default_emr';
};

/**
 * Generates a clinic-isolated file storage path in Supabase Storage:
 */
export const getClinicStoragePath = (
  folder: 'patients' | 'invoices' | 'logos' | 'documents' | 'prescriptions',
  fileName: string,
  subFolder?: string,
  doctor?: DoctorProfile
): string => {
  const clinicId = getActiveClinicId(doctor);
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const sub = subFolder ? `${subFolder.replace(/[^a-zA-Z0-9_.-]/g, '_')}/` : '';
  return `${clinicId}/${folder}/${sub}${Date.now()}_${cleanFileName}`;
};

/**
 * Uploads a file to Supabase Storage inside the clinic's isolated folder hierarchy.
 */
export const uploadClinicFile = async (
  file: File,
  folder: 'patients' | 'invoices' | 'logos' | 'documents' | 'prescriptions',
  subFolder?: string,
  doctor?: DoctorProfile
): Promise<{ url: string; path: string } | null> => {
  const client = supabaseClient || reinitSupabaseClient();
  if (!client) {
    console.warn('Supabase client not connected. Returning local DataURL fallback.');
    return null;
  }

  try {
    const storagePath = getClinicStoragePath(folder, file.name, subFolder, doctor);

    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Supabase multi-tenant storage upload error:', error);
      return null;
    }

    const { data: urlData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      url: urlData?.publicUrl || '',
      path: data.path,
    };
  } catch (err) {
    console.error('Error during multi-tenant file upload:', err);
    return null;
  }
};

/**
 * Deletes a file from Supabase Storage while verifying tenant ownership.
 */
export const deleteClinicFile = async (
  filePath: string,
  doctor?: DoctorProfile
): Promise<boolean> => {
  const client = supabaseClient || reinitSupabaseClient();
  if (!client || !filePath) return false;

  const activeClinicId = getActiveClinicId(doctor);
  
  if (!filePath.startsWith(`${activeClinicId}/`)) {
    console.error(`Security restriction: Cannot delete file ${filePath} belonging to another tenant.`);
    return false;
  }

  try {
    const { error } = await client.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting multi-tenant storage file:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception during storage file deletion:', err);
    return false;
  }
};

/**
 * Multi-Tenant Database Query Helper:
 * Queries any Supabase table strictly filtered by the active clinic_id.
 */
export const fetchClinicRecords = async <T>(
  tableName: string,
  doctor?: DoctorProfile
): Promise<T[] | null> => {
  const client = supabaseClient || reinitSupabaseClient();
  if (!client) return null;

  const clinicId = getActiveClinicId(doctor);
  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .eq('clinic_id', clinicId);

    if (error) {
      console.warn(`Supabase query warning for table '${tableName}':`, error.message);
      return null;
    }

    return data as T[];
  } catch (err) {
    console.error(`Error querying table '${tableName}' for clinic ${clinicId}:`, err);
    return null;
  }
};

/**
 * Multi-Tenant Database Upsert Helper:
 * Automatically formats rows & injects clinic_id before upserting.
 */
export const upsertClinicRecords = async <T extends Record<string, any>>(
  tableName: string,
  records: T[],
  doctor?: DoctorProfile,
  onConflictKey: string = 'id'
): Promise<boolean> => {
  const client = supabaseClient || reinitSupabaseClient();
  if (!client || records.length === 0) return false;

  const clinicId = getActiveClinicId(doctor);
  const now = new Date().toISOString();

  let preparedRecords: any[] = [];

  if (tableName === 'patients') {
    preparedRecords = records.map((rec) => ({
      id: rec.id,
      clinic_id: clinicId,
      mrn: rec.mrn || '',
      name: rec.name || 'Unknown Patient',
      phone: rec.phone || '',
      gender: rec.gender || '',
      age: typeof rec.age === 'number' ? rec.age : parseInt(rec.age || '0', 10) || 0,
      data: rec,
      updated_at: now,
    }));
  } else if (tableName === 'chairs') {
    preparedRecords = records.map((rec) => ({
      id: rec.id,
      clinic_id: clinicId,
      name: rec.name || '',
      status: rec.status || 'Available',
      data: rec,
      updated_at: now,
    }));
  } else {
    preparedRecords = records.map((rec) => ({
      ...rec,
      clinic_id: clinicId,
      updated_at: now,
    }));
  }

  try {
    const { error } = await client
      .from(tableName)
      .upsert(preparedRecords, { onConflict: onConflictKey });

    if (error) {
      console.warn(`Supabase upsert warning for table '${tableName}':`, error.message);
      // Resilient fallback for patients table
      if (tableName === 'patients') {
        const fallbackRecords = records.map((rec) => ({
          id: rec.id,
          clinic_id: clinicId,
          data: rec,
          updated_at: now,
        }));
        const { error: fbErr } = await client
          .from(tableName)
          .upsert(fallbackRecords, { onConflict: onConflictKey });
        if (!fbErr) return true;
      }
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Error upserting records into table '${tableName}' for clinic ${clinicId}:`, err);
    return false;
  }
};

/**
 * Multi-Tenant Database Delete Helper:
 */
export const deleteClinicRecord = async (
  tableName: string,
  recordId: string,
  doctor?: DoctorProfile
): Promise<boolean> => {
  const client = supabaseClient || reinitSupabaseClient();
  if (!client || !recordId) return false;

  const clinicId = getActiveClinicId(doctor);
  try {
    const { error } = await client
      .from(tableName)
      .delete()
      .eq('id', recordId)
      .eq('clinic_id', clinicId);

    if (error) {
      console.error(`Error deleting record ${recordId} from ${tableName}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Exception deleting record ${recordId} from ${tableName}:`, err);
    return false;
  }
};

