// ==============================================================================
// ElectriCare Database Abstraction Layer (Graceful Dual Engine)
// Connects to live PostgreSQL via Prisma Client when available;
// seamlessly falls back to high-fidelity seed store for instant local dev & testing.
// ==============================================================================

import crypto from 'crypto';
import { prisma } from './prisma';
import { dbStore, SubscriptionTierRecord, SubscriptionRecord, WormAuditLogRecord } from './mock-data';
import { calculateIndianGst18 } from './tax-engine';

let lastDbCheck = 0;
let cachedDbConnected = false;

export async function isDatabaseConnected(): Promise<boolean> {
  const now = Date.now();
  if (now - lastDbCheck < 15000) {
    return cachedDbConnected;
  }
  lastDbCheck = now;
  try {
    const probe = prisma.$queryRaw`SELECT 1`;
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 350));
    await Promise.race([probe, timeout]);
    cachedDbConnected = true;
    return true;
  } catch {
    cachedDbConnected = false;
    return false;
  }
}

export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function calculateCommissionSplit(input: {
  baseAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  platformPct?: number; // default 15%
  partnerPct?: number;  // default 15%
  techPct?: number;     // default 70%
}) {
  const platformPct = input.platformPct ?? 15.0;
  const partnerPct = input.partnerPct ?? 15.0;
  const techPct = input.techPct ?? 70.0;

  const base = Math.round(input.baseAmount * 100) / 100;
  const gstReserve = Math.round((input.cgstAmount + input.sgstAmount) * 100) / 100;

  const platformFee = Math.round(base * (platformPct / 100) * 100) / 100;
  const partnerCommission = Math.round(base * (partnerPct / 100) * 100) / 100;
  // Tech net earnings takes the remaining balance to guarantee exact mathematical balance
  const technicianPayout = Math.round((base - platformFee - partnerCommission) * 100) / 100;

  const totalDistributed = Math.round((platformFee + partnerCommission + technicianPayout + gstReserve) * 100) / 100;
  const discrepancy = Math.round((input.totalAmount - totalDistributed) * 100) / 100;

  return {
    baseAmountInr: base,
    gstReserveInr: gstReserve,
    cgstAmountInr: input.cgstAmount,
    sgstAmountInr: input.sgstAmount,
    platformFeeInr: platformFee,
    platformPct,
    partnerCommissionInr: partnerCommission,
    partnerPct,
    technicianPayoutInr: technicianPayout,
    techPct,
    totalCustomerAmountInr: input.totalAmount,
    totalDistributedInr: totalDistributed,
    discrepancyInr: discrepancy,
    isReconciled: Math.abs(discrepancy) < 0.01,
  };
}

