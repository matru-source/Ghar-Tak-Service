import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId') || 'ptnr_mah_01';
    const pincode = searchParams.get('pincode') || undefined;
    const isOnlineParam = searchParams.get('isOnline');
    const isOnline = isOnlineParam !== null ? isOnlineParam === 'true' : undefined;
    const kycStatus = searchParams.get('kycStatus') || undefined;
    const search = searchParams.get('search') || undefined;

    const technicians = await db.getAllTechnicians({
      partnerId,
      pincode,
      isOnline,
      kycStatus,
      search,
    });

    // Compute regional fleet stats
    const allTechs = await db.getAllTechnicians({ partnerId });
    const totalFleet = allTechs.length;
    const onlineCount = allTechs.filter((t) => t.isOnline).length;
    const pendingKycCount = allTechs.filter((t) => t.kycStatus === 'PENDING_REVIEW').length;
    const verifiedKycCount = allTechs.filter((t) => t.kycStatus === 'VERIFIED').length;
    const safetyGearVerifiedCount = allTechs.filter((t) => t.insulatedGlovesVerified).length;

    return NextResponse.json({
      success: true,
      partnerId,
      stats: {
        totalFleet,
        onlineCount,
        offlineCount: totalFleet - onlineCount,
        pendingKycCount,
        verifiedKycCount,
        safetyGearVerifiedCount,
        onlinePercentage: totalFleet > 0 ? Math.round((onlineCount / totalFleet) * 100) : 0,
      },
      technicians,
    });
  } catch (error) {
    console.error('Failed to fetch partner fleet roster:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error fetching fleet roster' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { technicianId, isOnline, assignedPincode, insulatedGlovesVerified, safetyKitSerial, actorId } = body;

    if (!technicianId) {
      return NextResponse.json(
        { success: false, error: 'technicianId is required' },
        { status: 400 }
      );
    }

    const updatedTech = await db.updateTechnicianShiftAndPincode(technicianId, {
      isOnline,
      assignedPincode,
      insulatedGlovesVerified,
      safetyKitSerial,
    });

    if (!updatedTech) {
      return NextResponse.json(
        { success: false, error: 'Technician not found' },
        { status: 404 }
      );
    }

    const techName = (updatedTech as any).fullName || (updatedTech as any).user?.fullName || 'Technician';
    const auditSummary = `Partner Shift/Roster Update: ${techName} (${(updatedTech as any).badgeNumber}) - isOnline=${(updatedTech as any).isOnline}, pincode=${(updatedTech as any).assignedPincode}`;
    const auditLog = await db.recordWormAuditLog({
      actorId: actorId || 'usr_partner_01',
      actorRole: 'PARTNER',
      action: 'UPDATE_FLEET_SHIFT_ASSIGNMENT',
      resourceType: 'TECHNICIAN',
      resourceId: technicianId,
      payloadSummary: auditSummary,
    });

    return NextResponse.json({
      success: true,
      message: 'Technician shift & pincode updated successfully',
      technician: updatedTech,
      auditLog: {
        sequenceNumber: auditLog.sequenceNumber,
        currentHash: auditLog.currentHash,
        timestamp: auditLog.timestamp,
      },
    });
  } catch (error) {
    console.error('Failed to update technician roster:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error updating technician shift' },
      { status: 500 }
    );
  }
}
