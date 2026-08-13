import { smsStore } from './smsStore.js';
import { sendTextBeeSms, normalizePhoneNumber } from './textbeeService.js';

let schedulerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

/**
 * Replaces dynamic placeholders in SMS template string
 */
export function formatSmsMessage(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, val || '');
  }
  return result;
}

/**
 * Runs one check tick for pending SMS (appointment reminders & scheduled followups)
 */
export async function processPendingSmsQueue(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  if (isProcessing) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  isProcessing = true;
  let sentCount = 0;
  let failedCount = 0;
  let totalProcessed = 0;

  try {
    const settings = smsStore.getSettings();

    // If master SMS setting is OFF or gateway not connected, return early
    if (!settings.smsEnabled) {
      isProcessing = false;
      return { processed: 0, sent: 0, failed: 0 };
    }

    if (!settings.connected || !settings.deviceId || !settings.apiKey) {
      // Gateway unavailable - mark any newly created pending items as Gateway Unavailable
      const followups = smsStore.getFollowups();
      const todayIso = new Date().toISOString().split('T')[0];
      for (const fu of followups) {
        if (fu.scheduledDate <= todayIso && fu.smsStatus === 'Pending') {
          smsStore.updateFollowupStatus(fu.id, 'Gateway Unavailable', 'SMS Gateway is disconnected in Settings.');
        }
      }
      isProcessing = false;
      return { processed: 0, sent: 0, failed: 0 };
    }

    const todayIso = new Date().toISOString().split('T')[0];

    // 1. Process Scheduled Follow-Up Tasks
    const followups = smsStore.getFollowups();
    const pendingFollowups = followups.filter(
      (fu) => fu.smsEnabled && fu.scheduledDate <= todayIso && fu.smsStatus === 'Pending'
    );

    for (const fu of pendingFollowups) {
      totalProcessed++;
      const dedupeKey = `FU_${fu.patientId}_${fu.id}_${fu.scheduledDate}`;

      if (smsStore.hasAlreadySent(dedupeKey)) {
        smsStore.updateFollowupStatus(fu.id, 'Sent');
        continue;
      }

      const log = smsStore.addLog({
        patientId: fu.patientId,
        patientName: fu.patientName,
        followupId: fu.id,
        recipient: normalizePhoneNumber(fu.patientPhone),
        message: fu.message,
        type: 'Follow-up',
        status: 'Sending',
        uniqueDedupeKey: dedupeKey,
      });

      const res = await sendTextBeeSms({
        deviceId: settings.deviceId,
        apiKey: settings.apiKey,
        recipientPhone: fu.patientPhone,
        message: fu.message,
      });

      if (res.success) {
        sentCount++;
        smsStore.updateLog(log.id, {
          status: 'Sent',
          sentAt: new Date().toISOString(),
          textbeeMessageId: res.messageId,
        });
        smsStore.updateFollowupStatus(fu.id, 'Sent');
      } else {
        failedCount++;
        smsStore.updateLog(log.id, {
          status: 'Failed',
          error: res.error,
        });
        smsStore.updateFollowupStatus(fu.id, 'Failed', res.error);
      }
    }

    // 2. Process Synced Appointments requiring reminders
    const syncedPatients = smsStore.getSyncedPatients();
    for (const patient of syncedPatients) {
      if (patient.smsConsent === false) continue; // Skip patients with consent disabled

      for (const apt of patient.appointments || []) {
        if (!apt.smsReminderEnabled || apt.status === 'Cancelled' || apt.status === 'Completed') {
          continue;
        }

        // Determine if reminder is due today
        let isDue = false;
        const timing = apt.smsReminderTiming || settings.defaultReminderTiming || '1 day before';

        if (timing === 'Same day' && apt.date === todayIso) {
          isDue = true;
        } else if (timing === '1 day before') {
          const aptDateObj = new Date(apt.date);
          aptDateObj.setDate(aptDateObj.getDate() - 1);
          const reminderDateStr = aptDateObj.toISOString().split('T')[0];
          if (reminderDateStr === todayIso || (reminderDateStr < todayIso && apt.date >= todayIso)) {
            isDue = true;
          }
        } else if (timing === '2 days before') {
          const aptDateObj = new Date(apt.date);
          aptDateObj.setDate(aptDateObj.getDate() - 2);
          const reminderDateStr = aptDateObj.toISOString().split('T')[0];
          if (reminderDateStr === todayIso || (reminderDateStr < todayIso && apt.date >= todayIso)) {
            isDue = true;
          }
        } else if (apt.date === todayIso) {
          isDue = true;
        }

        if (!isDue) continue;

        const dedupeKey = `APT_${patient.id}_${apt.id}_Reminder_${apt.date}`;
        if (smsStore.hasAlreadySent(dedupeKey)) continue;

        // Build reminder message using template
        const templates = smsStore.getTemplates();
        const reminderTpl =
          templates.find((t) => t.category === 'Appointment Reminder')?.body ||
          'Dear {{patient_name}}, this is a reminder from {{clinic_name}}. Your appointment is on {{appointment_date}} at {{appointment_time}}. Thank you.';

        const messageText = formatSmsMessage(reminderTpl, {
          patient_name: patient.name,
          clinic_name: settings.clinicName,
          doctor_name: settings.doctorName,
          appointment_date: apt.date,
          appointment_time: apt.timeSlot,
          clinic_phone: settings.clinicPhone,
        });

        totalProcessed++;

        const log = smsStore.addLog({
          patientId: patient.id,
          patientName: patient.name,
          appointmentId: apt.id,
          recipient: normalizePhoneNumber(patient.phone),
          message: messageText,
          type: 'Appointment',
          status: 'Sending',
          uniqueDedupeKey: dedupeKey,
        });

        const res = await sendTextBeeSms({
          deviceId: settings.deviceId,
          apiKey: settings.apiKey,
          recipientPhone: patient.phone,
          message: messageText,
        });

        if (res.success) {
          sentCount++;
          smsStore.updateLog(log.id, {
            status: 'Sent',
            sentAt: new Date().toISOString(),
            textbeeMessageId: res.messageId,
          });
        } else {
          failedCount++;
          smsStore.updateLog(log.id, {
            status: 'Failed',
            error: res.error,
          });
        }
      }
    }
  } catch (err: any) {
    console.error('[SMS Scheduler] Queue processing error:', err);
  } finally {
    isProcessing = false;
  }

  return { processed: totalProcessed, sent: sentCount, failed: failedCount };
}

/**
 * Starts the background SMS scheduler loop
 */
export function startSmsScheduler(intervalMs = 60000) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  console.log(`[SMS Scheduler] Starting background SMS scheduler (Interval: ${intervalMs}ms)...`);
  
  // Run immediately on boot
  processPendingSmsQueue();

  schedulerInterval = setInterval(() => {
    processPendingSmsQueue();
  }, intervalMs);
}

/**
 * Stops the background SMS scheduler
 */
export function stopSmsScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[SMS Scheduler] Stopped background SMS scheduler.');
  }
}
