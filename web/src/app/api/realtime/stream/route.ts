import { NextRequest } from 'next/server';
import { realtimeBus, RealtimeEventPayload } from '@/lib/realtime-bus';

export const dynamic = 'force-dynamic';

/**
 * GET /api/realtime/stream
 * Resilient Real-Time Server-Sent Events (SSE) Stream (Issue 49).
 * Emits keep-alive heartbeat pings (: ping\n\n) every 15 seconds to prevent
 * carrier NAT/firewall drops when mobile devices transition across 5G/4G/Wi-Fi.
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connection established message
      controller.enqueue(
        encoder.encode(`event: CONNECTED\ndata: ${JSON.stringify({ status: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`)
      );

      // 2. Event listener for realtimeBus notifications
      const listener = (event: RealtimeEventPayload) => {
        try {
          const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream controller closed
        }
      };

      const unsubscribe = realtimeBus.subscribe(`sse-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, listener);

      // 3. Keep-alive heartbeat ping every 15 seconds (Issue 49)
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
