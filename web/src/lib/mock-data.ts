// ==============================================================================
// ElectriCare Mission-Critical SaaS Platform — Enterprise Mock Data Store
// Provides instant high-fidelity seed records for local offline development,
// Flutter app testing, and CI environments when PostgreSQL container is offline.
// ==============================================================================

export interface PartnerRecord {
  id: string;
  userId: string;
  entityName: string;
  directorName: string;
  email: string;
  phone: string;
  companyRegistrationNumber: string;
  gstin: string;
  stateLicensed: string;
  allocatedStates: string[];
  maxPincodeQuota: number;
  activePincodesCount: number;
  activeTechnicianQuota: number;
  activeTechnicianCount: number;
  platformRevenueSharePct: number;
  partnerRevenueSharePct: number;
  ifscCode: string;
  bankAccountNumber: string;
  bankName: string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  createdAt: string;
}

export interface SubscriptionTierRecord {
  id: string;
  name: string;
  code: string;
  targetAudience: 'CONSUMER' | 'PARTNER_FRANCHISE' | 'ENTERPRISE';
  priceInr: number;
  durationMonths: number;
  surgeProtectionCoverageInr: number;
  freeInspectionsCount: number;
  isPrioritySosDispatch: boolean;
  applianceWarrantyIncluded: boolean;
  cyberShieldAuditIncluded: boolean;
  isActive: boolean;
  description: string;
}

export interface SubscriptionRecord {
  id: string;
  tierId: string;
  tierName: string;
  subscriberType: 'CUSTOMER' | 'PARTNER';
  subscriberId: string;
  subscriberName: string;
  subscriberPhone: string;
  pricePaidInr: number;
  startDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  autoRenew: boolean;
  coverageMaxInr: number;
}

export interface WormAuditLogRecord {
  id: string;
  sequenceNumber: number;
  timestamp: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousHash: string;
  currentHash: string;
  payloadSummary: string;
  ipAddress: string;
  isTamperVerified: boolean;
}

export interface ElectriCareStore {
  users: Array<{
    id: string;
    phone: string;
    email: string;
    fullName: string;
    role: 'SUPER_ADMIN' | 'PARTNER' | 'TECHNICIAN' | 'CUSTOMER';
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
  }>;
  partner: PartnerRecord;
  partners: PartnerRecord[];
  pincodes: Array<{
    id: string;
    pincode: string;
    areaName: string;
    district: string;
    state: string;
    partnerId: string;
    isActive: boolean;
    isExclusive: boolean;
    density: string;
    targetEtaMinutes: number;
    activeCapacityCount: number;
    perimeterRadiusKm?: number;
  }>;
  technicians: Array<{
    id: string;
    userId: string;
    partnerId: string;
    badgeNumber: string;
    fullName: string;
    phone: string;
    rating: number;
    totalJobsCompleted: number;
    isOnline: boolean;
    currentLatitude: number;
    currentLongitude: number;
    assignedPincode: string;
    kycStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED';
    electricalLicenseNumber: string;
    insulatedGlovesVerified: boolean;
    safetyKitSerial: string;
    aadharNumberMasked?: string;
    panDocUrl?: string;
    kycRejectionReason?: string;
    kycVerifiedAt?: string;
    kycNotes?: string;
  }>;
  customers: Array<{
    id: string;
    userId: string;
    fullName: string;
    phone: string;
    email: string;
    defaultAddressLine: string;
    defaultPincode: string;
    defaultLatitude: number;
    defaultLongitude: number;
    activeSubscriptionPlan: string;
    subscriptionExpiryDate?: string;
    totalOrdersCount: number;
    totalSpendInr: number;
    disputeCount: number;
    isVip: boolean;
    memberSince: string;
    notes?: string;
  }>;
  globalCommissionConfig: {
    platformRevenueSharePct: number;
    partnerDefaultSharePct: number;
    technicianNetSharePct: number;
    gstStatutoryRatePct: number;
    emergencySosPremiumPct: number;
    autoEscrowDisbursement: boolean;
    minWithdrawalThresholdInr: number;
    lastUpdated: string;
  };
  serviceCategories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
  }>;
  serviceCatalog: Array<{
    id: string;
    categoryId: string;
    title: string;
    code: string;
    basePriceInr: number;
    gstRatePct: number;
    estimatedDurationMinutes: number;
    isEmergencySosEligible: boolean;
  }>;
  jobs: Array<{
    id: string;
    jobTicketNumber: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    partnerId: string;
    technicianId?: string;
    technicianName?: string;
    serviceId: string;
    serviceTitle: string;
    pincode: string;
    customerAddressText: string;
    customerLatitude: number;
    customerLongitude: number;
    status: 'PENDING_DISPATCH' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'SAFETY_CHECKED' | 'IN_PROGRESS' | 'WORK_COMPLETED' | 'PAYMENT_PENDING' | 'SETTLED' | 'CANCELLED' | 'ESCALATED_SLA';
    priority: 'STANDARD' | 'URGENT_SLA' | 'EMERGENCY_SOS_247';
    scheduledAt: string;
    slaExpiryAt: string;
    dispatchedAt?: string;
    arrivedAt?: string;
    startedAt?: string;
    completedAt?: string;
    safetyGlovesConfirmed: boolean;
    safetyMcbSwitchConfirmed: boolean;
    handoverOtp: string;
    beforePhotoUrl?: string;
    afterPhotoUrl?: string;
    customerRating?: number;
    customerFeedback?: string;
    totalAmountInr: number;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    jobId: string;
    customerId: string;
    partnerId: string;
    baseAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    totalAmount: number;
    paymentStatus: 'ISSUED' | 'PAID' | 'REFUNDED';
    paymentMethod: 'UPI' | 'CREDIT_DEBIT_CARD' | 'CASH';
    razorpayPaymentId?: string;
    createdAt: string;
  }>;
  supportTickets: Array<{
    id: string;
    ticketNumber: string;
    subject: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_EMERGENCY';
    status: 'OPEN' | 'IN_INVESTIGATION' | 'RESOLVED';
    description: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    technicianId?: string;
    technicianName?: string;
    jobId?: string;
    jobTicketNumber?: string;
    assignedTo?: string;
    category?: string;
    resolutionNotes?: string;
    slaDueAt?: string;
    createdAt: string;
    updatedAt?: string;
  }>;
  escalationEvents: Array<{
    id: string;
    jobId: string;
    jobTicketNumber: string;
    trigger: 'SLA_BREACH_TIMER' | 'TECHNICIAN_REJECTION' | 'MANUAL_DISPATCHER_OVERRIDE' | 'CUSTOMER_COMPLAINT';
    previousTechnicianId?: string;
    previousTechnicianName?: string;
    reassignedTechnicianId?: string;
    reassignedTechnicianName?: string;
    proximityDistanceKm?: number;
    reason: string;
    slaExtendedMinutes?: number;
    timestamp: string;
  }>;
  ledgerEntries: Array<{
    id: string;
    transactionReference: string;
    invoiceId?: string;
    jobTicketNumber?: string;
    partnerId?: string;
    technicianId?: string;
    ledgerType: 'CUSTOMER_PAYMENT' | 'PLATFORM_FEE' | 'PARTNER_COMMISSION' | 'TECHNICIAN_PAYOUT' | 'GST_RESERVE_18';
    entryDirection: 'DEBIT' | 'CREDIT';
    amountInr: number;
    runningBalanceInr: number;
    narrative: string;
    createdAt: string;
  }>;
  subscriptionTiers: SubscriptionTierRecord[];
  subscriptions: SubscriptionRecord[];
  wormAuditLogs: WormAuditLogRecord[];
}

