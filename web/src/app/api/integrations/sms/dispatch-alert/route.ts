import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { SmsGateway } from '@/lib/sms-gateway';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, technicianId } = body;

    const job = await db.getJobById(jobId);
    if (!job) {
      return apiError(`Job ticket '${jobId}' not found`, 404);
    }

    const techId = technicianId || job.technicianId;
    if (!techId) {
      return apiError('No technician assigned to this job ticket', 400);
    }

    const tech = await db.getTechnicianById(techId);
    if (!tech) {
      return apiError(`Technician '${techId}' not found`, 404);
    }

    const techAny = tech as any;
    const jobAny = job as any;
    const techPhone = techAny.phone || techAny.user?.phone || '+919876543212';
    const techName = techAny.fullName || techAny.user?.fullName || 'Field Technician';
    const fee = jobAny.totalAmountInr || 1250;

    const smsRecord = await SmsGateway.sendSms(techPhone, 'JOB_DISPATCH_ALERT', {
      ticketNumber: job.jobTicketNumber,
      areaName: 'Colaba Hub',
      pincode: job.pincode,
      fee,
    });

    return apiSuccess(
      smsRecord,
      `Dispatch alert SMS sent to technician ${techName} (${techPhone}) for work order ${job.jobTicketNumber}`
    );
  } catch (error) {
    return apiError(
      'Failed to dispatch technician SMS alert',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
