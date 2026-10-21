// ==============================================================================
// Ghar Tak Services (GTS) - Enterprise Cryptographic OTP Verification Engine
// Zero client-side bypasses. Cryptographically secure random tokens.
// Single-use token burning to prevent replay attacks.
// Resilient multi-worker & restart-proof persistence via temp storage & global store.
// ==============================================================================

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface OtpRecord {
  identifier: string; // Normalized phone or lowercase email
  code: string;
  purpose: 'RESET_PASSWORD' | 'REGISTER' | 'LOGIN' | 'GENERAL';
  expiresAt: number;
  attempts: number;
}

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes validity
const MAX_ATTEMPTS = 5;
const OTP_STORAGE_FILE = path.join(os.tmpdir(), 'ghartak_active_otps.json');

/**
 * Loads unexpired persisted OTP records from disk across worker processes or restarts.
 */
function loadPersistedOtps(): Map<string, OtpRecord> {
  const map = new Map<string, OtpRecord>();
  try {
    if (fs.existsSync(OTP_STORAGE_FILE)) {
      const data = fs.readFileSync(OTP_STORAGE_FILE, 'utf-8');
      const parsed: Record<string, OtpRecord> = JSON.parse(data);
      const now = Date.now();
      for (const [key, val] of Object.entries(parsed)) {
        if (val && typeof val.expiresAt === 'number' && val.expiresAt > now) {
          map.set(key, val);
        }
      }
    }
  } catch {
    // Non-blocking fallback to in-memory store
  }
  return map;
}

/**
 * Synchronously flushes active unexpired OTP records to disk.
 */
function persistOtps(store: Map<string, OtpRecord>) {
  try {
    const obj: Record<string, OtpRecord> = {};
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (v.expiresAt > now) {
        obj[k] = v;
      }
    }
    fs.writeFileSync(OTP_STORAGE_FILE, JSON.stringify(obj), 'utf-8');
  } catch {
    // Non-blocking fallback
  }
}

// Preserve store across Next.js dev server hot module reloading and serverless invocations
const globalForOtp = globalThis as unknown as {
  __gharTakOtpStore?: Map<string, OtpRecord>;
};

const otpStore: Map<string, OtpRecord> =
  globalForOtp.__gharTakOtpStore || loadPersistedOtps();
globalForOtp.__gharTakOtpStore = otpStore;

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
  const record: OtpRecord = {
    identifier: cleanId,
    code,
    purpose,
    expiresAt: expiresAtMs,
    attempts: 0,
  };

  otpStore.set(key, record);
  persistOtps(otpStore);

  return {
    code,
    expiresAt: new Date(expiresAtMs),
  };
}

/**
 * Validates a submitted OTP against the cryptographically stored challenge.
 * Enforces TTL, attempt limits, cross-worker syncing, and burns the OTP immediately on success.
 */
export function verifyOtp(
  identifier: string,
  submittedCode: string,
  purpose: 'RESET_PASSWORD' | 'REGISTER' | 'LOGIN' | 'GENERAL' = 'GENERAL'
): { valid: boolean; reason?: string } {
  const cleanId = normalizeIdentifier(identifier);
  const key = `${cleanId}:${purpose}`;

  // If not found in local memory, attempt sync from persistent store for multi-worker support
  let record = otpStore.get(key) || otpStore.get(`${cleanId}:GENERAL`);
  if (!record) {
    const refreshed = loadPersistedOtps();
    record = refreshed.get(key) || refreshed.get(`${cleanId}:GENERAL`);
    if (record) {
      otpStore.set(key, record);
    }
  }

  if (!record) {
    return {
      valid: false,
      reason: 'No active verification code found for this address. Please request a new code.',
    };
  }

  // Check TTL expiration
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    otpStore.delete(`${cleanId}:GENERAL`);
    persistOtps(otpStore);
    return {
      valid: false,
      reason: 'Verification code has expired (valid for 5 minutes). Please request a new code.',
    };
  }

  // Check rate-limiting / brute force protection
  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(key);
    otpStore.delete(`${cleanId}:GENERAL`);
    persistOtps(otpStore);
    return {
      valid: false,
      reason: 'Too many incorrect attempts. For security, this code has been invalidated. Please request a new code.',
    };
  }

  // Constant-time comparison to prevent timing attacks
  const expectedBuffer = Buffer.from(record.code);
  const submittedBuffer = Buffer.from(submittedCode.trim());

  if (expectedBuffer.length !== submittedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, submittedBuffer)) {
    persistOtps(otpStore);
    return {
      valid: false,
      reason: `Incorrect verification code. ${MAX_ATTEMPTS - record.attempts} attempts remaining.`,
    };
  }

  // Token verified: burn immediately (Single-use token to prevent replay attacks)
  otpStore.delete(key);
  otpStore.delete(`${cleanId}:GENERAL`);
  persistOtps(otpStore);
  return { valid: true };
}
