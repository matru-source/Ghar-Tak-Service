import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 1. Handle CORS preflight & headers for all /api routes
  if (pathname.startsWith('/api')) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Portal-Role',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Portal-Role');
    return response;
  }

  // Extract authentication tokens from cookies
  const authToken =
    request.cookies.get('gts_token')?.value ||
    request.cookies.get('gts_auth_token')?.value ||
    request.cookies.get('token')?.value;
  const userRole = request.cookies.get('gts_user_role')?.value;

  // 2. Direct Path Route Protection for /admin
  if (pathname.startsWith('/admin')) {
    const isLogin = pathname === '/admin/login';
    if (isLogin) {
      // Allow explicit access to login screen without forced auto-bouncing
      return NextResponse.next();
    }

    // Guard all non-login admin routes: strictly requires token AND SUPER_ADMIN role
    if (!authToken || userRole !== 'SUPER_ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // 3. Direct Path Route Protection for /partner
  if (pathname.startsWith('/partner')) {
    const isLogin = pathname === '/partner/login';
    if (isLogin) {
      // Allow explicit access to login screen without forced auto-bouncing
      return NextResponse.next();
    }

    // Common partner aliases
    if (pathname === '/partner/technicians') {
      const url = request.nextUrl.clone();
      url.pathname = '/partner/fleet';
      return NextResponse.rewrite(url);
    }
    if (pathname === '/partner/finance') {
      const url = request.nextUrl.clone();
      url.pathname = '/partner/invoices';
      return NextResponse.rewrite(url);
    }

    // Guard all non-login partner routes: strictly requires token AND PARTNER role
    if (!authToken || userRole !== 'PARTNER') {
      const url = request.nextUrl.clone();
      url.pathname = '/partner/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // 4. Super Admin Subdomain Routing (admin.localhost:3000, admin.*, or Port 3001)
  const isAdminHost = host.startsWith('admin.') || host.includes(':3001');
  if (isAdminHost) {
    // Prevent admin from viewing partner or customer pages
    if (pathname.startsWith('/partner') || pathname.startsWith('/customer') || pathname.startsWith('/tech')) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }

    // Root routing: If not authenticated, present the dedicated Admin Login portal; if authenticated, present /admin
    const authToken =
      request.cookies.get('gts_token')?.value ||
      request.cookies.get('gts_auth_token')?.value ||
      request.cookies.get('token')?.value;
    const userRole = request.cookies.get('gts_user_role')?.value;
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = (!authToken || userRole !== 'SUPER_ADMIN') ? '/admin/login' : '/admin';
      return NextResponse.rewrite(url);
    }

    // Allow direct clean URLs like /dispatch, /jobs, /invoices, /disputes, /safety on the admin subdomain
    const adminRoutes = [
      'dispatch',
      'jobs',
      'escalations',
      'finance',
      'invoices',
      'partners',
      'technicians',
      'customers',
      'pincodes',
      'subscriptions',
      'support',
      'audit',
      'settings',
      'commissions',
      'disputes',
      'safety',
      'login',
    ];
    const firstSegment = pathname.split('/')[1];
    if (adminRoutes.includes(firstSegment)) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  // Handle common partner alias redirects across all hosts
  if (pathname === '/partner/technicians') {
    const url = request.nextUrl.clone();
    url.pathname = '/partner/fleet';
    return NextResponse.rewrite(url);
  }
  if (pathname === '/partner/finance') {
    const url = request.nextUrl.clone();
    url.pathname = '/partner/invoices';
    return NextResponse.rewrite(url);
  }

  // 3. Regional Partner Portal Routing (partner.localhost:3000, partner.*, or Port 3002)
  const isPartnerHost = host.startsWith('partner.') || host.includes(':3002');
  if (isPartnerHost) {
    // Prevent partner from viewing super admin or customer pages
    if (pathname.startsWith('/admin') || pathname.startsWith('/customer') || pathname.startsWith('/tech')) {
      const url = request.nextUrl.clone();
      url.pathname = '/partner';
      return NextResponse.redirect(url);
    }

    // Root routing: If not authenticated, present the dedicated Partner Login portal; if authenticated, present /partner
    const authToken =
      request.cookies.get('gts_token')?.value ||
      request.cookies.get('gts_auth_token')?.value ||
      request.cookies.get('token')?.value;
    const userRole = request.cookies.get('gts_user_role')?.value;
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = (!authToken || userRole !== 'PARTNER') ? '/partner/login' : '/partner';
      return NextResponse.rewrite(url);
    }

    // Allow direct clean URLs like /dispatch, /fleet, /capacity, /jobs, /inventory, /services on the partner subdomain
    const partnerRoutes = [
      'dispatch',
      'jobs',
      'escalations',
      'fleet',
      'technicians',
      'capacity',
      'invoices',
      'finance',
      'inventory',
      'services',
      'profile',
      'support',
      'login',
    ];
    const firstSegment = pathname.split('/')[1];
    if (partnerRoutes.includes(firstSegment)) {
      const url = request.nextUrl.clone();
      if (firstSegment === 'technicians') {
        url.pathname = `/partner/fleet`;
      } else if (firstSegment === 'finance') {
        url.pathname = `/partner/invoices`;
      } else {
        url.pathname = `/partner${pathname}`;
      }
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo assets, images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};
