import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId') || 'ptnr_mah_01';

    const profile = await db.getPartnerProfile(partnerId);

    return NextResponse.json({
      success: true,
      partner: profile,
    });
  } catch (error) {
    console.error('Failed to fetch partner profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error fetching partner profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      partnerId = 'ptnr_mah_01',
      directorName,
      phone,
      email,
      bankName,
      bankAccountNumber,
      ifscCode,
      actorId,
    } = body;

    const updatedPartner = await db.updatePartnerProfile(partnerId, {
      ...(directorName ? { directorName } : {}),
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      ...(bankName ? { bankName } : {}),
      ...(bankAccountNumber ? { bankAccountNumber } : {}),
      ...(ifscCode ? { ifscCode } : {}),
    });

    // Record WORM audit trail log for statutory banking update
    const auditSummary = `Franchise Bank Settlement Update: [${updatedPartner.entityName}] Bank=${updatedPartner.bankName}, A/C=${updatedPartner.bankAccountNumber.slice(-4).padStart(updatedPartner.bankAccountNumber.length, 'X')}, IFSC=${updatedPartner.ifscCode}`;
    const auditLog = await db.recordWormAuditLog({
      actorId: actorId || 'usr_partner_01',
      actorRole: 'PARTNER',
      action: 'UPDATE_PARTNER_BANKING_PROFILE',
      resourceType: 'PARTNER_PROFILE',
      resourceId: partnerId,
      payloadSummary: auditSummary,
    });

    return NextResponse.json({
      success: true,
      message: 'Franchise entity profile & bank details updated successfully',
      partner: updatedPartner,
      auditLog: {
        sequenceNumber: auditLog.sequenceNumber,
        currentHash: auditLog.currentHash,
        timestamp: auditLog.timestamp,
      },
    });
  } catch (error) {
    console.error('Failed to update partner profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error updating partner profile' },
      { status: 500 }
    );
  }
}
