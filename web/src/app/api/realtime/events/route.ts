import { NextRequest } from 'next/server';
import { realtimeBus, RealtimeEventPayload } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * GET: Server-Sent Events (SSE) Stream
 * Clients (Customer App, Technician App, Partner CRM, Admin CRM) listen for real-time events.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || undefined;
  const partnerId = searchParams.get('partnerId') || undefined;
  const technicianId = searchParams.get('technicianId') || undefined;
  const jobId = searchParams.get('jobId') || undefined;

  const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Create SSE Readable Stream
  const encoder = new TextEncoder();
  let keepAliveInterval: NodeJS.Timeout | null = null;
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial Handshake Event
      const initialPayload: RealtimeEventPayload = {
        type: 'CONNECTED',
        timestamp: new Date().toISOString(),
        details: {
          subscriberId,
          role: role || 'ANONYMOUS',
          partnerId,
          technicianId,
          jobId,
          activeNodes: realtimeBus.getTelemetry().activeConnections + 1,
        },
      };

      controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(initialPayload)}\n\n`));

      // 2. Register with Central Event Bus
      unsubscribe = realtimeBus.subscribe(
        subscriberId,
        (event) => {
          try {
            controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(event)}\n\n`));
          } catch {
            // Controller closed by client
          }
        },
        { role, partnerId, technicianId, jobId }
      );

      // 3. Heartbeat Keep-Alive every 15 seconds
      keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:heartbeat\n\n`));
        } catch {
          if (keepAliveInterval) clearInterval(keepAliveInterval);
        }
      }, 15000);
    },
    cancel() {
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * POST: Publish event to the central event bus
 * Used by webhooks, test harnesses, and client dispatch actions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, jobId, ticketNumber, partnerId, technicianId, customerId, pincode, status, location, details } = body;

    if (!type) {
      return apiError('Event type is required', 400);
    }

    realtimeBus.publish({
      type,
      jobId,
      ticketNumber,
      partnerId,
      technicianId,
      customerId,
      pincode,
      status,
      location,
      details,
    });

    const telemetry = realtimeBus.getTelemetry();

    return apiSuccess(
      {
        publishedEvent: type,
        activeSubscribers: telemetry.activeConnections,
        totalEventsPublished: telemetry.totalEventsPublished,
      },
      'Real-time event broadcasted successfully'
    );
  } catch (error) {
    return apiError('Failed to publish real-time event', 500, error instanceof Error ? error.message : String(error));
  }
}