export const initialStore: ElectriCareStore = {
  users: [
    {
      id: 'usr_admin_01',
      phone: '+919876543210',
      email: 'admin@electricare.in',
      fullName: 'Vikram Malhotra',
      role: 'SUPER_ADMIN',
      isVerified: true,
      isActive: true,
      createdAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'usr_partner_01',
      phone: '+919876543211',
      email: 'maharashtra.ops@electricare.in',
      fullName: 'Suresh Patil (Director)',
      role: 'PARTNER',
      isVerified: true,
      isActive: true,
      createdAt: '2026-08-10T00:00:00Z',
    },
    {
      id: 'usr_tech_01',
      phone: '+919876543212',
      email: 'rajesh.kumar@electricare.tech',
      fullName: 'Rajesh Kumar',
      role: 'TECHNICIAN',
      isVerified: true,
      isActive: true,
      createdAt: '2026-08-15T00:00:00Z',
    },
    {
      id: 'usr_tech_04',
      phone: '+919876543240',
      email: 'pradeep.jadhav@electricare.tech',
      fullName: 'Pradeep Jadhav',
      role: 'TECHNICIAN',
      isVerified: true,
      isActive: true,
      createdAt: '2026-08-20T00:00:00Z',
    },
    {
      id: 'usr_cust_01',
      phone: '+919876543213',
      email: 'amit.sharma@gmail.com',
      fullName: 'Amit Sharma',
      role: 'CUSTOMER',
      isVerified: true,
      isActive: true,
      createdAt: '2026-09-01T00:00:00Z',
    },
  ],
  partner: {
    id: 'ptnr_mah_01',
    userId: 'usr_partner_01',
    entityName: 'Maharashtra Tier-1 Operations Hub',
    directorName: 'Suresh Patil',
    email: 'maharashtra.ops@electricare.in',
    phone: '+919876543211',
    companyRegistrationNumber: 'CIN-MH-2024-88912',
    gstin: '27AABCU9603R1ZM',
    stateLicensed: 'Maharashtra',
    allocatedStates: ['Maharashtra'],
    maxPincodeQuota: 50,
    activePincodesCount: 45,
    activeTechnicianQuota: 100,
    activeTechnicianCount: 48,
    platformRevenueSharePct: 15.0,
    partnerRevenueSharePct: 15.0,
    ifscCode: 'HDFC0001234',
    bankAccountNumber: '50200088912345',
    bankName: 'HDFC Bank, Fort Mumbai Branch',
    status: 'ACTIVE',
    createdAt: '2026-08-10T00:00:00Z',
  },
  partners: [
    {
      id: 'ptnr_mah_01',
      userId: 'usr_partner_01',
      entityName: 'Maharashtra Tier-1 Operations Hub',
      directorName: 'Suresh Patil',
      email: 'maharashtra.ops@electricare.in',
      phone: '+919876543211',
      companyRegistrationNumber: 'CIN-MH-2024-88912',
      gstin: '27AABCU9603R1ZM',
      stateLicensed: 'Maharashtra',
      allocatedStates: ['Maharashtra'],
      maxPincodeQuota: 50,
      activePincodesCount: 45,
      activeTechnicianQuota: 100,
      activeTechnicianCount: 48,
      platformRevenueSharePct: 15.0,
      partnerRevenueSharePct: 15.0,
      ifscCode: 'HDFC0001234',
      bankAccountNumber: '50200088912345',
      bankName: 'HDFC Bank, Fort Mumbai Branch',
      status: 'ACTIVE',
      createdAt: '2026-08-10T00:00:00Z',
    },
    {
      id: 'ptnr_del_02',
      userId: 'usr_partner_02',
      entityName: 'Delhi-NCR ElectroGrid Franchise Ltd',
      directorName: 'Raman Singhal',
      email: 'delhi.franchise@electricare.in',
      phone: '+919811022334',
      companyRegistrationNumber: 'CIN-DL-2023-44120',
      gstin: '07AAACD1234F1Z8',
      stateLicensed: 'Delhi NCR',
      allocatedStates: ['Delhi', 'Haryana'],
      maxPincodeQuota: 40,
      activePincodesCount: 35,
      activeTechnicianQuota: 80,
      activeTechnicianCount: 30,
      platformRevenueSharePct: 15.0,
      partnerRevenueSharePct: 15.0,
      ifscCode: 'ICIC0000021',
      bankAccountNumber: '002105001239',
      bankName: 'ICICI Bank, Connaught Place',
      status: 'ACTIVE',
      createdAt: '2026-08-15T00:00:00Z',
    },
    {
      id: 'ptnr_kar_03',
      userId: 'usr_partner_03',
      entityName: 'Karnataka TechPower Systems Pvt Ltd',
      directorName: 'Venkatesh Rao',
      email: 'bangalore.ops@electricare.in',
      phone: '+919845012345',
      companyRegistrationNumber: 'CIN-KA-2024-11883',
      gstin: '29AABCK5512L1Z3',
      stateLicensed: 'Karnataka',
      allocatedStates: ['Karnataka'],
      maxPincodeQuota: 30,
      activePincodesCount: 20,
      activeTechnicianQuota: 60,
      activeTechnicianCount: 15,
      platformRevenueSharePct: 15.0,
      partnerRevenueSharePct: 15.0,
      ifscCode: 'SBIN0004040',
      bankAccountNumber: '30491827364',
      bankName: 'State Bank of India, MG Road',
      status: 'PENDING_APPROVAL',
      createdAt: '2026-09-02T00:00:00Z',
    },
    {
      id: 'ptnr_guj_04',
      userId: 'usr_partner_04',
      entityName: 'Gujarat Solar & Electricals Enterprise',
      directorName: 'Kirit Patel',
      email: 'ahmedabad.ops@electricare.in',
      phone: '+919825098765',
      companyRegistrationNumber: 'CIN-GJ-2023-77231',
      gstin: '24AABCG9812M1Z2',
      stateLicensed: 'Gujarat',
      allocatedStates: ['Gujarat'],
      maxPincodeQuota: 35,
      activePincodesCount: 25,
      activeTechnicianQuota: 50,
      activeTechnicianCount: 22,
      platformRevenueSharePct: 15.0,
      partnerRevenueSharePct: 15.0,
      ifscCode: 'BARB0AHMEDA',
      bankAccountNumber: '10928374650',
      bankName: 'Bank of Baroda, Ashram Road',
      status: 'ACTIVE',
      createdAt: '2026-08-20T00:00:00Z',
    },
  ],
  pincodes: [
    {
      id: 'pin_400001',
      pincode: '400001',
      areaName: 'Colaba, Mumbai Hub',
      district: 'Mumbai City',
      state: 'Maharashtra',
      partnerId: 'ptnr_mah_01',
      isActive: true,
      isExclusive: true,
      density: 'URBAN_HIGH_DENSITY',
      targetEtaMinutes: 15,
      activeCapacityCount: 8,
      perimeterRadiusKm: 5.5,
    },
    {
      id: 'pin_400005',
      pincode: '400005',
      areaName: 'Cuffe Parade & Colaba Post Office',
      district: 'Mumbai City',
      state: 'Maharashtra',
      partnerId: 'ptnr_mah_01',
      isActive: true,
      isExclusive: true,
      density: 'URBAN_HIGH_DENSITY',
      targetEtaMinutes: 18,
      activeCapacityCount: 5,
      perimeterRadiusKm: 4.8,
    },
    {
      id: 'pin_400020',
      pincode: '400020',
      areaName: 'Churchgate & Marine Drive Sector',
      district: 'Mumbai City',
      state: 'Maharashtra',
      partnerId: 'ptnr_mah_01',
      isActive: true,
      isExclusive: true,
      density: 'METRO_STANDARD',
      targetEtaMinutes: 20,
      activeCapacityCount: 6,
      perimeterRadiusKm: 6.2,
    },
    {
      id: 'pin_400021',
      pincode: '400021',
      areaName: 'Nariman Point Financial District',
      district: 'Mumbai City',
      state: 'Maharashtra',
      partnerId: 'ptnr_mah_01',
      isActive: true,
      isExclusive: true,
      density: 'URBAN_HIGH_DENSITY',
      targetEtaMinutes: 15,
      activeCapacityCount: 7,
      perimeterRadiusKm: 4.0,
    },
    {
      id: 'pin_400050',
      pincode: '400050',
      areaName: 'Bandra West & Linking Road',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      partnerId: 'ptnr_mah_01',
      isActive: true,
      isExclusive: false,
      density: 'URBAN_HIGH_DENSITY',
      targetEtaMinutes: 20,
      activeCapacityCount: 11,
      perimeterRadiusKm: 7.0,
    },
    {
      id: 'pin_400069',
      pincode: '400069',
      areaName: 'Andheri East Commercial Hub',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      partnerId: 'ptnr_mah_01',
      isActive: true,
      isExclusive: true,
      density: 'URBAN_HIGH_DENSITY',
      targetEtaMinutes: 25,
      activeCapacityCount: 9,
      perimeterRadiusKm: 8.5,
    },
    {
      id: 'pin_411001',
      pincode: '411001',
      areaName: 'Pune Camp & Central Sector',
      district: 'Pune',
      state: 'Maharashtra',
      partnerId: 'ptnr_mah_01',
      isActive: true,
      isExclusive: true,
      density: 'URBAN_HIGH_DENSITY',
      targetEtaMinutes: 25,
      activeCapacityCount: 12,
      perimeterRadiusKm: 9.0,
    },
    {
      id: 'pin_110001',
      pincode: '110001',
      areaName: 'Connaught Place & Barakhamba',
      district: 'New Delhi',
      state: 'Delhi',
      partnerId: 'ptnr_del_02',
      isActive: true,
      isExclusive: true,
      density: 'URBAN_HIGH_DENSITY',
      targetEtaMinutes: 18,
      activeCapacityCount: 10,
      perimeterRadiusKm: 6.0,
    },
    {
      id: 'pin_560001',
      pincode: '560001',
      areaName: 'MG Road, Brigade Road & Central CBD',
      district: 'Bangalore Urban',
      state: 'Karnataka',
      partnerId: 'ptnr_kar_03',
      isActive: true,
      isExclusive: true,
      density: 'URBAN_HIGH_DENSITY',
      targetEtaMinutes: 22,
      activeCapacityCount: 8,
      perimeterRadiusKm: 6.5,
    },
    {
      id: 'pin_380009',
      pincode: '380009',
      areaName: 'Navrangpura & CG Road Commercial Hub',
      district: 'Ahmedabad',
      state: 'Gujarat',
      partnerId: 'ptnr_guj_04',
      isActive: true,
      isExclusive: true,
      density: 'METRO_STANDARD',
      targetEtaMinutes: 20,
      activeCapacityCount: 7,
      perimeterRadiusKm: 7.2,
    },
  ],
  technicians: [
    {
      id: 'tech_rajesh_01',
      userId: 'usr_tech_01',
      partnerId: 'ptnr_mah_01',
      badgeNumber: 'TECH-7821',
      fullName: 'Rajesh Kumar',
      phone: '+919876543212',
      rating: 4.9,
      totalJobsCompleted: 142,
      isOnline: true,
      currentLatitude: 18.9220,
      currentLongitude: 72.8347,
      assignedPincode: '400001',
      kycStatus: 'VERIFIED',
      electricalLicenseNumber: 'EL-MH-2024-8849',
      insulatedGlovesVerified: true,
      safetyKitSerial: 'SK-1000V-992',
      aadharNumberMasked: 'XXXX-XXXX-4912',
      kycVerifiedAt: '2026-08-15T10:30:00Z',
      kycNotes: 'Physical safety kit verified. Wireman Grade-A license authentic.',
    },
    {
      id: 'tech_sunil_02',
      userId: 'usr_tech_02',
      partnerId: 'ptnr_mah_01',
      badgeNumber: 'TECH-8042',
      fullName: 'Sunil Verma',
      phone: '+919876543220',
      rating: 4.7,
      totalJobsCompleted: 38,
      isOnline: false,
      currentLatitude: 18.9180,
      currentLongitude: 72.8290,
      assignedPincode: '400005',
      kycStatus: 'PENDING_REVIEW',
      electricalLicenseNumber: 'EL-MH-2025-1192',
      insulatedGlovesVerified: false,
      safetyKitSerial: 'SK-1000V-104',
      aadharNumberMasked: 'XXXX-XXXX-8821',
      kycNotes: 'Submitted for verification. Awaiting 1000V insulated gloves calibration certificate inspection.',
    },
    {
      id: 'tech_anil_03',
      userId: 'usr_tech_03',
      partnerId: 'ptnr_mah_01',
      badgeNumber: 'TECH-6619',
      fullName: 'Anil Shinde',
      phone: '+919876543230',
      rating: 4.2,
      totalJobsCompleted: 64,
      isOnline: false,
      currentLatitude: 18.9250,
      currentLongitude: 72.8310,
      assignedPincode: '400001',
      kycStatus: 'REJECTED',
      electricalLicenseNumber: 'EL-MH-2020-0041',
      insulatedGlovesVerified: false,
      safetyKitSerial: 'SK-1000V-089',
      aadharNumberMasked: 'XXXX-XXXX-3345',
      kycRejectionReason: 'Expired Wireman License (validity ended Dec 2024). Re-upload valid renewal.',
    },
    {
      id: 'tech_pradeep_04',
      userId: 'usr_tech_04',
      partnerId: 'ptnr_mah_01',
      badgeNumber: 'TECH-9104',
      fullName: 'Pradeep Jadhav',
      phone: '+919876543240',
      rating: 4.88,
      totalJobsCompleted: 89,
      isOnline: true,
      currentLatitude: 18.9150,
      currentLongitude: 72.8220,
      assignedPincode: '400005',
      kycStatus: 'VERIFIED',
      electricalLicenseNumber: 'EL-MH-2023-7712',
      insulatedGlovesVerified: true,
      safetyKitSerial: 'SK-1000V-512',
      aadharNumberMasked: 'XXXX-XXXX-9104',
      kycVerifiedAt: '2026-08-20T14:15:00Z',
      kycNotes: 'Passed high-voltage safety protocol inspection. Standby lead technician.',
    },
    {
      id: 'tech_vikas_05',
      userId: 'usr_tech_05',
      partnerId: 'ptnr_del_02',
      badgeNumber: 'TECH-4410',
      fullName: 'Vikas Sharma',
      phone: '+919811055667',
      rating: 4.82,
      totalJobsCompleted: 52,
      isOnline: true,
      currentLatitude: 28.6315,
      currentLongitude: 77.2167,
      assignedPincode: '110001',
      kycStatus: 'VERIFIED',
      electricalLicenseNumber: 'EL-DL-2024-3321',
      insulatedGlovesVerified: true,
      safetyKitSerial: 'SK-1000V-330',
      aadharNumberMasked: 'XXXX-XXXX-6612',
      kycVerifiedAt: '2026-08-25T11:00:00Z',
      kycNotes: 'Delhi electricity board certified wireman. Full safety kit active.',
    },
    {
      id: 'tech_sanjay_06',
      userId: 'usr_tech_06',
      partnerId: 'ptnr_kar_03',
      badgeNumber: 'TECH-5520',
      fullName: 'Sanjay Gowda',
      phone: '+919845066778',
      rating: 4.65,
      totalJobsCompleted: 24,
      isOnline: false,
      currentLatitude: 12.9716,
      currentLongitude: 77.5946,
      assignedPincode: '560001',
      kycStatus: 'PENDING_REVIEW',
      electricalLicenseNumber: 'EL-KA-2025-8812',
      insulatedGlovesVerified: false,
      safetyKitSerial: 'SK-1000V-442',
      aadharNumberMasked: 'XXXX-XXXX-1190',
      kycNotes: 'Pending Aadhar biometric cross-check and safety gloves kit inspection.',
    },
  ],
  customers: [
    {
      id: 'cust_amit_01',
      userId: 'usr_cust_01',
      fullName: 'Amit Sharma',
      phone: '+919876543213',
      email: 'amit.sharma@gmail.com',
      defaultAddressLine: 'Flat 402, Sea Green Apartments, Colaba, Mumbai',
      defaultPincode: '400001',
      defaultLatitude: 18.9067,
      defaultLongitude: 72.8147,
      activeSubscriptionPlan: 'ZEX_SHIELD_1MO',
      subscriptionExpiryDate: '2026-11-15T00:00:00Z',
      totalOrdersCount: 4,
      totalSpendInr: 4850.00,
      disputeCount: 0,
      isVip: true,
      memberSince: '2026-08-01T00:00:00Z',
      notes: 'High-value residential customer. Preferred slot morning 10 AM.',
    },
    {
      id: 'cust_priya_02',
      userId: 'usr_cust_02',
      fullName: 'Priya Deshmukh',
      phone: '+919820011223',
      email: 'priya.deshmukh@gmail.com',
      defaultAddressLine: '12B, Ocean Crest, Marine Drive, Mumbai',
      defaultPincode: '400020',
      defaultLatitude: 18.9320,
      defaultLongitude: 72.8230,
      activeSubscriptionPlan: 'ZEX_SHIELD_PRO_1YR',
      subscriptionExpiryDate: '2027-07-20T00:00:00Z',
      totalOrdersCount: 7,
      totalSpendInr: 9200.00,
      disputeCount: 0,
      isVip: true,
      memberSince: '2026-07-10T00:00:00Z',
      notes: 'Subscribed to 1-Year Comprehensive Home Surge Protection.',
    },
    {
      id: 'cust_vikram_03',
      userId: 'usr_cust_03',
      fullName: 'Vikram Seth',
      phone: '+919810055443',
      email: 'vikram.seth@rediffmail.com',
      defaultAddressLine: 'Flat 14, Block B, Connaught Place, New Delhi',
      defaultPincode: '110001',
      defaultLatitude: 28.6320,
      defaultLongitude: 77.2180,
      activeSubscriptionPlan: 'NONE',
      totalOrdersCount: 2,
      totalSpendInr: 2400.00,
      disputeCount: 1,
      isVip: false,
      memberSince: '2026-09-05T00:00:00Z',
      notes: 'Dispute logged for arrival delay #SUP-1019 (Resolved with ₹200 wallet credit).',
    },
    {
      id: 'cust_ananya_04',
      userId: 'usr_cust_04',
      fullName: 'Ananya Iyer',
      phone: '+919845099887',
      email: 'ananya.iyer@techcorp.in',
      defaultAddressLine: 'Villa 88, Palm Meadows, Whitefield, Bangalore',
      defaultPincode: '560001',
      defaultLatitude: 12.9720,
      defaultLongitude: 77.5950,
      activeSubscriptionPlan: 'ENTERPRISE_PROTECT',
      subscriptionExpiryDate: '2027-01-01T00:00:00Z',
      totalOrdersCount: 12,
      totalSpendInr: 18600.00,
      disputeCount: 0,
      isVip: true,
      memberSince: '2026-06-15T00:00:00Z',
      notes: 'Corporate facility manager account. Multiple commercial properties.',
    },
    {
      id: 'cust_karan_05',
      userId: 'usr_cust_05',
      fullName: 'Karan Mehta',
      phone: '+919825044332',
      email: 'karan.mehta@gujaratsteel.com',
      defaultAddressLine: '404, Shivalik Plaza, CG Road, Ahmedabad',
      defaultPincode: '380009',
      defaultLatitude: 23.0300,
      defaultLongitude: 72.5600,
      activeSubscriptionPlan: 'NONE',
      totalOrdersCount: 1,
      totalSpendInr: 1250.00,
      disputeCount: 0,
      isVip: false,
      memberSince: '2026-10-02T00:00:00Z',
      notes: 'Commercial shop owner. Fan repair completed.',
    },
  ],
  globalCommissionConfig: {
    platformRevenueSharePct: 15.0,
    partnerDefaultSharePct: 15.0,
    technicianNetSharePct: 70.0,
    gstStatutoryRatePct: 18.0,
    emergencySosPremiumPct: 20.0,
    autoEscrowDisbursement: true,
    minWithdrawalThresholdInr: 500,
    lastUpdated: '2026-10-06T12:00:00Z',
  },
  serviceCategories: [
    {
      id: 'cat_repairs',
      name: 'Electrical Repairs',
      slug: 'electrical-repairs',
      description: 'Standard home wiring, appliances, switches & ceiling fans',
    },
    {
      id: 'cat_emergency',
      name: '24/7 SOS Emergency Services',
      slug: 'emergency-sos',
      description: 'Rapid 15-minute response for sparking, burning smells & power outages',
    },
    {
      id: 'cat_installation',
      name: 'Appliance & Heavy Installations',
      slug: 'appliance-installations',
      description: 'AC lines, inverters, geysers, modular switchboards & heavy cabling',
    },
    {
      id: 'cat_commercial',
      name: 'High-Voltage & Commercial Maintenance',
      slug: 'high-voltage-commercial',
      description: '3-phase distribution boards, industrial panels & load compliance audits',
    },
  ],
  serviceCatalog: [
    {
      id: 'srv_fan_01',
      categoryId: 'cat_repairs',
      title: 'Ceiling Fan Repair / Bearing Replacement',
      code: 'SRV-FAN-01',
      basePriceInr: 1059.32,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 45,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_mcb_02',
      categoryId: 'cat_emergency',
      title: 'Circuit Breaker Tripping & Short-Circuit Diagnostic',
      code: 'SRV-MCB-02',
      basePriceInr: 1059.32,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 30,
      isEmergencySosEligible: true,
    },
    {
      id: 'srv_sw_03',
      categoryId: 'cat_repairs',
      title: 'Modular Switchboard Rewiring & Replacement',
      code: 'SRV-SW-03',
      basePriceInr: 677.97,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 40,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_ac_04',
      categoryId: 'cat_installation',
      title: 'Heavy AC Power Line Installation & Dedicated MCB',
      code: 'SRV-AC-04',
      basePriceInr: 1525.42,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 60,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_hv_05',
      categoryId: 'cat_commercial',
      title: '3-Phase Commercial Panel & Transformer Audit',
      code: 'SRV-HV-05',
      basePriceInr: 2966.10,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 90,
      isEmergencySosEligible: true,
    },
  ],
  jobs: [
    {
      id: 'job_1001',
      jobTicketNumber: 'J-1001',
      customerId: 'cust_amit_01',
      customerName: 'Amit Sharma',
      customerPhone: '+919876543213',
      partnerId: 'ptnr_mah_01',
      technicianId: 'tech_rajesh_01',
      technicianName: 'Rajesh Kumar',
      serviceId: 'srv_fan_01',
      serviceTitle: 'Ceiling Fan Repair / Bearing Replacement',
      pincode: '400001',
      customerAddressText: 'Flat 402, Sea Green Apartments, Colaba, Mumbai 400001',
      customerLatitude: 18.9067,
      customerLongitude: 72.8147,
      status: 'IN_PROGRESS',
      priority: 'STANDARD',
      scheduledAt: new Date().toISOString(),
      slaExpiryAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      safetyGlovesConfirmed: true,
      safetyMcbSwitchConfirmed: true,
      handoverOtp: '4829',
      beforePhotoUrl: '/uploads/jobs/J1001_before.jpg',
      totalAmountInr: 1250.00,
    },
    {
      id: 'job_1005',
      jobTicketNumber: 'J-1005',
      customerId: 'cust_amit_01',
      customerName: 'Amit Sharma',
      customerPhone: '+919876543213',
      partnerId: 'ptnr_mah_01',
      serviceId: 'srv_mcb_02',
      serviceTitle: 'Circuit Breaker Tripping & Short-Circuit Diagnostic',
      pincode: '400001',
      customerAddressText: 'Shop #12, Colaba Market Lane, Mumbai 400001',
      customerLatitude: 18.9100,
      customerLongitude: 72.8200,
      status: 'ESCALATED_SLA',
      priority: 'URGENT_SLA',
      scheduledAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      slaExpiryAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      safetyGlovesConfirmed: false,
      safetyMcbSwitchConfirmed: false,
      handoverOtp: '9182',
      totalAmountInr: 1475.00,
    },
  ],
  invoices: [
    {
      id: 'inv_1001',
      invoiceNumber: 'INV-2026-001',
      jobId: 'job_1001',
      customerId: 'cust_amit_01',
      partnerId: 'ptnr_mah_01',
      baseAmount: 1059.32,
      cgstAmount: 95.34,
      sgstAmount: 95.34,
      totalAmount: 1250.00,
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      razorpayPaymentId: 'pay_EL_8819231',
      createdAt: '2026-10-06T12:00:00Z',
    },
    {
      id: 'inv_1002',
      invoiceNumber: 'INV-2026-002',
      jobId: 'job_1002',
      customerId: 'cust_priya_02',
      partnerId: 'ptnr_mah_01',
      baseAmount: 2100.00,
      cgstAmount: 189.00,
      sgstAmount: 189.00,
      totalAmount: 2478.00,
      paymentStatus: 'PAID',
      paymentMethod: 'CREDIT_DEBIT_CARD',
      razorpayPaymentId: 'pay_EL_9918234',
      createdAt: '2026-10-06T14:30:00Z',
    },
    {
      id: 'inv_1003',
      invoiceNumber: 'INV-2026-003',
      jobId: 'job_1005',
      customerId: 'cust_amit_01',
      partnerId: 'ptnr_mah_01',
      baseAmount: 1250.00,
      cgstAmount: 112.50,
      sgstAmount: 112.50,
      totalAmount: 1475.00,
      paymentStatus: 'ISSUED',
      paymentMethod: 'UPI',
      createdAt: '2026-10-06T16:00:00Z',
    },
    {
      id: 'inv_1004',
      invoiceNumber: 'INV-2026-004',
      jobId: 'job_1004',
      customerId: 'cust_ananya_04',
      partnerId: 'ptnr_kar_03',
      baseAmount: 3000.00,
      cgstAmount: 270.00,
      sgstAmount: 270.00,
      totalAmount: 3540.00,
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      razorpayPaymentId: 'pay_EL_7721109',
      createdAt: '2026-10-05T11:15:00Z',
    },
  ],
  supportTickets: [
    {
      id: 'sup_1024',
      ticketNumber: 'SUP-1024',
      subject: 'Technician Delay Escalation - Colaba Hub',
      priority: 'CRITICAL_EMERGENCY',
      status: 'OPEN',
      description: 'High-voltage feeder line delay in Colaba market quadrant. 30-min SLA timer breached. Proximity reassignment requested.',
      customerId: 'cust_amit_01',
      customerName: 'Amit Sharma',
      customerPhone: '+919820011223',
      technicianId: 'tech_pradeep_02',
      technicianName: 'Pradeep Jadhav',
      jobId: 'job_1005',
      jobTicketNumber: 'J-1005',
      assignedTo: 'Super Admin Vikram',
      category: 'DISPATCH_DELAY',
      slaDueAt: '2026-10-07T02:00:00Z',
      createdAt: '2026-10-06T12:05:00Z',
      updatedAt: '2026-10-06T12:08:00Z',
    },
    {
      id: 'sup_1025',
      ticketNumber: 'SUP-1025',
      subject: 'Zex Surge Protection Warranty Claim - Inverter Tripping',
      priority: 'HIGH',
      status: 'IN_INVESTIGATION',
      description: 'Customer reports voltage spike in Bandra West causing smart inverter to trip repeatedly. Protection Plan covers up to ₹25,000.',
      customerId: 'cust_priya_02',
      customerName: 'Priya Sundaram',
      customerPhone: '+919819922334',
      technicianId: 'tech_rajesh_01',
      technicianName: 'Rajesh Kumar',
      jobId: 'job_1002',
      jobTicketNumber: 'J-1002',
      assignedTo: 'Super Admin Vikram',
      category: 'WARRANTY_CLAIM',
      slaDueAt: '2026-10-07T04:30:00Z',
      createdAt: '2026-10-06T10:30:00Z',
      updatedAt: '2026-10-06T11:00:00Z',
    },
    {
      id: 'sup_1026',
      ticketNumber: 'SUP-1026',
      subject: 'Franchise Escrow Commission Split Reconciliation',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      description: 'Maharashtra Operations Hub requested reconciliation query regarding 18% GST deduction on invoice #INV-2026-001.',
      assignedTo: 'Central Finance Treasury',
      category: 'FINANCE_COMMISSION',
      resolutionNotes: 'Audited against central ledger ref TXN-2026-00102. 18% GST (CGST ₹95.34 + SGST ₹95.34) correctly escrowed for GSTR-3B compliance.',
      slaDueAt: '2026-10-06T15:00:00Z',
      createdAt: '2026-10-06T09:15:00Z',
      updatedAt: '2026-10-06T14:45:00Z',
    },
  ],
  escalationEvents: [
    {
      id: 'esc_1005_init',
      jobId: 'job_1005',
      jobTicketNumber: 'J-1005',
      trigger: 'SLA_BREACH_TIMER',
      reason: '30-minute response timer breached without dispatch acceptance in Colaba Hub',
      proximityDistanceKm: 1.15,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ],
  ledgerEntries: [
    {
      id: 'led_1001_01',
      transactionReference: 'TXN-2026-00101',
      invoiceId: 'inv_1001',
      jobTicketNumber: 'J-1001',
      partnerId: 'ptnr_mah_01',
      technicianId: 'tech_rajesh_01',
      ledgerType: 'CUSTOMER_PAYMENT',
      entryDirection: 'CREDIT',
      amountInr: 1250.00,
      runningBalanceInr: 1250.00,
      narrative: 'Customer Amit Sharma paid for Ceiling Fan Repair J-1001 via UPI',
      createdAt: '2026-10-06T12:00:00Z',
    },
    {
      id: 'led_1001_02',
      transactionReference: 'TXN-2026-00102',
      invoiceId: 'inv_1001',
      jobTicketNumber: 'J-1001',
      partnerId: 'ptnr_mah_01',
      ledgerType: 'GST_RESERVE_18',
      entryDirection: 'DEBIT',
      amountInr: 190.68,
      runningBalanceInr: 190.68,
      narrative: 'Statutory 18% GST (9% CGST ₹95.34 + 9% SGST ₹95.34) withheld for GSTR-3B tax return',
      createdAt: '2026-10-06T12:00:00Z',
    },
    {
      id: 'led_1001_03',
      transactionReference: 'TXN-2026-00103',
      invoiceId: 'inv_1001',
      jobTicketNumber: 'J-1001',
      partnerId: 'ptnr_mah_01',
      ledgerType: 'PLATFORM_FEE',
      entryDirection: 'DEBIT',
      amountInr: 158.90,
      runningBalanceInr: 158.90,
      narrative: 'ElectriCare Platform Fee recognized (15.0% of Base Labor ₹1,059.32)',
      createdAt: '2026-10-06T12:00:00Z',
    },
    {
      id: 'led_1001_04',
      transactionReference: 'TXN-2026-00104',
      invoiceId: 'inv_1001',
      jobTicketNumber: 'J-1001',
      partnerId: 'ptnr_mah_01',
      ledgerType: 'PARTNER_COMMISSION',
      entryDirection: 'DEBIT',
      amountInr: 158.90,
      runningBalanceInr: 158.90,
      narrative: 'Maharashtra Operations Hub Regional Share (15.0% of Base Labor ₹1,059.32)',
      createdAt: '2026-10-06T12:00:00Z',
    },
    {
      id: 'led_1001_05',
      transactionReference: 'TXN-2026-00105',
      invoiceId: 'inv_1001',
      jobTicketNumber: 'J-1001',
      partnerId: 'ptnr_mah_01',
      technicianId: 'tech_rajesh_01',
      ledgerType: 'TECHNICIAN_PAYOUT',
      entryDirection: 'DEBIT',
      amountInr: 741.52,
      runningBalanceInr: 741.52,
      narrative: 'Technician Rajesh Kumar Net Labor Earnings (70.0% of Base Labor ₹1,059.32)',
      createdAt: '2026-10-06T12:00:00Z',
    },
  ],
  subscriptionTiers: [
    {
      id: 'tier_user_1mo',
      name: 'Zex Cyber Surge Shield (Monthly)',
      code: 'SHIELD-USER-1M',
      targetAudience: 'CONSUMER',
      priceInr: 199.00,
      durationMonths: 1,
      surgeProtectionCoverageInr: 25000.00,
      freeInspectionsCount: 1,
      isPrioritySosDispatch: true,
      applianceWarrantyIncluded: true,
      cyberShieldAuditIncluded: false,
      isActive: true,
      description: 'Instant residential surge protection up to ₹25,000, 1 free quarterly earthing inspection, guaranteed 15-min priority SOS dispatch.',
    },
    {
      id: 'tier_user_1yr',
      name: 'Zex Cyber Surge Shield Gold (Annual)',
      code: 'SHIELD-USER-1Y',
      targetAudience: 'CONSUMER',
      priceInr: 1499.00,
      durationMonths: 12,
      surgeProtectionCoverageInr: 75000.00,
      freeInspectionsCount: 4,
      isPrioritySosDispatch: true,
      applianceWarrantyIncluded: true,
      cyberShieldAuditIncluded: true,
      isActive: true,
      description: 'Comprehensive annual household electrical immunity. ₹75,000 surge warranty, 4 seasonal safety audits, and unlimited zero-fee SOS callouts.',
    },
    {
      id: 'tier_partner_3mo',
      name: 'Partner Franchise Operations Shield (Quarterly)',
      code: 'SHIELD-PTNR-3M',
      targetAudience: 'PARTNER_FRANCHISE',
      priceInr: 4999.00,
      durationMonths: 3,
      surgeProtectionCoverageInr: 500000.00,
      freeInspectionsCount: 12,
      isPrioritySosDispatch: true,
      applianceWarrantyIncluded: true,
      cyberShieldAuditIncluded: true,
      isActive: true,
      description: 'Enterprise protection covering regional hub test benches, multi-meter diagnostic fleet, and ₹5,00,000 electrical liability indemnity.',
    },
    {
      id: 'tier_enterprise_1yr',
      name: 'Zex Grid Enterprise Shield (Annual)',
      code: 'SHIELD-ENT-1Y',
      targetAudience: 'ENTERPRISE',
      priceInr: 17999.00,
      durationMonths: 12,
      surgeProtectionCoverageInr: 2500000.00,
      freeInspectionsCount: 24,
      isPrioritySosDispatch: true,
      applianceWarrantyIncluded: true,
      cyberShieldAuditIncluded: true,
      isActive: true,
      description: 'Commercial 3-phase and high-voltage grid substation protection. ₹25,00,000 equipment coverage, SCADA integration & 24/7 designated master electrical engineer.',
    },
  ],
  subscriptions: [
    {
      id: 'sub_101',
      tierId: 'tier_user_1yr',
      tierName: 'Zex Cyber Surge Shield Gold (Annual)',
      subscriberType: 'CUSTOMER',
      subscriberId: 'cust_amit_01',
      subscriberName: 'Amit Sharma',
      subscriberPhone: '+919820011223',
      pricePaidInr: 1499.00,
      startDate: '2026-09-01T00:00:00Z',
      expiryDate: '2027-09-01T00:00:00Z',
      status: 'ACTIVE',
      autoRenew: true,
      coverageMaxInr: 75000.00,
    },
    {
      id: 'sub_102',
      tierId: 'tier_user_1mo',
      tierName: 'Zex Cyber Surge Shield (Monthly)',
      subscriberType: 'CUSTOMER',
      subscriberId: 'cust_priya_02',
      subscriberName: 'Priya Sundaram',
      subscriberPhone: '+919819922334',
      pricePaidInr: 199.00,
      startDate: '2026-10-01T00:00:00Z',
      expiryDate: '2026-11-01T00:00:00Z',
      status: 'ACTIVE',
      autoRenew: true,
      coverageMaxInr: 25000.00,
    },
    {
      id: 'sub_103',
      tierId: 'tier_partner_3mo',
      tierName: 'Partner Franchise Operations Shield (Quarterly)',
      subscriberType: 'PARTNER',
      subscriberId: 'ptnr_mah_01',
      subscriberName: 'Maharashtra Operations Hub (Suresh Patil)',
      subscriberPhone: '+919876543211',
      pricePaidInr: 4999.00,
      startDate: '2026-08-15T00:00:00Z',
      expiryDate: '2026-11-15T00:00:00Z',
      status: 'ACTIVE',
      autoRenew: false,
      coverageMaxInr: 500000.00,
    },
    {
      id: 'sub_104',
      tierId: 'tier_user_1mo',
      tierName: 'Zex Cyber Surge Shield (Monthly)',
      subscriberType: 'CUSTOMER',
      subscriberId: 'cust_rahul_03',
      subscriberName: 'Rahul Verma',
      subscriberPhone: '+919821133445',
      pricePaidInr: 199.00,
      startDate: '2026-08-01T00:00:00Z',
      expiryDate: '2026-09-01T00:00:00Z',
      status: 'EXPIRED',
      autoRenew: false,
      coverageMaxInr: 25000.00,
    },
  ],
  wormAuditLogs: [
    {
      id: 'worm_log_001',
      sequenceNumber: 1,
      timestamp: '2026-08-01T00:00:00Z',
      actorId: 'usr_admin_01',
      actorRole: 'SUPER_ADMIN',
      action: 'SYSTEM_BOOT_AUDIT_GENESIS',
      resourceType: 'SYSTEM_LEDGER',
      resourceId: 'SYS-001',
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      currentHash: '38ab1e73644172943b9f151635c636b25914fee7e04eb4a164b93bf69418c64b',
      payloadSummary: 'ElectriCare National Multi-Tenant Core Cluster Genesis Block initialized',
      ipAddress: '127.0.0.1',
      isTamperVerified: true,
    },
    {
      id: 'worm_log_002',
      sequenceNumber: 2,
      timestamp: '2026-08-10T10:00:00Z',
      actorId: 'usr_admin_01',
      actorRole: 'SUPER_ADMIN',
      action: 'PARTNER_TERRITORY_ALLOCATED',
      resourceType: 'PARTNER',
      resourceId: 'ptnr_mah_01',
      previousHash: '38ab1e73644172943b9f151635c636b25914fee7e04eb4a164b93bf69418c64b',
      currentHash: 'f686b10f85b8f3a1ec44e56bfcfd43ae68ef89c35f7cda38bb2ce30e907cedf4',
      payloadSummary: 'Maharashtra Operations Hub granted jurisdiction over 400001 (Colaba) with 15% rev share',
      ipAddress: '103.21.244.2',
      isTamperVerified: true,
    },
    {
      id: 'worm_log_003',
      sequenceNumber: 3,
      timestamp: '2026-08-15T14:30:00Z',
      actorId: 'usr_partner_01',
      actorRole: 'PARTNER',
      action: 'TECHNICIAN_KYC_VERIFIED',
      resourceType: 'TECHNICIAN',
      resourceId: 'tech_rajesh_01',
      previousHash: 'f686b10f85b8f3a1ec44e56bfcfd43ae68ef89c35f7cda38bb2ce30e907cedf4',
      currentHash: '1caa915bf3ecdb6dc604509bec022ad680675c9b2857e84c5a3625ea1db24f2f',
      payloadSummary: 'Rajesh Kumar Class-1 Electrical License & 1000V Insulated Gloves certified',
      ipAddress: '103.21.244.15',
      isTamperVerified: true,
    },
    {
      id: 'worm_log_004',
      sequenceNumber: 4,
      timestamp: '2026-10-06T12:05:00Z',
      actorId: 'SYSTEM_DISPATCH',
      actorRole: 'SYSTEM',
      action: 'SLA_BREACH_REASSIGNMENT',
      resourceType: 'JOB_ORDER',
      resourceId: 'job_1005',
      previousHash: '1caa915bf3ecdb6dc604509bec022ad680675c9b2857e84c5a3625ea1db24f2f',
      currentHash: '42054b0f3f7b8359f77c5f86b34cb31035e88bba1de99d284d852e9d2cae0798',
      payloadSummary: 'Colaba Hub 30-min SLA breached. Auto-reassigned to Pradeep Jadhav (1.15km proximity)',
      ipAddress: '127.0.0.1',
      isTamperVerified: true,
    },
    {
      id: 'worm_log_005',
      sequenceNumber: 5,
      timestamp: '2026-10-06T12:15:00Z',
      actorId: 'usr_admin_01',
      actorRole: 'SUPER_ADMIN',
      action: 'COMMISSION_RATE_CALIBRATED',
      resourceType: 'COMMISSION_CONFIG',
      resourceId: 'COMM-GLOBAL',
      previousHash: '42054b0f3f7b8359f77c5f86b34cb31035e88bba1de99d284d852e9d2cae0798',
      currentHash: 'a2b9933013fbd168868a5632dcc3444dc09b5c6b7384d52e45989c68977cc903',
      payloadSummary: 'Platform Fee updated to 15.0%, Partner 15.0%, Technician 70.0% with 100% sum verification',
      ipAddress: '103.21.244.2',
      isTamperVerified: true,
    },
  ],
};

// Mutable runtime state for API mutations during development
export const dbStore = { ...initialStore };
