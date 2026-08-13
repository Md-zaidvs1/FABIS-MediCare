import fs from 'fs';
import path from 'path';

export interface SmsSettings {
  deviceId: string;
  apiKey: string; // Server secret - masked on client responses
  connected: boolean;
  deviceName: string;
  lastCheckedAt?: string;
  clinicName: string;
  clinicPhone: string;
  doctorName: string;
  defaultReminderTiming: '1 day before' | '2 days before' | 'Same day' | 'Custom';
  smsEnabled: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface SmsLog {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  followupId?: string;
  recipient: string;
  message: string;
  type: 'Appointment' | 'Follow-up' | 'Manual' | 'Test' | 'Recall';
  status: 'Pending' | 'Sending' | 'Sent' | 'Failed';
  textbeeMessageId?: string;
  error?: string;
  sentAt?: string;
  createdAt: string;
  uniqueDedupeKey?: string;
}

export interface SmsTemplate {
  id: string;
  title: string;
  category: 'Appointment Reminder' | 'Follow-up Reminder' | 'Treatment Follow-up' | 'Dental Recall' | 'Missed Appointment' | 'Custom Message';
  body: string;
  isDefault?: boolean;
}

export interface ScheduledFollowUp {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  appointmentId?: string;
  followupType: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string;
  smsEnabled: boolean;
  smsStatus: 'Pending' | 'Sent' | 'Failed' | 'Gateway Unavailable';
  message: string;
  error?: string;
  sentAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface SyncedPatientRecord {
  id: string;
  name: string;
  phone: string;
  smsConsent: boolean;
  appointments: {
    id: string;
    date: string;
    timeSlot: string;
    procedure: string;
    status: string;
    smsReminderEnabled?: boolean;
    smsReminderTiming?: string;
    smsStatus?: string;
  }[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'sms_store.json');

const DEFAULT_TEMPLATES: SmsTemplate[] = [
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

const getEnvDeviceId = () => process.env.TEXTBEE_DEVICE_ID || process.env.VITE_TEXTBEE_DEVICE_ID || '';
const getEnvApiKey = () => process.env.TEXTBEE_API_KEY || process.env.VITE_TEXTBEE_API_KEY || '';

const DEFAULT_SETTINGS: SmsSettings = {
  deviceId: getEnvDeviceId(),
  apiKey: getEnvApiKey(),
  connected: Boolean(getEnvDeviceId() && getEnvApiKey()),
  deviceName: getEnvDeviceId() && getEnvApiKey() ? 'TextBee Android Gateway (Env Configured)' : '',
  clinicName: 'RK Dental Clinic',
  clinicPhone: '+91 9876543210',
  doctorName: 'Dr. Alex Mercer',
  defaultReminderTiming: '1 day before',
  smsEnabled: true,
  dailyLimit: 50,
  monthlyLimit: 300,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface SmsStoreData {
  settings: SmsSettings;
  logs: SmsLog[];
  templates: SmsTemplate[];
  followups: ScheduledFollowUp[];
  syncedPatients: SyncedPatientRecord[];
}

class SmsStore {
  private data: SmsStoreData;

  constructor() {
    this.data = {
      settings: { ...DEFAULT_SETTINGS },
      logs: [],
      templates: [...DEFAULT_TEMPLATES],
      followups: [],
      syncedPatients: [],
    };
    this.loadStore();
  }

  private loadStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_FILE)) {
        const fileContent = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        const loadedSettings = parsed.settings || {};

        const deviceId = loadedSettings.deviceId || getEnvDeviceId();
        const apiKey = loadedSettings.apiKey || getEnvApiKey();
        const connected = loadedSettings.connected !== undefined ? loadedSettings.connected : Boolean(deviceId && apiKey);

        this.data = {
          settings: {
            ...DEFAULT_SETTINGS,
            ...loadedSettings,
            deviceId,
            apiKey,
            connected,
            deviceName: loadedSettings.deviceName || (deviceId && apiKey ? 'TextBee Android Gateway' : ''),
          },
          logs: parsed.logs || [],
          templates: parsed.templates && parsed.templates.length > 0 ? parsed.templates : [...DEFAULT_TEMPLATES],
          followups: parsed.followups || [],
          syncedPatients: parsed.syncedPatients || [],
        };
      } else {
        this.saveStore();
      }
    } catch (err) {
      console.error('[SMS Store] Error loading store file:', err);
    }
  }

