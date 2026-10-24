import { NextRequest } from 'next/server';
import { verifyOtp, normalizePhoneNumber } from '@/lib/otp';
import { signAccessToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

import { getCoordinatesForPincode } from '@/lib/pincode-resolver';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawIdentifier = (body.identifier || body.email || body.phone || '').trim();
    const otp = (body.otp || body.code || '').trim();
    const purpose = (body.purpose || 'GENERAL') as 'RESET_PASSWORD' | 'REGISTER' | 'LOGIN' | 'GENERAL';
    const { role: requestedRole, fullName, verifyOnly } = body;

    if (!rawIdentifier || !otp) {
      return apiError('Identifier (email or phone) and verification code are required', 400);
    }

    const verification = verifyOtp(rawIdentifier, otp, purpose);

    if (!verification.valid) {
      return apiError(verification.reason || 'Invalid verification code', 401);
    }

    if (verifyOnly) {
      return apiSuccess({ verified: true, identifier: rawIdentifier }, 'Verification code verified successfully', 200);
    }

    const cleanPhone = rawIdentifier.includes('@') ? '' : normalizePhoneNumber(rawIdentifier);
    // Lookup user in database / mock store
    let user = rawIdentifier.includes('@')
      ? await db.getUserByIdentifier(rawIdentifier)
      : await db.getUserByPhone(cleanPhone);

    // Specialized role profile variables
    let profile: Record<string, unknown> | null = null;
    let partnerId: string | undefined;
    let technicianId: string | undefined;
    let customerId: string | undefined;
    let pincode: string | undefined;

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
        let existingTech: any = null;
        try {
          existingTech = await prisma.technician.findFirst({
            where: {
              OR: [
                { userId: newUserId },
                { user: { phone: cleanPhone } },
                { user: { phone: rawIdentifier } },
              ],
            },
            include: { user: true },
          });
        } catch {
          // Prisma offline fallback
        }

        if (!existingTech) {
          existingTech = dbStore.technicians.find(
            (t) => t.userId === newUserId || t.phone === cleanPhone || (cleanPhone && t.phone.includes(cleanPhone.slice(-10)))
          ) || null;
        }

        if (existingTech) {
          technicianId = existingTech.id;
          partnerId = existingTech.partnerId;
          pincode = existingTech.assignedPincode;
          profile = existingTech as unknown as Record<string, unknown>;
        } else {
          const registered = await db.registerTechnician({
            fullName: name,
            phone: cleanPhone,
            email: `${cleanPhone.replace('+', '')}@ghartak.in`,
            pincode: '760001',
            trade: 'Certified Professional',
          });
          technicianId = registered.id;
          partnerId = registered.partnerId;
          pincode = registered.assignedPincode;
          profile = registered as unknown as Record<string, unknown>;
        }
      }
    }

    if (user.role === 'TECHNICIAN') {
      let tech: any = null;
      try {
        tech = await prisma.technician.findFirst({
          where: {
            OR: [
              { userId: user.id },
              { user: { phone: user.phone } },
              { user: { phone: cleanPhone } },
            ],
          },
          include: { user: true },
        });
      } catch {
        // Prisma offline
      }
      if (!tech) {
        tech = await db.getTechnicianByUserId(user.id);
      }
      if (!tech && cleanPhone) {
        tech = dbStore.technicians.find((t) => t.phone === cleanPhone || (user.phone && t.phone === user.phone)) || null;
      }
      if (!tech) {
        tech = await db.registerTechnician({
          fullName: user.fullName,
          phone: user.phone || cleanPhone,
          email: user.email,
          pincode: '760001',
          trade: 'Certified Professional',
        });
      }
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
