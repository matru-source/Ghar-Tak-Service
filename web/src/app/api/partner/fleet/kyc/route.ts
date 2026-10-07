import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      technicianId,
      status, // 'VERIFIED' | 'REJECTED'
      reason,
      insulatedGlovesVerified,
      actorId,
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
      verifierId: actorId || 'usr_partner_01',
      insulatedGlovesVerified: insulatedGlovesVerified !== undefined ? insulatedGlovesVerified : (status === 'VERIFIED'),
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
      actorId: actorId || 'usr_partner_01',
      actorRole: 'PARTNER',
      action: actionDesc,
      resourceType: 'TECHNICIAN_KYC',
      resourceId: technicianId,
      payloadSummary: auditSummary,
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