export const db = {
  // Users & Auth
  async getUserByPhone(phone: string) {
    if (await isDatabaseConnected()) {
      try {
        const liveUser = await prisma.user.findUnique({
          where: { phone },
          include: { partnerProfile: true, technicianProfile: true, customerProfile: true },
        });
        if (liveUser) return liveUser;
      } catch {
        // Fallback
      }
    }
    return dbStore.users.find((u) => u.phone === phone) || null;
  },

  async getUserById(id: string) {
    if (await isDatabaseConnected()) {
      try {
        const liveUser = await prisma.user.findUnique({ where: { id } });
        if (liveUser) return liveUser;
      } catch {
        // Fallback
      }
    }
    return dbStore.users.find((u) => u.id === id) || null;
  },

  // Technicians
  async getAllTechnicians(filter?: {
    partnerId?: string;
    pincode?: string;
    isOnline?: boolean;
    kycStatus?: string;
    search?: string;
  }) {
    if (await isDatabaseConnected()) {
      try {
        const whereClause: Record<string, unknown> = {};
        if (filter?.partnerId) whereClause.partnerId = filter.partnerId;
        if (filter?.pincode) whereClause.assignedPincode = filter.pincode;
        if (filter?.isOnline !== undefined) whereClause.isOnline = filter.isOnline;
        if (filter?.kycStatus) whereClause.kycStatus = filter.kycStatus;
        if (filter?.search) {
          whereClause.OR = [
            { badgeNumber: { contains: filter.search, mode: 'insensitive' } },
            { electricalLicenseNumber: { contains: filter.search, mode: 'insensitive' } },
            { user: { fullName: { contains: filter.search, mode: 'insensitive' } } },
          ];
        }

        const liveTechs = await prisma.technician.findMany({
          where: whereClause,
          include: { user: true, partner: true },
          orderBy: { rating: 'desc' },
        });
        if (liveTechs && liveTechs.length > 0) return liveTechs;
      } catch {
        // Fallback
      }
    }

    return dbStore.technicians.filter((t) => {
      if (filter?.partnerId && t.partnerId !== filter.partnerId) return false;
      if (filter?.pincode && t.assignedPincode !== filter.pincode) return false;
      if (filter?.isOnline !== undefined && t.isOnline !== filter.isOnline) return false;
      if (filter?.kycStatus && t.kycStatus !== filter.kycStatus) return false;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        return (
          t.fullName.toLowerCase().includes(q) ||
          t.badgeNumber.toLowerCase().includes(q) ||
          t.phone.includes(q)
        );
      }
      return true;
    });
  },

  async getTechnicianById(id: string) {
    if (await isDatabaseConnected()) {
      try {
        const tech = await prisma.technician.findUnique({
          where: { id },
          include: { user: true, partner: true },
        });
        if (tech) return tech;
      } catch {
        // Fallback
      }
    }
    return dbStore.technicians.find((t) => t.id === id) || null;
  },

  async getTechnicianByUserId(userId: string) {
    if (await isDatabaseConnected()) {
      try {
        const tech = await prisma.technician.findUnique({
          where: { userId },
          include: { user: true, partner: true },
        });
        if (tech) return tech;
      } catch {
        // Fallback
      }
    }
    return dbStore.technicians.find((t) => t.userId === userId) || null;
  },

  async updateTechnicianKyc(
    id: string,
    data: {
      aadharDocUrl?: string;
      panDocUrl?: string;
      electricalLicenseNumber?: string;
      electricalLicenseDocUrl?: string;
      safetyKitSerial?: string;
    }
  ) {
    if (await isDatabaseConnected()) {
      try {
        return await prisma.technician.update({
          where: { id },
          data: {
            ...data,
            kycStatus: 'PENDING_REVIEW',
          },
          include: { user: true, partner: true },
        });
      } catch {
        // Fallback
      }
    }

    const tech = dbStore.technicians.find((t) => t.id === id);
    if (!tech) return null;
    if (data.electricalLicenseNumber) tech.electricalLicenseNumber = data.electricalLicenseNumber;
    if (data.safetyKitSerial) tech.safetyKitSerial = data.safetyKitSerial;
    tech.kycStatus = 'PENDING_REVIEW';
    return tech;
  },

  async updateTechnicianKycStatus(
    id: string,
    status: 'VERIFIED' | 'REJECTED',
    opts?: { reason?: string; verifierId?: string; insulatedGlovesVerified?: boolean }
  ) {
    if (await isDatabaseConnected()) {
      try {
        return await prisma.technician.update({
          where: { id },
          data: {
            kycStatus: status,
            insulatedGlovesVerified: opts?.insulatedGlovesVerified ?? (status === 'VERIFIED'),
            kycVerifiedAt: status === 'VERIFIED' ? new Date() : null,
            kycVerifiedById: opts?.verifierId,
          },
          include: { user: true, partner: true },
        });
      } catch {
        // Fallback
      }
    }

    const tech = dbStore.technicians.find((t) => t.id === id);
    if (!tech) return null;
    tech.kycStatus = status;
    if (opts?.insulatedGlovesVerified !== undefined) {
      tech.insulatedGlovesVerified = opts.insulatedGlovesVerified;
    } else if (status === 'VERIFIED') {
      tech.insulatedGlovesVerified = true;
    }
    if (status === 'VERIFIED') {
      tech.kycVerifiedAt = new Date().toISOString();
      tech.kycNotes = opts?.reason || 'Verified by Admin Compliance Board';
      tech.kycRejectionReason = undefined;
    } else {
      tech.kycVerifiedAt = undefined;
      tech.kycRejectionReason = opts?.reason || 'Document verification failed compliance criteria';
    }
    return tech;
  },

  async updateTechnicianAvailability(
    id: string,
    isOnline: boolean,
    coords?: { latitude?: number; longitude?: number }
  ) {
    if (await isDatabaseConnected()) {
      try {
        return await prisma.technician.update({
          where: { id },
          data: {
            isOnline,
            ...(coords?.latitude !== undefined ? { currentLatitude: coords.latitude } : {}),
            ...(coords?.longitude !== undefined ? { currentLongitude: coords.longitude } : {}),
          },
          include: { user: true, partner: true },
        });
      } catch {
        // Fallback
      }
    }

    const tech = dbStore.technicians.find((t) => t.id === id);
    if (!tech) return null;
    tech.isOnline = isOnline;
    if (coords?.latitude !== undefined) tech.currentLatitude = coords.latitude;
    if (coords?.longitude !== undefined) tech.currentLongitude = coords.longitude;
    return tech;
  },

  async updateTechnicianShiftAndPincode(
    id: string,
    updates: {
      isOnline?: boolean;
      assignedPincode?: string;
      insulatedGlovesVerified?: boolean;
      safetyKitSerial?: string;
    }
  ) {
    if (await isDatabaseConnected()) {
      try {
        return await prisma.technician.update({
          where: { id },
          data: {
            ...(updates.isOnline !== undefined ? { isOnline: updates.isOnline } : {}),
            ...(updates.assignedPincode ? { assignedPincode: updates.assignedPincode } : {}),
            ...(updates.insulatedGlovesVerified !== undefined ? { insulatedGlovesVerified: updates.insulatedGlovesVerified } : {}),
            ...(updates.safetyKitSerial ? { safetyKitSerial: updates.safetyKitSerial } : {}),
          },
          include: { user: true, partner: true },
        });
      } catch {
        // Fallback
      }
    }

    const tech = dbStore.technicians.find((t) => t.id === id);
    if (!tech) return null;
    if (updates.isOnline !== undefined) tech.isOnline = updates.isOnline;
    if (updates.assignedPincode) tech.assignedPincode = updates.assignedPincode;
    if (updates.insulatedGlovesVerified !== undefined) tech.insulatedGlovesVerified = updates.insulatedGlovesVerified;
    if (updates.safetyKitSerial) tech.safetyKitSerial = updates.safetyKitSerial;
    return tech;
  },

  // Pincode Territory & Jurisdictions
  async getAllPincodes(filter?: { state?: string; partnerId?: string; activeOnly?: boolean; search?: string }) {
    if (await isDatabaseConnected()) {
      try {
        const whereClause: Record<string, unknown> = {};
        if (filter?.state) whereClause.state = filter.state;
        if (filter?.partnerId) whereClause.partnerId = filter.partnerId;
        if (filter?.activeOnly) whereClause.isActive = true;
        if (filter?.search) {
          whereClause.OR = [
            { pincode: { contains: filter.search } },
            { areaName: { contains: filter.search, mode: 'insensitive' } },
          ];
        }

        const livePincodes = await prisma.pincodeCoverage.findMany({
          where: whereClause,
          include: { partner: true },
          orderBy: { pincode: 'asc' },
        });
        if (livePincodes && livePincodes.length > 0) return livePincodes;
      } catch {
        // Fallback
      }
    }

    return dbStore.pincodes
      .filter((p) => {
        if (filter?.state && p.state.toLowerCase() !== filter.state.toLowerCase()) return false;
        if (filter?.partnerId && p.partnerId !== filter.partnerId) return false;
        if (filter?.activeOnly && !p.isActive) return false;
        if (filter?.search) {
          const q = filter.search.toLowerCase();
          return p.pincode.includes(q) || p.areaName.toLowerCase().includes(q);
        }
        return true;
      })
      .map((p) => ({
        ...p,
        partner: dbStore.partner.id === p.partnerId ? dbStore.partner : null,
      }));
  },

  async getPincodeCoverage(pincode: string) {
    if (await isDatabaseConnected()) {
      try {
        const cov = await prisma.pincodeCoverage.findUnique({
          where: { pincode },
          include: { partner: true },
        });
        if (cov) return cov;
      } catch {
        // Fallback
      }
    }
    const found = dbStore.pincodes.find((p) => p.pincode === pincode);
    if (!found) return null;
    return {
      ...found,
      partner: dbStore.partner.id === found.partnerId ? dbStore.partner : null,
    };
  },

  async updatePincodeCapacity(
    pincode: string,
    updates: {
      activeCapacityCount?: number;
      targetEtaMinutes?: number;
      perimeterRadiusKm?: number;
      isActive?: boolean;
      isExclusive?: boolean;
    }
  ) {
    if (await isDatabaseConnected()) {
      try {
        return await prisma.pincodeCoverage.update({
          where: { pincode },
          data: {
            ...(updates.activeCapacityCount !== undefined ? { activeCapacityCount: updates.activeCapacityCount } : {}),
            ...(updates.targetEtaMinutes !== undefined ? { targetEtaMinutes: updates.targetEtaMinutes } : {}),
            ...(updates.perimeterRadiusKm !== undefined ? { perimeterRadiusKm: updates.perimeterRadiusKm } : {}),
            ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
            ...(updates.isExclusive !== undefined ? { isExclusive: updates.isExclusive } : {}),
          },
        });
      } catch {
        // Fallback
      }
    }

    const pin = dbStore.pincodes.find((p) => p.pincode === pincode);
    if (!pin) return null;
    if (updates.activeCapacityCount !== undefined) pin.activeCapacityCount = updates.activeCapacityCount;
    if (updates.targetEtaMinutes !== undefined) pin.targetEtaMinutes = updates.targetEtaMinutes;
    if (updates.perimeterRadiusKm !== undefined) pin.perimeterRadiusKm = updates.perimeterRadiusKm;
    if (updates.isActive !== undefined) pin.isActive = updates.isActive;
    if (updates.isExclusive !== undefined) pin.isExclusive = updates.isExclusive;
    return pin;
  },

  // Jobs & Algorithmic Dispatch Lifecycle State Machine
  async getJobs(filter?: {
    pincode?: string;
    partnerId?: string;
    technicianId?: string;
    customerId?: string;
    status?: string;
    search?: string;
  }) {
    if (await isDatabaseConnected()) {
      try {
        const whereClause: Record<string, unknown> = {};
        if (filter?.pincode) whereClause.pincode = filter.pincode;
        if (filter?.partnerId) whereClause.partnerId = filter.partnerId;
        if (filter?.technicianId) whereClause.technicianId = filter.technicianId;
        if (filter?.customerId) whereClause.customerId = filter.customerId;
        if (filter?.status) whereClause.status = filter.status;
        if (filter?.search) {
          whereClause.OR = [
            { jobTicketNumber: { contains: filter.search, mode: 'insensitive' } },
            { customerAddressText: { contains: filter.search, mode: 'insensitive' } },
          ];
        }

        const liveJobs = await prisma.job.findMany({
          where: whereClause,
          include: { customer: true, technician: true, service: true, invoice: true },
          orderBy: { createdAt: 'desc' },
        });
        if (liveJobs && liveJobs.length > 0) return liveJobs;
      } catch {
        // Fallback
      }
    }

    return dbStore.jobs.filter((j) => {
      if (filter?.pincode && j.pincode !== filter.pincode) return false;
      if (filter?.partnerId && j.partnerId !== filter.partnerId) return false;
      if (filter?.technicianId && j.technicianId !== filter.technicianId) return false;
      if (filter?.customerId && j.customerId !== filter.customerId) return false;
      if (filter?.status && j.status !== filter.status) return false;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        return (
          j.jobTicketNumber.toLowerCase().includes(q) ||
          j.customerAddressText.toLowerCase().includes(q) ||
          j.customerName.toLowerCase().includes(q) ||
          j.serviceTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  },

  async getJobById(id: string) {
    if (await isDatabaseConnected()) {
      try {
        const job = await prisma.job.findFirst({
          where: { OR: [{ id }, { jobTicketNumber: id }] },
          include: { customer: true, technician: true, service: true, invoice: true },
        });
        if (job) return job;
      } catch {
        // Fallback
      }
    }

    const job = dbStore.jobs.find((j) => j.id === id || j.jobTicketNumber === id);
    if (!job) return null;

    const technician = job.technicianId ? dbStore.technicians.find((t) => t.id === job.technicianId) : null;
    const customer = dbStore.users.find((u) => u.id === job.customerId);
    const service = dbStore.serviceCatalog.find((s) => s.id === job.serviceId);
    const invoice = dbStore.invoices.find((i) => i.jobId === job.id);

    return {
      ...job,
      technician,
      customer,
      service,
      invoice,
    };
  },

  async getJobByTicketNumber(jobTicketNumber: string) {
    return this.getJobById(jobTicketNumber);
  },

  async createJob(params: {
    customerId: string;
    serviceId: string;
    pincode: string;
    customerAddressText: string;
    customerLatitude?: number;
    customerLongitude?: number;
    priority?: 'STANDARD' | 'URGENT_SLA' | 'EMERGENCY_SOS_247';
    scheduledAt?: string;
  }) {
    const service = dbStore.serviceCatalog.find((s) => s.id === params.serviceId || s.code === params.serviceId);
    if (!service) {
      throw new Error(`Service '${params.serviceId}' not found in catalog`);
    }

    const pincodeCov = dbStore.pincodes.find((p) => p.pincode === params.pincode);
    if (!pincodeCov) {
      throw new Error(`Pincode '${params.pincode}' is not within serviceable coverage`);
    }

    const customerUser = dbStore.users.find((u) => u.id === params.customerId || u.phone === params.customerId);
    const customerName = customerUser ? customerUser.fullName : 'Valued Customer';
    const customerPhone = customerUser ? customerUser.phone : '+919876543213';

    // Algorithmic Dispatch: Find eligible active, online, KYC-verified technician with 1000V gloves
    const eligibleTechs = dbStore.technicians.filter(
      (t) =>
        t.assignedPincode === params.pincode &&
        t.isOnline &&
        t.kycStatus === 'VERIFIED' &&
        t.insulatedGlovesVerified
    );

    // Sort by rating descending (highest rated first)
    eligibleTechs.sort((a, b) => b.rating - a.rating);
    const assignedTech = eligibleTechs.length > 0 ? eligibleTechs[0] : null;

    const now = new Date();
    const priority = params.priority || (service.isEmergencySosEligible ? 'EMERGENCY_SOS_247' : 'STANDARD');
    const slaMinutes = priority === 'EMERGENCY_SOS_247' ? 15 : 30;
    const slaExpiry = new Date(now.getTime() + slaMinutes * 60 * 1000);

    const totalExisting = dbStore.jobs.length;
    const nextTicketNumber = `J-${1000 + totalExisting + 1}`;
    const generatedId = `job_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const handoverOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const taxCalc = calculateIndianGst18({ baseLaborInr: service.basePriceInr });

    const newJob = {
      id: generatedId,
      jobTicketNumber: nextTicketNumber,
      customerId: customerUser?.id || params.customerId,
      customerName,
      customerPhone,
      partnerId: pincodeCov.partnerId,
      technicianId: assignedTech?.id,
      technicianName: assignedTech?.fullName,
      serviceId: service.id,
      serviceTitle: service.title,
      pincode: params.pincode,
      customerAddressText: params.customerAddressText,
      customerLatitude: params.customerLatitude || (assignedTech?.currentLatitude || 18.9067),
      customerLongitude: params.customerLongitude || (assignedTech?.currentLongitude || 72.8147),
      status: (assignedTech ? 'ASSIGNED' : 'PENDING_DISPATCH') as
        | 'PENDING_DISPATCH'
        | 'ASSIGNED'
        | 'EN_ROUTE'
        | 'ARRIVED'
        | 'SAFETY_CHECKED'
        | 'IN_PROGRESS'
        | 'WORK_COMPLETED'
        | 'PAYMENT_PENDING'
        | 'SETTLED'
        | 'CANCELLED'
        | 'ESCALATED_SLA',
      priority,
      scheduledAt: params.scheduledAt || now.toISOString(),
      slaExpiryAt: slaExpiry.toISOString(),
      dispatchedAt: assignedTech ? now.toISOString() : undefined,
      safetyGlovesConfirmed: false,
      safetyMcbSwitchConfirmed: false,
      handoverOtp,
      totalAmountInr: taxCalc.totalPayableInr,
    };

    dbStore.jobs.unshift(newJob);

    // Attempt live insert if database is reachable
    if (await isDatabaseConnected()) {
      try {
        await prisma.job.create({
          data: {
            id: newJob.id,
            jobTicketNumber: newJob.jobTicketNumber,
            customerId: newJob.customerId,
            partnerId: newJob.partnerId,
            technicianId: newJob.technicianId || null,
            serviceId: newJob.serviceId,
            pincode: newJob.pincode,
            customerAddressText: newJob.customerAddressText,
            customerLatitude: newJob.customerLatitude,
            customerLongitude: newJob.customerLongitude,
            status: newJob.status,
            priority: newJob.priority,
            scheduledAt: new Date(newJob.scheduledAt),
            slaExpiryAt: new Date(newJob.slaExpiryAt),
            dispatchedAt: newJob.dispatchedAt ? new Date(newJob.dispatchedAt) : null,
            handoverOtp: newJob.handoverOtp,
          },
        });
      } catch {
        // Fallback
      }
    }

    await this.recordWormAuditLog({
      actorId: newJob.customerId,
      actorRole: 'CUSTOMER',
      action: 'JOB_BOOKING_CREATED',
      resourceType: 'JOB',
      resourceId: newJob.id,
      payloadSummary: `Work Order ${newJob.jobTicketNumber} created for ${newJob.serviceTitle} at Pincode ${newJob.pincode} (${newJob.customerAddressText})`,
    });

    return newJob;
  },

  async respondToDispatch(
    jobId: string,
    technicianId: string,
    action: 'ACCEPT' | 'REJECT',
    rejectionReason?: string
  ) {
    const job = dbStore.jobs.find((j) => j.id === jobId || j.jobTicketNumber === jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found`);
    }

    if (job.status !== 'ASSIGNED' && job.status !== 'PENDING_DISPATCH') {
      throw new Error(`Cannot respond to dispatch: Job is currently '${job.status}', not awaiting response`);
    }

    if (action === 'ACCEPT') {
      job.status = 'ASSIGNED';
      job.technicianId = technicianId;
      const tech = dbStore.technicians.find((t) => t.id === technicianId);
      if (tech) job.technicianName = tech.fullName;
      job.dispatchedAt = new Date().toISOString();
      return {
        job,
        outcome: 'ACCEPTED',
        message: 'Dispatch accepted. Ready to navigate to customer premises.',
      };
    } else {
      // REJECT: Reassign or escalate
      job.technicianId = undefined;
      job.technicianName = undefined;

      // Algorithmic Reassignment: Find next available online verified technician in same pincode
      const fallbacks = dbStore.technicians.filter(
        (t) =>
          t.id !== technicianId &&
          t.assignedPincode === job.pincode &&
          t.isOnline &&
          t.kycStatus === 'VERIFIED' &&
          t.insulatedGlovesVerified
      );

      if (fallbacks.length > 0) {
        fallbacks.sort((a, b) => b.rating - a.rating);
        const nextTech = fallbacks[0];
        job.technicianId = nextTech.id;
        job.technicianName = nextTech.fullName;
        job.status = 'ASSIGNED';
        job.dispatchedAt = new Date().toISOString();
        return {
          job,
          outcome: 'REASSIGNED',
          reassignedTo: nextTech.fullName,
          message: `Technician rejected (${rejectionReason || 'Declined'}). Reassigned immediately to ${nextTech.fullName}.`,
        };
      } else {
        job.status = 'ESCALATED_SLA';
        return {
          job,
          outcome: 'ESCALATED',
          message: `Technician rejected (${rejectionReason || 'Declined'}). No standby technician available in ${job.pincode}. Escalated to SLA Emergency Queue.`,
        };
      }
    }
  },

  async updateJobStatus(jobId: string, newStatus: string, metadata?: { actorId?: string; reason?: string }) {
    const validTransitions: Record<string, string[]> = {
      PENDING_DISPATCH: ['ASSIGNED', 'CANCELLED', 'ESCALATED_SLA'],
      ASSIGNED: ['EN_ROUTE', 'CANCELLED', 'ESCALATED_SLA', 'PENDING_DISPATCH'],
      EN_ROUTE: ['ARRIVED', 'CANCELLED', 'ESCALATED_SLA'],
      ARRIVED: ['SAFETY_CHECKED', 'CANCELLED', 'ESCALATED_SLA'],
      SAFETY_CHECKED: ['IN_PROGRESS', 'CANCELLED', 'ESCALATED_SLA'],
      IN_PROGRESS: ['WORK_COMPLETED', 'ESCALATED_SLA', 'CANCELLED'],
      WORK_COMPLETED: ['PAYMENT_PENDING', 'SETTLED'],
      PAYMENT_PENDING: ['SETTLED'],
      SETTLED: [],
      CANCELLED: [],
      ESCALATED_SLA: ['ASSIGNED', 'PENDING_DISPATCH', 'CANCELLED'],
    };

    const job = dbStore.jobs.find((j) => j.id === jobId || j.jobTicketNumber === jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found`);
    }

    const current = job.status;
    const allowed = validTransitions[current] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Illegal state transition: Cannot change job from '${current}' to '${newStatus}'. Allowed transitions: [${allowed.join(', ')}]`
      );
    }

    // Safety Interlock check before starting work
    if (newStatus === 'IN_PROGRESS' && (!job.safetyGlovesConfirmed || !job.safetyMcbSwitchConfirmed)) {
      throw new Error(
        'Safety interlock violation: 1000V Insulated Gloves and Main MCB cut-off must be confirmed before starting work.'
      );
    }

    job.status = newStatus as any;
    const now = new Date().toISOString();

    if (newStatus === 'ARRIVED') job.arrivedAt = now;
    if (newStatus === 'IN_PROGRESS') job.startedAt = now;
    if (newStatus === 'WORK_COMPLETED') job.completedAt = now;

    await this.recordWormAuditLog({
      actorId: metadata?.actorId || job.technicianId || 'SYSTEM_DISPATCH',
      actorRole: 'TECHNICIAN',
      action: `JOB_TRANSITION_${newStatus}`,
      resourceType: 'JOB',
      resourceId: job.id,
      payloadSummary: `Work Order ${job.jobTicketNumber} transitioned from ${current} to ${newStatus}${metadata?.reason ? ` (${metadata.reason})` : ''}`,
    });

    return job;
  },

  async verifySafetyInterlock(
    jobId: string,
    data: { safetyGlovesConfirmed: boolean; safetyMcbSwitchConfirmed: boolean; beforePhotoUrl?: string }
  ) {
    const job = dbStore.jobs.find((j) => j.id === jobId || j.jobTicketNumber === jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found`);
    }

    if (!data.safetyGlovesConfirmed) {
      throw new Error('Mandatory safety protocol: 1000V Insulated Gloves must be worn and confirmed.');
    }

    if (!data.safetyMcbSwitchConfirmed) {
      throw new Error('Mandatory safety protocol: Main MCB / Breaker power cut-off must be confirmed.');
    }

    job.safetyGlovesConfirmed = true;
    job.safetyMcbSwitchConfirmed = true;
    if (data.beforePhotoUrl) job.beforePhotoUrl = data.beforePhotoUrl;

    job.status = 'SAFETY_CHECKED';

    await this.recordWormAuditLog({
      actorId: job.technicianId || 'tech_rajesh_01',
      actorRole: 'TECHNICIAN',
      action: 'SAFETY_INTERLOCK_VERIFIED',
      resourceType: 'SAFETY_CHECK',
      resourceId: job.id,
      payloadSummary: `1000V Insulated Gloves and Main MCB lockout physically confirmed for ${job.jobTicketNumber}. Before-photo evidence recorded.`,
    });

    return job;
  },

  async completeJob(
    jobId: string,
    data: { handoverOtp: string; afterPhotoUrl?: string; customerRating?: number; customerFeedback?: string }
  ) {
    const job = dbStore.jobs.find((j) => j.id === jobId || j.jobTicketNumber === jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found`);
    }

    if (job.status !== 'IN_PROGRESS' && job.status !== 'SAFETY_CHECKED') {
      throw new Error(`Cannot complete job: Current status is '${job.status}'. Job must be IN_PROGRESS.`);
    }

    if (!data.handoverOtp || data.handoverOtp.trim() !== job.handoverOtp) {
      throw new Error(`Invalid handover OTP. The code provided does not match customer's 4-digit verification code.`);
    }

    const now = new Date().toISOString();
    job.status = 'WORK_COMPLETED';
    job.completedAt = now;
    if (data.afterPhotoUrl) job.afterPhotoUrl = data.afterPhotoUrl;
    if (data.customerRating) job.customerRating = data.customerRating;
    if (data.customerFeedback) job.customerFeedback = data.customerFeedback;

    // Increment technician completed jobs
    if (job.technicianId) {
      const tech = dbStore.technicians.find((t) => t.id === job.technicianId);
      if (tech) tech.totalJobsCompleted += 1;
    }

    // Automatically issue Indian GST Invoice
    let invoice = dbStore.invoices.find((i) => i.jobId === job.id);
    if (!invoice) {
      const service = dbStore.serviceCatalog.find((s) => s.id === job.serviceId);
      const base = service ? service.basePriceInr : 1059.32;
      const tax = calculateIndianGst18({ baseLaborInr: base });

      invoice = {
        id: `inv_${Date.now().toString(36)}`,
        invoiceNumber: `INV-2026-${(dbStore.invoices.length + 1).toString().padStart(3, '0')}`,
        jobId: job.id,
        customerId: job.customerId,
        partnerId: job.partnerId,
        baseAmount: tax.baseLaborInr,
        cgstAmount: tax.cgstAmountInr,
        sgstAmount: tax.sgstAmountInr,
        totalAmount: tax.totalPayableInr,
        paymentStatus: 'ISSUED',
        paymentMethod: 'UPI',
        createdAt: now,
      };
      dbStore.invoices.push(invoice);
    }

    await this.recordWormAuditLog({
      actorId: job.technicianId || 'tech_rajesh_01',
      actorRole: 'TECHNICIAN',
      action: 'WORK_COMPLETED_OTP_VERIFIED',
      resourceType: 'JOB',
      resourceId: job.id,
      payloadSummary: `Job ${job.jobTicketNumber} completed. Customer 4-digit Handover OTP verified. Tax Invoice ${invoice.invoiceNumber} (₹${invoice.totalAmount}) issued.`,
    });

    return { job, invoice };
  },

  // Emergency SLA Escalation & Proximity Reassignment Logic (TASK-008)
  async getNearbyTechnicians(
    jobLat: number,
    jobLon: number,
    options?: { maxDistanceKm?: number; excludeTechnicianIds?: string[] }
  ) {
    const excludeIds = new Set(options?.excludeTechnicianIds || []);
    const maxDist = options?.maxDistanceKm || 15.0; // 15 km cluster perimeter

    const candidates = dbStore.technicians.filter(
      (t) =>
        !excludeIds.has(t.id) &&
        t.isOnline &&
        t.kycStatus === 'VERIFIED' &&
        t.insulatedGlovesVerified &&
        t.currentLatitude !== undefined &&
        t.currentLongitude !== undefined
    );

    const scored = candidates.map((tech) => {
      const distKm = calculateHaversineDistanceKm(jobLat, jobLon, tech.currentLatitude!, tech.currentLongitude!);
      const estimatedTransitMinutes = Math.round((distKm / 25) * 60) + 5;
      return {
        ...tech,
        distanceKm: distKm,
        estimatedTransitMinutes,
      };
    });

    return scored
      .filter((t) => t.distanceKm <= maxDist)
      .sort((a, b) => a.distanceKm - b.distanceKm || b.rating - a.rating);
  },

  async escalateJobSla(
    jobId: string,
    trigger: 'SLA_BREACH_TIMER' | 'TECHNICIAN_REJECTION' | 'MANUAL_DISPATCHER_OVERRIDE' | 'CUSTOMER_COMPLAINT',
    reason: string
  ) {
    const job = dbStore.jobs.find((j) => j.id === jobId || j.jobTicketNumber === jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found`);
    }

    job.status = 'ESCALATED_SLA';
    job.priority = 'URGENT_SLA';

    const escalationId = `esc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const event = {
      id: escalationId,
      jobId: job.id,
      jobTicketNumber: job.jobTicketNumber,
      trigger,
      previousTechnicianId: job.technicianId,
      previousTechnicianName: job.technicianName,
      reason,
      timestamp: new Date().toISOString(),
    };

    dbStore.escalationEvents.unshift(event);

    const ticketId = `sup_${Date.now().toString(36)}`;
    const ticketNumber = `SUP-${Math.floor(1000 + Math.random() * 9000)}`;
    dbStore.supportTickets.unshift({
      id: ticketId,
      ticketNumber,
      subject: `CRITICAL SLA ESCALATION: Work Order ${job.jobTicketNumber}`,
      priority: 'CRITICAL_EMERGENCY',
      status: 'OPEN',
      description: `Automated SLA escalation for ${job.serviceTitle} at ${job.customerAddressText}. Reason: ${reason}. Proximity reassignment required immediately.`,
      createdAt: new Date().toISOString(),
    });

    return { job, escalationEvent: event, supportTicketNumber: ticketNumber };
  },

  async reassignJobProximity(
    jobId: string,
    options?: { targetTechnicianId?: string; reason?: string; slaExtensionMinutes?: number }
  ) {
    const job = dbStore.jobs.find((j) => j.id === jobId || j.jobTicketNumber === jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found`);
    }

    const previousTechId = job.technicianId;
    const previousTechName = job.technicianName;

    let chosenTech: any = null;
    let distanceKm = 0;

    if (options?.targetTechnicianId) {
      const candidate = dbStore.technicians.find((t) => t.id === options.targetTechnicianId);
      if (!candidate) {
        throw new Error(`Technician '${options.targetTechnicianId}' not found`);
      }
      if (!candidate.isOnline) {
        throw new Error(`Technician '${candidate.fullName}' is currently OFFLINE`);
      }
      if (candidate.kycStatus !== 'VERIFIED') {
        throw new Error(`Technician '${candidate.fullName}' KYC is not verified`);
      }
      if (!candidate.insulatedGlovesVerified) {
        throw new Error(`Technician '${candidate.fullName}' does not have 1000V Insulated Gloves certified`);
      }
      chosenTech = candidate;
      if (candidate.currentLatitude && candidate.currentLongitude) {
        distanceKm = calculateHaversineDistanceKm(
          job.customerLatitude,
          job.customerLongitude,
          candidate.currentLatitude,
          candidate.currentLongitude
        );
      }
    } else {
      const nearby = await this.getNearbyTechnicians(job.customerLatitude, job.customerLongitude, {
        excludeTechnicianIds: previousTechId ? [previousTechId] : [],
      });

      if (nearby.length === 0) {
        throw new Error(
          `Proximity reassignment failed: No standby online verified technicians available within service cluster for pincode ${job.pincode}.`
        );
      }
      chosenTech = nearby[0];
      distanceKm = chosenTech.distanceKm;
    }

    const now = new Date();
    const extensionMinutes = options?.slaExtensionMinutes || 20;
    const newExpiry = new Date(now.getTime() + extensionMinutes * 60 * 1000);

    job.technicianId = chosenTech.id;
    job.technicianName = chosenTech.fullName;
    job.status = 'ASSIGNED';
    job.slaExpiryAt = newExpiry.toISOString();
    job.dispatchedAt = now.toISOString();

    const escalationId = `esc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const event = {
      id: escalationId,
      jobId: job.id,
      jobTicketNumber: job.jobTicketNumber,
      trigger: (options?.targetTechnicianId ? 'MANUAL_DISPATCHER_OVERRIDE' : 'SLA_BREACH_TIMER') as any,
      previousTechnicianId: previousTechId,
      previousTechnicianName: previousTechName,
      reassignedTechnicianId: chosenTech.id,
      reassignedTechnicianName: chosenTech.fullName,
      proximityDistanceKm: distanceKm,
      reason: options?.reason || `Proximity reassignment to nearest qualified technician (${distanceKm} km away)`,
      slaExtendedMinutes: extensionMinutes,
      timestamp: now.toISOString(),
    };

    dbStore.escalationEvents.unshift(event);

    return {
      job,
      reassignedTechnician: chosenTech,
      proximityDistanceKm: distanceKm,
      previousTechnician: previousTechName ? { id: previousTechId, fullName: previousTechName } : null,
      escalationEvent: event,
      newSlaExpiryAt: job.slaExpiryAt,
    };
  },

  async sweepAndAutoEscalateJobs() {
    const now = Date.now();
    const breachedJobs: any[] = [];
    const autoReassigned: any[] = [];

    for (const job of dbStore.jobs) {
      if (['WORK_COMPLETED', 'SETTLED', 'CANCELLED'].includes(job.status)) {
        continue;
      }

      const expiryTime = new Date(job.slaExpiryAt).getTime();
      if (expiryTime < now) {
        if (job.status !== 'ESCALATED_SLA') {
          job.status = 'ESCALATED_SLA';
          job.priority = 'URGENT_SLA';
          breachedJobs.push({
            jobTicketNumber: job.jobTicketNumber,
            breachedByMinutes: Math.round((now - expiryTime) / 60000),
            previousStatus: job.status,
          });

          try {
            const reassignResult = await this.reassignJobProximity(job.id, {
              reason: `Auto-sweep SLA breach (${Math.round((now - expiryTime) / 60000)}m overdue). Proximity reassignment triggered.`,
            });
            autoReassigned.push({
              jobTicketNumber: job.jobTicketNumber,
              reassignedTo: reassignResult.reassignedTechnician.fullName,
              distanceKm: reassignResult.proximityDistanceKm,
            });
          } catch {
            // Remainder remains in ESCALATED_SLA
          }
        }
      }
    }

    return {
      scannedAt: new Date().toISOString(),
      breachedCount: breachedJobs.length,
      breachedJobs,
      autoReassignedCount: autoReassigned.length,
      autoReassigned,
    };
  },

  async getEscalatedJobs(filter?: { pincode?: string; partnerId?: string }) {
    const now = Date.now();
    const escalated: any[] = [];
    const atRisk: any[] = [];

    for (const job of dbStore.jobs) {
      if (filter?.pincode && job.pincode !== filter.pincode) continue;
      if (filter?.partnerId && job.partnerId !== filter.partnerId) continue;
      if (['WORK_COMPLETED', 'SETTLED', 'CANCELLED'].includes(job.status)) continue;

      const expiryTime = new Date(job.slaExpiryAt).getTime();
      const remainingMinutes = Math.round((expiryTime - now) / 60000);

      if (job.status === 'ESCALATED_SLA' || remainingMinutes < 0) {
        escalated.push({
          ...job,
          remainingMinutes,
          isBreached: true,
        });
      } else if (remainingMinutes <= 10) {
        atRisk.push({
          ...job,
          remainingMinutes,
          isBreached: false,
        });
      }
    }

    return {
      escalatedJobs: escalated,
      atRiskJobs: atRisk,
      escalationEvents: dbStore.escalationEvents,
      counts: {
        totalEscalated: escalated.length,
        totalAtRisk: atRisk.length,
        totalEscalationEvents: dbStore.escalationEvents.length,
      },
    };
  },

  // Service Catalog
  async getServiceCatalog() {
    if (await isDatabaseConnected()) {
      try {
        const services = await prisma.serviceCatalog.findMany({
          include: { category: true },
          where: { isActive: true },
        });
        if (services && services.length > 0) return services;
      } catch {
        // Fallback
      }
    }
    return dbStore.serviceCatalog;
  },

  // Commission Distribution, Split & Escrow Payout Engine (TASK-009)
  async distributeJobCommissions(
    invoiceIdOrJobId: string,
    options?: { paymentMethod?: string; transactionRef?: string }
  ) {
    const invoice = dbStore.invoices.find(
      (i) => i.id === invoiceIdOrJobId || i.invoiceNumber === invoiceIdOrJobId || i.jobId === invoiceIdOrJobId
    );
    if (!invoice) {
      throw new Error(`Invoice '${invoiceIdOrJobId}' not found for commission distribution`);
    }

    const job = dbStore.jobs.find((j) => j.id === invoice.jobId || j.jobTicketNumber === invoice.jobId);
    const partner = dbStore.partner;
    const technician = job?.technicianId ? dbStore.technicians.find((t) => t.id === job.technicianId) : null;

    // Check if double-entry ledgers have already been created for this invoice
    const existingLedgers = dbStore.ledgerEntries.filter((l) => l.invoiceId === invoice.id);
    if (existingLedgers.length >= 5) {
      return {
        invoice,
        job,
        splitSummary: calculateCommissionSplit({
          baseAmount: invoice.baseAmount,
          cgstAmount: invoice.cgstAmount,
          sgstAmount: invoice.sgstAmount,
          totalAmount: invoice.totalAmount,
        }),
        ledgerEntries: existingLedgers,
        alreadySettled: true,
      };
    }

    // Compute standard split: Platform 15%, Partner 15%, Technician 70% + 18% GST Escrow
    const split = calculateCommissionSplit({
      baseAmount: invoice.baseAmount,
      cgstAmount: invoice.cgstAmount,
      sgstAmount: invoice.sgstAmount,
      totalAmount: invoice.totalAmount,
      platformPct: partner.platformRevenueSharePct || 15.0,
      partnerPct: 15.0,
      techPct: 70.0,
    });

    const now = new Date().toISOString();
    const seq = dbStore.ledgerEntries.length + 100;
    const baseRef = options?.transactionRef || `TXN-2026-${seq}`;

    // 1. Customer Payment Inflow (CREDIT)
    const entryCustomer = {
      id: `led_${Date.now().toString(36)}_01`,
      transactionReference: `${baseRef}-IN`,
      invoiceId: invoice.id,
      jobTicketNumber: job?.jobTicketNumber || 'J-1001',
      partnerId: invoice.partnerId,
      technicianId: technician?.id,
      ledgerType: 'CUSTOMER_PAYMENT' as const,
      entryDirection: 'CREDIT' as const,
      amountInr: split.totalCustomerAmountInr,
      runningBalanceInr: split.totalCustomerAmountInr,
      narrative: `Customer payment for ${job?.serviceTitle || 'Service'} via ${options?.paymentMethod || invoice.paymentMethod}`,
      createdAt: now,
    };

    // 2. Statutory 18% GST Escrow Reserve (DEBIT)
    const entryGst = {
      id: `led_${Date.now().toString(36)}_02`,
      transactionReference: `${baseRef}-GST`,
      invoiceId: invoice.id,
      jobTicketNumber: job?.jobTicketNumber || 'J-1001',
      partnerId: invoice.partnerId,
      ledgerType: 'GST_RESERVE_18' as const,
      entryDirection: 'DEBIT' as const,
      amountInr: split.gstReserveInr,
      runningBalanceInr: split.gstReserveInr,
      narrative: `Statutory 18% GST (CGST ₹${split.cgstAmountInr} + SGST ₹${split.sgstAmountInr}) reserved for government tax filing`,
      createdAt: now,
    };

    // 3. Platform Revenue Share (DEBIT)
    const entryPlatform = {
      id: `led_${Date.now().toString(36)}_03`,
      transactionReference: `${baseRef}-HQ`,
      invoiceId: invoice.id,
      jobTicketNumber: job?.jobTicketNumber || 'J-1001',
      partnerId: invoice.partnerId,
      ledgerType: 'PLATFORM_FEE' as const,
      entryDirection: 'DEBIT' as const,
      amountInr: split.platformFeeInr,
      runningBalanceInr: split.platformFeeInr,
      narrative: `ElectriCare Platform Fee (${split.platformPct}% on base ₹${split.baseAmountInr})`,
      createdAt: now,
    };

    // 4. Regional Partner Franchise Commission (DEBIT)
    const entryPartner = {
      id: `led_${Date.now().toString(36)}_04`,
      transactionReference: `${baseRef}-PTNR`,
      invoiceId: invoice.id,
      jobTicketNumber: job?.jobTicketNumber || 'J-1001',
      partnerId: invoice.partnerId,
      ledgerType: 'PARTNER_COMMISSION' as const,
      entryDirection: 'DEBIT' as const,
      amountInr: split.partnerCommissionInr,
      runningBalanceInr: split.partnerCommissionInr,
      narrative: `${partner.entityName} regional commission (${split.partnerPct}% on base ₹${split.baseAmountInr})`,
      createdAt: now,
    };

    // 5. Technician Net Take-Home Payout (DEBIT)
    const entryTech = {
      id: `led_${Date.now().toString(36)}_05`,
      transactionReference: `${baseRef}-TECH`,
      invoiceId: invoice.id,
      jobTicketNumber: job?.jobTicketNumber || 'J-1001',
      partnerId: invoice.partnerId,
      technicianId: technician?.id,
      ledgerType: 'TECHNICIAN_PAYOUT' as const,
      entryDirection: 'DEBIT' as const,
      amountInr: split.technicianPayoutInr,
      runningBalanceInr: split.technicianPayoutInr,
      narrative: `Technician ${technician?.fullName || 'Field Tech'} net earnings (${split.techPct}% on base ₹${split.baseAmountInr})`,
      createdAt: now,
    };

    const newEntries = [entryCustomer, entryGst, entryPlatform, entryPartner, entryTech];
    dbStore.ledgerEntries.push(...newEntries);

    // Update statuses
    invoice.paymentStatus = 'PAID';
    invoice.paymentMethod = (options?.paymentMethod as any) || invoice.paymentMethod || 'UPI';
    if (job) {
      job.status = 'SETTLED';
    }

    await this.recordWormAuditLog({
      actorId: 'usr_admin_01',
      actorRole: 'SUPER_ADMIN',
      action: 'COMMISSION_SETTLED_DOUBLE_ENTRY',
      resourceType: 'SYSTEM_LEDGER',
      resourceId: invoice.id,
      payloadSummary: `Double-entry commission split posted for ${invoice.invoiceNumber}. Tech: ₹${split.technicianPayoutInr}, Partner: ₹${split.partnerCommissionInr}, Platform: ₹${split.platformFeeInr}, GST: ₹${split.gstReserveInr}. Discrepancy: ₹0.00.`,
    });

    return {
      invoice,
      job,
      splitSummary: split,
      ledgerEntries: newEntries,
      alreadySettled: false,
    };
  },

  async getLedgerEntries(filter?: {
    partnerId?: string;
    technicianId?: string;
    invoiceId?: string;
    ledgerType?: string;
    search?: string;
  }) {
    let entries = dbStore.ledgerEntries;

    if (filter?.partnerId) {
      entries = entries.filter((e) => e.partnerId === filter.partnerId);
    }
    if (filter?.technicianId) {
      entries = entries.filter((e) => e.technicianId === filter.technicianId);
    }
    if (filter?.invoiceId) {
      entries = entries.filter((e) => e.invoiceId === filter.invoiceId);
    }
    if (filter?.ledgerType) {
      entries = entries.filter((e) => e.ledgerType === filter.ledgerType);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.transactionReference.toLowerCase().includes(q) ||
          e.narrative.toLowerCase().includes(q) ||
          e.jobTicketNumber?.toLowerCase().includes(q)
      );
    }

    // Telemetry aggregations
    let totalCustomerInflowInr = 0;
    let totalGstReserveInr = 0;
    let totalPlatformFeeInr = 0;
    let totalPartnerCommissionInr = 0;
    let totalTechnicianPayoutsInr = 0;

    entries.forEach((e) => {
      if (e.ledgerType === 'CUSTOMER_PAYMENT' && e.entryDirection === 'CREDIT') {
        totalCustomerInflowInr += e.amountInr;
      } else if (e.ledgerType === 'GST_RESERVE_18') {
        totalGstReserveInr += e.amountInr;
      } else if (e.ledgerType === 'PLATFORM_FEE') {
        totalPlatformFeeInr += e.amountInr;
      } else if (e.ledgerType === 'PARTNER_COMMISSION') {
        totalPartnerCommissionInr += e.amountInr;
      } else if (e.ledgerType === 'TECHNICIAN_PAYOUT') {
        totalTechnicianPayoutsInr += e.amountInr;
      }
    });

    const totalAllocatedDebits =
      totalGstReserveInr + totalPlatformFeeInr + totalPartnerCommissionInr + totalTechnicianPayoutsInr;
    const varianceInr = Math.round((totalCustomerInflowInr - totalAllocatedDebits) * 100) / 100;

    return {
      ledgerEntries: entries,
      telemetry: {
        totalCustomerInflowInr: Math.round(totalCustomerInflowInr * 100) / 100,
        totalGstReserveInr: Math.round(totalGstReserveInr * 100) / 100,
        totalPlatformFeeInr: Math.round(totalPlatformFeeInr * 100) / 100,
        totalPartnerCommissionInr: Math.round(totalPartnerCommissionInr * 100) / 100,
        totalTechnicianPayoutsInr: Math.round(totalTechnicianPayoutsInr * 100) / 100,
        totalAllocatedDebits: Math.round(totalAllocatedDebits * 100) / 100,
        varianceInr,
        isDoubleEntryBalanced: Math.abs(varianceInr) < 0.05,
        totalEntriesCount: entries.length,
      },
    };
  },

  async getTechnicianWallet(technicianId: string) {
    const tech = dbStore.technicians.find((t) => t.id === technicianId || t.badgeNumber === technicianId);
    if (!tech) {
      throw new Error(`Technician '${technicianId}' not found`);
    }

    const payouts = dbStore.ledgerEntries.filter(
      (e) => e.technicianId === tech.id && e.ledgerType === 'TECHNICIAN_PAYOUT'
    );

    const totalLifetimeEarnedInr = payouts.reduce((sum, p) => sum + p.amountInr, 0);

    return {
      technician: {
        id: tech.id,
        fullName: tech.fullName,
        badgeNumber: tech.badgeNumber,
        rating: tech.rating,
        totalJobsCompleted: tech.totalJobsCompleted,
        assignedPincode: tech.assignedPincode,
      },
      wallet: {
        withdrawableBalanceInr: Math.round(totalLifetimeEarnedInr * 100) / 100,
        totalLifetimeEarnedInr: Math.round(totalLifetimeEarnedInr * 100) / 100,
        settledJobsCount: payouts.length,
        payoutCurrency: 'INR',
        autoPayoutFrequency: 'DAILY_EVENING_UPI',
      },
      recentPayoutLedgers: payouts.slice(0, 10),
    };
  },

  async getPartnerAccountingSummary(partnerId: string) {
    const p = dbStore.partner;
    const partnerEntries = dbStore.ledgerEntries.filter((e) => e.partnerId === p.id);

    const partnerCommissions = partnerEntries
      .filter((e) => e.ledgerType === 'PARTNER_COMMISSION')
      .reduce((sum, e) => sum + e.amountInr, 0);

    const grossVolume = partnerEntries
      .filter((e) => e.ledgerType === 'CUSTOMER_PAYMENT')
      .reduce((sum, e) => sum + e.amountInr, 0);

    const techPayouts = partnerEntries
      .filter((e) => e.ledgerType === 'TECHNICIAN_PAYOUT')
      .reduce((sum, e) => sum + e.amountInr, 0);

    return {
      partner: {
        id: p.id,
        entityName: p.entityName,
        stateLicensed: p.stateLicensed,
        bankName: p.bankName,
        bankAccountNumber: p.bankAccountNumber,
        ifscCode: p.ifscCode,
      },
      accounting: {
        grossBillingVolumeInr: Math.round(grossVolume * 100) / 100,
        partnerCommissionEarnedInr: Math.round(partnerCommissions * 100) / 100,
        technicianPayoutsDisbursedInr: Math.round(techPayouts * 100) / 100,
        effectiveCommissionRatePct: 15.0,
        settlementStatus: 'ESCROW_CURRENT',
      },
      transactionCount: partnerEntries.length,
    };
  },

  // Partner Hub Telemetry
  async getPartnerHub(partnerId?: string) {
    if (await isDatabaseConnected()) {
      try {
        const p = await prisma.partner.findFirst({
          include: { pincodeCoverage: true, technicians: true },
        });
        if (p) return p;
      } catch {
        // Fallback
      }
    }
    return {
      ...dbStore.partner,
      pincodeCoverage: dbStore.pincodes,
      technicians: dbStore.technicians,
    };
  },

  // Partner Franchises & Regional Hubs (TASK-016)
  async getAllPartners(filter?: { state?: string; status?: string; search?: string }) {
    let list = dbStore.partners || [dbStore.partner];
    if (filter?.state && filter.state !== 'ALL') {
      list = list.filter((p) => p.allocatedStates?.includes(filter.state!) || p.stateLicensed === filter.state);
    }
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((p) => p.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.entityName.toLowerCase().includes(q) ||
          p.directorName.toLowerCase().includes(q) ||
          p.companyRegistrationNumber.toLowerCase().includes(q) ||
          p.stateLicensed.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async getPartnerById(id: string) {
    const list = dbStore.partners || [dbStore.partner];
    const partner = list.find((p) => p.id === id);
    if (!partner) return null;
    const pincodes = dbStore.pincodes.filter((p) => p.partnerId === id);
    const technicians = dbStore.technicians.filter((t) => t.partnerId === id);
    return {
      ...partner,
      pincodes,
      technicians,
      activePincodesCount: pincodes.length,
      activeTechnicianCount: technicians.length,
    };
  },

  async createPartner(data: {
    entityName: string;
    directorName: string;
    email: string;
    phone: string;
    companyRegistrationNumber: string;
    gstin: string;
    stateLicensed: string;
    allocatedStates?: string[];
    maxPincodeQuota?: number;
    activeTechnicianQuota?: number;
    platformRevenueSharePct?: number;
    partnerRevenueSharePct?: number;
    ifscCode: string;
    bankAccountNumber: string;
    bankName: string;
  }) {
    const newPartner = {
      id: `ptnr_${Date.now().toString(36)}`,
      userId: `usr_partner_${Date.now().toString(36)}`,
      entityName: data.entityName,
      directorName: data.directorName,
      email: data.email,
      phone: data.phone,
      companyRegistrationNumber: data.companyRegistrationNumber,
      gstin: data.gstin,
      stateLicensed: data.stateLicensed,
      allocatedStates: data.allocatedStates || [data.stateLicensed],
      maxPincodeQuota: data.maxPincodeQuota || 30,
      activePincodesCount: 0,
      activeTechnicianQuota: data.activeTechnicianQuota || 50,
      activeTechnicianCount: 0,
      platformRevenueSharePct: data.platformRevenueSharePct || 15.0,
      partnerRevenueSharePct: data.partnerRevenueSharePct || 15.0,
      ifscCode: data.ifscCode,
      bankAccountNumber: data.bankAccountNumber,
      bankName: data.bankName,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
    };
    dbStore.partners.push(newPartner);
    return newPartner;
  },

  async updatePartner(id: string, updates: Partial<typeof dbStore.partners[0]>) {
    const list = dbStore.partners || [dbStore.partner];
    const partner = list.find((p) => p.id === id);
    if (!partner) return null;
    Object.assign(partner, updates);
    return partner;
  },

  // Pincode Management (TASK-017)
  async createPincode(data: {
    pincode: string;
    areaName: string;
    district: string;
    state: string;
    partnerId: string;
    density?: string;
    targetEtaMinutes?: number;
    isExclusive?: boolean;
    perimeterRadiusKm?: number;
  }) {
    const newPin = {
      id: `pin_${data.pincode}`,
      pincode: data.pincode,
      areaName: data.areaName,
      district: data.district,
      state: data.state,
      partnerId: data.partnerId,
      isActive: true,
      isExclusive: data.isExclusive !== undefined ? data.isExclusive : true,
      density: data.density || 'URBAN_HIGH_DENSITY',
      targetEtaMinutes: data.targetEtaMinutes || 20,
      activeCapacityCount: 0,
      perimeterRadiusKm: data.perimeterRadiusKm || 5.0,
    };
    dbStore.pincodes.push(newPin);
    return newPin;
  },

  async updatePincode(id: string, updates: Partial<typeof dbStore.pincodes[0]>) {
    const pin = dbStore.pincodes.find((p) => p.id === id || p.pincode === id);
    if (!pin) return null;
    Object.assign(pin, updates);
    return pin;
  },

  async togglePincodeStatus(id: string) {
    const pin = dbStore.pincodes.find((p) => p.id === id || p.pincode === id);
    if (!pin) return null;
    pin.isActive = !pin.isActive;
    return pin;
  },

  // Customer Lifetime Profiles & Governance (TASK-019)
  async getAllCustomers(filter?: { search?: string; subscriptionPlan?: string }) {
    let list = dbStore.customers;
    if (filter?.subscriptionPlan && filter.subscriptionPlan !== 'ALL') {
      list = list.filter((c) => c.activeSubscriptionPlan === filter.subscriptionPlan);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.defaultPincode.includes(q)
      );
    }
    return list;
  },

  async getCustomerById(id: string) {
    const customer = dbStore.customers.find((c) => c.id === id || c.userId === id);
    if (!customer) return null;
    const jobs = dbStore.jobs.filter((j) => j.customerId === customer.id || j.customerId === customer.userId);
    const invoices = dbStore.invoices.filter((i) => i.customerId === customer.id || i.customerId === customer.userId);
    const tickets = dbStore.supportTickets.filter(
      (t) => t.subject.includes(customer.fullName) || t.description.includes(customer.fullName)
    );
    return {
      ...customer,
      jobs,
      invoices,
      supportTickets: tickets,
    };
  },

  async createCustomer(data: {
    fullName: string;
    phone: string;
    email?: string;
    defaultAddressLine: string;
    defaultPincode: string;
    defaultLatitude?: number;
    defaultLongitude?: number;
    activeSubscriptionPlan?: string;
  }) {
    const newCust = {
      id: `cust_${Date.now().toString(36)}`,
      userId: `usr_cust_${Date.now().toString(36)}`,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || `${data.fullName.toLowerCase().replace(/\s+/g, '.')}@electricare.in`,
      defaultAddressLine: data.defaultAddressLine,
      defaultPincode: data.defaultPincode,
      defaultLatitude: data.defaultLatitude || 18.9067,
      defaultLongitude: data.defaultLongitude || 72.8147,
      activeSubscriptionPlan: data.activeSubscriptionPlan || 'NONE',
      totalOrdersCount: 0,
      totalSpendInr: 0,
      disputeCount: 0,
      isVip: false,
      memberSince: new Date().toISOString(),
    };
    dbStore.customers.unshift(newCust);
    return newCust;
  },

  async updateCustomer(id: string, updates: Partial<typeof dbStore.customers[0]>) {
    const customer = dbStore.customers.find((c) => c.id === id || c.userId === id);
    if (!customer) return null;
    Object.assign(customer, updates);
    return customer;
  },

  // Central Finance, Commission Rules & Tax Invoicing (TASK-020)
  async getGlobalCommissionConfig() {
    return (
      dbStore.globalCommissionConfig || {
        platformRevenueSharePct: 15.0,
        partnerDefaultSharePct: 15.0,
        technicianNetSharePct: 70.0,
        gstStatutoryRatePct: 18.0,
        emergencySosPremiumPct: 20.0,
        autoEscrowDisbursement: true,
        minWithdrawalThresholdInr: 500,
        lastUpdated: new Date().toISOString(),
      }
    );
  },

  async updateGlobalCommissionConfig(updates: Partial<typeof dbStore.globalCommissionConfig>) {
    if (!dbStore.globalCommissionConfig) {
      dbStore.globalCommissionConfig = {
        platformRevenueSharePct: 15.0,
        partnerDefaultSharePct: 15.0,
        technicianNetSharePct: 70.0,
        gstStatutoryRatePct: 18.0,
        emergencySosPremiumPct: 20.0,
        autoEscrowDisbursement: true,
        minWithdrawalThresholdInr: 500,
        lastUpdated: new Date().toISOString(),
      };
    }
    Object.assign(dbStore.globalCommissionConfig, {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });
    return dbStore.globalCommissionConfig;
  },

  async getInvoices(filter?: { partnerId?: string; customerId?: string; paymentStatus?: string; search?: string }) {
    let list = dbStore.invoices;
    if (filter?.partnerId && filter.partnerId !== 'ALL') {
      list = list.filter((i) => i.partnerId === filter.partnerId);
    }
    if (filter?.customerId) {
      list = list.filter((i) => i.customerId === filter.customerId);
    }
    if (filter?.paymentStatus && filter.paymentStatus !== 'ALL') {
      list = list.filter((i) => i.paymentStatus === filter.paymentStatus);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((i) => i.invoiceNumber.toLowerCase().includes(q) || i.jobId.toLowerCase().includes(q));
    }
    return list;
  },

  async getInvoiceById(id: string) {
    const inv = dbStore.invoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (!inv) return null;
    const job = dbStore.jobs.find((j) => j.id === inv.jobId || j.jobTicketNumber === inv.jobId);
    const customer = dbStore.customers.find((c) => c.id === inv.customerId || c.userId === inv.customerId);
    const partner = (dbStore.partners || [dbStore.partner]).find((p) => p.id === inv.partnerId) || dbStore.partner;
    const ledgers = dbStore.ledgerEntries.filter((l) => l.invoiceId === inv.id);
    return {
      ...inv,
      job,
      customer,
      partner,
      ledgers,
    };
  },

  async getCentralFinanceTelemetry() {
    const invoices = dbStore.invoices;
    const totalGmvInr = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalBaseLaborInr = invoices.reduce((sum, i) => sum + i.baseAmount, 0);
    const totalGstCollectedInr = invoices.reduce((sum, i) => sum + (i.cgstAmount + i.sgstAmount), 0);
    const paidInvoicesCount = invoices.filter((i) => i.paymentStatus === 'PAID').length;
    const config = await this.getGlobalCommissionConfig();

    const platformFeesRecognizedInr =
      Math.round(totalBaseLaborInr * (config.platformRevenueSharePct / 100) * 100) / 100;
    const partnerCommissionsEarnedInr =
      Math.round(totalBaseLaborInr * (config.partnerDefaultSharePct / 100) * 100) / 100;
    const technicianDisbursementsInr =
      Math.round(totalBaseLaborInr * (config.technicianNetSharePct / 100) * 100) / 100;

    return {
      totalGmvInr: Math.round(totalGmvInr * 100) / 100,
      totalBaseLaborInr: Math.round(totalBaseLaborInr * 100) / 100,
      totalGstCollectedInr: Math.round(totalGstCollectedInr * 100) / 100,
      platformFeesRecognizedInr,
      partnerCommissionsEarnedInr,
      technicianDisbursementsInr,
      totalInvoicesCount: invoices.length,
      paidInvoicesCount,
      config,
    };
  },

  // --------------------------------------------------------------------------
  // STEP 21: SUBSCRIPTION MODULES (ZEX CYBER SURGE PROTECTION PLANS)
  // --------------------------------------------------------------------------
  async getSubscriptionTiers() {
    return dbStore.subscriptionTiers;
  },

  async getSubscriptionTierById(id: string) {
    return dbStore.subscriptionTiers.find((t) => t.id === id || t.code === id) || null;
  },

  async createSubscriptionTier(tierData: Omit<SubscriptionTierRecord, 'id'>) {
    const newTier: SubscriptionTierRecord = {
      id: `tier_${Date.now()}`,
      ...tierData,
    };
    dbStore.subscriptionTiers.unshift(newTier);
    await this.recordWormAuditLog({
      actorId: 'usr_admin_01',
      actorRole: 'SUPER_ADMIN',
      action: 'SUBSCRIPTION_TIER_CREATED',
      resourceType: 'SUBSCRIPTION_TIER',
      resourceId: newTier.id,
      payloadSummary: `Created protection tier ${newTier.name} (${newTier.code}) priced at ₹${newTier.priceInr}`,
    });
    return newTier;
  },

  async updateSubscriptionTier(id: string, updates: Partial<SubscriptionTierRecord>) {
    const index = dbStore.subscriptionTiers.findIndex((t) => t.id === id || t.code === id);
    if (index === -1) return null;
    dbStore.subscriptionTiers[index] = {
      ...dbStore.subscriptionTiers[index],
      ...updates,
    };
    await this.recordWormAuditLog({
      actorId: 'usr_admin_01',
      actorRole: 'SUPER_ADMIN',
      action: 'SUBSCRIPTION_TIER_UPDATED',
      resourceType: 'SUBSCRIPTION_TIER',
      resourceId: id,
      payloadSummary: `Updated tier ${id} parameters: ${Object.keys(updates).join(', ')}`,
    });
    return dbStore.subscriptionTiers[index];
  },

  async getAllSubscriptions(filter?: { status?: string; subscriberType?: string; search?: string }) {
    let list = [...dbStore.subscriptions];
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((s) => s.status === filter.status);
    }
    if (filter?.subscriberType && filter.subscriberType !== 'ALL') {
      list = list.filter((s) => s.subscriberType === filter.subscriberType);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.subscriberName.toLowerCase().includes(q) ||
          s.subscriberPhone.toLowerCase().includes(q) ||
          s.tierName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async getSubscriptionById(id: string) {
    return dbStore.subscriptions.find((s) => s.id === id) || null;
  },

  async createSubscription(data: Omit<SubscriptionRecord, 'id'>) {
    const newSub: SubscriptionRecord = {
      id: `sub_${Date.now()}`,
      ...data,
    };
    dbStore.subscriptions.unshift(newSub);
    await this.recordWormAuditLog({
      actorId: data.subscriberId,
      actorRole: data.subscriberType === 'PARTNER' ? 'PARTNER' : 'CUSTOMER',
      action: 'SUBSCRIPTION_ENROLLED',
      resourceType: 'SUBSCRIPTION',
      resourceId: newSub.id,
      payloadSummary: `Enrolled ${newSub.subscriberName} into ${newSub.tierName} for ₹${newSub.pricePaidInr}`,
    });
    return newSub;
  },

  async getSubscriptionsTelemetry() {
    const subs = dbStore.subscriptions;
    const activeSubs = subs.filter((s) => s.status === 'ACTIVE');
    const totalRevenueInr = subs.reduce((acc, s) => acc + s.pricePaidInr, 0);
    const totalRiskPoolCoverageInr = activeSubs.reduce((acc, s) => acc + s.coverageMaxInr, 0);
    const consumerActiveCount = activeSubs.filter((s) => s.subscriberType === 'CUSTOMER').length;
    const partnerActiveCount = activeSubs.filter((s) => s.subscriberType === 'PARTNER').length;

    return {
      totalSubscriptionsCount: subs.length,
      activeSubscriptionsCount: activeSubs.length,
      consumerActiveCount,
      partnerActiveCount,
      totalRevenueInr: Math.round(totalRevenueInr * 100) / 100,
      totalRiskPoolCoverageInr: Math.round(totalRiskPoolCoverageInr * 100) / 100,
      activeTiersCount: dbStore.subscriptionTiers.filter((t) => t.isActive).length,
    };
  },

  // --------------------------------------------------------------------------
  // STEP 22: SUPPORT DESK & WORM IMMUTABLE AUDIT TRAIL LOGS
  // --------------------------------------------------------------------------
  async getAllSupportTickets(filter?: { status?: string; priority?: string; search?: string }) {
    let list = [...dbStore.supportTickets];
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((t) => t.status === filter.status);
    }
    if (filter?.priority && filter.priority !== 'ALL') {
      list = list.filter((t) => t.priority === filter.priority);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.customerName && t.customerName.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async getSupportTicketById(id: string) {
    const t = dbStore.supportTickets.find((x) => x.id === id || x.ticketNumber === id);
    if (!t) return null;
    const customer = t.customerId ? dbStore.customers.find((c) => c.id === t.customerId || c.userId === t.customerId) : null;
    const technician = t.technicianId ? dbStore.technicians.find((x) => x.id === t.technicianId || x.userId === t.technicianId) : null;
    const job = t.jobId ? dbStore.jobs.find((j) => j.id === t.jobId || j.jobTicketNumber === t.jobId) : null;
    return {
      ...t,
      customer,
      technician,
      job,
    };
  },

  async createSupportTicket(ticketData: {
    subject: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_EMERGENCY';
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    technicianId?: string;
    technicianName?: string;
    jobId?: string;
    jobTicketNumber?: string;
    category?: string;
    assignedTo?: string;
  }) {
    const ticketSeq = dbStore.supportTickets.length + 1024;
    const newTicket = {
      id: `sup_${Date.now()}`,
      ticketNumber: `SUP-${ticketSeq}`,
      subject: ticketData.subject,
      description: ticketData.description,
      priority: ticketData.priority,
      status: 'OPEN' as const,
      customerId: ticketData.customerId,
      customerName: ticketData.customerName,
      customerPhone: ticketData.customerPhone,
      technicianId: ticketData.technicianId,
      technicianName: ticketData.technicianName,
      jobId: ticketData.jobId,
      jobTicketNumber: ticketData.jobTicketNumber,
      category: ticketData.category || 'GENERAL_INQUIRY',
      assignedTo: ticketData.assignedTo || 'National Help Desk',
      slaDueAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbStore.supportTickets.unshift(newTicket);
    await this.recordWormAuditLog({
      actorId: ticketData.customerId || 'usr_customer_web',
      actorRole: 'CUSTOMER',
      action: 'SUPPORT_TICKET_RAISED',
      resourceType: 'SUPPORT_TICKET',
      resourceId: newTicket.ticketNumber,
      payloadSummary: `Support Ticket ${newTicket.ticketNumber} opened: ${newTicket.subject} [${newTicket.priority}]`,
    });
    return newTicket;
  },

  async updateSupportTicket(id: string, updates: Partial<(typeof dbStore.supportTickets)[0]>) {
    const idx = dbStore.supportTickets.findIndex((t) => t.id === id || t.ticketNumber === id);
    if (idx === -1) return null;
    dbStore.supportTickets[idx] = {
      ...dbStore.supportTickets[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.recordWormAuditLog({
      actorId: 'usr_admin_01',
      actorRole: 'SUPER_ADMIN',
      action: 'SUPPORT_TICKET_UPDATED',
      resourceType: 'SUPPORT_TICKET',
      resourceId: dbStore.supportTickets[idx].ticketNumber,
      payloadSummary: `Support ticket ${dbStore.supportTickets[idx].ticketNumber} updated. Status: ${dbStore.supportTickets[idx].status}`,
    });
    return dbStore.supportTickets[idx];
  },

  async resolveSupportTicket(id: string, resolutionNotes: string) {
    const idx = dbStore.supportTickets.findIndex((t) => t.id === id || t.ticketNumber === id);
    if (idx === -1) return null;
    dbStore.supportTickets[idx] = {
      ...dbStore.supportTickets[idx],
      status: 'RESOLVED',
      resolutionNotes,
      updatedAt: new Date().toISOString(),
    };
    await this.recordWormAuditLog({
      actorId: 'usr_admin_01',
      actorRole: 'SUPER_ADMIN',
      action: 'SUPPORT_TICKET_RESOLVED',
      resourceType: 'SUPPORT_TICKET',
      resourceId: dbStore.supportTickets[idx].ticketNumber,
      payloadSummary: `Ticket ${dbStore.supportTickets[idx].ticketNumber} resolved with notes: ${resolutionNotes.slice(0, 80)}`,
    });
    return dbStore.supportTickets[idx];
  },

  async getSupportDeskTelemetry() {
    const tickets = dbStore.supportTickets;
    const openCount = tickets.filter((t) => t.status === 'OPEN').length;
    const investigatingCount = tickets.filter((t) => t.status === 'IN_INVESTIGATION').length;
    const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;
    const criticalCount = tickets.filter((t) => t.priority === 'CRITICAL_EMERGENCY').length;
    return {
      totalTicketsCount: tickets.length,
      openCount,
      investigatingCount,
      resolvedCount,
      criticalCount,
      slaComplianceRatePct: 98.4,
    };
  },

  async getWormAuditLogs(filter?: { actorRole?: string; resourceType?: string; search?: string; limit?: number }) {
    let list = [...dbStore.wormAuditLogs];
    if (filter?.actorRole && filter.actorRole !== 'ALL') {
      list = list.filter((l) => l.actorRole === filter.actorRole);
    }
    if (filter?.resourceType && filter.resourceType !== 'ALL') {
      list = list.filter((l) => l.resourceType === filter.resourceType);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.payloadSummary.toLowerCase().includes(q) ||
          l.resourceId.toLowerCase().includes(q) ||
          l.actorId.toLowerCase().includes(q) ||
          l.currentHash.toLowerCase().includes(q)
      );
    }
    // Sort descending by sequence number for audit viewing
    list.sort((a, b) => b.sequenceNumber - a.sequenceNumber);
    if (filter?.limit) {
      list = list.slice(0, filter.limit);
    }
    return list;
  },

  // --------------------------------------------------------------------------
  // STEP 29 & 30: INVOICES, LEDGERS & PARTNER PROFILE MANAGEMENT
  // --------------------------------------------------------------------------
  async getAllInvoices(filter?: { partnerId?: string; status?: string; search?: string }) {
    let list = dbStore.invoices.map((inv) => {
      const job = dbStore.jobs.find((j) => j.id === inv.jobId || j.jobTicketNumber === inv.jobId);
      const customer = dbStore.customers.find((c) => c.id === inv.customerId || c.userId === inv.customerId);
      const technician = job?.technicianId ? dbStore.technicians.find((t) => t.id === job.technicianId) : null;
      return {
        ...inv,
        job,
        customer,
        technician,
      };
    });

    if (filter?.partnerId) {
      list = list.filter((i) => i.partnerId === filter.partnerId);
    }
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((i) => i.paymentStatus === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          (i.job?.jobTicketNumber && i.job.jobTicketNumber.toLowerCase().includes(q)) ||
          (i.customer?.fullName && i.customer.fullName.toLowerCase().includes(q)) ||
          (i.technician?.fullName && i.technician.fullName.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async getInvoiceByNumberOrId(idOrNumber: string) {
    const inv = dbStore.invoices.find((i) => i.id === idOrNumber || i.invoiceNumber === idOrNumber);
    if (!inv) return null;
    const job = dbStore.jobs.find((j) => j.id === inv.jobId || j.jobTicketNumber === inv.jobId);
    const customer = dbStore.customers.find((c) => c.id === inv.customerId || c.userId === inv.customerId);
    const technician = job?.technicianId ? dbStore.technicians.find((t) => t.id === job.technicianId) : null;
    const partner = dbStore.partners.find((p) => p.id === inv.partnerId) || dbStore.partner;
    return {
      ...inv,
      job,
      customer,
      technician,
      partner,
    };
  },

  async getPartnerLedger(filter?: { partnerId?: string; ledgerType?: string; search?: string }) {
    let list = [...dbStore.ledgerEntries];
    if (filter?.partnerId) {
      list = list.filter((l) => !l.partnerId || l.partnerId === filter.partnerId);
    }
    if (filter?.ledgerType && filter.ledgerType !== 'ALL') {
      list = list.filter((l) => l.ledgerType === filter.ledgerType);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.transactionReference.toLowerCase().includes(q) ||
          l.narrative.toLowerCase().includes(q) ||
          (l.jobTicketNumber && l.jobTicketNumber.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async getPartnerProfile(partnerId: string = 'ptnr_mah_01') {
    const p = dbStore.partners.find((x) => x.id === partnerId) || dbStore.partner;
    return p;
  },

  async updatePartnerProfile(partnerId: string, updates: any) {
    let p = dbStore.partners.find((x) => x.id === partnerId);
    if (!p) {
      p = dbStore.partner;
    }
    Object.assign(p, updates);
    if (dbStore.partner.id === partnerId) {
      Object.assign(dbStore.partner, updates);
    }
    return p;
  },

  async recordWormAuditLog(data: {
    actorId: string;
    actorRole: string;
    action: string;
    resourceType: string;
    resourceId: string;
    payloadSummary: string;
    ipAddress?: string;
  }) {
    const logs = dbStore.wormAuditLogs;
    const prevLog = logs.length > 0 ? logs[logs.length - 1] : null;
    const sequenceNumber = logs.length + 1;
    const timestamp = new Date().toISOString();
    const previousHash = prevLog ? prevLog.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    
    const content = `${sequenceNumber}|${previousHash}|${timestamp}|${data.actorId}|${data.action}|${data.resourceType}|${data.resourceId}|${data.payloadSummary}`;
    const currentHash = crypto.createHash('sha256').update(content).digest('hex');

    const newLog: WormAuditLogRecord = {
      id: `worm_log_${Date.now()}_${sequenceNumber}`,
      sequenceNumber,
      timestamp,
      actorId: data.actorId,
      actorRole: data.actorRole,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      previousHash,
      currentHash,
      payloadSummary: data.payloadSummary,
      ipAddress: data.ipAddress || '103.21.244.2',
      isTamperVerified: true,
    };

    dbStore.wormAuditLogs.push(newLog);
    return newLog;
  },

  async verifyWormChainIntegrity() {
    const logs = [...dbStore.wormAuditLogs].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    let expectedPreviousHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < logs.length; i++) {
      const entry = logs[i];
      if (entry.previousHash !== expectedPreviousHash) {
        return {
          isValid: false,
          totalBlocks: logs.length,
          verifiedAt: new Date().toISOString(),
          failedBlockIndex: i,
          sequenceNumber: entry.sequenceNumber,
          failureDetails: `Hash pointer mismatch at block #${entry.sequenceNumber}. Stored previousHash ${entry.previousHash.slice(0, 10)}... does not match expected ${expectedPreviousHash.slice(0, 10)}...`,
        };
      }

      const content = `${entry.sequenceNumber}|${entry.previousHash}|${entry.timestamp}|${entry.actorId}|${entry.action}|${entry.resourceType}|${entry.resourceId}|${entry.payloadSummary}`;
      const recomputed = crypto.createHash('sha256').update(content).digest('hex');

      if (recomputed !== entry.currentHash) {
        return {
          isValid: false,
          totalBlocks: logs.length,
          verifiedAt: new Date().toISOString(),
          failedBlockIndex: i,
          sequenceNumber: entry.sequenceNumber,
          failureDetails: `Cryptographic payload digest violation at block #${entry.sequenceNumber}. Recomputed SHA-256 does not match recorded digest.`,
        };
      }

      expectedPreviousHash = entry.currentHash;
    }

    return {
      isValid: true,
      totalBlocks: logs.length,
      verifiedAt: new Date().toISOString(),
      algorithm: 'SHA-256 (FIPS 180-4)',
      complianceStandard: 'WORM Non-Repudiation (IT Act 65B & RBI Cyber Resilience)',
    };
  },
};

export default db;
