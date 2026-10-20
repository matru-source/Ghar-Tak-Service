import { NextRequest } from 'next/server';
import { verifyOtp, normalizePhoneNumber } from '@/lib/otp';
import { signAccessToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

import { getCoordinatesForPincode } from '@/lib/pincode-resolver';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, role: requestedRole, fullName } = body;

    if (!phone || !otp) {
      return apiError('Phone number and OTP code are required', 400);
    }

    const cleanPhone = normalizePhoneNumber(phone);
    const verification = verifyOtp(cleanPhone, otp);

    if (!verification.valid) {
      return apiError(verification.reason || 'Invalid OTP code', 401);
    }

    // Lookup user in database / mock store
    let user = await db.getUserByPhone(cleanPhone);

    // If user does not exist yet, auto-register as Customer (or requested role)
    if (!user) {
      const assignedRole = (requestedRole === 'TECHNICIAN' ? 'TECHNICIAN' : 'CUSTOMER') as 'TECHNICIAN' | 'CUSTOMER';
      const newUserId = `usr_${Date.now()}`;
      const name = fullName || (assignedRole === 'TECHNICIAN' ? 'Field Technician' : 'Valued Customer');

      user = {
        id: newUserId,
        phone: cleanPhone,
        email: `${cleanPhone.replace('+', '')}@ghartak.in`,
        fullName: name,
        role: assignedRole,
        isVerified: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      // Add to runtime store
      dbStore.users.push(user);

      if (assignedRole === 'CUSTOMER') {
        (dbStore.customers as any[]).push({
          id: `cust_${Date.now()}`,
          userId: newUserId,
          fullName: name,
          phone: cleanPhone,
          email: `${cleanPhone.replace('+', '')}@ghartak.in`,
          defaultAddressLine: 'Doorstep Service Area',
          defaultPincode: '760001',
          defaultLatitude: 19.3149,
          defaultLongitude: 84.7941,
          activeSubscriptionPlan: 'NONE',
          totalOrdersCount: 0,
          totalSpendInr: 0,
          disputeCount: 0,
          riskScore: 'LOW',
          preferredLanguage: 'HINDI',
          createdAt: new Date().toISOString(),
        });
      } else if (assignedRole === 'TECHNICIAN') {
        const cleanPin = '760001';
        const geo = getCoordinatesForPincode(cleanPin);
        const techId = `tech_${Date.now()}`;
        (dbStore.technicians as any[]).push({
          id: techId,
          userId: newUserId,
          partnerId: 'part_odisha_01',
          badgeNumber: `GTS-TECH-${Math.floor(1000 + Math.random() * 9000)}`,
          fullName: name,
          phone: cleanPhone,
          rating: 5.0,
          totalJobsCompleted: 0,
          isOnline: true,
          currentLatitude: geo.latitude,
          currentLongitude: geo.longitude,
          assignedPincode: cleanPin,
          kycStatus: 'VERIFIED',
          electricalLicenseNumber: `LIC-${cleanPin}-${Math.floor(1000 + Math.random() * 9000)}`,
          insulatedGlovesVerified: true,
          safetyKitSerial: `KIT-${Math.floor(10000 + Math.random() * 90000)}`,
          email: `${cleanPhone.replace('+', '')}@ghartak.in`,
          trade: 'Certified Professional',
        });
      }
    }

    // Determine specialized role profile
    let profile: Record<string, unknown> | null = null;
    let partnerId: string | undefined;
    let technicianId: string | undefined;
    let customerId: string | undefined;
    let pincode: string | undefined;

    if (user.role === 'TECHNICIAN') {
      const tech = await db.getTechnicianByUserId(user.id);
      if (tech) {
        profile = tech as unknown as Record<string, unknown>;
        technicianId = tech.id;
        partnerId = tech.partnerId;
        pincode = tech.assignedPincode;
      }
    } else if (user.role === 'PARTNER') {
      const partner = await db.getPartnerHub();
      profile = partner as unknown as Record<string, unknown>;
      partnerId = partner.id;
    } else if (user.role === 'CUSTOMER') {
      const cust = dbStore.customers.find((c) => c.userId === user?.id);
      profile = (cust || null) as unknown as Record<string, unknown>;
      customerId = cust?.id;
      pincode = cust?.defaultPincode || '400001';
    }

    // Sign JWT token with full claim set
    const token = await signAccessToken({
      sub: user.id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role as 'SUPER_ADMIN' | 'PARTNER' | 'TECHNICIAN' | 'CUSTOMER',
      partnerId,
      technicianId,
      customerId,
      pincode,
    });

    return apiSuccess(
      {
        token,
        tokenType: 'Bearer',
        expiresIn: '7d',
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        profile,
      },
      'Authentication successful',
      200
    );
  } catch (error) {
    return apiError('Failed to verify OTP', 500, error instanceof Error ? error.message : String(error));
  }
}
