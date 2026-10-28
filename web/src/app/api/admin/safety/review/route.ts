import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/admin/safety/review
 * Admin Instant Approve / Reject for Safety Evidence (Issue 29 & 30)
 * Records tamper-evident WORM audit log with SHA-256 hash chaining.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, decision, reviewerNotes, failureReasons, auditorId } = body;

    if (!jobId) {
      return apiError('Missing mandatory field: jobId is required', 400);
    }

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      return apiError("Invalid decision. Must be either 'APPROVE' or 'REJECT'", 422);
    }

    const updatedJob = await db.reviewSafetyInspection(jobId, {
      decision,
      auditorId: auditorId || 'admin_qa_auditor',
      reviewerNotes: reviewerNotes || (decision === 'APPROVE' ? 'Approved by Quality Audit.' : 'Rejected by Quality Audit.'),
      failureReasons: Array.isArray(failureReasons) ? failureReasons : undefined,
    });

    // Broadcast audit decision on real-time event bus
    realtimeBus.publish({
      type: 'SAFETY_INSPECTION_AUDITED',
      jobId: updatedJob.id,
      ticketNumber: updatedJob.jobTicketNumber,
      partnerId: updatedJob.partnerId,
      technicianId: updatedJob.technicianId,
      status: updatedJob.status,
      details: {
        decision,
        auditorId: (updatedJob as any).safetyAuditorId,
        notes: (updatedJob as any).safetyAuditNotes,
        auditedAt: (updatedJob as any).safetyAuditedAt,
      },
    });

    return apiSuccess(
      {
        jobId: updatedJob.id,
        jobTicketNumber: updatedJob.jobTicketNumber,
        safetyAuditStatus: (updatedJob as any).safetyAuditStatus,
        safetyAuditedAt: (updatedJob as any).safetyAuditedAt,
        safetyAuditorId: (updatedJob as any).safetyAuditorId,
        safetyAuditNotes: (updatedJob as any).safetyAuditNotes,
      },
      `Safety inspection ${decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'} successfully for Work Order #${updatedJob.jobTicketNumber}. Cryptographic WORM audit log committed.`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to process safety evidence review',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
