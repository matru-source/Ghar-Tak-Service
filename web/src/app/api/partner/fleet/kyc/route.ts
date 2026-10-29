import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { realtimeBus } from '@/lib/realtime-bus';
import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    let verifierId = 'usr_partner_01';
    let actorRole: any = 'PARTNER';
    if (token) {
      const payload = await verifyAccessToken(token);
      if (!payload || (payload.role !== 'PARTNER' && payload.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ success: false, error: 'Access denied: PARTNER or SUPER_ADMIN role required' }, { status: 403 });
      }
      verifierId = payload.sub || verifierId;
      actorRole = payload.role || actorRole;
    }

    const body = await request.json();
    const {
      technicianId,
      status, // 'VERIFIED' | 'REJECTED'
      reason,
      insulatedGlovesVerified,
    } = body;

    if (!technicianId || !status) {
      return NextResponse.json(
        { success: false, error: 'technicianId and status (VERIFIED | REJECTED) are required' },
        { status: 400 }
      );
    }

    if (status !== 'VERIFIED' && status !== 'REJECTED') {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be VERIFIED or REJECTED' },
        { status: 400 }
      );
    }

    const updatedTech = await db.updateTechnicianKycStatus(technicianId, status, {
      reason,
      verifierId,
      insulatedGlovesVerified: status === 'VERIFIED' ? Boolean(insulatedGlovesVerified) : false,
    });

    if (!updatedTech) {
      return NextResponse.json(
        { success: false, error: 'Technician not found' },
        { status: 404 }
      );
    }

    // Record WORM audit log for regulatory compliance
    const actionDesc = status === 'VERIFIED' ? 'APPROVE_TECHNICIAN_KYC' : 'REJECT_TECHNICIAN_KYC';
    const techName = (updatedTech as any).fullName || (updatedTech as any).user?.fullName || 'Technician';
    const auditSummary = `Partner Regulatory Audit Decision: ${techName} (${(updatedTech as any).badgeNumber}) marked ${status}. License=${(updatedTech as any).electricalLicenseNumber}, Gloves=${(updatedTech as any).insulatedGlovesVerified ? 'Verified' : 'Unverified'}. Reason/Notes: ${reason || 'N/A'}`;
    
    const auditLog = await db.recordWormAuditLog({
      actorId: verifierId,
      actorRole,
      action: actionDesc,
      resourceType: 'TECHNICIAN_KYC',
      resourceId: technicianId,
      payloadSummary: auditSummary,
    });

    realtimeBus.publish({
      type: status === 'VERIFIED' ? 'TECH_KYC_VERIFIED' : 'TECH_AVAILABILITY_CHANGED',
      technicianId,
      partnerId: (updatedTech as any).partnerId || 'ptnr_mah_01',
      details: {
        kycStatus: status,
        fullName: techName,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Technician KYC ${status.toLowerCase()} successfully`,
      technician: updatedTech,
      auditLog: {
        sequenceNumber: auditLog.sequenceNumber,
        currentHash: auditLog.currentHash,
        timestamp: auditLog.timestamp,
      },
    });
  } catch (error) {
    console.error('Failed to process technician KYC screening:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error processing KYC screening' },
      { status: 500 }
    );
  }
}
