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
    const role = (body.role || 'CUSTOMER').toUpperCase();
    const trade = (body.trade || body.skills?.[0] || 'ELECTRICAL').toUpperCase();

    if (!fullName) {
      return apiError('Full Name is required', 400);
    }

    if (!email || !email.includes('@')) {
      return apiError('Valid email address is required', 400);
    }

    if (!password || password.length < 4) {
      return apiError('Password must be at least 4 characters long', 400);
    }

    // Mandatory 6-digit postal Pincode verification for both Customer & Technician
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return apiError('Mandatory 6-digit postal Pincode is required to verify local service territory coverage', 400);
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

    // Handle Technician Registration
    if (role === 'TECHNICIAN') {
      const registeredTech = await db.registerTechnician({
        fullName,
        phone: phone || `+91${Math.floor(6000000000 + Math.random() * 3999999999)}`,
        email,
        password,
        pincode,
        trade,
      });

      const token = await signAccessToken({
        sub: registeredTech.userId,
        phone: registeredTech.phone,
        fullName: registeredTech.fullName,
        role: 'TECHNICIAN',
      });

      return apiSuccess(
        {
          token,
          tokenType: 'Bearer',
          expiresIn: '7d',
          user: {
            id: registeredTech.userId,
            technicianId: registeredTech.id,
            partnerId: registeredTech.partnerId,
            fullName: registeredTech.fullName,
            email: registeredTech.email,
            phone: registeredTech.phone,
            role: 'TECHNICIAN',
            pincode: registeredTech.assignedPincode,
            trade: registeredTech.trade || trade,
          },
        },
        `Welcome Technician ${registeredTech.fullName}! Bound to Pincode ${pincode} (${registeredTech.trade || trade})`,
        201
      );
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
      pincode,
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
