import { SignJWT, jwtVerify } from 'jose';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      '[Security] FATAL: JWT_SECRET environment variable is not defined or is too short (min 32 chars). Refusing to issue insecure tokens.'
    );
  }
  return new TextEncoder().encode(secret.trim());
}

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
    .sign(getJwtSecret());
  return jwt;
}

/**
 * Verifies a JWT token and returns the typed payload.
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts Bearer token from Request Authorization header or cookies.
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Fallback to NextRequest cookies if available
  if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
    const cookieToken =
      (request as any).cookies.get('gts_token')?.value ||
      (request as any).cookies.get('gts_auth_token')?.value ||
      (request as any).cookies.get('token')?.value;
    if (cookieToken) return cookieToken;
  }

  // Fallback to standard cookie header parsing
  const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)(?:gts_token|gts_auth_token|token)=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }

  return null;
}
