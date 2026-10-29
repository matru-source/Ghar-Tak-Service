import { NextResponse } from 'next/server';
import { apiSuccess } from '@/lib/api-response';

export async function POST() {
  const isProduction = process.env.NODE_ENV === 'production';
  const response = apiSuccess({ loggedOut: true }, 'Signed out successfully');

  response.cookies.set('gts_token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('gts_auth_token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('gts_user_role', '', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('token', '', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
