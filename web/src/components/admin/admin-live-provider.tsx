'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeEvents, playSyntheticAlert, RealtimeConnectionStatus } from '@/lib/use-realtime-events';
import type { RealtimeEventPayload } from '@/lib/realtime-bus';

interface AdminLiveContextType {
  status: RealtimeConnectionStatus;
  lastEvent: RealtimeEventPayload | null;
  liveEvents: RealtimeEventPayload[];
  refreshKey: number;
  activeNotification: { title: string; message: string; type?: string; ticket?: string } | null;
  clearNotification: () => void;
}

const AdminLiveContext = createContext<AdminLiveContextType>({
  status: 'DISCONNECTED',
  lastEvent: null,
  liveEvents: [],
  refreshKey: 0,
  activeNotification: null,
  clearNotification: () => {},
});

export function useAdminLive() {
  return useContext(AdminLiveContext);
}

export function AdminLiveProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [liveEvents, setLiveEvents] = useState<RealtimeEventPayload[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [activeNotification, setActiveNotification] = useState<{
    title: string;
    message: string;
    type?: string;
    ticket?: string;
  } | null>(null);

  const refreshDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const triggerDebouncedRscRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
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

      // Audio & Visual Alert Logic based on event severity
      if (event.type === 'JOB_CREATED') {
        playSyntheticAlert('chime');
        setActiveNotification({
          title: '⚡ New Work Order Created',
          message: `Ticket ${event.ticketNumber || event.jobId} created in Pincode ${event.pincode || 'Regional'}.`,
          type: 'info',
          ticket: event.ticketNumber || event.jobId,
        });
        triggerDebouncedRscRefresh();
      } else if (event.type === 'TECH_ACCEPTED' || event.type === 'TECH_DISPATCHED') {
        setActiveNotification({
          title: '👷 Fleet Dispatched',
          message: `Technician assigned to ${event.ticketNumber || event.jobId}.`,
          type: 'success',
          ticket: event.ticketNumber || event.jobId,
        });
        triggerDebouncedRscRefresh();
      } else if (event.type === 'JOB_COMPLETED') {
        playSyntheticAlert('chime');
        setActiveNotification({
          title: '✅ Job Completed & Reconciled',
          message: `Ticket ${event.ticketNumber || event.jobId} marked complete. Double-entry ledger updated.`,
          type: 'success',
          ticket: event.ticketNumber || event.jobId,
        });
        triggerDebouncedRscRefresh();
      } else if (event.type === 'SAFETY_INTERLOCK_VERIFIED' || event.type === 'DISPUTE_TICKET_CREATED') {
        triggerDebouncedRscRefresh();
      }
    },
    [triggerDebouncedRscRefresh]
  );

  const { status, lastEvent } = useRealtimeEvents({
    role: 'SUPER_ADMIN',
    onEvent: handleIncomingEvent,
  });

  // Auto-dismiss notification toast after 5 seconds
  useEffect(() => {
    if (activeNotification) {
      const t = setTimeout(() => setActiveNotification(null), 5000);
      return () => clearTimeout(t);
    }
  }, [activeNotification]);

  return (
    <AdminLiveContext.Provider
      value={{
        status,
        lastEvent,
        liveEvents,
        refreshKey,
        activeNotification,
        clearNotification: () => setActiveNotification(null),
      }}
    >
      {/* Toast Notification Container */}
      {activeNotification && (
        <div className="fixed top-18 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-extrabold text-xs tracking-wider flex items-center gap-1.5">
                {activeNotification.title}
              </div>
              <div className="text-xs text-slate-300 mt-1">{activeNotification.message}</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveNotification(null)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {children}
    </AdminLiveContext.Provider>
  );
}
