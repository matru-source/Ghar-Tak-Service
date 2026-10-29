'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface PartnerAuthGuardProps {
  children: ReactNode;
}

export function PartnerAuthGuard({ children }: PartnerAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // If accessing login screen, pass through immediately
    if (pathname?.startsWith('/partner/login')) {
      setIsAuthorized(true);
      return;
    }

    // Check client storage and cookie tokens
    const hasLocalToken =
      typeof window !== 'undefined' &&
      Boolean(
        localStorage.getItem('gts_token') ||
        localStorage.getItem('gts_auth_token') ||
        localStorage.getItem('token')
      );

    const hasCookieToken =
      typeof document !== 'undefined' &&
      (document.cookie.includes('gts_token=') ||
       document.cookie.includes('gts_auth_token=') ||
       document.cookie.includes('token='));

    const userRole = typeof window !== 'undefined'
      ? (localStorage.getItem('gts_user_role') || (document.cookie.match(/gts_user_role=([^;]+)/)?.[1]))
      : null;

    const hasToken = hasLocalToken || hasCookieToken;

    // Must have token AND if role is set, must NOT be a non-partner role
    if (!hasToken || (userRole && userRole !== 'PARTNER')) {
      setIsAuthorized(false);
      router.replace(`/partner/login?redirect=${encodeURIComponent(pathname || '/partner')}`);
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  // Pass login page through immediately without wrap
  if (pathname?.startsWith('/partner/login')) {
    return <>{children}</>;
  }

  // Initial authentication verification state
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-mono tracking-wide">
          Verifying Regional Franchise Clearance...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <div className="partner-shell-authorized">{children}</div>;
}

