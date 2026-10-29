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

    let invoice: any = null;
    let job: any = null;
    let customer: any = null;
    let technician: any = null;

    if (await isDatabaseConnected()) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const dbInv = await prisma.invoice.findFirst({
          where: { OR: [{ id }, { invoiceNumber: id }, { jobId: id }] },
          include: {
            job: {
              include: {
                service: true,
                technician: { include: { user: true } },
                customer: { include: { user: true } },
              },
            },
          },
        });
        if (dbInv) {
          invoice = dbInv;
          job = dbInv.job;
          customer = dbInv.job?.customer;
          technician = dbInv.job?.technician;
        }
      } catch (_) {}
    }

    if (!invoice) {
      invoice = dbStore.invoices.find((i) => i.id === id || i.invoiceNumber === id || i.jobId === id);
      if (invoice) {
        job = dbStore.jobs.find((j) => j.id === invoice.jobId || j.jobTicketNumber === invoice.jobId);
        customer = job ? dbStore.customers.find((c) => c.id === job.customerId || c.userId === job.customerId) : null;
        technician = job && job.technicianId ? dbStore.technicians.find((t) => t.id === job.technicianId || t.badgeNumber === job.technicianId) : null;
      }
    }

    if (!invoice) {
      return NextResponse.json({ error: `Tax Invoice '${id}' not found` }, { status: 404 });
    }

    const baseLabor = invoice.baseAmount || 850;
    const cgst = invoice.cgstAmount || Math.round(baseLabor * 0.09);
    const sgst = invoice.sgstAmount || Math.round(baseLabor * 0.09);
    const total = invoice.totalAmount || baseLabor + cgst + sgst;

    const pdfBuffer = generateGstTaxInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.createdAt || new Date().toISOString(),
      jobTicketNumber: job?.jobTicketNumber || invoice.jobId || 'TKT-1024',
      customerName: customer?.fullName || customer?.user?.fullName || job?.customerName || 'Customer',
      customerPhone: customer?.phone || customer?.user?.phone || job?.customerPhone || '',
      customerAddress: customer?.defaultAddressLine || job?.customerAddressText || 'Pan-India',
      customerPincode: customer?.defaultPincode || job?.pincode || '400001',
      technicianName: technician?.fullName || technician?.user?.fullName || job?.technicianName || 'Specialist',
      technicianBadge: technician?.badgeNumber || 'Certified',
      serviceTitle: job?.serviceTitle || job?.service?.title || 'Electrical Repair & Diagnostic',
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
