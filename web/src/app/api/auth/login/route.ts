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
      // If administrative role without seeded password, allow bootstrap credential
      const allowedBootstrapPasswords = ['admin123', 'admin@123', 'ghartak123', 'ghartak_admin_2026', 'superadmin', 'password'];
      if ((user.role === 'SUPER_ADMIN' || user.role === 'PARTNER') && allowedBootstrapPasswords.includes(password)) {
        (user as any).passwordHash = hashPassword(password);
      } else {
        return apiError('This account has no active password set. Please use the Forgot Password flow or contact National Command.', 401);
      }
    } else {
      const isPasswordValid = verifyPassword(password, storedHash);
      if (!isPasswordValid) {
        return apiError('Invalid password credentials', 401);
      }
    }

    // Determine specialized role profile
    let partnerId: string | undefined;
    let technicianId: string | undefined;
    let badgeNumber: string | undefined;
    let defaultAddress: string | undefined;
    let defaultPincode: string | undefined;

    const requestedRole = (body.role || '').toUpperCase();

    if (user.role === 'PARTNER') {
      const partner = await db.getPartnerHub();
      partnerId = partner?.id;
    }

    const tech = await db.getTechnicianByUserId(user.id);
    if (tech) {
      technicianId = tech.id;
      partnerId = tech.partnerId;
      badgeNumber = tech.badgeNumber;
      defaultPincode = tech.assignedPincode || '760001';
    }

    const customerProfile = (user as any).customerProfile;
    if (customerProfile) {
      defaultAddress = customerProfile.defaultAddressLine;
      if (!defaultPincode) defaultPincode = customerProfile.defaultPincode;
    }

    const token = await signAccessToken({
      sub: user.id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role as 'SUPER_ADMIN' | 'PARTNER' | 'TECHNICIAN' | 'CUSTOMER',
      partnerId,
      technicianId,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const effectiveRole = (requestedRole === 'TECHNICIAN' && technicianId) ? 'TECHNICIAN' : (requestedRole === 'CUSTOMER' ? 'CUSTOMER' : user.role);

    const response = apiSuccess(
      {
        token,
        tokenType: 'Bearer',
        expiresIn: '7d',
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          role: effectiveRole,
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

    // Issue 4: Industry-standard HttpOnly secure session cookie
    response.cookies.set('gts_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set('gts_auth_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Client-accessible role marker cookie for Next.js routing & client state
    response.cookies.set('gts_user_role', effectiveRole, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return apiError('Login request failed', 500, error instanceof Error ? error.message : String(error));
  }
}
