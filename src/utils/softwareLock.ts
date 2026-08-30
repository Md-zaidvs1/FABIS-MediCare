// FABIS MediCare - Permanent Doctor Access Lock & Developer Maintenance Mode Controller
// NOTE: Software remains usable indefinitely. Only Admin can manually lock/unlock Doctor Access or toggle Maintenance Mode.

import { getStoredSupabaseConfig } from './supabaseMultiTenant';

const ACCESS_KEYS = {
  DOCTOR_ACCESS_STATUS: 'fabis_doctor_access_status_v2',
  DEVELOPER_MAINTENANCE_MODE: 'fabis_developer_maintenance_mode_v2',
};

export interface SoftwareAccessState {
  isLocked: boolean; // True if Doctor is blocked (due to Doctor Lock or Maintenance Mode)
  doctorAccess: 'Active' | 'Locked';
  maintenanceMode: boolean;
  serverTime: string;
  source: 'server_api' | 'supabase_db' | 'cached_validation';
}

/**
 * Gets stored Doctor Access status ('Active' | 'Locked')
 */
export function getStoredDoctorAccess(): 'Active' | 'Locked' {
  try {
    const val = localStorage.getItem(ACCESS_KEYS.DOCTOR_ACCESS_STATUS);
    if (val === 'Locked') return 'Locked';
  } catch {}
  return 'Active';
}

/**
 * Gets stored Developer Maintenance Mode status
 */
export function getStoredMaintenanceMode(): boolean {
  try {
    const val = localStorage.getItem(ACCESS_KEYS.DEVELOPER_MAINTENANCE_MODE);
    return val === 'true';
  } catch {}
  return false;
}

/**
 * Evaluates access status from Server / Supabase with local fallback
 */
export async function evaluateSoftwareAccess(): Promise<SoftwareAccessState> {
  let doctorAccess: 'Active' | 'Locked' = getStoredDoctorAccess();
  let maintenanceMode: boolean = getStoredMaintenanceMode();
  let source: 'server_api' | 'supabase_db' | 'cached_validation' = 'cached_validation';
  let serverTime = new Date().toISOString();

  // 1. Try local Express backend endpoint
  try {
    const res = await fetch('/api/software-status/status', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.doctorAccess) {
        doctorAccess = data.doctorAccess;
        maintenanceMode = Boolean(data.maintenanceMode);
        serverTime = data.serverTime || serverTime;
        source = 'server_api';

        // Cache latest remote state
        localStorage.setItem(ACCESS_KEYS.DOCTOR_ACCESS_STATUS, doctorAccess);
        localStorage.setItem(ACCESS_KEYS.DEVELOPER_MAINTENANCE_MODE, maintenanceMode ? 'true' : 'false');
      }
    }
  } catch {
    // 2. Try Supabase cloud config or fallback
    try {
      const { url, anonKey } = getStoredSupabaseConfig();
      if (url && !url.includes('demo-clinic-emr') && anonKey) {
        const sbRes = await fetch(`${url}/rest/v1/system_settings?key=eq.doctor_access_control&select=*`, {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          cache: 'no-store',
        });
        if (sbRes.ok) {
          const rows = await sbRes.json();
          if (rows && rows.length > 0 && rows[0].value) {
            const val = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
            if (val.doctorAccess) doctorAccess = val.doctorAccess;
            if (typeof val.maintenanceMode === 'boolean') maintenanceMode = val.maintenanceMode;
            source = 'supabase_db';

            localStorage.setItem(ACCESS_KEYS.DOCTOR_ACCESS_STATUS, doctorAccess);
            localStorage.setItem(ACCESS_KEYS.DEVELOPER_MAINTENANCE_MODE, maintenanceMode ? 'true' : 'false');
          }
        }
      }
    } catch {}
  }

  // Doctor is locked if either Doctor Access is Locked OR Developer Maintenance Mode is ON
  const isLocked = maintenanceMode || doctorAccess === 'Locked';

  return {
    isLocked,
    doctorAccess,
    maintenanceMode,
    serverTime,
    source,
  };
}

/**
 * Admin action to Lock / Unlock Doctor Access
 */
export async function setDoctorAccessStatus(status: 'Active' | 'Locked'): Promise<boolean> {
  try {
    localStorage.setItem(ACCESS_KEYS.DOCTOR_ACCESS_STATUS, status);

    // Notify backend
    try {
      await fetch('/api/software-status/doctor-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorAccess: status }),
      });
    } catch {}

    // Persist to Supabase
    try {
      const { url, anonKey } = getStoredSupabaseConfig();
      if (url && !url.includes('demo-clinic-emr') && anonKey) {
        const currentMaint = getStoredMaintenanceMode();
        await fetch(`${url}/rest/v1/system_settings`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            key: 'doctor_access_control',
            value: JSON.stringify({
              doctorAccess: status,
              maintenanceMode: currentMaint,
              updatedAt: new Date().toISOString(),
            }),
            updated_at: new Date().toISOString(),
          }),
        });
      }
    } catch {}

    // Cloud snapshot backup
    try {
      const { performSupabaseCloudBackup } = await import('./supabaseCloudBackup');
      await performSupabaseCloudBackup();
    } catch {}

    window.dispatchEvent(new Event('software-license-updated'));
    return true;
  } catch (err) {
    console.error('Error updating doctor access status:', err);
    return false;
  }
}

/**
 * Admin action to Enable / Disable Developer Maintenance Mode
 */
export async function setMaintenanceModeStatus(enabled: boolean): Promise<boolean> {
  try {
    localStorage.setItem(ACCESS_KEYS.DEVELOPER_MAINTENANCE_MODE, enabled ? 'true' : 'false');

    // Notify backend
    try {
      await fetch('/api/software-status/maintenance-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceMode: enabled }),
      });
    } catch {}

    // Persist to Supabase
    try {
      const { url, anonKey } = getStoredSupabaseConfig();
      if (url && !url.includes('demo-clinic-emr') && anonKey) {
        const currentAccess = getStoredDoctorAccess();
        await fetch(`${url}/rest/v1/system_settings`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            key: 'doctor_access_control',
            value: JSON.stringify({
              doctorAccess: currentAccess,
              maintenanceMode: enabled,
              updatedAt: new Date().toISOString(),
            }),
            updated_at: new Date().toISOString(),
          }),
        });
      }
    } catch {}

    // Cloud snapshot backup
    try {
      const { performSupabaseCloudBackup } = await import('./supabaseCloudBackup');
      await performSupabaseCloudBackup();
    } catch {}

    window.dispatchEvent(new Event('software-license-updated'));
    return true;
  } catch (err) {
    console.error('Error updating maintenance mode:', err);
    return false;
  }
}
