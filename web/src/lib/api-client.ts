/**
 * Unified API & Authentication Client for Pan-India Web Surfaces
 * Standardizes single authentication cookie (gts_token) and provides
 * a unified fetch interceptor (authFetch) across Partner, Admin, and Customer portals.
 * Resolves Issue 41: Token Key Inconsistency (token vs authToken vs gts_token).
 */

export const AUTH_COOKIE_NAME = 'gts_token';
export const LEGACY_AUTH_COOKIE_NAME = 'gts_auth_token';

/**
 * Extracts the active JWT Bearer token from cookies or localStorage.
 * Checks gts_token, gts_auth_token, token, and authToken in order of precedence.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check document.cookie
  const cookieMatches = document.cookie.match(
    /(?:^|;\s*)(?:gts_token|gts_auth_token|authToken|token)=([^;]+)/
  );
  if (cookieMatches && cookieMatches[1]) {
    try {
      return decodeURIComponent(cookieMatches[1].trim());
    } catch {
      return cookieMatches[1].trim();
    }
  }

  // 2. Check localStorage
  const localKeys = ['gts_token', 'gts_auth_token', 'token', 'authToken', 'electriCare_token'];
  for (const key of localKeys) {
    const val = localStorage.getItem(key);
    if (val && val.trim() && val !== 'null' && val !== 'undefined') {
      return val.trim();
    }
  }

  return null;
}

/**
 * Persists an authenticated session token consistently to both cookie and localStorage.
 */
export function setAuthToken(token: string, role: string = 'PARTNER', maxAgeSeconds: number = 604800): void {
  if (typeof window === 'undefined') return;

  // Standard primary cookie: gts_token
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  // Backward compatibility cookie: gts_auth_token
  document.cookie = `${LEGACY_AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  document.cookie = `gts_user_role=${role}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;

  // Standard primary localStorage
  localStorage.setItem('gts_token', token);
  localStorage.setItem('gts_auth_token', token);
  localStorage.setItem('gts_user_role', role);
}

/**
 * Clears all authentication tokens from cookies and localStorage on logout.
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;

  const cookieKeys = ['gts_token', 'gts_auth_token', 'token', 'authToken', 'gts_user_role', 'gts_partner_hub'];
  for (const k of cookieKeys) {
    document.cookie = `${k}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  const localKeys = ['gts_token', 'gts_auth_token', 'token', 'authToken', 'gts_user', 'gts_hub', 'gts_user_role'];
  for (const k of localKeys) {
    localStorage.removeItem(k);
  }
}

/**
 * Unified fetch wrapper with automated JWT Bearer injection.
 * Prevents "Bearer null" 401 Unauthorized errors across all partner and admin pages.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const finalInit: RequestInit = {
    ...init,
    headers,
  };

  const response = await fetch(input, finalInit);

  // If token expired, clear tokens
  if (response.status === 401 && typeof window !== 'undefined') {
    console.warn('[authFetch] 401 Unauthorized encountered. Session token may have expired.');
  }

  return response;
}
