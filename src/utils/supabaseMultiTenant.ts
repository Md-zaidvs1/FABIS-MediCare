// FABIS MediCare - Supabase Multi-Tenant SaaS Isolation Engine & File Storage Manager

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DoctorProfile, Patient, Invoice } from '../types';
import { getStoredDoctor } from './storage';

// Supabase Environment Setup
const metaEnv = (import.meta as any).env || {};
const SUPABASE_URL = (metaEnv.VITE_SUPABASE_URL as string) || 'https://demo-clinic-emr.supabase.co';
const SUPABASE_ANON_KEY = (metaEnv.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-anon-key';

export const BUCKET_NAME = 'clinic_vault';

let supabaseClient: SupabaseClient | null = null;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
} catch (err) {
  console.warn('Supabase multi-tenant initialization notice:', err);
}

export { supabaseClient };

/**
 * Automatically detects the logged-in clinic's unique tenant ID (clinic_id).
 * Priority order:
 * 1. doctor.clinicId (Explicit stored tenant ID)
 * 2. doctor.id (If custom doctor ID)
 * 3. doctor.clinicName (Clean slugified name)
 * 4. Fallback default tenant ID ('clinic_default_emr')
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
 * Format: {clinic_id}/{folder}/{subFolder?}/{timestamp}_{sanitized_filename}
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
 * Automatically prepends the logged-in clinic's ID.
 */
export const uploadClinicFile = async (
  file: File,
  folder: 'patients' | 'invoices' | 'logos' | 'documents' | 'prescriptions',
  subFolder?: string,
  doctor?: DoctorProfile
): Promise<{ url: string; path: string } | null> => {
  if (!supabaseClient) {
    console.warn('Supabase client not connected. Returning local DataURL fallback.');
    return null;
  }

  try {
    const storagePath = getClinicStoragePath(folder, file.name, subFolder, doctor);

    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Supabase multi-tenant storage upload error:', error);
      return null;
    }

    // Retrieve public or signed URL
    const { data: urlData } = supabaseClient.storage
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
  if (!supabaseClient || !filePath) return false;

  const activeClinicId = getActiveClinicId(doctor);
  
  // Security check: ensure path starts with active tenant clinic_id
  if (!filePath.startsWith(`${activeClinicId}/`)) {
    console.error(`Security restriction: Cannot delete file ${filePath} belonging to another tenant.`);
    return false;
  }

  try {
    const { error } = await supabaseClient.storage
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
  if (!supabaseClient) return null;

  const clinicId = getActiveClinicId(doctor);
  try {
    const { data, error } = await supabaseClient
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
 * Automatically injects clinic_id into every row before upserting.
 */
export const upsertClinicRecords = async <T extends Record<string, any>>(
  tableName: string,
  records: T[],
  doctor?: DoctorProfile,
  onConflictKey: string = 'id'
): Promise<boolean> => {
  if (!supabaseClient || records.length === 0) return false;

  const clinicId = getActiveClinicId(doctor);
  const now = new Date().toISOString();

  const preparedRecords = records.map((rec) => ({
    ...rec,
    clinic_id: clinicId,
    updated_at: now,
  }));

  try {
    const { error } = await supabaseClient
      .from(tableName)
      .upsert(preparedRecords, { onConflict: onConflictKey });

    if (error) {
      console.warn(`Supabase upsert warning for table '${tableName}':`, error.message);
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
 * Deletes a record by ID ensuring it belongs to the active clinic_id.
 */
export const deleteClinicRecord = async (
  tableName: string,
  recordId: string,
  doctor?: DoctorProfile
): Promise<boolean> => {
  if (!supabaseClient || !recordId) return false;

  const clinicId = getActiveClinicId(doctor);
  try {
    const { error } = await supabaseClient
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
