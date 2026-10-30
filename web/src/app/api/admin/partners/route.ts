import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const partners = await db.getAllPartners({ state, status, search });

    // Calculate macro aggregations
    const totalPartners = partners.length;
    const activePincodesCovered = partners.reduce((sum, p) => sum + (p.activePincodesCount || 0), 0);
    const totalFleetCapacity = partners.reduce((sum, p) => sum + (p.activeTechnicianQuota || 0), 0);
    const activeTechniciansRostered = partners.reduce((sum, p) => sum + (p.activeTechnicianCount || 0), 0);
    const uniqueStates = Array.from(new Set(partners.flatMap((p) => p.allocatedStates || [p.stateLicensed])));

    return apiSuccess(
      {
        partners,
        metrics: {
          totalPartners,
          activePincodesCovered,
          totalFleetCapacity,
          activeTechniciansRostered,
          activeStatesCount: uniqueStates.length,
          uniqueStates,
        },
      },
      'Franchise partners retrieved successfully'
    );
  } catch (error) {
    return apiError(
      'Failed to retrieve franchise partners',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return apiError('Missing or malformed Authorization header. Bearer token required.', 401);
    }
    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return apiError('Access denied: SUPER_ADMIN role authorization required.', 403);
    }

    const body = await request.json();
    const {
      entityName,
      directorName,
      email,
      phone,
      companyRegistrationNumber,
      gstin,
      stateLicensed,
      allocatedStates,
      allocatedPincodes,
      maxPincodeQuota,
      activeTechnicianQuota,
      platformRevenueSharePct,
      partnerRevenueSharePct,
      ifscCode,
      bankAccountNumber,
      bankName,
    } = body;

    if (!entityName || !directorName || !email || !phone || !stateLicensed || !gstin || !ifscCode || !bankAccountNumber || !bankName) {
      return apiError(
        'Missing mandatory fields: entityName, directorName, email, phone, stateLicensed, gstin, ifscCode, bankAccountNumber, and bankName are all required.',
        400
      );
    }

    // Exclusivity Check: Ensure none of the requested pincodes are already assigned to another partner
    const requestedPincodes: string[] = Array.isArray(allocatedPincodes)
      ? Array.from(new Set(allocatedPincodes.map((p: any) => String(p).trim()))).filter((p) => p.length === 6)
      : [];

    if (requestedPincodes.length > 0) {
      const allAssigned = await db.getAllPincodes();
      const assignedSet = new Set(allAssigned.map((p) => String(p.pincode).trim()));
      const conflicts = requestedPincodes.filter((p) => assignedSet.has(p));

      if (conflicts.length > 0) {
        return apiError(
          `Territorial conflict: Pincode(s) ${conflicts.slice(0, 5).join(', ')}${conflicts.length > 5 ? ` and ${conflicts.length - 5} more` : ''} are already assigned to an existing franchise partner.`,
          409
        );
      }
    }

    const partner = await db.createPartner({
      entityName,
      directorName,
      email,
      phone,
      companyRegistrationNumber: companyRegistrationNumber || `CIN-${stateLicensed.substring(0, 2).toUpperCase()}-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      gstin,
      stateLicensed,
      allocatedStates: allocatedStates || [stateLicensed],
      maxPincodeQuota: Math.max(Number(maxPincodeQuota) || 30, requestedPincodes.length + 10),
      activeTechnicianQuota: Number(activeTechnicianQuota) || 50,
      platformRevenueSharePct: Number(platformRevenueSharePct) || 15.0,
      partnerRevenueSharePct: Number(partnerRevenueSharePct) || 15.0,
      ifscCode: String(ifscCode).trim().toUpperCase(),
      bankAccountNumber: String(bankAccountNumber).trim(),
      bankName: String(bankName).trim(),
    });

    // Allocate selected pincodes to the newly onboarded partner
    if (requestedPincodes.length > 0) {
      const { getDetails } = await import('@devzoy/indian-pincode');
      for (const pin of requestedPincodes) {
        const details = getDetails(pin);
        const districtName = details?.districts?.[0]
          ? details.districts[0].charAt(0).toUpperCase() + details.districts[0].slice(1).toLowerCase()
          : 'General District';
        await db.createPincode({
          pincode: pin,
          areaName: `${districtName} Hub (${pin})`,
          district: districtName,
          state: stateLicensed,
          partnerId: partner.id,
          isActive: true,
          isExclusive: true,
        });
      }
      await db.updatePartner(partner.id, {
        activePincodesCount: requestedPincodes.length,
        maxPincodeQuota: Math.max(Number(maxPincodeQuota) || 30, requestedPincodes.length + 10),
      });
      partner.activePincodesCount = requestedPincodes.length;
    }

    // WORM Audit Logging
    await db.recordWormAuditLog({
      actorId: payload.sub,
      actorRole: payload.role,
      action: 'ONBOARD_FRANCHISE_PARTNER',
      resourceType: 'PARTNER',
      resourceId: partner.id,
      payloadSummary: `Onboarded partner ${entityName} in state ${stateLicensed} with ${requestedPincodes.length} exclusive pincodes allocated.`,
    });

    return apiSuccess(partner, `Franchise partner '${entityName}' onboarded successfully with ${requestedPincodes.length} allocated pincodes`, 201);
  } catch (error) {
    return apiError(
      'Failed to onboard franchise partner',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
