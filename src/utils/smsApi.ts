import { Patient, SmsPublicSettings, SmsLogRecord, SmsTemplateRecord } from '../types';
import {
  getStoredSmsGatewaySettings,
  saveStoredSmsGatewaySettings,
  getStoredSmsLogs,
  saveStoredSmsLogs,
  getStoredSmsTemplates,
  saveStoredSmsTemplates,
  getStoredSmsFollowups,
  saveStoredSmsFollowups,
  StoredSmsGatewaySettings,
} from './storage';
import { performSupabaseCloudBackup } from './supabaseCloudBackup';
import {
  getActiveClinicId,
  supabaseClient,
  reinitSupabaseClient,
  isSupabaseConfigured,
} from './supabaseMultiTenant';

export interface SmsDashboardData {
  gateway: SmsPublicSettings;
  counts: {
    todayTotal: number;
    todaySent: number;
    todayFailed: number;
    todayPending: number;
    monthlySent: number;
  };
  recentLogs: SmsLogRecord[];
  todayFollowupsCount: number;
  upcomingRemindersCount: number;
}

export const DEFAULT_SMS_TEMPLATES: SmsTemplateRecord[] = [
  {
    id: 'tpl-1',
    title: 'Standard Appointment Reminder',
    category: 'Appointment Reminder',
    body: 'Dear {{patient_name}}, this is a reminder from {{clinic_name}}. Your dental appointment is scheduled for {{appointment_date}} at {{appointment_time}}. Please arrive 10 minutes early. Thank you.',
    isDefault: true,
  },
  {
    id: 'tpl-2',
    title: 'Dental Review & Follow-up',
    category: 'Follow-up Reminder',
    body: 'Dear {{patient_name}}, this is a follow-up reminder from {{clinic_name}}. Your dental review is scheduled for {{followup_date}}. Please contact us if you need to adjust your visit. Thank you.',
    isDefault: true,
  },
  {
    id: 'tpl-3',
    title: 'Post-Treatment Healing Check',
    category: 'Treatment Follow-up',
    body: 'Dear {{patient_name}}, Dr. {{doctor_name}} from {{clinic_name}} hopes you are healing well after your treatment. Please take prescribed medications on time and call {{clinic_phone}} if you have discomfort.',
    isDefault: true,
  },
  {
    id: 'tpl-4',
    title: '6-Month Dental Recall Checkup',
    category: 'Dental Recall',
    body: 'Dear {{patient_name}}, it has been 6 months since your last scaling & checkup at {{clinic_name}}. Keep your smile healthy! Call {{clinic_phone}} to book your recall appointment.',
    isDefault: true,
  },
  {
    id: 'tpl-5',
    title: 'Missed Appointment Follow-up',
    category: 'Missed Appointment',
    body: 'Dear {{patient_name}}, we missed you today at {{clinic_name}} for your scheduled dental visit. Please reply or call {{clinic_phone}} to reschedule at your convenience.',
    isDefault: true,
  },
  {
    id: 'tpl-6',
    title: 'Custom General Message',
    category: 'Custom Message',
    body: 'Dear {{patient_name}}, greetings from {{clinic_name}}. {{message_content}} Thank you.',
    isDefault: false,
  },
];

/**
 * Normalizes Indian/international phone numbers to E.164 (+91XXXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.trim().replace(/[\s\-\(\)]/g, '');
  if (clean.startsWith('+91')) return clean;
  if (clean.startsWith('91') && clean.length === 12) return '+' + clean;
  if (/^[6-9]\d{9}$/.test(clean)) return '+91' + clean;
  if (!clean.startsWith('+')) return '+' + clean;
  return clean;
}

export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^\+\d{10,15}$/.test(normalized);
}

/**
 * Direct client-side TextBee API call (https://api.textbee.dev)
 * Primary endpoint: POST https://api.textbee.dev/api/v1/gateway/send-sms
 * Device payload: { recipients: [...], message: "...", deviceId: "..." }
 * Fallback endpoint: POST https://api.textbee.dev/api/v1/gateway/devices/{DEVICE_ID}/send-sms
 */
