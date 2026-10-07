import { NextRequest } from 'next/server';
import { PaymentGateway } from '@/lib/payment-gateway';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, jobId } = body;

    let invoice = dbStore.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    let job = jobId ? await db.getJobById(jobId) : null;

    if (!invoice && job) {
      const targetJob = job;
      invoice = dbStore.invoices.find((i) => i.jobId === targetJob.id);
    }
    if (invoice && !job) {
      job = await db.getJobById(invoice.jobId);
    }

    if (!invoice || !job) {
      return apiError("Valid 'invoiceId' or 'jobId' is required", 400);
    }

    const upiUrl = PaymentGateway.generateUpiIntentUrl(
      invoice.totalAmount,
      job.jobTicketNumber,
      invoice.invoiceNumber
    );

    return apiSuccess(
      {
        invoiceNumber: invoice.invoiceNumber,
        totalAmountInr: invoice.totalAmount,
        upiIntentUrl: upiUrl,
        supportedApps: ['Google Pay (GPay)', 'PhonePe', 'Paytm UPI', 'BHIM UPI', 'Cred UPI'],
      },
      `NPCI UPI Intent deep link generated for invoice '${invoice.invoiceNumber}' (₹${invoice.totalAmount})`
    );
  } catch (error) {
    return apiError(
      'Failed to generate UPI Intent URL',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
