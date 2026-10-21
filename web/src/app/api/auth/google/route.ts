import { NextRequest } from 'next/server';
import { db, isDatabaseConnected } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { signAccessToken } from '@/lib/jwt';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/auth/google
 * Real, industry-grade Google Sign-In verification endpoint.
 * Validates cryptographic Google ID Token with Google's OAuth2 verification service.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, role: requestedRole = 'CUSTOMER' } = body;

    if (!idToken || typeof idToken !== 'string') {
      return apiError('Cryptographic Google ID token is required', 400);
    }

    // Verify token with Google's public OAuth2 tokeninfo service
    const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`;
    const googleResponse = await fetch(googleVerifyUrl, { method: 'GET' });

    if (!googleResponse.ok) {
      const errData = await googleResponse.json().catch(() => ({}));
      console.warn('[GOOGLE_AUTH_FAILED] Invalid ID token:', errData);
      return apiError('Invalid or expired Google authentication token', 401);
    }

    const payload = await googleResponse.json();

    const email = payload.email?.toLowerCase();
    const emailVerified = payload.email_verified === 'true' || payload.email_verified === true;
    const fullName = payload.name || payload.given_name || 'Google User';
    const googleSubId = payload.sub;

    if (!email || !emailVerified) {
      return apiError('Google account does not possess a verified email address', 400);
    }

    // Lookup user in PostgreSQL database / dbStore
    let user: any = await db.getUserByIdentifier(email);

    if (!user) {
      // Dynamically provision verified user account
      const cleanPhone = `+91${googleSubId.replace(/\D/g, '').slice(-10).padEnd(10, '0')}`;
      if (requestedRole === 'TECHNICIAN') {
        const registeredTech = await db.registerTechnician({
          fullName,
          email,
          phone: cleanPhone,
          trade: 'Certified Professional',
          pincode: '760001',
          password: 'GOOGLE_OAUTH_AUTHENTICATED',
        });
        user = (await db.getUserByIdentifier(email)) || {
          id: registeredTech.userId,
          phone: registeredTech.phone,
          email: registeredTech.email,
          fullName: registeredTech.fullName,
          role: 'TECHNICIAN',
        };
      } else {
        user = await db.createCustomerUser({
          fullName,
          email,
          phone: cleanPhone,
          passwordHash: 'GOOGLE_OAUTH_AUTHENTICATED',
          address: 'Doorstep Service Hub',
          pincode: '760001',
        });
      }
    }

    // Determine specialized role profile
    let partnerId: string | undefined;
    let technicianId: string | undefined;
    let badgeNumber: string | undefined;
    let defaultAddress: string | undefined;
    let defaultPincode: string | undefined;

    if (user.role === 'TECHNICIAN') {
      const tech = await db.getTechnicianByUserId(user.id);
      technicianId = tech?.id;
      partnerId = tech?.partnerId;
      badgeNumber = tech?.badgeNumber;
      defaultPincode = tech?.assignedPincode;
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
      'Google authentication successful',
      200
    );
  } catch (error) {
    console.error('[GOOGLE_AUTH_EXCEPTION]', error);
    return apiError('Failed to process Google sign-in', 500, error instanceof Error ? error.message : String(error));
  }
}
