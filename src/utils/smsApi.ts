import { Patient, SmsPublicSettings, SmsLogRecord, SmsTemplateRecord } from '../types';

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

export async function connectSmsGateway(params: {
  deviceId: string;
  apiKey: string;
  clinicName?: string;
  clinicPhone?: string;
  doctorName?: string;
  defaultReminderTiming?: string;
}) {
  const res = await fetch('/api/sms/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to connect SMS gateway');
  }
  return data;
}

export async function disconnectSmsGateway() {
  const res = await fetch('/api/sms/disconnect', {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to disconnect gateway');
  }
  return data;
}

export async function getSmsStatus() {
  const res = await fetch('/api/sms/status');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch status');
  }
  return data;
}

export async function sendTestSms(recipientPhone: string, message?: string) {
  const res = await fetch('/api/sms/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientPhone, message }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send test SMS');
  }
  return data;
}

export async function sendManualSms(params: {
  patientId?: string;
  patientName?: string;
  recipientPhone: string;
  message: string;
  type?: 'Appointment' | 'Follow-up' | 'Manual' | 'Recall' | 'Test';
}) {
  const res = await fetch('/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send SMS');
  }
  return data;
}

export async function getSmsHistory(params?: { status?: string; type?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.type) query.append('type', params.type);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`/api/sms/history?${query.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch SMS history');
  }
  return data;
}

export async function retrySms(logId: string) {
  const res = await fetch('/api/sms/retry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to retry SMS');
  }
  return data;
}

export async function getSmsTemplates(): Promise<SmsTemplateRecord[]> {
  const res = await fetch('/api/sms/templates');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch templates');
  }
  return data.templates || [];
}

export async function saveSmsTemplate(template: Omit<SmsTemplateRecord, 'id'> & { id?: string }) {
  const res = await fetch('/api/sms/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save template');
  }
  return data;
}

export async function deleteSmsTemplate(id: string) {
  const res = await fetch(`/api/sms/templates/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete template');
  }
  return data;
}

export async function getScheduledFollowups() {
  const res = await fetch('/api/sms/followups');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch followups');
  }
  return data.followups || [];
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
  const res = await fetch('/api/sms/followups/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to schedule followup');
  }
  return data;
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
  const res = await fetch('/api/sms/reminders/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to schedule SMS reminder');
  }
  return data;
}

export async function sendFollowupSmsNow(id: string) {
  const res = await fetch(`/api/sms/followups/${id}/send`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send followup SMS');
  }
  return data;
}

export async function syncPatientsToSmsBackend(patients: Patient[]) {
  try {
    const formatted = patients.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      smsConsent: p.smsConsent !== false, // default true
      appointments: (p.appointments || []).map((a) => ({
        id: a.id,
        date: a.date,
        timeSlot: a.timeSlot,
        procedure: a.procedure,
        status: a.status,
        smsReminderEnabled: a.smsReminderEnabled !== false, // default true
        smsReminderTiming: a.smsReminderTiming || '1 day before',
        smsStatus: a.smsStatus || 'Pending',
      })),
    }));

    await fetch('/api/sms/patients/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patients: formatted }),
    });
  } catch (err) {
    console.warn('[SMS Client] Sync patients error:', err);
  }
}

export async function getSmsDashboardData(): Promise<SmsDashboardData> {
  const res = await fetch('/api/sms/dashboard');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch SMS dashboard data');
  }
  return data;
}
