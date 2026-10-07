import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const actorRole = searchParams.get('actorRole') || undefined;
    const resourceType = searchParams.get('resourceType') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;

    const logs = await db.getWormAuditLogs({ actorRole, resourceType, search, limit });
    const chainIntegrity = await db.verifyWormChainIntegrity();

    return NextResponse.json({
      success: true,
      logs,
      totalCount: logs.length,
      chainIntegrity,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch WORM audit logs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'VERIFY_CHAIN';

    if (action === 'VERIFY_CHAIN') {
      const integrityResult = await db.verifyWormChainIntegrity();
      return NextResponse.json({
        success: true,
        verification: integrityResult,
        message: integrityResult.isValid
          ? `Cryptographic WORM hash chain intact across all ${integrityResult.totalBlocks} ledger blocks.`
          : `Tamper detected: ${integrityResult.failureDetails}`,
      });
    }

    if (action === 'RECORD_LOG') {
      const { actorId, actorRole, logAction, resourceType, resourceId, payloadSummary } = body;
      const created = await db.recordWormAuditLog({
        actorId: actorId || 'usr_admin_01',
        actorRole: actorRole || 'SUPER_ADMIN',
        action: logAction || 'MANUAL_AUDIT_CHECKPOINT',
        resourceType: resourceType || 'MANUAL',
        resourceId: resourceId || 'AUDIT_01',
        payloadSummary: payloadSummary || 'Manual auditor checkpoint logged',
      });
      return NextResponse.json({
        success: true,
        log: created,
        message: `Block #${created.sequenceNumber} committed to immutable WORM chain`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute audit operation' },
      { status: 500 }
    );
  }
}
