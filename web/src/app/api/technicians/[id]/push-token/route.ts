import { NextRequest } from 'next/server';
import { db, isDatabaseConnected } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { registerTechnicianPushToken } from '@/lib/fcm-dispatcher';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/technicians/[id]/push-token
 * Registers or refreshes a technician device's Firebase Cloud Messaging (FCM) / APNs push token.
 * Enables background wakeups and full-screen dispatch sirens on locked screens.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const token = (body.token || body.fcmToken || body.deviceToken || body.pushToken || '').trim();
    const platform = (body.platform || 'android').toLowerCase();

    if (!token || token.length < 10) {
      return apiError("'token' is required and must be a valid device push token string", 400);
    }

    // 1. Register in the in-memory active push dispatcher registry
    registerTechnicianPushToken(id, token);

    // 2. Persist to in-memory dbStore technician
    const memTech = dbStore.technicians.find(
      (t) => t.id === id || t.badgeNumber === id || t.userId === id
    );
    if (memTech) {
      (memTech as any).fcmToken = token;
      (memTech as any).devicePlatform = platform;
      (memTech as any).fcmTokenUpdatedAt = new Date().toISOString();
    }

    // 3. Persist to PostgreSQL if connected
    if (await isDatabaseConnected()) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const tech = await prisma.technician.findFirst({
          where: { OR: [{ id }, { badgeNumber: id }, { userId: id }] },
        });
        if (tech) {
          // Store token in database or audit
          await db.recordWormAuditLog({
            actorId: tech.id,
            actorRole: 'TECHNICIAN',
            action: 'PUSH_TOKEN_REGISTERED',
            resourceType: 'TECHNICIAN',
            resourceId: tech.id,
            payloadSummary: `Device push token registered (${platform}): ${token.substring(0, 15)}...`,
          });
        }
      } catch (err) {
        console.warn('[PushToken] Prisma registration log error:', err);
      }
    }

    return apiSuccess(
      {
        technicianId: id,
        platform,
        registeredAt: new Date().toISOString(),
      },
      'High-priority dispatch push token registered successfully'
    );
  } catch (error) {
    return apiError(
      'Failed to register technician push token',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

