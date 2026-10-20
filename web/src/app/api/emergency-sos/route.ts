import { NextRequest } from 'next/server';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/emergency-sos
 * Triggered by Technician Emergency SOS Button (1000V shock, physical hazard, road accident).
 * Broadcasts critical high-priority alert to Partner Console, Admin Monitor, and Logs.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { technicianId, technicianName, phone, latitude, longitude, trade, reason } = body;

    const alertPayload = {
      technicianId: technicianId || 'tech_unknown',
      technicianName: technicianName || 'Certified Technician',
      phone: phone || '',
      latitude: latitude || 0.0,
      longitude: longitude || 0.0,
      trade: trade || 'Electrician',
      reason: reason || 'EMERGENCY_FIELD_SOS_TRIGGERED',
      timestamp: new Date().toISOString(),
      dialedEmergency: '112',
    };

    console.error(`🚨 [CRITICAL_SOS_EMERGENCY] Technician: ${alertPayload.technicianName} (${alertPayload.phone}) at Coords (${alertPayload.latitude}, ${alertPayload.longitude})`);

    // Broadcast High Priority Alert
    realtimeBus.publish({
      type: 'EMERGENCY_SOS_TRIGGERED',
      technicianId: alertPayload.technicianId,
      status: 'CRITICAL_ALERT',
      details: alertPayload,
    });

    return apiSuccess(alertPayload, 'Emergency SOS alert recorded and dispatched to operations center', 200);

  } catch (error) {
    return apiError(
      'Failed to broadcast emergency SOS',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
