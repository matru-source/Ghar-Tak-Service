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
    const { jobId } = body;

    const job = await db.getJobById(jobId);
    if (!job) {
      return apiError(`Job ticket '${jobId}' not found`, 404);
    }

    const jobAny = job as any;
    const customerPhone = jobAny.customerPhone || jobAny.customer?.phone || '+919876543213';
    const techName = jobAny.technicianName || jobAny.technician?.fullName || jobAny.technician?.user?.fullName || 'Field Engineer';

    const smsRecord = await SmsGateway.sendSms(customerPhone, 'CUSTOMER_HANDOVER_OTP', {
      techName,
      handoverOtp: job.handoverOtp,
      ticketNumber: job.jobTicketNumber,
    });

    return apiSuccess(
      smsRecord,
      `Customer handover OTP SMS sent to ${customerPhone} with code '${job.handoverOtp}' for job ${job.jobTicketNumber}`
    );
  } catch (error) {
    return apiError(
      'Failed to send customer handover OTP SMS',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
