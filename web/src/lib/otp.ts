// ==============================================================================
// Ghar Tak Services (GTS) - Enterprise Cryptographic OTP Verification Engine
// Zero client-side bypasses. Cryptographically secure random tokens.
// Single-use token burning to prevent replay attacks.
// Strict production enforcement: Mock OTP disabled in production.
// Rate limiting: Max 3 tries per 15-minute window with automated lockout.
// Multi-worker & restart-proof persistence via temp storage & global store.
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

interface RateLimitTracker {
  requestTimestamps: number[];
  failedAttempts: number;
  lockedUntil: number;
}

export interface OtpVerificationResult {
  valid: boolean;
  reason?: string;
  isLocked?: boolean;
}

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes validity
const MAX_VERIFY_ATTEMPTS = 3; // Maximum 3 verification attempts per OTP
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15-minute window
const MAX_SEND_PER_WINDOW = 3; // Maximum 3 OTP send requests per 15-minute window
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
  __gharTakOtpRateLimitStore?: Map<string, RateLimitTracker>;
};

const otpStore: Map<string, OtpRecord> =
  globalForOtp.__gharTakOtpStore || loadPersistedOtps();
globalForOtp.__gharTakOtpStore = otpStore;

if (!globalForOtp.__gharTakOtpRateLimitStore) {
  globalForOtp.__gharTakOtpRateLimitStore = new Map<string, RateLimitTracker>();
}
const rateLimitStore: Map<string, RateLimitTracker> = globalForOtp.__gharTakOtpRateLimitStore;

function getRateLimitTracker(identifier: string): RateLimitTracker {
  const cleanId = normalizeIdentifier(identifier);
  let tracker = rateLimitStore.get(cleanId);
  if (!tracker) {
    tracker = {
      requestTimestamps: [],
      failedAttempts: 0,
      lockedUntil: 0,
    };
    rateLimitStore.set(cleanId, tracker);
  }
  return tracker;
}

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
 * Generates a cryptographically secure 6-digit dynamic OTP with 15-min rate limiting.
 */
export function generateAndStoreOtp(
  identifier: string,
  purpose: 'RESET_PASSWORD' | 'REGISTER' | 'LOGIN' | 'GENERAL' = 'GENERAL'
): { code: string; expiresAt: Date } {
  const cleanId = normalizeIdentifier(identifier);
  const now = Date.now();
  const tracker = getRateLimitTracker(cleanId);

  // Check if account is temporarily locked out
  if (now < tracker.lockedUntil) {
    const remainingMin = Math.ceil((tracker.lockedUntil - now) / 60000);
    throw new Error(
      `Account temporarily locked due to excessive failed attempts. Please try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`
    );
  }

  // Rate limit check: max 3 requests per 15 minutes window
  tracker.requestTimestamps = tracker.requestTimestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (tracker.requestTimestamps.length >= MAX_SEND_PER_WINDOW) {
    throw new Error(
      `Rate limit exceeded for ${cleanId}. Maximum 3 verification codes allowed per 15-minute window.`
    );
  }
  tracker.requestTimestamps.push(now);

  // Cryptographically secure 6-digit number [100000, 999999]
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAtMs = now + OTP_TTL_MS;

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
 * Enforces TTL, strict 3-attempt limit, 15-minute lockout, and burns token on success.
 * Completely disables mock OTP bypass in production.
 */
export function verifyOtp(
  identifier: string,
  submittedCode: string,
  purpose: 'RESET_PASSWORD' | 'REGISTER' | 'LOGIN' | 'GENERAL' = 'GENERAL'
): OtpVerificationResult {
  const codeTrimmed = submittedCode.trim();
  const cleanId = normalizeIdentifier(identifier);
  const key = `${cleanId}:${purpose}`;
  const now = Date.now();
  const tracker = getRateLimitTracker(cleanId);

  // 1. Check if identifier is currently locked out
  if (now < tracker.lockedUntil) {
    const remainingMin = Math.ceil((tracker.lockedUntil - now) / 60000);
    return {
      valid: false,
      isLocked: true,
      reason: `Account temporarily locked due to excessive failed attempts. Please try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`,
    };
  }

  // 2. Production Security Gate: Cryptographic token validation only. Static bypass is disabled.
  // 3. Attempt sync from persistent store for multi-worker support
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

  // 4. Check TTL expiration
  if (now > record.expiresAt) {
    otpStore.delete(key);
    otpStore.delete(`${cleanId}:GENERAL`);
    persistOtps(otpStore);
    return {
      valid: false,
      reason: 'Verification code has expired (valid for 5 minutes). Please request a new code.',
    };
  }

  // 5. Constant-time comparison to prevent timing attacks
  const expectedBuffer = Buffer.from(record.code);
  const submittedBuffer = Buffer.from(codeTrimmed);

  const isMatch =
    expectedBuffer.length === submittedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, submittedBuffer);

  if (!isMatch) {
    record.attempts += 1;
    tracker.failedAttempts += 1;

    if (record.attempts >= MAX_VERIFY_ATTEMPTS || tracker.failedAttempts >= MAX_VERIFY_ATTEMPTS) {
      otpStore.delete(key);
      otpStore.delete(`${cleanId}:GENERAL`);
      persistOtps(otpStore);
      tracker.lockedUntil = now + RATE_LIMIT_WINDOW_MS;

      return {
        valid: false,
        isLocked: true,
        reason:
          'Too many incorrect attempts (3). For your security, this verification code has been invalidated and the account is locked for 15 minutes.',
      };
    }

    persistOtps(otpStore);
    const remaining = MAX_VERIFY_ATTEMPTS - record.attempts;
    return {
      valid: false,
      isLocked: false,
      reason: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // Token verified: burn immediately (Single-use token to prevent replay attacks)
  otpStore.delete(key);
  otpStore.delete(`${cleanId}:GENERAL`);
  persistOtps(otpStore);
  tracker.failedAttempts = 0;
  return { valid: true };
}
