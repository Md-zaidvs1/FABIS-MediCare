import { Router, Request, Response } from 'express';
import { smsStore } from './smsStore.js';
import { sendTextBeeSms, checkTextBeeDeviceHealth, normalizePhoneNumber } from './textbeeService.js';
import { processPendingSmsQueue } from './smsScheduler.js';

export const smsRouter = Router();

// 1. CONNECT GATEWAY
smsRouter.post('/connect', async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId, apiKey, clinicName, clinicPhone, doctorName, defaultReminderTiming } = req.body;

    if (!deviceId || !deviceId.trim()) {
      res.status(400).json({ success: false, error: 'TextBee Device ID is required' });
      return;
    }

    if (!apiKey || !apiKey.trim()) {
      res.status(400).json({ success: false, error: 'TextBee API Key is required' });
      return;
    }

    // Ping device API to check validity
    const health = await checkTextBeeDeviceHealth({ deviceId, apiKey });

    if (!health.isOnline && health.error?.includes('Unauthorized')) {
      res.status(401).json({ success: false, error: 'Invalid TextBee API Key or Device Unauthorized' });
      return;
    }

    // Save configuration securely on backend
    const updated = smsStore.updateSettings({
      deviceId: deviceId.trim(),
      apiKey: apiKey.trim(),
      connected: true,
      deviceName: health.deviceName || 'TextBee Android Gateway',
      lastCheckedAt: new Date().toISOString(),
      ...(clinicName ? { clinicName } : {}),
      ...(clinicPhone ? { clinicPhone } : {}),
      ...(doctorName ? { doctorName } : {}),
      ...(defaultReminderTiming ? { defaultReminderTiming } : {}),
    });

    res.json({
      success: true,
      message: 'TextBee Android SMS Gateway connected successfully!',
      settings: smsStore.getPublicSettings(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to connect TextBee gateway' });
  }
});

