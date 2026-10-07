import { NextRequest } from 'next/server';
import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return apiError('Missing or malformed Authorization header. Bearer token required.', 401);
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return apiError('Invalid or expired authentication token', 401);
    }

    const user = await db.getUserById(payload.sub);
    if (!user) {
      return apiError('User account associated with this session no longer exists', 404);
    }

    let profile: Record<string, unknown> | null = null;
    if (user.role === 'TECHNICIAN') {
      profile = (await db.getTechnicianByUserId(user.id)) as unknown as Record<string, unknown>;
    } else if (user.role === 'PARTNER') {
      profile = (await db.getPartnerHub()) as unknown as Record<string, unknown>;
    } else if (user.role === 'CUSTOMER') {
      const cust = dbStore.customers.find((c) => c.userId === user.id);
      profile = (cust || null) as unknown as Record<string, unknown>;
    }

    return apiSuccess(
      {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified,
        },
        tokenClaims: payload,
        profile,
      },
      'Active session retrieved',
      200
    );
  } catch (error) {
    return apiError('Failed to retrieve current user session', 500, error instanceof Error ? error.message : String(error));
  }
}
