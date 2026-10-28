import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = extractBearerToken(request);
    const payload = token ? await verifyAccessToken(token) : null;
    const partnerId = searchParams.get('partnerId') || payload?.partnerId || 'partner_hub';

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
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authorization Bearer token required' }, { status: 401 });
    }
    const payload = await verifyAccessToken(token);
    if (!payload || (payload.role !== 'PARTNER' && payload.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Access denied: PARTNER or SUPER_ADMIN role required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      partnerId,
      directorName,
      phone,
      email,
      bankName,
      bankAccountNumber,
      ifscCode,
    } = body;

    const targetPartnerId = partnerId || payload.partnerId || 'partner_hub';

    const updatedPartner = await db.updatePartnerProfile(targetPartnerId, {
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
      actorId: payload.sub,
      actorRole: payload.role,
      action: 'UPDATE_PARTNER_BANKING_PROFILE',
      resourceType: 'PARTNER_PROFILE',
      resourceId: targetPartnerId,
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
