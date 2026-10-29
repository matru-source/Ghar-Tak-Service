import { NextRequest } from 'next/server';
import { realtimeBus, RealtimeEventPayload } from '@/lib/realtime-bus';
import { verifyAccessToken } from '@/lib/jwt';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/realtime/stream
 * Authenticated Server-Sent Events (SSE) Stream (Urban Company / Uber standard).
 * Validates JWT Bearer token on EventSource handshake (header, query, or cookie).
 * Resolves Issue 49: Unauthenticated SSE Stream Leak.
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate Token Handshake
  const authHeader = request.headers.get('authorization');
  const searchParams = new URL(request.url).searchParams;
  const tokenFromQuery = searchParams.get('token') || searchParams.get('auth');
  const tokenFromCookie =
    request.cookies.get('gts_token')?.value ||
    request.cookies.get('gts_auth_token')?.value ||
    request.cookies.get('token')?.value;

  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (tokenFromQuery) {
    token = tokenFromQuery.trim();
  } else if (tokenFromCookie) {
    token = tokenFromCookie.trim();
  }

  if (!token) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized: Valid JWT Bearer token required to connect to real-time SSE stream.',
        code: 'SSE_UNAUTHENTICATED',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized: Expired or invalid authentication token on SSE handshake.',
        code: 'SSE_TOKEN_INVALID',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const requestedJobId = searchParams.get('jobId');
  const role = payload.role || 'CUSTOMER';
  const userId = payload.sub || '';
  const partnerId = (payload as any).partnerId || '';
  const technicianId = (payload as any).technicianId || (role === 'TECHNICIAN' ? userId : '');

  // 2. Ownership Verification for requested jobId (Zero unauthorized spying)
  if (requestedJobId && role !== 'SUPER_ADMIN') {
    const targetJob = await db.findOrRecoverJob(requestedJobId);
    if (targetJob) {
      if (role === 'PARTNER' && partnerId && targetJob.partnerId !== partnerId) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Access denied to foreign franchise job stream', code: 'FORBIDDEN_JOB_STREAM' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (role === 'CUSTOMER' && targetJob.customerId !== userId && (targetJob as any).customerPhone !== (payload as any).phone) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Cannot listen to another customer work order stream', code: 'FORBIDDEN_JOB_STREAM' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (role === 'TECHNICIAN' && targetJob.technicianId !== technicianId && targetJob.technicianId !== userId) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Cannot listen to unassigned technician job stream', code: 'FORBIDDEN_JOB_STREAM' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  const encoder = new TextEncoder();
  const subscriberId = `sse-${role.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connection established message with authenticated session context
      controller.enqueue(
        encoder.encode(
          `event: CONNECTED\ndata: ${JSON.stringify({
            status: 'CONNECTED',
            subscriberId,
            role,
            userId,
            jobId: requestedJobId || null,
            timestamp: new Date().toISOString(),
          })}\n\n`
        )
      );

      // 2. Event listener for realtimeBus with role & ownership filtering
      const listener = (event: RealtimeEventPayload) => {
        try {
          // If stream subscribed to a specific jobId, only forward events matching this job
          if (requestedJobId && event.jobId && event.jobId !== requestedJobId && event.ticketNumber !== requestedJobId) {
            return;
          }

          // Role ownership filtering:
          if (role === 'PARTNER' && partnerId && event.partnerId && event.partnerId !== partnerId) {
            return;
          }
          if (role === 'TECHNICIAN') {
            if (event.technicianId && event.technicianId !== technicianId && event.technicianId !== userId) {
              return;
            }
          }
          if (role === 'CUSTOMER') {
            if (event.customerId && event.customerId !== userId) {
              return;
            }
          }

          // Issue 36: Sanitize handoverOtp for technicians
          let safeEvent = event;
          if (role === 'TECHNICIAN') {
            if (safeEvent.details?.handoverOtp || (safeEvent as any).handoverOtp) {
              const cleanDetails = { ...safeEvent.details };
              delete cleanDetails.handoverOtp;
              delete cleanDetails.otp;
              safeEvent = { ...safeEvent, details: cleanDetails };
            }
          }

          const payloadStr = `event: ${safeEvent.type}\ndata: ${JSON.stringify(safeEvent)}\n\n`;
          controller.enqueue(encoder.encode(payloadStr));
        } catch {
          // Stream controller closed
        }
      };

      const unsubscribe = realtimeBus.subscribe(
        subscriberId,
        listener,
        {
          role,
          partnerId: partnerId || undefined,
          technicianId: technicianId || undefined,
          customerId: role === 'CUSTOMER' ? userId : undefined,
          jobId: requestedJobId || undefined,
        }
      );

      // 3. Keep-alive heartbeat ping every 15 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
          unsubscribe();
        }
      }, 15000);

      // 4. Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
