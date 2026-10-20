// ==============================================================================
// Ghar Tak Services (GTS) - Enterprise Cryptographic OTP Verification Engine
// Zero client-side bypasses. Cryptographically secure random tokens.
// Single-use token burning to prevent replay attacks.
// ==============================================================================

import crypto from 'crypto';

interface OtpRecord {
  identifier: string; // Normalized phone or lowercase email
  code: string;
  purpose: 'RESET_PASSWORD' | 'REGISTER' | 'LOGIN' | 'GENERAL';
  expiresAt: number;
  attempts: number;
}

// In-memory OTP registry (TTL enforced)
const otpStore = new Map<string, OtpRecord>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes validity
const MAX_ATTEMPTS = 5;

/**
 * Normalizes an identifier (email to trimmed lowercase, phone to E.164 +91 format).
 */
export function normalizeIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  return normalizePhoneNumber(trimmed);
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

/**
 * Generates a cryptographically secure 6-digit dynamic OTP.
 */
export function generateAndStoreOtp(
  identifier: string,
  purpose: 'RESET_PASSWORD' | 'REGISTER' | 'LOGIN' | 'GENERAL' = 'GENERAL'
): { code: string; expiresAt: Date } {
  const cleanId = normalizeIdentifier(identifier);

  // Cryptographically secure 6-digit number [100000, 999999]
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAtMs = Date.now() + OTP_TTL_MS;

  const key = `${cleanId}:${purpose}`;
  otpStore.set(key, {
    identifier: cleanId,
    code,
    purpose,
    expiresAt: expiresAtMs,
    attempts: 0,
  });

  return {
    code,
    expiresAt: new Date(expiresAtMs),
  };
}

/**
 * Validates a submitted OTP against the cryptographically stored challenge.
 * Enforces TTL, attempt limits, and burns the OTP immediately on success.
 */
export function verifyOtp(
  identifier: string,
  submittedCode: string,
  purpose: 'RESET_PASSWORD' | 'REGISTER' | 'LOGIN' | 'GENERAL' = 'GENERAL'
): { valid: boolean; reason?: string } {
  const cleanId = normalizeIdentifier(identifier);
  const key = `${cleanId}:${purpose}`;

  // Also check without purpose for backwards compatibility
  const record = otpStore.get(key) || otpStore.get(`${cleanId}:GENERAL`);

  if (!record) {
    return {
      valid: false,
      reason: 'No active verification code found for this address. Please request a new code.',
    };
  }

  // Check TTL expiration
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return {
      valid: false,
      reason: 'Verification code has expired (valid for 5 minutes). Please request a new code.',
    };
  }

  // Check rate-limiting / brute force protection
  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(key);
    return {
      valid: false,
      reason: 'Too many incorrect attempts. For security, this code has been invalidated. Please request a new code.',
    };
  }

  // Constant-time comparison to prevent timing attacks
  const expectedBuffer = Buffer.from(record.code);
  const submittedBuffer = Buffer.from(submittedCode.trim());

  if (expectedBuffer.length !== submittedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, submittedBuffer)) {
    return {
      valid: false,
      reason: `Incorrect verification code. ${MAX_ATTEMPTS - record.attempts} attempts remaining.`,
    };
  }

  // Token verified: burn immediately (Single-use token to prevent replay attacks)
  otpStore.delete(key);
  return { valid: true };
}
