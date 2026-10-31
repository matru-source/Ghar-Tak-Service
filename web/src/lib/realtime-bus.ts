// ==============================================================================
// Central Real-Time Event Bus for Pan-India Multi-Surface Synchronization
// Supports WebSockets, Server-Sent Events (SSE), and Android Client Streams.
// Equipped with Redis Pub/Sub backplane (ioredis) for seamless multi-pod
// horizontal scaling across Next.js clusters (Urban Company / Uber standard).
// ==============================================================================

import { getRedisClient, getRedisSubscriber, isRedisActive } from './redis-client';

export type RealtimeEventType =
  | 'CONNECTED'
  | 'HEARTBEAT'
  | 'JOB_CREATED'
  | 'JOB_STATUS_UPDATE'
  | 'TECH_DISPATCHED'
  | 'TECH_ACCEPTED'
  | 'TECH_REJECTED'
  | 'TECH_AVAILABILITY_CHANGED'
  | 'TECH_LOCATION_UPDATE'
  | 'TECH_ARRIVED'
  | 'TECH_KYC_VERIFIED'
  | 'TECH_KYC_SUBMITTED'
  | 'SAFETY_INTERLOCK_VERIFIED'
  | 'SAFETY_INSPECTION_AUDITED'
  | 'JOB_COMPLETED'
  | 'JOB_REASSIGNED'
  | 'SLA_BREACH_WARNING'
  | 'PAYOUT_TRANSFERRED'
  | 'PAYMENT_RECEIVED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_APPROVED'
  | 'CAPACITY_UPDATED'
  | 'SERVICE_UPDATED'
  | 'SERVICE_CREATED'
  | 'CATEGORY_CREATED'
  | 'EMERGENCY_SOS'
  | 'EMERGENCY_SOS_TRIGGERED'
  | 'CUSTOMER_EMERGENCY_SOS_TRIGGERED'
  | 'JOB_CANCELLED'
  | 'JOB_FEEDBACK_SUBMITTED'
  | 'DEAD_MILEAGE_CREDITED'
  | 'MATERIAL_ADDED'
  | 'PART_ADDED'
  | 'JOB_PRICE_UPDATED'
  | 'QUOTE_APPROVAL_REQUESTED'
  | 'DISPUTE_TICKET_CREATED'
  | 'DISPUTE_TICKET_UPDATED'
  | 'TECH_BROADCAST';

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
  _sourcePodId?: string;
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

const REDIS_CHANNEL = 'ghartak:realtime:events';
const CURRENT_POD_ID = `pod_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

class RealtimeEventBus {
  private subscribers: Map<string, Subscriber> = new Map();
  private eventHistory: RealtimeEventPayload[] = [];
  private maxHistory = 100;
  private totalEventsPublished = 0;
  private isSubscribedToRedis = false;

  constructor() {
    this.initRedisBackplane();
  }

  private initRedisBackplane() {
    const subscriber = getRedisSubscriber();
    if (subscriber && !this.isSubscribedToRedis) {
      this.isSubscribedToRedis = true;
      subscriber.subscribe(REDIS_CHANNEL, (err) => {
        if (err) {
          console.warn('[RealtimeBus] Failed subscribing to Redis channel:', err.message);
          this.isSubscribedToRedis = false;
        } else {
          console.log(`[RealtimeBus] Subscribed to Redis Pub/Sub channel: ${REDIS_CHANNEL}`);
        }
      });

      subscriber.on('message', (channel, message) => {
        if (channel === REDIS_CHANNEL) {
          try {
            const event: RealtimeEventPayload = JSON.parse(message);
            // Ignore events published by this exact same pod process to prevent duplicate dispatch
            if (event._sourcePodId !== CURRENT_POD_ID) {
              this.dispatchLocal(event);
            }
          } catch (e: any) {
            console.warn('[RealtimeBus] Error parsing Redis pub/sub message:', e.message);
          }
        }
      });
    }
  }

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
      _sourcePodId: CURRENT_POD_ID,
    };

    // Store in circular history buffer for late reconnects
    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }
    this.totalEventsPublished++;

    // 1. Dispatch locally to this server's subscribers
    this.dispatchLocal(fullEvent);

    // 2. Publish to Redis Pub/Sub backplane for multi-pod broadcast
    const redis = getRedisClient();
    if (redis) {
      try {
        redis.publish(REDIS_CHANNEL, JSON.stringify(fullEvent)).catch((err) => {
          console.warn('[RealtimeBus] Redis publish error:', err.message);
        });
      } catch (err: any) {
        console.warn('[RealtimeBus] Redis publish error:', err.message);
      }
    }

    // 3. Automated Dual-Channel High-Priority Push Notification Hook (Issue 2)
    try {
      if (
        fullEvent.type === 'TECH_DISPATCHED' ||
        fullEvent.type === 'TECH_BROADCAST'
      ) {
        import('./fcm-dispatcher').then(({ autoDispatchFcmFromRealtimeEvent }) => {
          autoDispatchFcmFromRealtimeEvent(fullEvent).catch((err) => {
            console.warn('[RealtimeBus -> FCM] Error triggering push notification:', err);
          });
        }).catch(() => {});
      }
    } catch (_) {}
  }

  private dispatchLocal(fullEvent: RealtimeEventPayload) {
    for (const [id, sub] of this.subscribers.entries()) {
      try {
        // Super Admin / National Ops receives all events across all pods
        if (sub.role === 'SUPER_ADMIN' || sub.role === 'ADMIN') {
          sub.listener(fullEvent);
          continue;
        }

        // Scope filters
        if (sub.jobId && fullEvent.jobId && sub.jobId !== fullEvent.jobId) continue;
        if (sub.customerId && fullEvent.customerId && sub.customerId !== fullEvent.customerId) continue;

        // Technician filtering: targeted events require match, but broadcasts to pincode reach active technicians
        if (fullEvent.type === 'TECH_BROADCAST') {
          if (sub.role !== 'TECHNICIAN' && !sub.technicianId) continue;
        } else if (sub.technicianId && fullEvent.technicianId) {
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

        // Issue 36: Security / OTP Defense-in-depth:
        // Strictly exclude handoverOtp completely from technician event stream.
        let deliveredEvent = fullEvent;
        if (sub.role === 'TECHNICIAN' || (sub.technicianId && !sub.customerId)) {
          if (deliveredEvent.details?.handoverOtp || (deliveredEvent as any).handoverOtp) {
            const sanitizedDetails = { ...deliveredEvent.details };
            delete sanitizedDetails.handoverOtp;
            delete sanitizedDetails.otp;
            deliveredEvent = {
              ...deliveredEvent,
              details: sanitizedDetails,
            };
            delete (deliveredEvent as any).handoverOtp;
          }
        }

        sub.listener(deliveredEvent);
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
      redisBackplaneActive: isRedisActive(),
      podId: CURRENT_POD_ID,
      timestamp: new Date().toISOString(),
    };
  }
}

// Global Singleton (survives HMR in development)
const globalForBus = global as unknown as { gtsRealtimeBus?: RealtimeEventBus };
export const realtimeBus = globalForBus.gtsRealtimeBus || new RealtimeEventBus();
if (process.env.NODE_ENV !== 'production') globalForBus.gtsRealtimeBus = realtimeBus;
