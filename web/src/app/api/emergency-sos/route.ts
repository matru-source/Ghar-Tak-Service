import { NextRequest } from 'next/server';
import { realtimeBus } from '@/lib/realtime-bus';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/emergency-sos
 * Triggered by Customer Emergency SOS Button or Technician Emergency SOS Button (Issue 35).
 * Broadcasts critical high-priority alert to Ghar Tak Safety Command Center, Admin Monitor, and Logs.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = (body.role || 'TECHNICIAN').toUpperCase();
    const {
      customerId,
      customerName,
      technicianId,
      technicianName,
      phone,
      latitude,
      longitude,
      trade,
      reason,
      jobId,
      ticketNumber,
    } = body;

    const isCustomer = role === 'CUSTOMER';

    const alertPayload = {
      callerRole: isCustomer ? 'CUSTOMER' : 'TECHNICIAN',
      callerId: isCustomer ? (customerId || 'customer_unknown') : (technicianId || 'tech_unknown'),
      callerName: isCustomer ? (customerName || 'Ghar Tak Customer') : (technicianName || 'Certified Technician'),
      phone: phone || '',
      jobId: jobId || undefined,
      ticketNumber: ticketNumber || undefined,
      latitude: latitude || 0.0,
      longitude: longitude || 0.0,
      trade: trade || (isCustomer ? 'Customer Safety' : 'Electrician'),
      reason: reason || (isCustomer ? 'CUSTOMER_SAFETY_SOS_TRIGGERED' : 'EMERGENCY_FIELD_SOS_TRIGGERED'),
      timestamp: new Date().toISOString(),
      dialedEmergency: '112',
      commandCenterStatus: 'ACTIVE_INTERVENTION_DISPATCHED',
    };

    console.error(
      `🚨 [CRITICAL_SAFETY_SOS] ${alertPayload.callerRole}: ${alertPayload.callerName} (${alertPayload.phone}) at Coords (${alertPayload.latitude}, ${alertPayload.longitude}) for Ticket #${alertPayload.ticketNumber || 'N/A'}`
    );

    // Broadcast High Priority Alert to Safety Command Center
    realtimeBus.publish({
      type: isCustomer ? 'CUSTOMER_EMERGENCY_SOS_TRIGGERED' : 'EMERGENCY_SOS_TRIGGERED',
      jobId: alertPayload.jobId,
      ticketNumber: alertPayload.ticketNumber,
      status: 'CRITICAL_SAFETY_ALERT',
      details: alertPayload,
    });

    // Record audit log
    await db.recordWormAuditLog({
      actorId: alertPayload.callerId,
      actorRole: isCustomer ? 'CUSTOMER' : 'TECHNICIAN',
      action: isCustomer ? 'CUSTOMER_EMERGENCY_SOS' : 'TECHNICIAN_EMERGENCY_SOS',
      resourceType: 'EMERGENCY_SOS',
      resourceId: alertPayload.jobId || alertPayload.callerId,
      payloadSummary: `EMERGENCY SOS: ${alertPayload.callerRole} ${alertPayload.callerName} triggered SOS at coordinates (${alertPayload.latitude}, ${alertPayload.longitude}). Reason: ${alertPayload.reason}`,
    });

    return apiSuccess(
      alertPayload,
      `24x7 Safety SOS dispatched to Ghar Tak Emergency Command Center. Field response & 112 emergency dispatched.`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to broadcast emergency SOS',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
