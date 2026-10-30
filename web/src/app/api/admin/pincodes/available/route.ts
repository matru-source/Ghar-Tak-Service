import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { listStates, listDistricts, getPincodes, getDetails } from '@devzoy/indian-pincode';

export async function OPTIONS() {
  return corsOptionsResponse();
}

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => (w === 'and' ? 'and' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincodeParam = searchParams.get('pincode');
    const stateParam = searchParams.get('state');
    const districtParam = searchParams.get('district');
    const searchParam = searchParams.get('search');

    // Quick lookup for single 6-digit pincode
    if (pincodeParam && pincodeParam.length === 6) {
      const details = getDetails(pincodeParam.trim());
      if (details) {
        return apiSuccess(
          {
            lookup: {
              pincode: details.pincode,
              state: toTitleCase(details.state),
              district: details.districts && details.districts[0] ? toTitleCase(details.districts[0]) : '',
              districts: (details.districts || []).map((d) => toTitleCase(d)),
            },
          },
          'Pincode resolved successfully',
          200
        );
      }
    }

    // 1. Retrieve all standard Indian States and Union Territories (36 total)
    const rawStates = listStates();
    const formattedStates = rawStates.map((s) => toTitleCase(s));

    // 2. Fetch all currently assigned/claimed pincodes across all partners in DB
    const allAssigned = await db.getAllPincodes();
    const assignedSet = new Set(allAssigned.map((p) => String(p.pincode).trim()));

    // If no specific state is selected, return the master states directory & assigned metric
    if (!stateParam) {
      return apiSuccess(
        {
          states: formattedStates,
          totalAssignedPincodesCount: assignedSet.size,
        },
        'All Indian states retrieved successfully',
        200
      );
    }

    // 3. Match requested state case-insensitively
    const normalizedQuery = stateParam.trim().toLowerCase();
    const matchedStateUpper = rawStates.find((s) => s.toLowerCase() === normalizedQuery);

    if (!matchedStateUpper) {
      return apiError(
        `Invalid state '${stateParam}'. Please select a valid Indian State or Union Territory.`,
        400
      );
    }

    // 4. Retrieve all districts for this state
    const rawDistricts = listDistricts(matchedStateUpper);
    const formattedDistricts = rawDistricts.map((d) => toTitleCase(d));

    // 5. Retrieve all postal codes for this state from official registry
    const allStatePincodes = getPincodes({ state: matchedStateUpper });

    // 6. Exclusivity Filter: Omit any pincode that is already assigned to another partner
    let assignedInStateCount = 0;
    const availablePincodesList: Array<{
      pincode: string;
      district: string;
      state: string;
    }> = [];

    for (const pin of allStatePincodes) {
      if (assignedSet.has(pin)) {
        assignedInStateCount++;
      } else {
        const details = getDetails(pin);
        const districtName = details?.districts?.[0] ? toTitleCase(details.districts[0]) : 'General';
        availablePincodesList.push({
          pincode: pin,
          district: districtName,
          state: toTitleCase(matchedStateUpper),
        });
      }
    }

    // 7. Apply optional district filter
    let filteredPincodes = availablePincodesList;
    if (districtParam && districtParam !== 'ALL') {
      const distLower = districtParam.toLowerCase();
      filteredPincodes = filteredPincodes.filter((p) => p.district.toLowerCase() === distLower);
    }

    // 8. Apply optional search filter
    if (searchParam && searchParam.trim()) {
      const q = searchParam.trim().toLowerCase();
      filteredPincodes = filteredPincodes.filter(
        (p) => p.pincode.includes(q) || p.district.toLowerCase().includes(q)
      );
    }

    return apiSuccess(
      {
        states: formattedStates,
        selectedState: toTitleCase(matchedStateUpper),
        districts: formattedDistricts,
        totalPincodesInState: allStatePincodes.length,
        assignedPincodesInState: assignedInStateCount,
        availableCount: availablePincodesList.length,
        filteredCount: filteredPincodes.length,
        pincodes: filteredPincodes,
      },
      `Retrieved ${filteredPincodes.length} unassigned pincodes for ${toTitleCase(matchedStateUpper)}`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to load available territory pincodes',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

