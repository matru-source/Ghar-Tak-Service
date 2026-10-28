'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeEventPayload } from './realtime-bus';

export type RealtimeConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export interface UseRealtimeEventsOptions {
  role?: string;
  partnerId?: string;
  technicianId?: string;
  customerId?: string;
  jobId?: string;
  enabled?: boolean;
  onEvent?: (event: RealtimeEventPayload) => void;
}

/**
 * Enterprise Web Audio Synthesizer
 * Generates clear, high-priority emergency sirens & chime alerts without external asset dependencies.
 */
export function playSyntheticAlert(type: 'siren' | 'chime' | 'sos' = 'chime') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (type === 'siren') {
      // 60-Second Inbound Dispatch Siren (Dual alternating high-penetration tone)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      // Modulate frequency between 750Hz and 1100Hz
      const startTime = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        osc.frequency.setValueAtTime(750, startTime + i * 0.4);
        osc.frequency.exponentialRampToValueAtTime(1150, startTime + i * 0.4 + 0.2);
        osc.frequency.exponentialRampToValueAtTime(750, startTime + i * 0.4 + 0.4);
      }

      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 1.8);
    } else if (type === 'sos') {
      // High-priority SOS Alert (Pulsed 880Hz warning)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.setValueAtTime(0.01, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.01, ctx.currentTime + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } else {
      // Gentle notification chime (Arrived / Completed)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch (err) {
    console.debug('[RealtimeAudio] Audio synthesis not permitted without user gesture:', err);
  }
}

/**
 * Trigger device vibration for physical haptic alert on supported mobile browsers
 */
export function triggerHapticAlert(pattern: number[] = [400, 200, 400, 200, 600]) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

/**
 * Universal Hook for subscribing to the Pan-India Real-Time SSE Bus.
 * Handles auto-reconnect backoff, heartbeat watchdogs, and lifecycle cleanup.
 */
export function useRealtimeEvents({
  role,
  partnerId,
  technicianId,
  customerId,
  jobId,
  enabled = true,
  onEvent,
}: UseRealtimeEventsOptions) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>('DISCONNECTED');
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffDelayRef = useRef<number>(1000);
  const onEventRef = useRef(onEvent);

  // Keep latest callback reference
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const resetHeartbeatWatchdog = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    // If no heartbeat or event received in 35 seconds, consider stream stale and reconnect
    heartbeatTimeoutRef.current = setTimeout(() => {
      console.warn('[RealtimeClient] Watchdog: Stream timed out (no heartbeat). Reconnecting...');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setStatus('DISCONNECTED');
      scheduleReconnect();
    }, 35000);
  }, []);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStatus('CONNECTING');

    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (partnerId) params.set('partnerId', partnerId);
    if (technicianId) params.set('technicianId', technicianId);
    if (customerId) params.set('customerId', customerId);
    if (jobId) params.set('jobId', jobId);

    const sseUrl = `/api/realtime/events?${params.toString()}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    resetHeartbeatWatchdog();

    es.onopen = () => {
      setStatus('CONNECTED');
      backoffDelayRef.current = 1000; // Reset backoff on successful handshake
      resetHeartbeatWatchdog();
    };

    es.onmessage = (messageEvent) => {
      resetHeartbeatWatchdog();
      try {
        const payload: RealtimeEventPayload = JSON.parse(messageEvent.data);
        setLastEvent(payload);
        if (onEventRef.current) {
          onEventRef.current(payload);
        }
      } catch (err) {
        console.warn('[RealtimeClient] Malformed event payload:', err);
      }
    };

    es.onerror = () => {
      setStatus('ERROR');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      scheduleReconnect();
    };
  }, [role, partnerId, technicianId, customerId, jobId, enabled, resetHeartbeatWatchdog]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    const delay = backoffDelayRef.current;
    // Exponential backoff capped at 20 seconds
    backoffDelayRef.current = Math.min(delay * 1.5, 20000);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setStatus('DISCONNECTED');
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
    };
  }, [enabled, connect]);

  return {
    status,
    lastEvent,
    reconnect: connect,
    playAlert: playSyntheticAlert,
    triggerHaptic: triggerHapticAlert,
  };
}
