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

export interface WithdrawalRecord {
  id: string;
  technicianId: string;
  technicianName: string;
  technicianBadge: string;
  technicianPhone: string;
  partnerId: string;
  amountInr: number;
  payoutMethod: 'UPI' | 'BANK_ACCOUNT';
  upiId?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  utrNumber?: string;
  partnerMessage?: string;
  rejectionReason?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface ElectriCareStore {
  users: Array<{
    id: string;
    phone: string;
    email: string;
    fullName: string;
    role: 'SUPER_ADMIN' | 'PARTNER' | 'TECHNICIAN' | 'CUSTOMER';
    avatarUrl?: string | null;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    passwordHash?: string;
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
    email?: string;
    avatarUrl?: string | null;
    rating: number;
    totalJobsCompleted: number;
    isOnline: boolean;
    currentLatitude: number;
    currentLongitude: number;
    assignedPincode: string;
    kycStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED';
    electricalLicenseNumber?: string;
    insulatedGlovesVerified?: boolean;
    safetyKitSerial?: string;
    trade?: string;
    specialization?: string;
    experience?: string;
    license?: string;
    serviceArea?: string;
    aadharNumberMasked?: string;
    panDocUrl?: string;
    kycRejectionReason?: string;
    kycVerifiedAt?: string;
    kycNotes?: string;
    passwordHash?: string;
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
  withdrawals: WithdrawalRecord[];
}

export const initialStore: ElectriCareStore = {
  users: [
    {
      id: 'usr_admin_01',
      phone: '+919876543210',
      email: 'admin@ghartak.in',
      fullName: 'Vikram Malhotra',
      role: 'SUPER_ADMIN',
      isVerified: true,
      isActive: true,
      createdAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'usr_partner_01',
      phone: '+919876543211',
      email: 'operations@ghartak.in',
      fullName: 'Operations Partner',
      role: 'PARTNER',
      isVerified: true,
      isActive: true,
      createdAt: '2026-08-10T00:00:00Z',
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
  technicians: [],
  customers: [],
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
      id: 'cat_aluminum_glass',
      name: 'Aluminum And Glass Fitting services',
      slug: 'aluminum-and-glass-fitting-services',
      description: 'Sliding window tracks, glass partitions and aluminum door frames',
    },
    {
      id: 'cat_carpenter',
      name: 'Carpenter',
      slug: 'carpenter',
      description: 'Door locks, furniture repair, hinge alignment and custom woodwork',
    },
    {
      id: 'cat_cctv',
      name: 'CCTV Service',
      slug: 'cctv-service',
      description: 'HD surveillance cameras, DVR hard disk repair and IP camera setup',
    },
    {
      id: 'cat_cleaner',
      name: 'Cleaner',
      slug: 'cleaner',
      description: 'Full home deep cleaning, kitchen sanitization and sofa shampooing',
    },
    {
      id: 'cat_digital_marketer',
      name: 'Digital Marketer',
      slug: 'digital-marketer',
      description: 'Google business profile SEO, social media ads and lead generation',
    },
    {
      id: 'cat_electrician',
      name: 'Electrician',
      slug: 'electrician',
      description: 'Ceiling fan, switchboard, wiring, MCB distribution panel and short circuit repair',
    },
    {
      id: 'cat_false_ceiling',
      name: 'False Ceiling Service',
      slug: 'false-ceiling-service',
      description: 'Gypsum ceiling installation, grid repair and LED cove lighting',
    },
    {
      id: 'cat_gas_stove',
      name: 'Gas Stove Service',
      slug: 'gas-stove-service',
      description: 'Gas burner cleaning, pipeline leak check and auto-ignition hob repair',
    },
    {
      id: 'cat_generator',
      name: 'Generator Technician',
      slug: 'generator-technician',
      description: 'Diesel generator routine servicing, AMF panel and alternator repair',
    },
    {
      id: 'cat_hot_cool',
      name: 'Hot And Cool',
      slug: 'hot-and-cool',
      description: 'AC jet service, gas top-up, geyser installation and refrigerator cooling',
    },
    {
      id: 'cat_house_painting',
      name: 'House Painting Service',
      slug: 'house-painting-service',
      description: 'Interior/exterior painting, waterproofing and wall texture coating',
    },
    {
      id: 'cat_it_service',
      name: 'IT Service',
      slug: 'it-service',
      description: 'Wi-Fi router setup, laptop/PC OS formatting and printer repair',
    },
    {
      id: 'cat_laundry',
      name: 'Laundry Service',
      slug: 'laundry-service',
      description: 'Steam ironing, premium dry cleaning pickup and blanket wash',
    },
    {
      id: 'cat_packers_movers',
      name: 'Packers & Movers',
      slug: 'packers-movers',
      description: 'Local home shifting, intercity moving and safe furniture transit',
    },
    {
      id: 'cat_pest_control',
      name: 'Pest Control Service',
      slug: 'pest-control-service',
      description: 'Cockroach herbal gel, anti-termite treatment and bed bug eradication',
    },
    {
      id: 'cat_plumber',
      name: 'Plumber',
      slug: 'plumber',
      description: 'Pipe leakage repair, tap fitting, water tank cleaning and bathroom fixtures',
    },
    {
      id: 'cat_rajmistri',
      name: 'Rajmistri',
      slug: 'rajmistri',
      description: 'Brick masonry, wall plastering, tile/marble laying and concrete repairs',
    },
    {
      id: 'cat_wallpaper',
      name: 'Wallpaper',
      slug: 'wallpaper',
      description: 'Designer wallpaper pasting, 3D wall murals and wallpaper removal',
    },
  ],
  serviceCatalog: [
    {
      id: 'srv_fan_install',
      categoryId: 'cat_electrician',
      title: 'Fan Installation',
      code: 'FAN-INSTALL-01',
      basePriceInr: 299.0,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 35,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_light_install',
      categoryId: 'cat_electrician',
      title: 'Light Installation',
      code: 'LIGHT-INSTALL-01',
      basePriceInr: 199.0,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 25,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_modular_switch',
      categoryId: 'cat_electrician',
      title: 'Switchboard Repair',
      code: 'SWITCH-REPAIR-01',
      basePriceInr: 349.0,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 35,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_mcb_panel',
      categoryId: 'cat_electrician',
      title: 'MCB & Fuse Replacement',
      code: 'MCB-REPAIR-01',
      basePriceInr: 499.0,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 40,
      isEmergencySosEligible: true,
    },
    {
      id: 'srv_fan_01',
      categoryId: 'cat_electrician',
      title: 'Ceiling Fan Repair / Bearing Replacement',
      code: 'SRV-FAN-01',
      basePriceInr: 1059.32,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 45,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_mcb_02',
      categoryId: 'cat_electrician',
      title: 'Circuit Breaker Tripping & Short-Circuit Diagnostic',
      code: 'SRV-MCB-02',
      basePriceInr: 1059.32,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 30,
      isEmergencySosEligible: true,
    },
    {
      id: 'srv_sw_03',
      categoryId: 'cat_electrician',
      title: 'Modular Switchboard Rewiring & Replacement',
      code: 'SRV-SW-03',
      basePriceInr: 677.97,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 40,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_ac_04',
      categoryId: 'cat_hot_cool',
      title: 'Heavy AC Jet Servicing & Gas Top-up',
      code: 'SRV-AC-04',
      basePriceInr: 1525.42,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 60,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_hv_05',
      categoryId: 'cat_electrician',
      title: '3-Phase Commercial Panel & Transformer Audit',
      code: 'SRV-HV-05',
      basePriceInr: 2966.10,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 90,
      isEmergencySosEligible: true,
    },
    {
      id: 'srv_plumb_01',
      categoryId: 'cat_plumber',
      title: 'Concealed Pipe Leakage & Burst Repair',
      code: 'SRV-PLUMB-01',
      basePriceInr: 799.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 45,
      isEmergencySosEligible: true,
    },
    {
      id: 'srv_carp_01',
      categoryId: 'cat_carpenter',
      title: 'Door Lock & Handle Fitting',
      code: 'SRV-CARP-01',
      basePriceInr: 599.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 45,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_clean_01',
      categoryId: 'cat_cleaner',
      title: 'Full Home Deep Cleaning & Sanitization',
      code: 'SRV-CLEAN-01',
      basePriceInr: 1999.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 180,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_gas_01',
      categoryId: 'cat_gas_stove',
      title: 'Gas Stove Burner Deep Cleaning & Flame Tune-up',
      code: 'SRV-GAS-01',
      basePriceInr: 499.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 35,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_raj_01',
      categoryId: 'cat_rajmistri',
      title: 'Brick Masonry & Wall Plastering Repair',
      code: 'SRV-RAJ-01',
      basePriceInr: 1199.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 120,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_laund_01',
      categoryId: 'cat_laundry',
      title: 'Steam Ironing & Wash Care Service',
      code: 'SRV-LAUND-01',
      basePriceInr: 299.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 30,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_pack_01',
      categoryId: 'cat_packers_movers',
      title: 'Local Home Shifting & Relocation Package',
      code: 'SRV-PACK-01',
      basePriceInr: 4999.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 240,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_pest_01',
      categoryId: 'cat_pest_control',
      title: 'Odorless Herbal Cockroach & Pest Control',
      code: 'SRV-PEST-01',
      basePriceInr: 899.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 45,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_paint_01',
      categoryId: 'cat_house_painting',
      title: 'Full Home Interior Emulsion Painting',
      code: 'SRV-PAINT-01',
      basePriceInr: 4499.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 300,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_wall_01',
      categoryId: 'cat_wallpaper',
      title: 'Designer Wallpaper Pasting & Roll Installation',
      code: 'SRV-WALL-01',
      basePriceInr: 899.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 60,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_alum_01',
      categoryId: 'cat_aluminum_glass',
      title: 'Sliding Window Roller & Track Repair',
      code: 'SRV-ALUM-01',
      basePriceInr: 699.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 45,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_gen_01',
      categoryId: 'cat_generator',
      title: 'Diesel Generator Routine Servicing & Oil Change',
      code: 'SRV-GEN-01',
      basePriceInr: 1699.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 90,
      isEmergencySosEligible: true,
    },
    {
      id: 'srv_ceil_01',
      categoryId: 'cat_false_ceiling',
      title: 'Gypsum False Ceiling Installation & Grid Fix',
      code: 'SRV-CEIL-01',
      basePriceInr: 1499.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 120,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_it_01',
      categoryId: 'cat_it_service',
      title: 'Wi-Fi Router Setup & Home Network Expansion',
      code: 'SRV-IT-01',
      basePriceInr: 499.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 40,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_mkt_01',
      categoryId: 'cat_digital_marketer',
      title: 'Google Business Profile & Local SEO Setup',
      code: 'SRV-MKT-01',
      basePriceInr: 1299.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 120,
      isEmergencySosEligible: false,
    },
    {
      id: 'srv_cctv_01',
      categoryId: 'cat_cctv',
      title: 'HD CCTV Camera Setup (4-Channel System)',
      code: 'SRV-CCTV-01',
      basePriceInr: 2499.00,
      gstRatePct: 18.0,
      estimatedDurationMinutes: 150,
      isEmergencySosEligible: false,
    },
  ],
  jobs: [],
  invoices: [],
  supportTickets: [],
  escalationEvents: [],
  ledgerEntries: [],
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
  withdrawals: [],
};

// Mutable runtime state for API mutations during development
export const dbStore = { ...initialStore };