// 2. DISCONNECT GATEWAY
smsRouter.post('/disconnect', (req: Request, res: Response) => {
  try {
    smsStore.updateSettings({
      connected: false,
      deviceId: '',
      apiKey: '',
      deviceName: '',
    });

    res.json({
      success: true,
      message: 'TextBee SMS Gateway disconnected successfully. Patient logs and data preserved.',
      settings: smsStore.getPublicSettings(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to disconnect gateway' });
  }
});

// 3. GET GATEWAY STATUS & HEALTH
smsRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const settings = smsStore.getSettings();
    const publicSettings = smsStore.getPublicSettings();
    const counts = smsStore.getTodayCounts();

    let healthOnline = false;
    let healthError = '';

    if (settings.connected && settings.deviceId && settings.apiKey) {
      const ping = await checkTextBeeDeviceHealth({
        deviceId: settings.deviceId,
        apiKey: settings.apiKey,
      });
      healthOnline = ping.isOnline;
      healthError = ping.error || '';
      smsStore.updateSettings({ lastCheckedAt: new Date().toISOString() });
    }

    res.json({
      success: true,
      settings: publicSettings,
      health: {
        isOnline: healthOnline,
        error: healthError,
        lastHeartbeat: new Date().toISOString(),
      },
      counts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch status' });
  }
});

// 4. SEND TEST SMS
smsRouter.post('/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientPhone, message } = req.body;
    const settings = smsStore.getSettings();

    if (!settings.connected || !settings.deviceId || !settings.apiKey) {
      res.status(400).json({
        success: false,
        error: 'SMS Gateway is not connected. Please connect your TextBee Android phone first.',
      });
      return;
    }

    if (!recipientPhone || !recipientPhone.trim()) {
      res.status(400).json({ success: false, error: 'Recipient phone number is required' });
      return;
    }

    const testMsg = message?.trim() || `Test SMS from RK Dental Clinic via TextBee Android Gateway (${new Date().toLocaleTimeString()}). System functioning normal.`;

    const normalized = normalizePhoneNumber(recipientPhone);

    const log = smsStore.addLog({
      patientId: 'TEST_PATIENT',
      patientName: 'Test SMS Recipient',
      recipient: normalized,
      message: testMsg,
      type: 'Test',
      status: 'Sending',
    });

    const result = await sendTextBeeSms({
      deviceId: settings.deviceId,
      apiKey: settings.apiKey,
      recipientPhone: normalized,
      message: testMsg,
    });

    if (result.success) {
      smsStore.updateLog(log.id, {
        status: 'Sent',
        sentAt: new Date().toISOString(),
        textbeeMessageId: result.messageId,
      });

      res.json({
        success: true,
        message: `Test SMS sent successfully to ${normalized}!`,
        messageId: result.messageId,
      });
    } else {
      smsStore.updateLog(log.id, {
        status: 'Failed',
        error: result.error,
      });

      res.status(400).json({
        success: false,
        error: result.error || 'Failed to send test SMS via TextBee',
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error processing test SMS' });
  }
});

// 5. SEND DIRECT MANUAL SMS TO PATIENT
smsRouter.post('/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, patientName, recipientPhone, message, type = 'Manual' } = req.body;
    const settings = smsStore.getSettings();

    if (!settings.connected || !settings.deviceId || !settings.apiKey) {
      res.status(400).json({
        success: false,
        error: 'SMS Gateway is not connected. Please connect your TextBee Android phone in Settings.',
      });
      return;
    }

    if (!recipientPhone || !recipientPhone.trim()) {
      res.status(400).json({ success: false, error: 'Patient phone number is required' });
      return;
    }

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, error: 'Message content cannot be empty' });
      return;
    }

    const normalized = normalizePhoneNumber(recipientPhone);

    const log = smsStore.addLog({
      patientId: patientId || 'PAT_UNKNOWN',
      patientName: patientName || 'Patient',
      recipient: normalized,
      message: message.trim(),
      type,
      status: 'Sending',
    });

    const result = await sendTextBeeSms({
      deviceId: settings.deviceId,
      apiKey: settings.apiKey,
      recipientPhone: normalized,
      message: message.trim(),
    });

    if (result.success) {
      smsStore.updateLog(log.id, {
        status: 'Sent',
        sentAt: new Date().toISOString(),
        textbeeMessageId: result.messageId,
      });

      res.json({
        success: true,
        message: `SMS sent successfully to ${patientName || normalized}!`,
        logId: log.id,
      });
    } else {
      smsStore.updateLog(log.id, {
        status: 'Failed',
        error: result.error,
      });

      res.status(400).json({
        success: false,
        error: result.error || 'Failed to send SMS',
        logId: log.id,
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error sending SMS' });
  }
});

// 6. GET SMS HISTORY LOGS
smsRouter.get('/history', (req: Request, res: Response) => {
  try {
    const { status, type, search } = req.query;
    const logs = smsStore.getLogs({
      status: status as string,
      type: type as string,
      search: search as string,
    });

    res.json({
      success: true,
      total: logs.length,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch history' });
  }
});

// 7. RETRY FAILED SMS
smsRouter.post('/retry', async (req: Request, res: Response): Promise<void> => {
  try {
    const { logId } = req.body;
    const logs = smsStore.getLogs();
    const existingLog = logs.find((l) => l.id === logId);

    if (!existingLog) {
      res.status(404).json({ success: false, error: 'SMS log record not found' });
      return;
    }

    const settings = smsStore.getSettings();
    if (!settings.connected || !settings.deviceId || !settings.apiKey) {
      res.status(400).json({
        success: false,
        error: 'SMS Gateway is disconnected. Please connect TextBee Android phone first.',
      });
      return;
    }

    smsStore.updateLog(logId, { status: 'Sending', error: undefined });

    const result = await sendTextBeeSms({
      deviceId: settings.deviceId,
      apiKey: settings.apiKey,
      recipientPhone: existingLog.recipient,
      message: existingLog.message,
    });

    if (result.success) {
      smsStore.updateLog(logId, {
        status: 'Sent',
        sentAt: new Date().toISOString(),
        textbeeMessageId: result.messageId,
      });

      res.json({
        success: true,
        message: 'SMS retried and sent successfully!',
      });
    } else {
      smsStore.updateLog(logId, {
        status: 'Failed',
        error: result.error,
      });

      res.status(400).json({
        success: false,
        error: result.error || 'Retry failed',
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to retry SMS' });
  }
});

// 8. TEMPLATES CRUD
smsRouter.get('/templates', (req: Request, res: Response) => {
  res.json({ success: true, templates: smsStore.getTemplates() });
});

smsRouter.post('/templates', (req: Request, res: Response) => {
  try {
    const { id, title, category, body } = req.body;
    if (!title || !category || !body) {
      res.status(400).json({ success: false, error: 'Title, category, and body are required' });
      return;
    }

    const updated = smsStore.saveTemplate({
      id: id || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      category,
      body,
    });

    res.json({ success: true, templates: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save template' });
  }
});

smsRouter.delete('/templates/:id', (req: Request, res: Response) => {
  try {
    const updated = smsStore.deleteTemplate(req.params.id);
    res.json({ success: true, templates: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to delete template' });
  }
});

// 9. SCHEDULED FOLLOW-UPS
smsRouter.get('/followups', (req: Request, res: Response) => {
  res.json({ success: true, followups: smsStore.getFollowups() });
});

smsRouter.post('/followups/schedule', (req: Request, res: Response) => {
  try {
    const { id, patientId, patientName, patientPhone, followupType, scheduledDate, message } = req.body;

    if (!patientId || !patientPhone || !scheduledDate || !message) {
      res.status(400).json({ success: false, error: 'Patient ID, Phone, Scheduled Date, and Message are required' });
      return;
    }

    const followup = smsStore.saveFollowup({
      id,
      patientId,
      patientName: patientName || 'Patient',
      patientPhone: normalizePhoneNumber(patientPhone),
      followupType: followupType || 'Dental Review',
      scheduledDate,
      smsEnabled: true,
      smsStatus: 'Pending',
      message,
    });

    res.json({
      success: true,
      message: 'Follow-up SMS scheduled successfully!',
      followup,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to schedule follow-up' });
  }
});

// MANUALLY SEND FOLLOW-UP IMMEDIATELY
smsRouter.post('/followups/:id/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const followups = smsStore.getFollowups();
    const item = followups.find((f) => f.id === req.params.id);

    if (!item) {
      res.status(404).json({ success: false, error: 'Follow-up task not found' });
      return;
    }

    const settings = smsStore.getSettings();
    if (!settings.connected || !settings.deviceId || !settings.apiKey) {
      res.status(400).json({
        success: false,
        error: 'SMS Gateway is not connected. Please connect your TextBee Android phone in Settings.',
      });
      return;
    }

    const result = await sendTextBeeSms({
      deviceId: settings.deviceId,
      apiKey: settings.apiKey,
      recipientPhone: item.patientPhone,
      message: item.message,
    });

    if (result.success) {
      smsStore.updateFollowupStatus(item.id, 'Sent');
      smsStore.addLog({
        patientId: item.patientId,
        patientName: item.patientName,
        followupId: item.id,
        recipient: item.patientPhone,
        message: item.message,
        type: 'Follow-up',
        status: 'Sent',
        textbeeMessageId: result.messageId,
        sentAt: new Date().toISOString(),
      });

      res.json({ success: true, message: `Follow-up SMS sent successfully to ${item.patientName}!` });
    } else {
      smsStore.updateFollowupStatus(item.id, 'Failed', result.error);
      smsStore.addLog({
        patientId: item.patientId,
        patientName: item.patientName,
        followupId: item.id,
        recipient: item.patientPhone,
        message: item.message,
        type: 'Follow-up',
        status: 'Failed',
        error: result.error,
      });

      res.status(400).json({ success: false, error: result.error || 'Failed to send follow-up SMS' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to send follow-up SMS' });
  }
});

// 10. SYNC PATIENTS FROM CLIENT TO SERVER
smsRouter.post('/patients/sync', (req: Request, res: Response) => {
  try {
    const { patients } = req.body;
    if (Array.isArray(patients)) {
      smsStore.syncPatients(patients);
      // Trigger instant processing check
      processPendingSmsQueue();
    }
    res.json({ success: true, message: 'Patients synced to SMS backend engine successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to sync patients' });
  }
});

// 11. DASHBOARD METRICS
smsRouter.get('/dashboard', (req: Request, res: Response) => {
  try {
    const settings = smsStore.getSettings();
    const counts = smsStore.getTodayCounts();
    const recentLogs = smsStore.getLogs().slice(0, 10);
    const followups = smsStore.getFollowups();

    const todayIso = new Date().toISOString().split('T')[0];
    const todayFollowups = followups.filter((f) => f.scheduledDate === todayIso);
    const upcomingReminders = followups.filter((f) => f.scheduledDate > todayIso && f.smsStatus === 'Pending');

    res.json({
      success: true,
      gateway: smsStore.getPublicSettings(),
      counts,
      recentLogs,
      todayFollowupsCount: todayFollowups.length,
      upcomingRemindersCount: upcomingReminders.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch dashboard metrics' });
  }
});

// 12. SCHEDULE APPOINTMENT REMINDER
smsRouter.post('/reminders/schedule', (req: Request, res: Response) => {
  try {
    const { appointmentId, patientId, patientName, patientPhone, appointmentDate, appointmentTime, procedure, chair } = req.body;

    if (!patientPhone || !appointmentDate || !appointmentTime) {
      res.status(400).json({ success: false, error: 'Phone, Appointment Date, and Time are required' });
      return;
    }

    const settings = smsStore.getSettings();
    const clinicName = settings.clinicName || 'RK Dental Clinic';
    const doctorName = settings.doctorName || 'Dr. Fabis (BDS, MDS)';
    const normPhone = normalizePhoneNumber(patientPhone);

    const message = `Hello ${patientName || 'Patient'}, appointment reminder at ${clinicName}: Date ${appointmentDate} at ${appointmentTime} (${procedure || 'Dental Consultation'}) with ${doctorName}. Chair: ${chair || 'Main Operatory'}. Pls call clinic if need to reschedule.`;

    const followup = smsStore.saveFollowup({
      patientId: patientId || `P-${Date.now()}`,
      patientName: patientName || 'Patient',
      patientPhone: normPhone,
      followupType: 'Appointment Reminder',
      scheduledDate: appointmentDate,
      smsEnabled: true,
      smsStatus: 'Pending',
      message,
    });

    smsStore.syncPatients([
      {
        id: patientId || `P-${Date.now()}`,
        name: patientName || 'Patient',
        phone: normPhone,
        smsConsent: true,
        appointments: [
          {
            id: appointmentId || `APT-${Date.now()}`,
            date: appointmentDate,
            timeSlot: appointmentTime,
            procedure: procedure || 'Consultation',
            status: 'Scheduled',
            smsReminderEnabled: true,
            smsReminderTiming: '1 day before',
            smsStatus: 'Pending',
          },
        ],
      },
    ]);

    processPendingSmsQueue();

    res.json({ success: true, message: 'SMS reminder scheduled successfully', followup });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to schedule reminder' });
  }
});
