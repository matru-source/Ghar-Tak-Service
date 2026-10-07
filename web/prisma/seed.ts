import { PrismaClient, UserRole, PartnerStatus, KycStatus, DensityClassification, JobStatus, JobPriority, InvoiceStatus, PaymentMethod, LedgerType, DebitCredit, TicketPriority, TicketStatus } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateSha256Checksum(payload: string): string {
  return crypto.createHash('sha256').update(payload).digest('hex');
}

async function main() {
  console.log('⚡ Starting ElectriCare Database Seeding...');

  // 1. Super Admin User
  const adminUser = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      phone: '+919876543210',
      email: 'admin@electricare.in',
      fullName: 'Vikram Malhotra',
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
      isActive: true,
    },
  });

  // 2. Regional Partner Franchise User & Profile (Maharashtra Hub)
  const partnerUser = await prisma.user.upsert({
    where: { phone: '+919876543211' },
    update: {},
    create: {
      phone: '+919876543211',
      email: 'maharashtra.ops@electricare.in',
      fullName: 'Suresh Patil (Director)',
      role: UserRole.PARTNER,
      isVerified: true,
      isActive: true,
    },
  });

  const partnerProfile = await prisma.partner.upsert({
    where: { userId: partnerUser.id },
    update: {},
    create: {
      userId: partnerUser.id,
      entityName: 'Maharashtra Tier-1 Operations Hub',
      companyRegistrationNumber: 'CIN-MH-2024-88912',
      stateLicensed: 'Maharashtra',
      maxPincodeQuota: 50,
      activeTechnicianQuota: 100,
      platformRevenueSharePct: 15.0,
      ifscCode: 'HDFC0001234',
      bankAccountNumber: '50200088912345',
      bankName: 'HDFC Bank, Fort Mumbai Branch',
      bankAccountHolder: 'Maharashtra Electrical Services LLP',
      status: PartnerStatus.ACTIVE,
    },
  });

  // 3. Pincode Jurisdiction (Colaba 400001)
  const colabaPincode = await prisma.pincodeCoverage.upsert({
    where: { pincode: '400001' },
    update: {},
    create: {
      pincode: '400001',
      areaName: 'Colaba, Mumbai Hub',
      district: 'Mumbai City',
      state: 'Maharashtra',
      partnerId: partnerProfile.id,
      isActive: true,
      isExclusive: true,
      density: DensityClassification.URBAN_HIGH_DENSITY,
      targetEtaMinutes: 15,
      activeCapacityCount: 8,
    },
  });

  // 4. Technician User & Profile (Rajesh Kumar)
  const techUser = await prisma.user.upsert({
    where: { phone: '+919876543212' },
    update: {},
    create: {
      phone: '+919876543212',
      email: 'rajesh.kumar@electricare.tech',
      fullName: 'Rajesh Kumar',
      role: UserRole.TECHNICIAN,
      isVerified: true,
      isActive: true,
    },
  });

  const techProfile = await prisma.technician.upsert({
    where: { userId: techUser.id },
    update: {},
    create: {
      userId: techUser.id,
      partnerId: partnerProfile.id,
      badgeNumber: 'TECH-7821',
      rating: 4.9,
      totalJobsCompleted: 142,
      isOnline: true,
      currentLatitude: 18.9220,
      currentLongitude: 72.8347, // Colaba Causeway coordinates
      assignedPincode: '400001',
      kycStatus: KycStatus.VERIFIED,
      aadharNumberMasked: 'XXXXXXXX4829',
      aadharDocUrl: '/docs/kyc/aadhar_rajesh.pdf',
      panNumberMasked: 'XXXXX9921K',
      panDocUrl: '/docs/kyc/pan_rajesh.pdf',
      electricalLicenseNumber: 'EL-MH-2024-8849',
      electricalLicenseDocUrl: '/docs/kyc/license_rajesh.pdf',
      insulatedGlovesVerified: true,
      safetyKitSerial: 'SK-1000V-992',
      kycVerifiedAt: new Date('2026-08-15'),
      kycVerifiedById: adminUser.id,
    },
  });

  // 5. Customer User & Profile (Amit Sharma)
  const customerUser = await prisma.user.upsert({
    where: { phone: '+919876543213' },
    update: {},
    create: {
      phone: '+919876543213',
      email: 'amit.sharma@gmail.com',
      fullName: 'Amit Sharma',
      role: UserRole.CUSTOMER,
      isVerified: true,
      isActive: true,
    },
  });

  const customerProfile = await prisma.customerProfile.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      defaultAddressLine: 'Flat 402, Sea Green Apartments, Colaba, Mumbai',
      defaultPincode: '400001',
      defaultLatitude: 18.9067,
      defaultLongitude: 72.8147,
      activeSubscriptionPlan: 'ZEX_SHIELD_1MO',
      subscriptionExpiryDate: new Date('2026-11-06'),
    },
  });

  // 6. Service Categories & Catalog Hierarchy
  const repairCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'electrical-repairs' },
    update: {},
    create: {
      name: 'Electrical Repairs',
      slug: 'electrical-repairs',
      description: 'Standard home wiring, appliances, switches & ceiling fans',
      displayOrder: 1,
    },
  });

  const emergencyCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'emergency-sos' },
    update: {},
    create: {
      name: '24/7 SOS Emergency Services',
      slug: 'emergency-sos',
      description: 'Rapid 15-minute response for sparking, burning smells & power outages',
      displayOrder: 2,
    },
  });

  const fanService = await prisma.serviceCatalog.upsert({
    where: { code: 'SRV-FAN-01' },
    update: {},
    create: {
      categoryId: repairCategory.id,
      title: 'Ceiling Fan Repair / Bearing Replacement',
      code: 'SRV-FAN-01',
      basePriceInr: 1059.32,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 45,
      isEmergencySosEligible: false,
      description: 'Complete inspection, bearing lubrication/replacement, noise troubleshooting',
    },
  });

  const mcbEmergencyService = await prisma.serviceCatalog.upsert({
    where: { code: 'SRV-MCB-02' },
    update: {},
    create: {
      categoryId: emergencyCategory.id,
      title: 'Circuit Breaker Tripping & Short-Circuit Emergency Diagnostic',
      code: 'SRV-MCB-02',
      basePriceInr: 1250.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 30,
      isEmergencySosEligible: true,
      description: 'Immediate 15-min arrival with high-voltage insulated tools to isolate short circuits',
    },
  });

  // 7. Work-Order Lifecycle Job #J-1001 (Amit Sharma - Colaba)
  const job1001 = await prisma.job.upsert({
    where: { jobTicketNumber: 'J-1001' },
    update: {},
    create: {
      jobTicketNumber: 'J-1001',
      customerId: customerProfile.id,
      partnerId: partnerProfile.id,
      technicianId: techProfile.id,
      serviceId: fanService.id,
      pincode: '400001',
      customerAddressText: 'Flat 402, Sea Green Apartments, Colaba, Mumbai 400001',
      customerLatitude: 18.9067,
      customerLongitude: 72.8147,
      status: JobStatus.IN_PROGRESS,
      priority: JobPriority.STANDARD,
      scheduledAt: new Date(),
      slaExpiryAt: new Date(Date.now() + 30 * 60 * 1000), // 30-min SLA
      dispatchedAt: new Date(Date.now() - 25 * 60 * 1000),
      arrivedAt: new Date(Date.now() - 15 * 60 * 1000),
      startedAt: new Date(Date.now() - 10 * 60 * 1000),
      beforePhotoUrl: '/uploads/jobs/J1001_before.jpg',
      safetyGlovesConfirmed: true,
      safetyMcbSwitchConfirmed: true,
      handoverOtp: '4829', // 4-digit verification code
    },
  });

  // 8. Urgent SLA Escalation Job #J-1005 (Pending Proximity Reassignment)
  await prisma.job.upsert({
    where: { jobTicketNumber: 'J-1005' },
    update: {},
    create: {
      jobTicketNumber: 'J-1005',
      customerId: customerProfile.id,
      partnerId: partnerProfile.id,
      serviceId: mcbEmergencyService.id,
      pincode: '400001',
      customerAddressText: 'Shop #12, Colaba Market Lane, Mumbai 400001',
      customerLatitude: 18.9100,
      customerLongitude: 72.8200,
      status: JobStatus.ESCALATED_SLA,
      priority: JobPriority.URGENT_SLA,
      scheduledAt: new Date(Date.now() - 40 * 60 * 1000),
      slaExpiryAt: new Date(Date.now() - 10 * 60 * 1000), // SLA breached by 10 mins
      handoverOtp: '9182',
    },
  });

  // 9. Official Tax Invoice #INV-2026-001 (₹1,250 Total with 18% GST)
  const invoice1001 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-001' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-001',
      jobId: job1001.id,
      customerId: customerProfile.id,
      partnerId: partnerProfile.id,
      baseAmount: 1059.32,
      cgstAmount: 95.34, // 9% CGST
      sgstAmount: 95.34, // 9% SGST
      totalAmount: 1250.00,
      paymentStatus: InvoiceStatus.PAID,
      paymentMethod: PaymentMethod.UPI,
      razorpayOrderId: 'order_EL_9918237',
      razorpayPaymentId: 'pay_EL_8819231',
      pdfInvoiceUrl: '/invoices/INV_2026_001.pdf',
    },
  });

  // 10. Financial Double-Entry Ledgers (Platform 15%, Partner 15%, Tech 70% of base)
  await prisma.ledgerEntry.upsert({
    where: { transactionReference: 'TXN-2026-88129-CUST' },
    update: {},
    create: {
      transactionReference: 'TXN-2026-88129-CUST',
      invoiceId: invoice1001.id,
      partnerId: partnerProfile.id,
      ledgerType: LedgerType.CUSTOMER_PAYMENT,
      entryDirection: DebitCredit.CREDIT,
      amountInr: 1250.00,
      runningBalanceInr: 1250.00,
      narrative: 'Customer payment received via UPI for Job J-1001',
    },
  });

  await prisma.ledgerEntry.upsert({
    where: { transactionReference: 'TXN-2026-88129-TECH' },
    update: {},
    create: {
      transactionReference: 'TXN-2026-88129-TECH',
      invoiceId: invoice1001.id,
      technicianId: techProfile.id,
      ledgerType: LedgerType.TECHNICIAN_PAYOUT,
      entryDirection: DebitCredit.CREDIT,
      amountInr: 741.52, // 70% of base
      runningBalanceInr: 741.52,
      narrative: 'Technician base earnings credit for Job J-1001',
    },
  });

  // 11. Support Ticket #SUP-1024
  await prisma.supportTicket.upsert({
    where: { ticketNumber: 'SUP-1024' },
    update: {},
    create: {
      ticketNumber: 'SUP-1024',
      requesterUserId: partnerUser.id,
      partnerId: partnerProfile.id,
      jobId: job1001.id,
      subject: 'Technician Delay Escalation - Colaba Hub',
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
      description: 'High-voltage feeder line delay in Colaba market quadrant. Required quick reassignment.',
    },
  });

  // 12. Immutable WORM Audit Trail Log
  const auditPayload = JSON.stringify({
    action: 'SEED_INITIAL_TOPOLOGY',
    partner: 'Maharashtra Tier-1 Operations Hub',
    pincode: '400001',
    technician: 'Rajesh Kumar (TECH-7821)',
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: adminUser.id,
      actorRole: 'SUPER_ADMIN',
      action: 'SYSTEM_GENESIS_INITIALIZE',
      targetEntity: 'PlatformTopology',
      targetEntityId: 'ALL_INDIA_ROOT',
      payloadAfter: auditPayload,
      ipAddress: '127.0.0.1',
      userAgent: 'ElectriCare/Seeder/1.0',
      checksumSha256: generateSha256Checksum(auditPayload),
    },
  });

  console.log('✅ ElectriCare Database Seeding Complete! Seeded:');
  console.log('   • 1 Super Admin (Vikram Malhotra)');
  console.log('   • 1 Partner Hub (Maharashtra Tier-1 Operations Hub)');
  console.log('   • 1 Territory Pincode (400001 Colaba Hub)');
  console.log('   • 1 Technician (Rajesh Kumar - TECH-7821)');
  console.log('   • 1 Customer (Amit Sharma)');
  console.log('   • 2 Service Catalog items (Ceiling Fan & Short-Circuit SOS)');
  console.log('   • 2 Jobs (Active J-1001 with OTP 4829 & Escalated J-1005)');
  console.log('   • 1 GST Tax Invoice (INV-2026-001 @ ₹1,250)');
  console.log('   • 2 Double-entry ledger rows');
  console.log('   • 1 Support Ticket (SUP-1024)');
  console.log('   • 1 WORM-compliant Audit Log');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
