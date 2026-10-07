import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode') || '400001';
    const coverage = await db.getPincodeCoverage(pincode);

    if (!coverage || !coverage.isActive) {
      return apiSuccess({
        serviceable: false,
        pincode,
        message: `Pincode ${pincode} outside active territory jurisdiction.`,
      }, 'Pincode outside coverage', 200);
    }

    return apiSuccess({
      serviceable: true,
      pincode: coverage.pincode,
      areaName: coverage.areaName,
      district: coverage.district,
      state: coverage.state,
      targetEtaMinutes: coverage.targetEtaMinutes,
      emergencySosAvailable: true,
      assignedPartnerName: coverage.partner?.entityName || 'Maharashtra Regional Operations Hub',
    }, `Pincode ${pincode} is serviceable`, 200);
  } catch (error) {
    return apiError('Failed to verify serviceability', 500, error instanceof Error ? error.message : String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pincode, latitude, longitude } = body;

    if (!pincode || typeof pincode !== 'string') {
      return apiError('Valid pincode is required', 400);
    }

    const cleanPin = pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return apiError('Postal pincode must be exactly 6 digits', 400);
    }

    const coverage = await db.getPincodeCoverage(cleanPin);

    if (!coverage || !coverage.isActive) {
      return apiSuccess(
        {
          serviceable: false,
          pincode: cleanPin,
          message: `ElectriCare electrical services are not currently available in pincode ${cleanPin}. Our Maharashtra expansion team is onboarding technicians rapidly!`,
          waitlistAvailable: true,
        },
        'Pincode outside active territory jurisdiction',
        200
      );
    }

    return apiSuccess(
      {
        serviceable: true,
        pincode: coverage.pincode,
        areaName: coverage.areaName,
        district: coverage.district,
        state: coverage.state,
        targetEtaMinutes: coverage.targetEtaMinutes,
        emergencySosAvailable: true,
        densityClassification: coverage.density,
        assignedPartnerName: coverage.partner?.entityName || 'Regional Operations Hub',
        clientCoordinatesSupplied: !!(latitude && longitude),
      },
      `Pincode ${cleanPin} is fully serviceable with sub-${coverage.targetEtaMinutes}-minute dispatch readiness!`,
      200
    );
  } catch (error) {
    return apiError('Failed to verify serviceability', 500, error instanceof Error ? error.message : String(error));
  }
}
