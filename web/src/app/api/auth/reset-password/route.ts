import { NextRequest } from 'next/server';
import { db, isDatabaseConnected } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { signAccessToken } from '@/lib/jwt';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { dbStore } from '@/lib/mock-data';
import { verifyOtp } from '@/lib/otp';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * GET /api/auth/reset-password?identifier=...
 * Checks whether an account exists for the given email, phone, or badge number.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = (
      searchParams.get('identifier') ||
      searchParams.get('email') ||
      searchParams.get('phone') ||
      ''
    ).trim();

    if (!identifier) {
      return apiError('Identifier (email or mobile number) is required', 400);
    }

    const user = await db.getUserByIdentifier(identifier);
    if (!user) {
      return apiError(`No registered account found with '${identifier}'`, 404);
    }

    return apiSuccess(
      {
        exists: true,
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      'Account verified',
      200
    );
  } catch (error) {
    return apiError('Account lookup failed', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * POST /api/auth/reset-password
 * Resets user password in PostgreSQL / database store and issues verified JWT.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (body.identifier || body.email || body.phone || '').trim();
    const newPassword = (body.newPassword || body.password || '').trim();
    const otp = (body.otp || body.otpCode || '').trim();

    if (!identifier) {
      return apiError('Registered email or phone number is required', 400);
    }

    if (!newPassword || newPassword.length < 4) {
      return apiError('New password must be at least 4 characters long', 400);
    }

    if (!otp) {
      return apiError('6-digit security verification code is required', 400);
    }

    // Strictly verify dynamic cryptographic OTP with replay protection
    const otpVerification = verifyOtp(identifier, otp, 'RESET_PASSWORD');
    if (!otpVerification.valid) {
      return apiError(otpVerification.reason || 'Invalid or expired verification code. Please request a new code.', 400);
    }

    // Generate PBKDF2 hashed password with unique salt
    const passwordHash = hashPassword(newPassword);

    // Lookup user by email, phone, or badge
    let user: any = await db.getUserByIdentifier(identifier);
    if (!user) {
      return apiError(`No registered account found with '${identifier}'. Please create an account or verify your details.`, 404);
    }

    // Persist new password hash to PostgreSQL via Prisma
    if (await isDatabaseConnected()) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
      } catch (prismaErr) {
        console.warn('[RESET_PASSWORD] Failed to update password in PostgreSQL:', prismaErr);
      }
    }

    // Always update in runtime memory store
    const storeUser = dbStore.users.find(
      (u) => u.id === user.id || (u.email && u.email.toLowerCase() === identifier.toLowerCase())
    );
    if (storeUser) {
      (storeUser as any).passwordHash = passwordHash;
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

    // Sign verified JWT access token
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
      'Password reset successfully. You can now sign in with your new password.',
      200
    );
  } catch (error) {
    return apiError('Password reset failed', 500, error instanceof Error ? error.message : String(error));
  }
}
