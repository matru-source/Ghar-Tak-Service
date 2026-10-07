import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { dbStore } from '@/lib/mock-data';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.getJobById(id);

    if (!job) {
      return NextResponse.json({ success: false, error: `Job '${id}' not found` }, { status: 404 });
    }

    // Associated ledger entries
    const ledgers = dbStore.ledgerEntries.filter(
      (l) => l.jobTicketNumber === job.jobTicketNumber || l.invoiceId === job.invoice?.id
    );

    // Associated customer profile
    const customer = dbStore.customers.find((c) => c.id === job.customerId || c.userId === job.customerId);

    // Associated technician
    const technician = job.technicianId
      ? dbStore.technicians.find((t) => t.id === job.technicianId || t.userId === job.technicianId)
      : null;

    // SLA Telemetry
    const now = Date.now();
    const expiry = new Date(job.slaExpiryAt).getTime();
    const remainingMinutes = Math.round((expiry - now) / 60000);
    const isBreached = remainingMinutes < 0 && !['WORK_COMPLETED', 'SETTLED', 'COMPLETED'].includes(job.status);

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        customerProfile: customer,
        technicianProfile: technician,
        ledgers,
        slaTelemetry: {
          slaExpiryAt: job.slaExpiryAt,
          remainingMinutes,
          isBreached,
          status: isBreached ? 'BREACHED' : remainingMinutes <= 10 ? 'AT_RISK' : 'ON_TRACK',
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, safetyGlovesConfirmed, safetyMcbSwitchConfirmed, handoverOtpInput } = body;

    const jobIndex = dbStore.jobs.findIndex((j) => j.id === id || j.jobTicketNumber === id);
    if (jobIndex === -1) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const job = dbStore.jobs[jobIndex];

    if (safetyGlovesConfirmed !== undefined) {
      job.safetyGlovesConfirmed = Boolean(safetyGlovesConfirmed);
    }
    if (safetyMcbSwitchConfirmed !== undefined) {
      job.safetyMcbSwitchConfirmed = Boolean(safetyMcbSwitchConfirmed);
    }

    if (handoverOtpInput) {
      if (handoverOtpInput.trim() !== job.handoverOtp) {
        return NextResponse.json(
          { success: false, error: 'Invalid 4-digit handover OTP provided by customer.' },
          { status: 400 }
        );
      }
      job.status = 'WORK_COMPLETED';
    } else if (status) {
      job.status = status;
    }

    await db.recordWormAuditLog({
      actorId: 'usr_partner_01',
      actorRole: 'PARTNER',
      action: 'WORK_ORDER_LIFECYCLE_UPDATED',
      resourceType: 'JOB_ORDER',
      resourceId: job.jobTicketNumber,
      payloadSummary: `Work-Order ${job.jobTicketNumber} transitioned to status=${job.status}. Gloves=${job.safetyGlovesConfirmed}, MCB=${job.safetyMcbSwitchConfirmed}`,
    });

    return NextResponse.json({
      success: true,
      job,
      message: `Work-Order ${job.jobTicketNumber} updated successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update work order' },
      { status: 500 }
    );
  }
}
