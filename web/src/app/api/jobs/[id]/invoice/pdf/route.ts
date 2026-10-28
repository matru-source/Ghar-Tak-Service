import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { isDatabaseConnected } from '@/lib/db';
import { generateGstTaxInvoicePdf } from '@/lib/pdf-invoice';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.findOrRecoverJob(id);
    if (!job) {
      return NextResponse.json({ error: `Job '${id}' not found` }, { status: 404 });
    }

    let invoice = dbStore.invoices.find((i) => i.jobId === job.id || i.jobId === job.jobTicketNumber);

    if (!invoice && (await isDatabaseConnected())) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const dbInv = await prisma.invoice.findFirst({
          where: { OR: [{ jobId: job.id }, { job: { jobTicketNumber: job.jobTicketNumber } }] },
        });
        if (dbInv) {
          invoice = dbInv as any;
        }
      } catch (_) {}
    }

    if (!invoice) {
      invoice = {
        id: `inv_${Date.now()}`,
        invoiceNumber: `INV-2026-${job.jobTicketNumber.replace(/\D/g, '').slice(-5) || '10240'}`,
        jobId: job.id,
        customerId: job.customerId,
        partnerId: job.partnerId,
        baseAmount: job.totalAmountInr ? Math.round(job.totalAmountInr / 1.18) : 850,
        cgstAmount: job.totalAmountInr ? Math.round((job.totalAmountInr / 1.18) * 0.09) : 76.5,
        sgstAmount: job.totalAmountInr ? Math.round((job.totalAmountInr / 1.18) * 0.09) : 76.5,
        totalAmount: job.totalAmountInr || 1003,
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        createdAt: new Date().toISOString(),
      };
    }

    const baseLabor = invoice.baseAmount || 850;
    const cgst = invoice.cgstAmount || Math.round(baseLabor * 0.09);
    const sgst = invoice.sgstAmount || Math.round(baseLabor * 0.09);
    const total = invoice.totalAmount || baseLabor + cgst + sgst;

    const pdfBuffer = generateGstTaxInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.createdAt || new Date().toISOString(),
      jobTicketNumber: job.jobTicketNumber,
      customerName: job.customerName || 'Customer',
      customerPhone: job.customerPhone || '',
      customerAddress: job.customerAddressText || 'Pan-India',
      customerPincode: job.pincode || '400001',
      technicianName: job.technicianName || 'Specialist',
      serviceTitle: job.serviceTitle || (job as any).serviceCategory || 'Electrical Repair & Diagnostic',
      baseLaborInr: baseLabor,
      partsInr: 0,
      taxableValueInr: baseLabor,
      cgstRatePct: 9.0,
      cgstAmountInr: cgst,
      sgstRatePct: 9.0,
      sgstAmountInr: sgst,
      totalAmountInr: total,
      paymentMethod: invoice.paymentMethod || 'UPI',
      paymentStatus: invoice.paymentStatus || 'PAID',
    });

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate tax invoice PDF', details: error.message },
      { status: 500 }
    );
  }
}
