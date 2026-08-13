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
 * Endpoint: POST https://api.textbee.dev/api/v1/gateway/devices/{DEVICE_ID}/send-sms
 * Header: x-api-key: {API_KEY}
 * Body: { "recipients": ["+91XXXXXXXXXX"], "message": "string" }
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

  const url = `https://api.textbee.dev/api/v1/gateway/devices/${encodeURIComponent(deviceId.trim())}/send-sms`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
      },
      body: JSON.stringify({
        recipients: [normalizedPhone],
        message: message.trim(),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg =
        data?.message ||
        data?.error ||
        `TextBee Gateway HTTP error ${response.status}: ${response.statusText}`;
      return {
        success: false,
        error: errMsg,
        rawResponse: data,
      };
    }

    return {
      success: true,
      messageId: data?.data?.id || data?.id || `tb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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

  try {
    // Ping device info endpoint or devices endpoint if supported by TextBee
    const url = `https://api.textbee.dev/api/v1/gateway/devices/${encodeURIComponent(deviceId.trim())}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey.trim(),
      },
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        isOnline: true,
        deviceName: data?.data?.name || data?.name || 'TextBee Android Gateway',
      };
    }

    // If device info endpoint returns 404/not implemented, credentials are still valid if status != 401
    if (response.status === 401 || response.status === 403) {
      return { isOnline: false, error: 'Invalid TextBee API Key or unauthorized' };
    }

    // If status 200/404 assume device exists and credential is valid
    return { isOnline: true, deviceName: 'Registered Android Phone' };
  } catch (err: any) {
    return { isOnline: false, error: err.message || 'Unable to ping TextBee service' };
  }
}
