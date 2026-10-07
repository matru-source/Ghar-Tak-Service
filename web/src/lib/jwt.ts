import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'electricare_super_secret_jwt_key_2026_enterprise_production'
);

export interface TokenPayload {
  sub: string; // User ID
  phone: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'PARTNER' | 'TECHNICIAN' | 'CUSTOMER';
  partnerId?: string;
  technicianId?: string;
  customerId?: string;
  pincode?: string;
  [key: string]: unknown;
}

/**
 * Signs a JWT token with user claims and 7-day expiration.
 */
export async function signAccessToken(payload: TokenPayload): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  return jwt;
}

/**
 * Verifies a JWT token and returns the typed payload.
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts Bearer token from Request Authorization header.
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
}
