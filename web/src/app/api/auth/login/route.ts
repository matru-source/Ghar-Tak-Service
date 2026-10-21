import { NextRequest } from 'next/server';
import { signAccessToken } from '@/lib/jwt';
import { db, isDatabaseConnected } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/password';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (body.identifier || body.email || body.phone || body.emailOrPhone || body.badgeNumber || '').trim();
    const password = (body.password || '').trim();

    if (!identifier) {
      return apiError('Email, mobile number, or badge number is required', 400);
    }

    if (!password) {
      return apiError('Password is required', 400);
    }

    // Lookup user dynamically by identifier (email, phone, or technician badgeNumber)
    const user = await db.getUserByIdentifier(identifier);
    if (!user) {
      return apiError('Account not found with provided credentials', 404);
    }

    // Validate password strictly using cryptographic salted hash
    const storedHash = (user as any).passwordHash;
    if (!storedHash) {
      return apiError('This account has no active password set. Please use the Forgot Password flow to initialize your credentials.', 401);
    }

    const isPasswordValid = verifyPassword(password, storedHash);
    if (!isPasswordValid) {
      return apiError('Invalid password credentials', 401);
    }

    // Determine specialized role profile
    let partnerId: string | undefined;
    let technicianId: string | undefined;
    let badgeNumber: string | undefined;
    let defaultAddress: string | undefined;
    let defaultPincode: string | undefined;

    if (user.role === 'PARTNER') {
      const partner = await db.getPartnerHub();
      partnerId = partner?.id;
    } else if (user.role === 'TECHNICIAN') {
      const tech = await db.getTechnicianByUserId(user.id);
      technicianId = tech?.id;
      partnerId = tech?.partnerId;
      badgeNumber = tech?.badgeNumber;
    } else if (user.role === 'CUSTOMER') {
      const customerProfile = (user as any).customerProfile;
      defaultAddress = customerProfile?.defaultAddressLine;
      defaultPincode = customerProfile?.defaultPincode;
    }

    const token = await signAccessToken({
      sub: user.id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role as 'SUPER_ADMIN' | 'PARTNER' | 'TECHNICIAN' | 'CUSTOMER',
      partnerId,
      technicianId,
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
          technicianId,
          partnerId,
          badgeNumber,
          address: defaultAddress,
          pincode: defaultPincode,
        },
      },
      `Welcome back, ${user.fullName}`,
      200
    );
  } catch (error) {
    return apiError('Login request failed', 500, error instanceof Error ? error.message : String(error));
  }
}
