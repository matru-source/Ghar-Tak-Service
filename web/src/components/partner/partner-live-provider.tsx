'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRealtimeEvents, playSyntheticAlert, RealtimeConnectionStatus } from '@/lib/use-realtime-events';
import type { RealtimeEventPayload } from '@/lib/realtime-bus';
import { getActivePartnerId } from '@/lib/partner-session';

interface PartnerLiveContextType {
  status: RealtimeConnectionStatus;
  lastEvent: RealtimeEventPayload | null;
  liveEvents: RealtimeEventPayload[];
  activeNotification: {
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'info' | 'success';
    ticket?: string;
    link?: string;
    ctaText?: string;
  } | null;
  partnerId: string;
  clearNotification: () => void;
}

const PartnerLiveContext = createContext<PartnerLiveContextType>({
  status: 'DISCONNECTED',
  lastEvent: null,
  liveEvents: [],
  activeNotification: null,
  partnerId: 'ptnr_mah_01',
  clearNotification: () => {},
});

export function usePartnerLive() {
  return useContext(PartnerLiveContext);
}

export function PartnerLiveProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState<string>('ptnr_mah_01');
  const [liveEvents, setLiveEvents] = useState<RealtimeEventPayload[]>([]);
  const [activeNotification, setActiveNotification] = useState<{
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'info' | 'success';
    ticket?: string;
    link?: string;
    ctaText?: string;
  } | null>(null);

  const refreshDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resolved = getActivePartnerId('ptnr_mah_01');
    setPartnerId(resolved);
  }, []);

  const triggerDebouncedRscRefresh = useCallback(() => {
    if (refreshDebounceRef.current) {
      clearTimeout(refreshDebounceRef.current);
    }
    refreshDebounceRef.current = setTimeout(() => {
      try {
        router.refresh();
      } catch {}
    }, 600);
  }, [router]);

  const handleIncomingEvent = useCallback(
    (event: RealtimeEventPayload) => {
      setLiveEvents((prev) => [event, ...prev.slice(0, 49)]);

      const ticket = event.ticketNumber || event.jobId || 'UNKNOWN';

      // 1. High-Priority Field Emergency SOS Alert
      if (
        event.type === 'EMERGENCY_SOS' ||
        event.type === 'EMERGENCY_SOS_TRIGGERED' ||
        event.type === 'CUSTOMER_EMERGENCY_SOS_TRIGGERED'
      ) {
        playSyntheticAlert('sos');
        setActiveNotification({
          title: '🚨 CRITICAL REGIONAL EMERGENCY SOS',
          message: `Emergency SOS triggered on Work Order #${ticket}! Immediate intervention and dispatcher check required.`,
          type: 'error',
          ticket,
          link: '/partner/escalations',
          ctaText: 'DISPATCH INTERVENTION',
        });
        triggerDebouncedRscRefresh();
      }
      // 2. SLA Escalation & Breach Warning
      else if (
        event.type === 'SLA_BREACH' ||
        event.type === 'SLA_BREACH_TIMER' ||
        event.type === 'JOB_ESCALATED' ||
        (event.details && event.details.slaBreach)
      ) {
        playSyntheticAlert('siren');
        setActiveNotification({
          title: '⚠️ SLA ESCALATION WARNING',
          message: `Ticket #${ticket} is nearing or past 30-min SLA timer! Automated proximity reroute recommended.`,
          type: 'warning',
          ticket,
          link: '/partner/escalations',
          ctaText: 'REROUTE FLEET',
        });
        triggerDebouncedRscRefresh();
      }
      // 3. New Regional Work Order Created
      else if (event.type === 'JOB_CREATED') {
        playSyntheticAlert('chime');
        setActiveNotification({
          title: '⚡ New Regional Work Order',
          message: `Ticket #${ticket} created in territory (${event.pincode || 'Regional Zone'}).`,
          type: 'info',
          ticket,
          link: '/partner/dispatch',
          ctaText: 'VIEW DISPATCH',
        });
        triggerDebouncedRscRefresh();
      }
      // 4. Fleet Dispatched / Accepted
      else if (event.type === 'TECH_ACCEPTED' || event.type === 'TECH_DISPATCHED') {
        setActiveNotification({
          title: '👷 Fleet Dispatched',
          message: `Technician assigned and confirmed for Ticket #${ticket}.`,
          type: 'success',
          ticket,
          link: '/partner/dispatch',
          ctaText: 'TRACK STATUS',
        });
        triggerDebouncedRscRefresh();
      }
      // 5. Doorstep Arrival / Safety Verification
      else if (event.type === 'TECH_ARRIVED' || event.type === 'SAFETY_INTERLOCK_VERIFIED') {
        setActiveNotification({
          title: event.type === 'TECH_ARRIVED' ? '📍 Doorstep Arrival' : '🛡️ Safety Gate Cleared',
          message: `Ticket #${ticket}: ${event.type === 'TECH_ARRIVED' ? 'Technician arrived at doorstep.' : 'Safety checklist verified.'}`,
          type: 'info',
          ticket,
          link: '/partner/dispatch',
          ctaText: 'VIEW LIVE',
        });
        triggerDebouncedRscRefresh();
      }
      // 6. Job Completed & Double-Entry Reconciled
      else if (event.type === 'JOB_COMPLETED' || event.type === 'PAYOUT_TRANSFERRED') {
        playSyntheticAlert('chime');
        setActiveNotification({
          title: '✅ Job Completed & Commission Credited',
          message: `Ticket #${ticket} marked completed. 15% franchise commission booked to territory ledger.`,
          type: 'success',
          ticket,
          link: '/partner/invoices',
          ctaText: 'VIEW LEDGER',
        });
        triggerDebouncedRscRefresh();
      }
    },
    [triggerDebouncedRscRefresh]
  );

  const { status, lastEvent } = useRealtimeEvents({
    role: 'PARTNER',
    partnerId,
    onEvent: handleIncomingEvent,
  });

  // Auto-dismiss standard notifications after 8 seconds (SOS notifications persist until dismissed)
  useEffect(() => {
    if (activeNotification && activeNotification.type !== 'error') {
      const timer = setTimeout(() => setActiveNotification(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  return (
    <PartnerLiveContext.Provider
      value={{
        status,
        lastEvent,
        liveEvents,
        activeNotification,
        partnerId,
        clearNotification: () => setActiveNotification(null),
      }}
    >
      {/* Real-Time Floating Notification Banner (Issue 9) */}
      {activeNotification && (
        <div className="fixed top-18 right-6 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-300">
          <div
            className={`rounded-2xl p-4 shadow-2xl border text-white ${
              activeNotification.type === 'error'
                ? 'bg-rose-950/95 border-rose-500 shadow-rose-950/50 ring-2 ring-rose-500/50'
                : activeNotification.type === 'warning'
                ? 'bg-amber-950/95 border-amber-500 shadow-amber-950/50'
                : activeNotification.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500 shadow-emerald-950/50'
                : 'bg-slate-900/95 border-slate-700 shadow-slate-950/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-black text-xs tracking-wider flex items-center gap-1.5 uppercase">
                  {activeNotification.title}
                </div>
                <div className="text-xs text-slate-200 mt-1.5 leading-relaxed font-medium">
                  {activeNotification.message}
                </div>
                {activeNotification.link && (
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={activeNotification.link}
                      onClick={() => setActiveNotification(null)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                        activeNotification.type === 'error'
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : activeNotification.type === 'warning'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {activeNotification.ctaText || 'VIEW DETAILS'} →
                    </Link>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {status === 'CONNECTED' ? '● Real-Time SSE' : '○ Polling'}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveNotification(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer transition-colors"
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </PartnerLiveContext.Provider>
  );
}
