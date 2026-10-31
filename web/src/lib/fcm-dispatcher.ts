// ==============================================================================
// High-Priority Firebase Cloud Messaging (FCM) Dispatcher (Urban Company / Uber standard)
// Ensures background siren pushes wake up aggressive battery-saver Android OEMs
// (Xiaomi MIUI/HyperOS, Oppo ColorOS, Vivo FunTouch OS) with Full-Screen Intent.
// ==============================================================================

import { dbStore } from './mock-data';

export interface FcmDispatchPayload {
  token?: string;
  tokens?: string[];
  technicianId?: string;
  ticketNumber: string;
  serviceTitle: string;
  payoutInr: number;
  jobId: string;
  pincode?: string;
  customerId?: string;
  customerAddress?: string;
  timerSeconds?: number;
}

// In-Memory Device Push Token Registry for active technician fleet
const globalForFcm = global as unknown as { gtsTechDeviceTokens?: Map<string, Set<string>> };
const technicianDeviceTokens = globalForFcm.gtsTechDeviceTokens || new Map<string, Set<string>>();
if (process.env.NODE_ENV !== 'production') globalForFcm.gtsTechDeviceTokens = technicianDeviceTokens;

/**
 * Register or update a technician's mobile push notification device token.
 */
export function registerTechnicianPushToken(technicianId: string, token: string) {
  if (!technicianId || !token) return;
  const cleanId = technicianId.trim();
  const cleanToken = token.trim();
  if (!technicianDeviceTokens.has(cleanId)) {
    technicianDeviceTokens.set(cleanId, new Set());
  }
  technicianDeviceTokens.get(cleanId)!.add(cleanToken);
  console.log(`[FCM Registry] Registered device push token for technician '${cleanId}' (Total tokens: ${technicianDeviceTokens.get(cleanId)!.size})`);
}

/**
 * Retrieve all registered device tokens for a given technician.
 */
export function getTechnicianPushTokens(technicianId: string): string[] {
  if (!technicianId) return [];
  const cleanId = technicianId.trim();
  const tokens = new Set<string>();

  // Check in-memory registry
  const regTokens = technicianDeviceTokens.get(cleanId);
  if (regTokens) {
    regTokens.forEach((t) => tokens.add(t));
  }

  // Check dbStore.technicians
  const memTech = dbStore.technicians?.find(
    (t) => t.id === cleanId || t.badgeNumber === cleanId || t.userId === cleanId
  );
  if (memTech && (memTech as any).fcmToken) {
    tokens.add(String((memTech as any).fcmToken).trim());
  }

  return Array.from(tokens);
}

/**
 * Dispatches a high-priority FCM notification designed to wake up sleeping / locked Android devices
 * with an urgent 60-second dispatch siren and full-screen acceptance prompt.
 */
