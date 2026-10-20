import crypto from 'crypto';

/**
 * PBKDF2 Password Hashing with unique salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain text password against a stored hash
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash) return false;
  if (!storedHash.includes(':')) {
    // SHA-256 or plain fallback for existing seed data
    const sha = crypto.createHash('sha256').update(password).digest('hex');
    return storedHash === sha || storedHash === password;
  }
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}
