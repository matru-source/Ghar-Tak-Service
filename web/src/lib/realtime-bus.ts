// Central Real-Time Event Bus for Pan-India Multi-Surface Synchronization
// Supports WebSockets, Server-Sent Events (SSE), and Android Client Streams

export type RealtimeEventType =
  | 'CONNECTED'
  | 'HEARTBEAT'
  | 'JOB_CREATED'
  | 'TECH_DISPATCHED'
  | 'TECH_ACCEPTED'
  | 'TECH_REJECTED'
  | 'TECH_LOCATION_UPDATE'
  | 'TECH_ARRIVED'
  | 'SAFETY_INTERLOCK_VERIFIED'
  | 'JOB_COMPLETED'
  | 'SLA_BREACH_WARNING'
  | 'PAYOUT_TRANSFERRED'
  | 'EMERGENCY_SOS';

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  jobId?: string;
  ticketNumber?: string;
  partnerId?: string;
  technicianId?: string;
  customerId?: string;
  pincode?: string;
  status?: string;
  location?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    etaMinutes?: number;
  };
  details?: Record<string, any>;
  timestamp: string;
}

export type EventListener = (event: RealtimeEventPayload) => void;

interface Subscriber {
  id: string;
  role?: string;
  partnerId?: string;
  technicianId?: string;
  customerId?: string;
  jobId?: string;
  listener: EventListener;
  connectedAt: Date;
}

class RealtimeEventBus {
  private subscribers: Map<string, Subscriber> = new Map();
  private eventHistory: RealtimeEventPayload[] = [];
  private maxHistory = 100;
  private totalEventsPublished = 0;

  /**
   * Register a new SSE or WebSocket client stream
   */
  subscribe(
    id: string,
    listener: EventListener,
    filters?: {
      role?: string;
      partnerId?: string;
      technicianId?: string;
      customerId?: string;
      jobId?: string;
    }
  ): () => void {
    const subscriber: Subscriber = {
      id,
      role: filters?.role,
      partnerId: filters?.partnerId,
      technicianId: filters?.technicianId,
      customerId: filters?.customerId,
      jobId: filters?.jobId,
      listener,
      connectedAt: new Date(),
    };

    this.subscribers.set(id, subscriber);

    // Return cleanup unsubscribe function
    return () => {
      this.subscribers.delete(id);
    };
  }

  /**
   * Broadcast an event across all matched listeners
   */
  publish(event: Omit<RealtimeEventPayload, 'timestamp'>): void {
    const fullEvent: RealtimeEventPayload = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Store in circular history buffer for late reconnects
    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }
    this.totalEventsPublished++;

    // Broadcast to matching subscribers
    for (const [id, sub] of this.subscribers.entries()) {
      try {
        // Scope filters
        if (sub.jobId && fullEvent.jobId && sub.jobId !== fullEvent.jobId) continue;
        if (sub.customerId && fullEvent.customerId && sub.customerId !== fullEvent.customerId) continue;
        if (sub.technicianId && fullEvent.technicianId) {
          const sId = sub.technicianId.toLowerCase().replace(/[^a-z0-9]/g, '');
          const eId = fullEvent.technicianId.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (sId !== eId && !sId.includes(eId) && !eId.includes(sId)) {
            continue;
          }
        }
        if (sub.partnerId && fullEvent.partnerId && sub.partnerId !== 'ALL' && fullEvent.partnerId !== 'ALL') {
          const sP = sub.partnerId.toLowerCase().replace(/[^a-z0-9]/g, '');
          const eP = fullEvent.partnerId.toLowerCase().replace(/[^a-z0-9]/g, '');
          const isMahS = sP.includes('mah') || sP.includes('mumbai');
          const isMahE = eP.includes('mah') || eP.includes('mumbai');
          const isOdiS = sP.includes('odi') || sP.includes('puri') || sP.includes('bbsr');
          const isOdiE = eP.includes('odi') || eP.includes('puri') || eP.includes('bbsr');
          if (isMahS && isMahE) {
            // matches territory
          } else if (isOdiS && isOdiE) {
            // matches territory
          } else if (sP !== eP) {
            continue;
          }
        }

        sub.listener(fullEvent);
      } catch (err) {
        console.error(`[RealtimeBus] Failed sending to subscriber ${id}:`, err);
      }
    }
  }

  /**
   * Inspect current bus telemetry
   */
  getTelemetry() {
    return {
      activeConnections: this.subscribers.size,
      totalEventsPublished: this.totalEventsPublished,
      recentEvents: this.eventHistory.slice(-10),
      timestamp: new Date().toISOString(),
    };
  }
}

// Global Singleton (survives HMR in development)
const globalForBus = global as unknown as { gtsRealtimeBus?: RealtimeEventBus };
export const realtimeBus = globalForBus.gtsRealtimeBus || new RealtimeEventBus();
if (process.env.NODE_ENV !== 'production') globalForBus.gtsRealtimeBus = realtimeBus;