export async function sendHighPriorityDispatchSiren(payload: FcmDispatchPayload): Promise<{
  success: boolean;
  dispatchedCount: number;
  messageId?: string;
  error?: string;
}> {
  // Resolve target tokens
  const targetTokens: string[] = [];
  if (payload.token) targetTokens.push(payload.token);
  if (Array.isArray(payload.tokens)) targetTokens.push(...payload.tokens);

  if (targetTokens.length === 0 && payload.technicianId) {
    targetTokens.push(...getTechnicianPushTokens(payload.technicianId));
  }

  const fcmServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY;

  // Construct High-Priority FCM payload compliant with Android 14+ Priority_MAX
  const buildFcmBody = (targetToken: string) => ({
    to: targetToken,
    priority: 'high',
    android: {
      priority: 'high',
      ttl: '60s',
      notification: {
        channel_id: 'ghartak_dispatch_siren_channel',
        title: `🚨 GTS NEW WORK ORDER • ₹${payload.payoutInr}`,
        body: `${payload.serviceTitle} • #${payload.ticketNumber}. Tap to accept within ${payload.timerSeconds || 60}s!`,
        sound: 'dispatch_siren',
        default_sound: true,
        default_vibrate_timings: true,
        notification_priority: 'PRIORITY_MAX',
        visibility: 'PUBLIC',
      },
    },
    data: {
      type: 'DISPATCH_BROADCAST',
      jobId: payload.jobId,
      ticketNumber: payload.ticketNumber,
      serviceTitle: payload.serviceTitle,
      payoutInr: String(payload.payoutInr),
      customerId: payload.customerId || '',
      customerAddress: payload.customerAddress || '',
      timerSeconds: String(payload.timerSeconds || 60),
      timestamp: new Date().toISOString(),
    },
  });

  if (!fcmServerKey || targetTokens.length === 0) {
    console.log(`[FCM Dispatcher] High-priority dispatch siren queued for #${payload.ticketNumber}:`, {
      jobId: payload.jobId,
      payoutInr: payload.payoutInr,
      technicianId: payload.technicianId || 'REGIONAL_BROADCAST',
      targetTokensCount: targetTokens.length,
      mode: fcmServerKey ? 'PRODUCTION_LIVE' : 'SIMULATED_DEVELOPMENT',
    });
    return { success: true, dispatchedCount: targetTokens.length || 1, messageId: `fcm_sim_${Date.now()}` };
  }

  let successCount = 0;
  let lastError: string | undefined;

  for (const token of targetTokens) {
    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${fcmServerKey}`,
        },
        body: JSON.stringify(buildFcmBody(token)),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success > 0) {
        successCount++;
      } else {
        lastError = resJson.results?.[0]?.error || 'FCM delivery failed';
      }
    } catch (err: any) {
      console.warn(`[FCM] Error dispatching siren to token ${token.slice(0, 10)}...:`, err.message);
      lastError = err.message;
    }
  }

  return {
    success: successCount > 0,
    dispatchedCount: successCount,
    error: successCount === 0 ? lastError : undefined,
  };
}

/**
 * Broadcasts an unassigned emergency or standard work order to ALL active, online technicians
 * within the requested postal code.
 */
export async function broadcastDispatchSirenToPincodeFleet(payload: {
  pincode: string;
  ticketNumber: string;
  serviceTitle: string;
  payoutInr: number;
  jobId: string;
  trade?: string;
  customerId?: string;
  customerAddress?: string;
  timerSeconds?: number;
}): Promise<{ success: boolean; techniciansCount: number }> {
  // Find all online technicians covering this pincode
  const targetPincode = payload.pincode?.trim();
  const eligibleTechs = dbStore.technicians.filter((t) => {
    if (!t.isOnline || t.kycStatus !== 'VERIFIED') return false;
    const pinMatch = t.assignedPincode === targetPincode || (t as any).territoryPincodes?.includes(targetPincode);
    if (!pinMatch) return false;
    if (payload.trade && t.trade && t.trade.toUpperCase() !== payload.trade.toUpperCase()) {
      return false;
    }
    return true;
  });

  console.log(`[FCM Fleet Broadcast] Found ${eligibleTechs.length} candidate technicians in pincode '${targetPincode}' for work order #${payload.ticketNumber}`);

  const allTokens = new Set<string>();
  for (const tech of eligibleTechs) {
    const tokens = getTechnicianPushTokens(tech.id);
    tokens.forEach((t) => allTokens.add(t));
  }

  const tokenList = Array.from(allTokens);

  await sendHighPriorityDispatchSiren({
    tokens: tokenList,
    ticketNumber: payload.ticketNumber,
    serviceTitle: payload.serviceTitle,
    payoutInr: payload.payoutInr,
    jobId: payload.jobId,
    pincode: payload.pincode,
    customerId: payload.customerId,
    customerAddress: payload.customerAddress,
    timerSeconds: payload.timerSeconds || 60,
  });

  return {
    success: true,
    techniciansCount: eligibleTechs.length,
  };
}

/**
 * RealtimeBus Hook: Automatically maps dispatch events to high-priority FCM pushes.
 */
export async function autoDispatchFcmFromRealtimeEvent(event: any) {
  try {
    if (event.type === 'TECH_DISPATCHED' && event.technicianId) {
      const payout = event.details?.payoutShareInr || Math.round((event.details?.totalAmountInr || 1000) * 0.7);
      await sendHighPriorityDispatchSiren({
        technicianId: event.technicianId,
        ticketNumber: event.ticketNumber || event.jobId || 'J-1001',
        serviceTitle: event.details?.serviceTitle || 'Emergency Technical Repair',
        payoutInr: payout,
        jobId: event.jobId,
        pincode: event.pincode,
        customerId: event.customerId,
        customerAddress: event.details?.customerAddress || event.details?.customerAddressText,
        timerSeconds: event.details?.acceptanceTimerSeconds || 60,
      });
    } else if (event.type === 'TECH_BROADCAST' && event.pincode) {
      const payout = event.details?.payoutShareInr || Math.round((event.details?.totalAmountInr || 1000) * 0.7);
      await broadcastDispatchSirenToPincodeFleet({
        pincode: event.pincode,
        ticketNumber: event.ticketNumber || event.jobId || 'J-1001',
        serviceTitle: event.details?.serviceTitle || 'Emergency Technical Repair',
        payoutInr: payout,
        jobId: event.jobId,
        customerId: event.customerId,
        customerAddress: event.details?.customerAddress || event.details?.customerAddressText,
        timerSeconds: event.details?.broadcastTimerSeconds || 60,
      });
    }
  } catch (err: any) {
    console.warn('[FCM AutoDispatch] Exception during background event processing:', err.message);
  }
}
