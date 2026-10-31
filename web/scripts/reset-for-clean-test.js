import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function resetTestData() {
  console.log('⚡ [Ghar Tak] Starting Full Test Data Reset & Clean-State Purge...');

  try {
    // 1. Purge all Work Orders, Invoices, and Financial Transactions
    console.log('🧹 Purging Ledgers, Invoices, Withdrawals & Work Orders...');
    await prisma.withdrawalRequest.deleteMany({}).catch((e) => console.log('Notice withdrawalRequests:', e.message));
    await prisma.ledgerEntry.deleteMany({}).catch((e) => console.log('Notice ledgerEntries:', e.message));
    await prisma.invoice.deleteMany({}).catch((e) => console.log('Notice invoices:', e.message));
    await prisma.supportTicket.deleteMany({}).catch((e) => console.log('Notice supportTickets:', e.message));
    await prisma.partnerInventory.deleteMany({}).catch((e) => console.log('Notice inventories:', e.message));
    await prisma.job.deleteMany({}).catch((e) => console.log('Notice jobs:', e.message));

    // 2. Purge Technicians, Customer Profiles, Pincode Coverages & Partners
    console.log('🧹 Purging Technicians, Customers, Pincodes & Partners...');
    await prisma.technician.deleteMany({}).catch((e) => console.log('Notice technicians:', e.message));
    await prisma.customerProfile.deleteMany({}).catch((e) => console.log('Notice customerProfiles:', e.message));
    await prisma.pincodeCoverage.deleteMany({}).catch((e) => console.log('Notice pincodes:', e.message));
    await prisma.partner.deleteMany({}).catch((e) => console.log('Notice partners:', e.message));

    // 3. Purge all non-admin Users (Customer, Technician & Partner users - keeping ONLY SUPER_ADMIN)
    console.log('🧹 Purging all users except Super Admin...');
    await prisma.user.deleteMany({
      where: {
        role: { not: 'SUPER_ADMIN' }
      }
    }).catch((e) => console.log('Notice users:', e.message));

    // 4. Reset JSON persistence disks
    const withdrawalsPath = path.join(process.cwd(), 'withdrawals.json');
    if (fs.existsSync(withdrawalsPath)) {
      fs.writeFileSync(withdrawalsPath, '[]', 'utf-8');
      console.log('✓ Reset withdrawals.json');
    }

    const auditLedgerPath = path.join(process.cwd(), 'audit_ledger.json');
    if (fs.existsSync(auditLedgerPath)) {
      // Re-seed genesis block
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
      console.log('✓ Reset audit_ledger.json to clean Genesis block');
    }

    console.log('\n✅ Full Clean Slate Reset Complete!');
    console.log('All work orders, invoices, test customers, and test technicians have been purged.');
    console.log('Super Admin account and master service categories are preserved.');
  } catch (err) {
    console.error('❌ Reset error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestData();

