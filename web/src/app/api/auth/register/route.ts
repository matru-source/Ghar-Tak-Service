import { NextRequest } from 'next/server';
import { signAccessToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = (body.fullName || body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const phone = (body.phone || body.phoneNumber || '').trim();
    const address = (body.address || '').trim();
    const pincode = (body.pincode || '').trim();

    if (!fullName) {
      return apiError('Full Name is required', 400);
    }

    if (!email || !email.includes('@')) {
      return apiError('Valid email address is required', 400);
    }

    if (!password || password.length < 4) {
      return apiError('Password must be at least 4 characters long', 400);
    }

    // Check if account already exists with this email or phone
    const existingByEmail = await db.getUserByEmail(email);
    if (existingByEmail) {
      return apiError(`An account with email '${email}' is already registered. Please sign in.`, 409);
    }

    if (phone) {
      const existingByPhone = await db.getUserByPhone(phone);
      if (existingByPhone) {
        return apiError(`An account with phone '${phone}' is already registered. Please sign in.`, 409);
      }
    }

    // Hash password with salt
    const passwordHash = hashPassword(password);

    // Persist to PostgreSQL via Prisma (with fallback to dbStore)
    const newUser = await db.createCustomerUser({
      fullName,
      email,
      passwordHash,
      phone: phone || undefined,
      address: address || undefined,
      pincode: pincode || undefined,
    });

    // Issue verified JWT access token
    const token = await signAccessToken({
      sub: newUser.id,
      phone: newUser.phone,
      fullName: newUser.fullName,
      role: 'CUSTOMER',
    });

    return apiSuccess(
      {
        token,
        tokenType: 'Bearer',
        expiresIn: '7d',
        user: {
          id: newUser.id,
          phone: newUser.phone,
          email: newUser.email,
          fullName: newUser.fullName,
          role: 'CUSTOMER',
          address,
          pincode,
        },
      },
      `Welcome to Ghar Tak, ${newUser.fullName}!`,
      201
    );
  } catch (error) {
    return apiError(
      'Registration failed',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
