import { NextRequest } from 'next/server';
import { PaymentGateway } from '@/lib/payment-gateway';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, jobId } = body;

    let invoice: any = null;
    let job: any = null;

    if (invoiceId) {
      invoice = dbStore.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
      if (invoice) {
        job = await db.getJobById(invoice.jobId);
      }
    } else if (jobId) {
      job = await db.getJobById(jobId);
      if (job) {
        invoice = dbStore.invoices.find((i) => i.jobId === job.id);
      }
    }

    if (!invoice || !job) {
      return apiError("Valid 'invoiceId' or 'jobId' with generated invoice is required", 400);
    }

    const phone = job.customerPhone || job.customer?.phone || body.customerPhone;
    if (!phone) {
      return apiError('Customer phone number is required to initialize payment gateway order', 400);
    }
    const name = job.customerName || job.customer?.fullName || body.customerName || 'Customer';

    const orderData = PaymentGateway.createOrder({
      invoiceId: invoice.id,
      jobTicketNumber: job.jobTicketNumber,
      amountInr: invoice.totalAmount,
      customerPhone: phone,
      customerName: name,
    });

    return apiSuccess(
      orderData,
      `Payment order '${orderData.orderId}' initialized for invoice '${invoice.invoiceNumber}'. Total: ₹${invoice.totalAmount} (${orderData.amountPaise} paise).`,
      201
    );
  } catch (error) {
    return apiError(
      'Failed to create payment order',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
import { dbStore } from '@/lib/mock-data';
