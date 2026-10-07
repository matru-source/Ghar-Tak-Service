import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId') || 'ptnr_mah_01';
    const city = searchParams.get('city'); // e.g. Mumbai, Pune
    const search = searchParams.get('search');

    // Get all pincodes for the partner
    let pincodes: any[] = await db.getAllPincodes({ partnerId, search: search || undefined });

    if (city && city !== 'ALL') {
      pincodes = pincodes.filter((p) => {
        if (city.toLowerCase().includes('mumbai')) return p.district.toLowerCase().includes('mumbai') || p.areaName.toLowerCase().includes('mumbai');
        if (city.toLowerCase().includes('pune')) return p.district.toLowerCase().includes('pune') || p.areaName.toLowerCase().includes('pune');
        return true;
      });
    }

    // Get all technicians and jobs for this partner to calculate live telemetry
    const technicians = await db.getAllTechnicians({ partnerId });
    const jobs = await db.getJobs({ partnerId });

    // Enhance each pincode with live fleet & capacity telemetry
    const enrichedPincodes = pincodes.map((pin) => {
      const assignedTechs = technicians.filter((t) => t.assignedPincode === pin.pincode);
      const onlineTechs = assignedTechs.filter((t) => t.isOnline);
      const activeJobs = jobs.filter(
        (j) => j.pincode === pin.pincode && !['WORK_COMPLETED', 'SETTLED', 'CANCELLED'].includes(j.status)
      );

      const maxCapacity = pin.activeCapacityCount || 10;
      const currentLoad = assignedTechs.length;
      const utilizationPct = maxCapacity > 0 ? Math.min(100, Math.round((currentLoad / maxCapacity) * 100)) : 0;

      let capacityStatus: 'NORMAL' | 'LIMITED' | 'SURGE_GAP' = 'NORMAL';
      if (utilizationPct >= 90) capacityStatus = 'SURGE_GAP';
      else if (utilizationPct >= 70) capacityStatus = 'LIMITED';

      return {
        ...pin,
        assignedTechsCount: assignedTechs.length,
        onlineTechsCount: onlineTechs.length,
        activeJobsCount: activeJobs.length,
        maxCapacity,
        utilizationPct,
        capacityStatus,
        slaReadinessScore: Math.max(75, 100 - (pin.targetEtaMinutes > 20 ? 15 : 5)),
      };
    });

    // Regional telemetry summary
    const totalPincodes = enrichedPincodes.length;
    const totalAssignedTechs = technicians.length;
    const totalOnlineTechs = technicians.filter((t) => t.isOnline).length;
    const totalActiveJobs = jobs.filter(
      (j) => !['WORK_COMPLETED', 'SETTLED', 'CANCELLED'].includes(j.status)
    ).length;
    const coverageGapsCount = enrichedPincodes.filter((p) => p.capacityStatus === 'SURGE_GAP' || p.onlineTechsCount === 0).length;

    return NextResponse.json({
      success: true,
      partnerId,
      summary: {
        totalPincodes,
        totalAssignedTechs,
        totalOnlineTechs,
        totalActiveJobs,
        coverageGapsCount,
        avgEtaMinutes: Math.round(
          enrichedPincodes.reduce((acc, p) => acc + (p.targetEtaMinutes || 15), 0) / (totalPincodes || 1)
        ),
      },
      pincodes: enrichedPincodes,
    });
  } catch (error) {
    console.error('Failed to fetch partner capacity heatmap:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error fetching capacity data' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pincode,
      activeCapacityCount,
      targetEtaMinutes,
      perimeterRadiusKm,
      isExclusive,
      isActive,
      actorId,
    } = body;

    if (!pincode) {
      return NextResponse.json(
        { success: false, error: 'pincode is required' },
        { status: 400 }
      );
    }

    const updatedPin = await db.updatePincodeCapacity(pincode, {
      activeCapacityCount,
      targetEtaMinutes,
      perimeterRadiusKm,
      isExclusive,
      isActive,
    });

    if (!updatedPin) {
      return NextResponse.json(
        { success: false, error: 'Pincode not found' },
        { status: 404 }
      );
    }

    // Record WORM audit log
    const auditSummary = `Partner Pincode Perimeter Update: [${pincode}] Radius=${(updatedPin as any).perimeterRadiusKm || 5}km, TargetETA=${updatedPin.targetEtaMinutes}m, MaxCapacity=${updatedPin.activeCapacityCount}, Exclusive=${updatedPin.isExclusive}`;
    const auditLog = await db.recordWormAuditLog({
      actorId: actorId || 'usr_partner_01',
      actorRole: 'PARTNER',
      action: 'UPDATE_PINCODE_TERRITORY_CAPACITY',
      resourceType: 'PINCODE_TERRITORY',
      resourceId: pincode,
      payloadSummary: auditSummary,
    });

    return NextResponse.json({
      success: true,
      message: `Pincode ${pincode} capacity and perimeter updated successfully`,
      pincode: updatedPin,
      auditLog: {
        sequenceNumber: auditLog.sequenceNumber,
        currentHash: auditLog.currentHash,
        timestamp: auditLog.timestamp,
      },
    });
  } catch (error) {
    console.error('Failed to update pincode capacity:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error updating pincode capacity' },
      { status: 500 }
    );
  }
}
