import { NextRequest, NextResponse } from 'next/server';
import { signAccessToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(req: NextRequest) {
  return handleDemoAuth(req, 'GET');
}

export async function POST(req: NextRequest) {
  return handleDemoAuth(req, 'POST');
}

async function handleDemoAuth(req: NextRequest, method: 'GET' | 'POST') {
  try {
    let role = 'SUPER_ADMIN';
    let redirect = '/admin';

    if (method === 'GET') {
      const { searchParams } = new URL(req.url);
      role = (searchParams.get('role') || 'SUPER_ADMIN').toUpperCase();
      redirect = searchParams.get('redirect') || (role === 'PARTNER' ? '/partner' : role === 'TECHNICIAN' ? '/tech' : role === 'CUSTOMER' ? '/customer' : '/admin');
    } else {
      const body = await req.json().catch(() => ({}));
      role = (body.role || 'SUPER_ADMIN').toUpperCase();
      redirect = body.redirect || (role === 'PARTNER' ? '/partner' : role === 'TECHNICIAN' ? '/tech' : role === 'CUSTOMER' ? '/customer' : '/admin');
    }

    let user: any = null;
    let partnerId: string | undefined;
    let technicianId: string | undefined;

    if (role === 'PARTNER') {
      user = dbStore.users.find((u) => u.role === 'PARTNER') || {
        id: 'usr_partner_01',
        email: 'operations@ghartak.in',
        fullName: 'Maharashtra Operations Hub MH-01',
        role: 'PARTNER',
        phone: '+919876543202',
      };
      partnerId = 'ptnr_mah_01';
    } else if (role === 'TECHNICIAN') {
      user = dbStore.users.find((u) => u.role === 'TECHNICIAN') || {
        id: 'usr_tech_rajesh_01',
        email: 'rajesh.kumar@ghartak.in',
        fullName: 'Rajesh Kumar (Grade-A Wireman)',
        role: 'TECHNICIAN',
        phone: '+919876543210',
      };
      technicianId = 'tech_rajesh_01';
      partnerId = 'ptnr_mah_01';
    } else if (role === 'CUSTOMER') {
      user = dbStore.users.find((u) => u.role === 'CUSTOMER') || {
        id: 'usr_customer_web',
        email: 'customer@saralgroups.com',
        fullName: 'Priya Sharma (Colaba)',
        role: 'CUSTOMER',
        phone: '+919876543220',
      };
    } else {
      // Default to SUPER_ADMIN
      role = 'SUPER_ADMIN';
      user = dbStore.users.find((u) => u.role === 'SUPER_ADMIN') || {
        id: 'usr_admin_01',
        email: 'admin@ghartak.in',
        fullName: 'Vikram Malhotra (Super Admin)',
        role: 'SUPER_ADMIN',
        phone: '+919876543201',
      };
    }

    const token = await signAccessToken({
      sub: user.id,
      phone: user.phone || '+919876543200',
      fullName: user.fullName,
      role: role as any,
      partnerId,
      technicianId,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    if (method === 'GET') {
      const redirectUrl = new URL(redirect, req.url);
      const res = NextResponse.redirect(redirectUrl);

      res.cookies.set('gts_token', token, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });

      res.cookies.set('gts_auth_token', token, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });

      res.cookies.set('gts_user_role', role, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });

      return res;
    }

    const res = NextResponse.json({
      success: true,
      token,
      role,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role,
        partnerId,
        technicianId,
      },
      redirect,
      message: `Demo persona switched to ${role}`,
    });

    res.cookies.set('gts_token', token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    res.cookies.set('gts_auth_token', token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    res.cookies.set('gts_user_role', role, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to switch demo persona' },
      { status: 500 }
    );
  }
}

