export interface TextBeeSendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: any;
}

/**
 * Normalizes Indian phone numbers to standard E.164 format (+91XXXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.trim().replace(/[\s\-\(\)]/g, '');
  
  // If number starts with +91, keep it
  if (clean.startsWith('+91')) {
    return clean;
  }
  
  // If starts with 91 and has 12 digits total
  if (clean.startsWith('91') && clean.length === 12) {
    return '+' + clean;
  }
  
  // If it's a 10-digit Indian mobile number starting with 6,7,8,9
  if (/^[6-9]\d{9}$/.test(clean)) {
    return '+91' + clean;
  }
  
  // Default prefix + if missing and looks like E.164
  if (!clean.startsWith('+')) {
    return '+' + clean;
  }
  
  return clean;
}

/**
 * Validates whether a phone number is plausible
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Basic E.164 length check (between 10 and 15 digits excluding +)
  return /^\+\d{10,15}$/.test(normalized);
}

/**
 * Sends SMS via TextBee API REST Gateway
 * Primary endpoint: POST https://api.textbee.dev/api/v1/gateway/send-sms
 * Header: x-api-key: {API_KEY}
 * Body: { "recipients": ["+91XXXXXXXXXX"], "message": "string", "deviceId": "string" }
 * Fallback endpoint: POST https://api.textbee.dev/api/v1/gateway/devices/{DEVICE_ID}/send-sms
 */
export async function sendTextBeeSms(params: {
  deviceId: string;
  apiKey: string;
  recipientPhone: string;
  message: string;
}): Promise<TextBeeSendResponse> {
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
      error: `Invalid recipient phone number format: "${recipientPhone}". Normalized: "${normalizedPhone}". Must be valid E.164 format (e.g. +919876543210).`,
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
      return {
        success: false,
        error: fbError,
        rawResponse: fallbackData,
      };
    }

    const errMsg =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.join(', ') : null) ||
      `TextBee Gateway HTTP error ${response.status}: ${response.statusText}`;
    return {
      success: false,
      error: errMsg,
      rawResponse: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to connect to TextBee API: ${err.message || 'Network error / Gateway unreachable'}`,
    };
  }
}

/**
 * Checks heartbeat / status of TextBee device by sending a dummy validate or querying endpoint if available
 */
export async function checkTextBeeDeviceHealth(params: {
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
    // Ping device info endpoint
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

    return { isOnline: false, error: `TextBee Gateway HTTP ${response.status}` };
  } catch (err: any) {
    return { isOnline: false, error: err.message || 'Unable to ping TextBee service' };
  }
}
