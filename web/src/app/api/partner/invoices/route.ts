import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId') || 'ptnr_mah_01';
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const invoiceNumber = searchParams.get('invoiceNumber') || undefined;

    // Single invoice lookup (for PTNR-SCR-12 preview)
    if (invoiceNumber) {
      const singleInv = await db.getInvoiceByNumberOrId(invoiceNumber);
      if (!singleInv) {
        return NextResponse.json(
          { success: false, error: `Invoice '${invoiceNumber}' not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        invoice: singleInv,
      });
    }

    const invoices = await db.getAllInvoices({
      partnerId,
      status,
      search,
    });

    // Compute telemetry stats
    const allInvoices = await db.getAllInvoices({ partnerId });
    const paidInvoices = allInvoices.filter((i) => i.paymentStatus === 'PAID');
    const pendingInvoices = allInvoices.filter((i) => i.paymentStatus === 'ISSUED');

    const paidSettledAmount = paidInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const pendingEscrowAmount = pendingInvoices.reduce((acc, i) => acc + i.totalAmount, 0);

    return NextResponse.json({
      success: true,
      partnerId,
      stats: {
        totalInvoices: allInvoices.length,
        paidSettledCount: paidInvoices.length,
        paidSettledAmountInr: Math.round(paidSettledAmount * 100) / 100,
        pendingEscrowCount: pendingInvoices.length,
        pendingEscrowAmountInr: Math.round(pendingEscrowAmount * 100) / 100,
        monthlyBilledCount: allInvoices.length,
        monthlyGrossVolumeInr: Math.round((paidSettledAmount + pendingEscrowAmount) * 100) / 100,
        gstin: '27AABCU9603R1ZM',
        pan: 'AABCU9603R',
      },
      invoices,
    });
  } catch (error) {
    console.error('Failed to fetch partner invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error fetching invoices' },
      { status: 500 }
    );
  }
}