  private saveStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SMS Store] Error writing store file:', err);
    }
  }

  public getSettings(): SmsSettings {
    return { ...this.data.settings };
  }

  public getPublicSettings() {
    const s = this.getSettings();
    return {
      deviceId: s.deviceId,
      hasApiKey: Boolean(s.apiKey && s.apiKey.trim().length > 0),
      maskedApiKey: s.apiKey ? `${s.apiKey.slice(0, 3)}••••••••${s.apiKey.slice(-3)}` : '',
      connected: s.connected,
      deviceName: s.deviceName,
      lastCheckedAt: s.lastCheckedAt,
      clinicName: s.clinicName,
      clinicPhone: s.clinicPhone,
      doctorName: s.doctorName,
      defaultReminderTiming: s.defaultReminderTiming,
      smsEnabled: s.smsEnabled,
      dailyLimit: s.dailyLimit,
      monthlyLimit: s.monthlyLimit,
    };
  }

  public updateSettings(partial: Partial<SmsSettings>) {
    this.data.settings = {
      ...this.data.settings,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.saveStore();
    return this.getSettings();
  }

  public addLog(logData: Omit<SmsLog, 'id' | 'createdAt'>): SmsLog {
    const newLog: SmsLog = {
      ...logData,
      id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.logs.unshift(newLog); // latest first
    // Limit logs in file to last 1000 items
    if (this.data.logs.length > 1000) {
      this.data.logs = this.data.logs.slice(0, 1000);
    }
    this.saveStore();
    return newLog;
  }

  public updateLog(id: string, partial: Partial<SmsLog>) {
    const idx = this.data.logs.findIndex((l) => l.id === id);
    if (idx !== -1) {
      this.data.logs[idx] = { ...this.data.logs[idx], ...partial };
      this.saveStore();
      return this.data.logs[idx];
    }
    return null;
  }

  public getLogs(filter?: { status?: string; type?: string; search?: string }): SmsLog[] {
    let list = [...this.data.logs];

    if (filter?.status && filter.status !== 'All') {
      list = list.filter((l) => l.status.toLowerCase() === filter.status!.toLowerCase());
    }

    if (filter?.type && filter.type !== 'All') {
      list = list.filter((l) => l.type.toLowerCase() === filter.type!.toLowerCase());
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.patientName.toLowerCase().includes(q) ||
          l.recipient.includes(q) ||
          l.message.toLowerCase().includes(q)
      );
    }

    return list;
  }

  public hasAlreadySent(uniqueDedupeKey: string): boolean {
    if (!uniqueDedupeKey) return false;
    return this.data.logs.some(
      (l) => l.uniqueDedupeKey === uniqueDedupeKey && l.status === 'Sent'
    );
  }

  public getTemplates(): SmsTemplate[] {
    return [...this.data.templates];
  }

  public saveTemplate(template: SmsTemplate): SmsTemplate[] {
    const idx = this.data.templates.findIndex((t) => t.id === template.id);
    if (idx !== -1) {
      this.data.templates[idx] = template;
    } else {
      this.data.templates.push(template);
    }
    this.saveStore();
    return this.getTemplates();
  }

  public deleteTemplate(id: string): SmsTemplate[] {
    this.data.templates = this.data.templates.filter((t) => t.id !== id);
    this.saveStore();
    return this.getTemplates();
  }

  public getFollowups(): ScheduledFollowUp[] {
    return [...this.data.followups];
  }

  public saveFollowup(followupData: Omit<ScheduledFollowUp, 'id' | 'createdAt'> & { id?: string }): ScheduledFollowUp {
    let item: ScheduledFollowUp;
    if (followupData.id) {
      const idx = this.data.followups.findIndex((f) => f.id === followupData.id);
      if (idx !== -1) {
        this.data.followups[idx] = { ...this.data.followups[idx], ...followupData };
        item = this.data.followups[idx];
      } else {
        item = {
          ...followupData,
          id: followupData.id,
          createdAt: new Date().toISOString(),
        };
        this.data.followups.unshift(item);
      }
    } else {
      item = {
        ...followupData,
        id: `fu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      this.data.followups.unshift(item);
    }
    this.saveStore();
    return item;
  }

  public updateFollowupStatus(id: string, status: ScheduledFollowUp['smsStatus'], error?: string) {
    const idx = this.data.followups.findIndex((f) => f.id === id);
    if (idx !== -1) {
      this.data.followups[idx].smsStatus = status;
      if (status === 'Sent') {
        this.data.followups[idx].sentAt = new Date().toISOString();
        this.data.followups[idx].completedAt = new Date().toISOString();
      }
      if (error) {
        this.data.followups[idx].error = error;
      }
      this.saveStore();
      return this.data.followups[idx];
    }
    return null;
  }

  public syncPatients(patients: SyncedPatientRecord[]) {
    this.data.syncedPatients = patients;
    this.saveStore();
  }

  public getSyncedPatients(): SyncedPatientRecord[] {
    return [...this.data.syncedPatients];
  }

  public getTodayCounts() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = this.data.logs.filter((l) => l.createdAt.startsWith(todayStr));

    const sent = todayLogs.filter((l) => l.status === 'Sent').length;
    const failed = todayLogs.filter((l) => l.status === 'Failed').length;
    const pending = todayLogs.filter((l) => l.status === 'Pending' || l.status === 'Sending').length;

    // Monthly sent count
    const monthStr = todayStr.substring(0, 7);
    const monthlySent = this.data.logs.filter(
      (l) => l.createdAt.startsWith(monthStr) && l.status === 'Sent'
    ).length;

    return {
      todayTotal: todayLogs.length,
      todaySent: sent,
      todayFailed: failed,
      todayPending: pending,
      monthlySent,
    };
  }
}

export const smsStore = new SmsStore();
