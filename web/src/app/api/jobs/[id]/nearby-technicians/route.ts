import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.getJobById(id);

    if (!job) {
      return apiError(`Job ticket '${id}' not found`, 404);
    }

    const { searchParams } = new URL(request.url);
    const maxDistanceKm = searchParams.get('maxDistanceKm')
      ? parseFloat(searchParams.get('maxDistanceKm')!)
      : 15.0;

    const nearbyTechs = await db.getNearbyTechnicians(job.customerLatitude, job.customerLongitude, {
      maxDistanceKm,
      excludeTechnicianIds: job.technicianId ? [job.technicianId] : [],
    });

    return apiSuccess(
      {
        jobTicketNumber: job.jobTicketNumber,
        customerAddress: job.customerAddressText,
        pincode: job.pincode,
        coordinates: { latitude: job.customerLatitude, longitude: job.customerLongitude },
        currentAssignedTechnician: job.technician
          ? {
              id: job.technician.id,
              name: (job.technician as any).fullName || (job.technician as any).user?.fullName || 'Assigned Technician',
              rating: job.technician.rating,
              isOnline: job.technician.isOnline,
            }
          : null,
        availableNearbyTechnicians: nearbyTechs.map((t) => ({
          id: t.id,
          fullName: t.fullName,
          phone: t.phone,
          badgeNumber: t.badgeNumber,
          rating: t.rating,
          assignedPincode: t.assignedPincode,
          distanceKm: t.distanceKm,
          estimatedTransitMinutes: t.estimatedTransitMinutes,
          isOnline: t.isOnline,
          kycStatus: t.kycStatus,
          insulatedGlovesVerified: t.insulatedGlovesVerified,
        })),
        totalNearbyFound: nearbyTechs.length,
      },
      `Found ${nearbyTechs.length} standby verified technicians within ${maxDistanceKm}km radius`
    );
  } catch (error) {
    return apiError(
      'Failed to fetch nearby technicians',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
