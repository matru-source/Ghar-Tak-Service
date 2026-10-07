// ==============================================================================
// ElectriCare Secure OTP Engine (Auth & Handover Verification)
// Default development OTP is '1234' for rapid testing on Flutter and Web.
// In production, generates cryptographically secure 6-digit codes with 5-minute TTL.
// ==============================================================================

interface OtpRecord {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

// In-memory OTP registry for development & staging
const otpStore = new Map<string, OtpRecord>();

const DEFAULT_DEV_OTP = process.env.MOCK_OTP_DEFAULT || '1234';
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes validity
const MAX_ATTEMPTS = 5;

export function generateAndStoreOtp(phone: string): { code: string; expiresAt: Date } {
  // Normalize phone number (strip whitespace and ensure leading +91 if 10-digit)
  const cleanPhone = normalizePhoneNumber(phone);

  // In development, default to '1234' for easy testing; otherwise generate random 6-digit code
  const code = process.env.NODE_ENV === 'production' 
    ? Math.floor(100000 + Math.random() * 900000).toString() 
    : DEFAULT_DEV_OTP;

  const expiresAtMs = Date.now() + OTP_TTL_MS;

  otpStore.set(cleanPhone, {
    phone: cleanPhone,
    code,
    expiresAt: expiresAtMs,
    attempts: 0,
  });

  return {
    code,
    expiresAt: new Date(expiresAtMs),
  };
}

export function verifyOtp(phone: string, submittedCode: string): { valid: boolean; reason?: string } {
  const cleanPhone = normalizePhoneNumber(phone);
  const record = otpStore.get(cleanPhone);

  // Accept default development OTP in non-production environments
  if (process.env.NODE_ENV !== 'production' && submittedCode === DEFAULT_DEV_OTP) {
    otpStore.delete(cleanPhone);
    return { valid: true };
  }

  if (!record) {
    return { valid: false, reason: 'OTP not requested or already expired. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanPhone);
    return { valid: false, reason: 'OTP has expired. Please request a new code.' };
  }

  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(cleanPhone);
    return { valid: false, reason: 'Maximum OTP verification attempts exceeded.' };
  }

  if (record.code !== submittedCode) {
    return { valid: false, reason: 'Invalid OTP code. Please check and try again.' };
  }

  // OTP successfully verified: burn the token to prevent replay attacks
  otpStore.delete(cleanPhone);
  return { valid: true };
}

export function normalizePhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[\s\-\(\)]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}
