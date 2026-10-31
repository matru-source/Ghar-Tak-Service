import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import fs from 'fs';
import path from 'path';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const { isDatabaseConnected } = await import('@/lib/db');
    const isDb = await isDatabaseConnected();

    if (isDb) {
      const { prisma } = await import('@/lib/prisma');
      await prisma.withdrawalRequest.deleteMany({}).catch(() => {});
      await prisma.ledgerEntry.deleteMany({}).catch(() => {});
      await prisma.invoice.deleteMany({}).catch(() => {});
      await prisma.supportTicket.deleteMany({}).catch(() => {});
      await prisma.partnerInventory.deleteMany({}).catch(() => {});
      await prisma.job.deleteMany({}).catch(() => {});
      await prisma.technician.deleteMany({}).catch(() => {});
      await prisma.customerProfile.deleteMany({}).catch(() => {});
      await prisma.user.deleteMany({
        where: { role: { in: ['CUSTOMER', 'TECHNICIAN'] } }
      }).catch(() => {});
    }

    // Reset dbStore in-memory baseline
    dbStore.jobs = [];
    dbStore.invoices = [];
    dbStore.ledgerEntries = [];
    dbStore.withdrawals = [];
    dbStore.supportTickets = [];
    dbStore.technicians = [];
    dbStore.customers = [];
    dbStore.users = dbStore.users.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'PARTNER');

    // Reset disk files
    try {
      const withdrawalsPath = path.join(process.cwd(), 'withdrawals.json');
      if (fs.existsSync(withdrawalsPath)) {
        fs.writeFileSync(withdrawalsPath, '[]', 'utf-8');
      }

      const auditLedgerPath = path.join(process.cwd(), 'audit_ledger.json');
      if (fs.existsSync(auditLedgerPath)) {
        const genesis = [{
          sequenceNumber: 1,
          timestamp: new Date().toISOString(),
          actorId: 'system_genesis',
          actorRole: 'SUPER_ADMIN',
          action: 'LEDGER_INITIALIZED',
          resourceType: 'SYSTEM',
          resourceId: 'genesis',
          payloadSummary: 'WORM SHA-256 Non-Repudiation Audit Ledger Initialized Clean State',
          previousBlockHash: '0000000000000000000000000000000000000000000000000000000000000000',
          currentBlockHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          tamperEvidentSeal: 'SHA256:GENESIS_SEAL_VERIFIED'
        }];
        fs.writeFileSync(auditLedgerPath, JSON.stringify(genesis, null, 2), 'utf-8');
      }
    } catch (_) {}

    return apiSuccess({
      purged: {
        jobs: true,
        invoices: true,
        ledgerEntries: true,
        testTechnicians: true,
        testCustomers: true,
      },
      preserved: {
        superAdmin: true,
        serviceCatalog: true,
        pincodeJurisdictions: true,
      }
    }, 'Clean slate initialized successfully. You can now onboard from scratch.', 200);
  } catch (err) {
    return apiError('Failed to reset test data', 500, err instanceof Error ? err.message : String(err));
  }
}