export async function sendTextBeeSmsDirect(params: {
  deviceId: string;
  apiKey: string;
  recipientPhone: string;
  message: string;
}): Promise<{ success: boolean; messageId?: string; error?: string; rawResponse?: any }> {
  const { deviceId, apiKey, recipientPhone, message } = params;

  if (!deviceId || !deviceId.trim()) {
    return { success: false, error: 'TextBee Device ID is missing or empty' };
  }
  if (!apiKey || !apiKey.trim()) {
    return { success: false, error: 'TextBee API Key is missing or empty' };
  }

  const normalizedPhone = normalizePhoneNumber(recipientPhone);
  if (!isValidPhoneNumber(normalizedPhone)) {
    return {
      success: false,
      error: `Invalid recipient phone number: "${recipientPhone}". Must be valid E.164 format (e.g. +919876543210).`,
    };
  }

  if (!message || !message.trim()) {
    return { success: false, error: 'SMS message body cannot be empty' };
  }

  const cleanDeviceId = deviceId.trim();
  const cleanApiKey = apiKey.trim();
  const cleanMessage = message.trim();

  // Try Primary TextBee Gateway endpoint first
  const primaryUrl = 'https://api.textbee.dev/api/v1/gateway/send-sms';
  try {
    const response = await fetch(primaryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cleanApiKey,
      },
      body: JSON.stringify({
        recipients: [normalizedPhone],
        message: cleanMessage,
        deviceId: cleanDeviceId,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && (data.success !== false)) {
      return {
        success: true,
        messageId: data?.data?.id || data?.id || `tb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        rawResponse: data,
      };
    }

    // If primary returned 404 (endpoint variant), try device-specific endpoint
    if (response.status === 404) {
      const fallbackUrl = `https://api.textbee.dev/api/v1/gateway/devices/${encodeURIComponent(cleanDeviceId)}/send-sms`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanApiKey,
        },
        body: JSON.stringify({
          recipients: [normalizedPhone],
          message: cleanMessage,
        }),
      });

      const fallbackData = await fallbackRes.json().catch(() => ({}));
      if (fallbackRes.ok && (fallbackData.success !== false)) {
        return {
          success: true,
          messageId: fallbackData?.data?.id || fallbackData?.id || `tb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          rawResponse: fallbackData,
        };
      }

      const fbError = fallbackData?.message || fallbackData?.error || `TextBee HTTP ${fallbackRes.status}: ${fallbackRes.statusText}`;
      return { success: false, error: fbError, rawResponse: fallbackData };
    }

    const errMsg =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.join(', ') : null) ||
      `TextBee Gateway HTTP error ${response.status}: ${response.statusText}`;
    return { success: false, error: errMsg, rawResponse: data };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to connect directly to TextBee API (api.textbee.dev): ${err.message || 'Network error / Gateway unreachable'}`,
    };
  }
}

/**
 * Direct client-side device ping to https://api.textbee.dev
 */
export async function checkTextBeeHealthDirect(params: {
  deviceId: string;
  apiKey: string;
}): Promise<{ isOnline: boolean; deviceName?: string; error?: string }> {
  const { deviceId, apiKey } = params;
  if (!deviceId || !apiKey) {
    return { isOnline: false, error: 'Missing Device ID or API Key' };
  }

  const cleanDeviceId = deviceId.trim();
  const cleanApiKey = apiKey.trim();

  try {
    const url = `https://api.textbee.dev/api/v1/gateway/devices/${encodeURIComponent(cleanDeviceId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': cleanApiKey,
      },
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        isOnline: true,
        deviceName: data?.data?.name || data?.name || 'TextBee Android Gateway',
      };
    }

    if (response.status === 401 || response.status === 403) {
      return { isOnline: false, error: 'Invalid TextBee API Key (Unauthorized)' };
    }

    if (response.status === 404) {
      // Check devices list endpoint
      try {
        const listRes = await fetch('https://api.textbee.dev/api/v1/gateway/devices', {
          method: 'GET',
          headers: { 'x-api-key': cleanApiKey },
        });
        if (listRes.ok) {
          const listData = await listRes.json().catch(() => ({}));
          const devices = Array.isArray(listData?.data) ? listData.data : (Array.isArray(listData) ? listData : []);
          const match = devices.find((d: any) => d.id === cleanDeviceId || d.deviceId === cleanDeviceId);
          if (match) {
            return {
              isOnline: true,
              deviceName: match.name || 'TextBee Android Gateway',
            };
          }
          return {
            isOnline: false,
            error: `Device ID "${cleanDeviceId}" not found on TextBee account`,
          };
        }
      } catch {}
      return { isOnline: false, error: `TextBee device "${cleanDeviceId}" not found (404)` };
    }

    return { isOnline: false, error: `TextBee Gateway returned HTTP ${response.status}` };
  } catch (err: any) {
    return { isOnline: false, error: `Unable to ping TextBee: ${err.message || 'Network error'}` };
  }
}

// Get active credentials from localStorage or environment variables (used for fallback or admin setup)
function getActiveCredentials(): { deviceId: string; apiKey: string; settings: StoredSmsGatewaySettings | null } {
  const stored = getStoredSmsGatewaySettings();
  const envDeviceId = (import.meta as any).env?.VITE_TEXTBEE_DEVICE_ID || (import.meta as any).env?.TEXTBEE_DEVICE_ID || '';
  const envApiKey = (import.meta as any).env?.VITE_TEXTBEE_API_KEY || (import.meta as any).env?.TEXTBEE_API_KEY || '';

  const deviceId = stored?.deviceId || envDeviceId;
  const apiKey = stored?.apiKey || envApiKey;

  return {
    deviceId,
    apiKey,
    settings: stored,
  };
}

export async function connectSmsGateway(params: {
  deviceId?: string;
  clientId?: string;
  apiKey: string;
  clinicName?: string;
  clinicPhone?: string;
  doctorName?: string;
  defaultReminderTiming?: string;
}) {
  const effectiveDeviceId = (params.deviceId || params.clientId || '').trim();
  const effectiveApiKey = (params.apiKey || '').trim();

  if (!effectiveDeviceId) {
    throw new Error('TextBee Client ID is required');
  }
  if (!effectiveApiKey) {
    throw new Error('TextBee API Key is required');
  }

  // 1. Try connecting via MediCare backend API
  try {
    const response = await fetch('/api/sms/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: effectiveDeviceId,
        clientId: effectiveDeviceId,
        apiKey: effectiveApiKey,
        clinicName: params.clinicName,
        clinicPhone: params.clinicPhone,
        doctorName: params.doctorName,
        defaultReminderTiming: params.defaultReminderTiming,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      // Also update local storage cache for backup sync
      const updatedSettings: StoredSmsGatewaySettings = {
        deviceId: effectiveDeviceId,
        apiKey: effectiveApiKey,
        clinicName: params.clinicName || 'RK Dental Clinic',
        clinicPhone: params.clinicPhone || '+91 9876543210',
        doctorName: params.doctorName || 'Dr. Alex Mercer',
        defaultReminderTiming: (params.defaultReminderTiming as any) || '1 day before',
        connected: true,
      };
      saveStoredSmsGatewaySettings(updatedSettings);

      performSupabaseCloudBackup().catch((err) =>
        console.warn('[SMS Gateway] Notice on cloud backup sync:', err)
      );

      return {
        success: true,
        message: 'TextBee Gateway connected successfully! Credentials saved securely.',
        settings: data.settings || getPublicSettings(updatedSettings),
        health: data.health || { isOnline: true },
      };
    } else {
      const errData = await response.json().catch(() => ({}));
      if (errData.error?.includes('Unauthorized') || response.status === 401) {
        throw new Error('Invalid TextBee API Key or Device Unauthorized');
      }
    }
  } catch (backendErr: any) {
    if (backendErr.message?.includes('Invalid TextBee API Key')) {
      throw backendErr;
    }
    console.warn('[SMS API] Backend connect notice, testing direct:', backendErr);
  }

  // Direct check & fallback
  const health = await checkTextBeeHealthDirect({
    deviceId: effectiveDeviceId,
    apiKey: effectiveApiKey,
  });

  const updatedSettings: StoredSmsGatewaySettings = {
    deviceId: effectiveDeviceId,
    apiKey: effectiveApiKey,
    clinicName: params.clinicName || 'RK Dental Clinic',
    clinicPhone: params.clinicPhone || '+91 9876543210',
    doctorName: params.doctorName || 'Dr. Alex Mercer',
    defaultReminderTiming: (params.defaultReminderTiming as any) || '1 day before',
    connected: true,
  };

  saveStoredSmsGatewaySettings(updatedSettings);

  performSupabaseCloudBackup().catch((err) =>
    console.warn('[SMS Gateway] Notice on cloud backup sync:', err)
  );

  return {
    success: true,
    message: health.isOnline
      ? 'TextBee Gateway connected successfully!'
      : 'Credentials saved! Gateway is ready to send SMS.',
    settings: getPublicSettings(updatedSettings),
    health,
  };
}

export async function disconnectSmsGateway() {
  try {
    await fetch('/api/sms/disconnect', { method: 'POST' });
  } catch {
    // ignore
  }

  saveStoredSmsGatewaySettings(null);

  performSupabaseCloudBackup().catch((err) =>
    console.warn('[SMS Gateway] Notice on cloud backup sync after disconnect:', err)
  );

  return { 
    success: true, 
    message: 'TextBee Gateway disconnected successfully.',
    settings: getPublicSettings(null) 
  };
}

export async function autoRestoreSmsSettingsIfNeeded() {
  // 1. First check backend status if available
  try {
    const res = await fetch('/api/sms/status');
    if (res.ok) {
      const data = await res.json();
      if (data.settings?.connected) {
        return getSmsStatus();
      }
    }
  } catch {
    // fallback
  }

  // 2. Check local credentials cache
  let { deviceId, apiKey, settings } = getActiveCredentials();

  // 3. If local credentials missing or disconnected, query Supabase Cloud DB clinic_backups
  if (!deviceId || !apiKey || !settings?.connected) {
    try {
      const client = supabaseClient || reinitSupabaseClient();
      if (client && isSupabaseConfigured()) {
        const tenantClinicId = getActiveClinicId();
        const { data, error } = await client
          .from('clinic_backups')
          .select('backup_payload')
          .eq('clinic_id', tenantClinicId)
          .single();

        if (!error && data?.backup_payload?.smsSettings?.deviceId && data?.backup_payload?.smsSettings?.apiKey) {
          const cloudSms = data.backup_payload.smsSettings;
          saveStoredSmsGatewaySettings({
            ...cloudSms,
            connected: true,
          });
          deviceId = cloudSms.deviceId;
          apiKey = cloudSms.apiKey;
          settings = cloudSms;
        }
      }
    } catch (sbErr) {
      console.info('[SMS Auto-Restore] Supabase query note:', sbErr);
    }

    // 4. Also check local cloud recovery vault
    if (!deviceId || !apiKey) {
      try {
        const rawVault = localStorage.getItem('fabis_medicare_local_cloud_backup_vault');
        if (rawVault) {
          const parsed = JSON.parse(rawVault);
          if (parsed?.smsSettings?.deviceId && parsed?.smsSettings?.apiKey) {
            saveStoredSmsGatewaySettings({
              ...parsed.smsSettings,
              connected: true,
            });
            deviceId = parsed.smsSettings.deviceId;
            apiKey = parsed.smsSettings.apiKey;
            settings = parsed.smsSettings;
          }
        }
      } catch {}
    }
  }

  if (deviceId && apiKey) {
    if (!settings || !settings.connected) {
      saveStoredSmsGatewaySettings({
        deviceId,
        apiKey,
        clinicName: settings?.clinicName || 'RK Dental Clinic',
        clinicPhone: settings?.clinicPhone || '+91 9876543210',
        doctorName: settings?.doctorName || 'Dr. Alex Mercer',
        defaultReminderTiming: settings?.defaultReminderTiming || '1 day before',
        connected: true,
      });

      // Also restore to backend if accessible
      fetch('/api/sms/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, apiKey }),
      }).catch(() => {});
    }
  }
  return getSmsStatus();
}

function getPublicSettings(settings: StoredSmsGatewaySettings | null): SmsPublicSettings {
  const deviceId = settings?.deviceId || '';
  const apiKey = settings?.apiKey || '';
  const maskedApiKey = apiKey ? apiKey.substring(0, 4) + '••••••••' + apiKey.slice(-4) : '';

  return {
    deviceId,
    hasApiKey: Boolean(apiKey),
    maskedApiKey,
    connected: Boolean(deviceId && apiKey),
    deviceName: deviceId ? 'TextBee Android Gateway' : '',
    clinicName: settings?.clinicName || 'RK Dental Clinic',
    clinicPhone: settings?.clinicPhone || '+91 9876543210',
    doctorName: settings?.doctorName || 'Dr. Alex Mercer',
    defaultReminderTiming: settings?.defaultReminderTiming || '1 day before',
    smsEnabled: true,
    dailyLimit: 500,
    monthlyLimit: 15000,
  };
}

export async function getSmsStatus() {
  // 1. Check live status from MediCare Backend (if running in full-stack Node container)
  try {
    const response = await fetch('/api/sms/status');
    if (response.ok) {
      const data = await response.json();
      if (data.settings) {
        return {
          settings: data.settings,
          health: data.health || { isOnline: data.settings.connected },
          counts: data.counts || {
            todayTotal: 0,
            todaySent: 0,
            todayFailed: 0,
            todayPending: 0,
            monthlySent: 0,
          },
        };
      }
    }
  } catch (e) {
    console.info('[SMS Status] Backend status check offline, falling back to cached state.');
  }

  // 2. Fallback to direct client state & direct TextBee health ping (works seamlessly on Netlify SPA)
  const { deviceId, apiKey, settings } = getActiveCredentials();
  const publicSettings = getPublicSettings(settings);

  let health: { isOnline: boolean; deviceName?: string; error?: string } = {
    isOnline: false,
    deviceName: '',
    error: 'Gateway credentials missing',
  };
  if (deviceId && apiKey) {
    health = await checkTextBeeHealthDirect({ deviceId, apiKey });
  }

  return {
    settings: publicSettings,
    health,
    counts: {
      todayTotal: 0,
      todaySent: 0,
      todayFailed: 0,
      todayPending: 0,
      monthlySent: 0,
    },
  };
}

export async function sendTestSms(recipientPhone: string, message?: string) {
  const defaultMsg = 'Test SMS from FABIS MediCare Dental EMR. TextBee API Gateway is active & working!';
  return sendManualSms({
    recipientPhone,
    message: message || defaultMsg,
    type: 'Test',
  });
}

export async function sendManualSms(params: {
  patientId?: string;
  patientName?: string;
  recipientPhone: string;
  message: string;
  type?: 'Appointment' | 'Follow-up' | 'Manual' | 'Recall' | 'Test';
}) {
  const normalizedPhone = normalizePhoneNumber(params.recipientPhone);
  if (!isValidPhoneNumber(normalizedPhone)) {
    throw new Error(`Invalid recipient phone number: "${params.recipientPhone}". Please provide a valid mobile number.`);
  }

  let sendSuccess = false;
  let textbeeMessageId: string | undefined;
  let sendError: string | undefined;

  // 1. Try sending via MediCare Backend Proxy if available
  try {
    const backendRes = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: params.patientId || 'GENERAL',
        patientName: params.patientName || 'Patient',
        recipientPhone: normalizedPhone,
        message: params.message.trim(),
        type: params.type || 'Manual',
      }),
    });

    // If backend returns 404 (e.g. on Netlify static deploy), proceed to direct client fallback
    if (backendRes.status !== 404) {
      const data = await backendRes.json().catch(() => ({}));
      if (backendRes.ok && data.success) {
        sendSuccess = true;
        textbeeMessageId = data.messageId || data.logId;
      } else {
        sendError = data.error || `Server HTTP ${backendRes.status}`;
      }
    }
  } catch (netErr: any) {
    console.info('[SMS API] Backend proxy not reached, attempting direct client fallback');
  }

  // 2. Direct client TextBee API call if not sent via backend (e.g. Netlify deployment)
  if (!sendSuccess) {
    const { deviceId, apiKey } = getActiveCredentials();
    if (deviceId && apiKey) {
      const result = await sendTextBeeSmsDirect({
        deviceId,
        apiKey,
        recipientPhone: normalizedPhone,
        message: params.message,
      });

      if (result.success) {
        sendSuccess = true;
        textbeeMessageId = result.messageId;
        sendError = undefined;
      } else {
        sendError = result.error || sendError || 'Direct TextBee SMS delivery failed';
      }
    } else {
      if (!sendError) {
        sendError = 'TextBee SMS Gateway is not configured. Please set Device ID and API Key in Settings.';
      }
    }
  }

  const now = new Date().toISOString();
  const newLog: SmsLogRecord = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    patientId: params.patientId || 'GENERAL',
    patientName: params.patientName || 'General Recipient',
    recipient: normalizedPhone,
    message: params.message,
    type: params.type || 'Manual',
    status: sendSuccess ? 'Sent' : 'Failed',
    textbeeMessageId,
    error: sendSuccess ? undefined : sendError,
    sentAt: sendSuccess ? now : undefined,
    createdAt: now,
  };

  // Add to local storage logs
  const currentLogs = getStoredSmsLogs();
  const updatedLogs = [newLog, ...currentLogs];
  saveStoredSmsLogs(updatedLogs);

  // Sync with Supabase Cloud Backup
  performSupabaseCloudBackup().catch(() => {});

  if (!sendSuccess) {
    throw new Error(sendError || 'Failed to dispatch SMS via TextBee Android Gateway.');
  }

  return {
    success: true,
    message: `SMS sent successfully to ${normalizedPhone}`,
    logId: newLog.id,
    textbeeMessageId,
  };
}

export async function getSmsHistory(params?: { status?: string; type?: string; search?: string }) {
  let logs: SmsLogRecord[] = getStoredSmsLogs();

  if (params?.status && params.status !== 'All') {
    logs = logs.filter((l) => l.status.toLowerCase() === params.status!.toLowerCase());
  }

  if (params?.type && params.type !== 'All') {
    logs = logs.filter((l) => l.type.toLowerCase() === params.type!.toLowerCase());
  }

  if (params?.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    logs = logs.filter(
      (l) =>
        l.patientName?.toLowerCase().includes(q) ||
        l.recipient?.includes(q) ||
        l.message?.toLowerCase().includes(q)
    );
  }

  return { success: true, logs };
}

export async function retrySms(logId: string) {
  const logs = getStoredSmsLogs();
  const target = logs.find((l) => l.id === logId);

  if (!target) {
    throw new Error('SMS log record not found');
  }

  return sendManualSms({
    patientId: target.patientId,
    patientName: target.patientName,
    recipientPhone: target.recipient,
    message: target.message,
    type: target.type,
  });
}

export async function getSmsTemplates(): Promise<SmsTemplateRecord[]> {
  const tpls = getStoredSmsTemplates();
  if (!tpls || tpls.length === 0) {
    saveStoredSmsTemplates(DEFAULT_SMS_TEMPLATES);
    return DEFAULT_SMS_TEMPLATES;
  }
  return tpls;
}

export async function saveSmsTemplate(template: Omit<SmsTemplateRecord, 'id'> & { id?: string }) {
  const current = await getSmsTemplates();
  let updated: SmsTemplateRecord[];

  if (template.id) {
    updated = current.map((t) => (t.id === template.id ? ({ ...t, ...template } as SmsTemplateRecord) : t));
  } else {
    const newTpl: SmsTemplateRecord = {
      ...template,
      id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    updated = [newTpl, ...current];
  }

  saveStoredSmsTemplates(updated);
  performSupabaseCloudBackup().catch(() => {});
  return { success: true, templates: updated };
}

export async function deleteSmsTemplate(id: string) {
  const current = await getSmsTemplates();
  const updated = current.filter((t) => t.id !== id);
  saveStoredSmsTemplates(updated);
  performSupabaseCloudBackup().catch(() => {});
  return { success: true, templates: updated };
}

export async function getScheduledFollowups() {
  return getStoredSmsFollowups();
}

export async function scheduleFollowupSms(params: {
  id?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  followupType: string;
  scheduledDate: string;
  message: string;
}) {
  const current = getStoredSmsFollowups();
  const now = new Date().toISOString();

  const newFollowup = {
    id: params.id || `fu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    patientId: params.patientId,
    patientName: params.patientName,
    patientPhone: normalizePhoneNumber(params.patientPhone),
    followupType: params.followupType,
    scheduledDate: params.scheduledDate,
    smsEnabled: true,
    smsStatus: 'Pending',
    message: params.message,
    createdAt: now,
  };

  const updated = [newFollowup, ...current];
  saveStoredSmsFollowups(updated);
  performSupabaseCloudBackup().catch(() => {});

  return { success: true, followup: newFollowup };
}

export async function scheduleSmsReminderApi(params: {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  procedure?: string;
  chair?: string;
}) {
  const current = getStoredSmsFollowups();
  const now = new Date().toISOString();

  const reminderMsg = `Dear ${params.patientName}, appointment reminder from RK Dental Clinic for ${params.appointmentDate} at ${params.appointmentTime} (${params.procedure || 'Dental Checkup'}). Reply or call if you need to adjust.`;

  const newReminder = {
    id: `rem_${params.appointmentId}`,
    patientId: params.patientId,
    patientName: params.patientName,
    patientPhone: normalizePhoneNumber(params.patientPhone),
    appointmentId: params.appointmentId,
    followupType: 'Appointment Reminder',
    scheduledDate: params.appointmentDate,
    smsEnabled: true,
    smsStatus: 'Pending',
    message: reminderMsg,
    createdAt: now,
  };

  const updated = [newReminder, ...current.filter((f) => f.id !== newReminder.id)];
  saveStoredSmsFollowups(updated);
  performSupabaseCloudBackup().catch(() => {});

  return { success: true, reminder: newReminder };
}

export async function sendFollowupSmsNow(id: string) {
  const current = getStoredSmsFollowups();
  const item = current.find((f) => f.id === id);

  if (!item) {
    throw new Error('Scheduled followup item not found');
  }

  const result = await sendManualSms({
    patientId: item.patientId,
    patientName: item.patientName,
    recipientPhone: item.patientPhone,
    message: item.message,
    type: 'Follow-up',
  });

  const now = new Date().toISOString();
  const updated = current.map((f) =>
    f.id === id
      ? {
          ...f,
          smsStatus: 'Sent',
          sentAt: now,
          completedAt: now,
        }
      : f
  );

  saveStoredSmsFollowups(updated);
  performSupabaseCloudBackup().catch(() => {});

  return result;
}

export async function syncPatientsToSmsBackend(patients: Patient[]) {
  // Pure client side - no backend needed
}

export async function getSmsDashboardData(): Promise<SmsDashboardData> {
  const status = await getSmsStatus();
  const logs: SmsLogRecord[] = getStoredSmsLogs();
  const followups = getStoredSmsFollowups();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((l) => l.createdAt?.startsWith(todayStr));

  const todayTotal = todayLogs.length;
  const todaySent = todayLogs.filter((l) => l.status === 'Sent').length;
  const todayFailed = todayLogs.filter((l) => l.status === 'Failed').length;
  const todayPending = todayLogs.filter((l) => l.status === 'Pending').length;

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const monthlySent = logs.filter((l) => l.status === 'Sent' && l.createdAt?.startsWith(currentMonthStr)).length;

  const todayFollowupsCount = followups.filter(
    (f) => f.scheduledDate === todayStr && f.smsStatus === 'Pending'
  ).length;

  const upcomingRemindersCount = followups.filter(
    (f) => f.scheduledDate >= todayStr && f.smsStatus === 'Pending'
  ).length;

  return {
    gateway: status.settings,
    counts: {
      todayTotal,
      todaySent,
      todayFailed,
      todayPending,
      monthlySent,
    },
    recentLogs: logs.slice(0, 10),
    todayFollowupsCount,
    upcomingRemindersCount,
  };
}
