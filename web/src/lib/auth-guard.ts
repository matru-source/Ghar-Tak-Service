// ==============================================================================
// ElectriCare Role-Based Access Control (RBAC) Guard Utility
// Used across API routes and server handlers to protect multi-tenant operations.
// ==============================================================================

import { extractBearerToken, verifyAccessToken, TokenPayload } from './jwt';
import { apiError } from './api-response';

export type UserRoleType = 'SUPER_ADMIN' | 'PARTNER' | 'TECHNICIAN' | 'CUSTOMER';

export interface AuthContext {
  token: string;
  payload: TokenPayload;
  userId: string;
  role: UserRoleType;
  partnerId?: string;
  technicianId?: string;
  customerId?: string;
}

/**
 * Asserts that the request carries a valid Bearer JWT token,
 * and optionally validates that the user possesses one of the allowed roles.
 */
export async function assertAuth(
  request: Request,
  allowedRoles?: UserRoleType[]
): Promise<{ ok: true; context: AuthContext } | { ok: false; response: Response }> {
  const token = extractBearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: apiError('Authentication required. Missing Bearer token.', 401),
    };
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return {
      ok: false,
      response: apiError('Session expired or invalid token. Please log in again.', 401),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    return {
      ok: false,
      response: apiError(
        `Access denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${payload.role}`,
        403
      ),
    };
  }

  return {
    ok: true,
    context: {
      token,
      payload,
      userId: payload.sub,
      role: payload.role,
      partnerId: payload.partnerId,
      technicianId: payload.technicianId,
      customerId: payload.customerId,
    },
  };
}
