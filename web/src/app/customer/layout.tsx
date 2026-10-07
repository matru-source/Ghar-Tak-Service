'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, ShieldCheck } from '@/components/ui/icons';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Customer session initialization in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('electriCare_customer_session');
      if (!existing) {
        localStorage.setItem(
          'electriCare_customer_session',
          JSON.stringify({
            id: 'cust_amit_01',
            userId: 'usr_cust_01',
            fullName: 'Amit Sharma',
            phone: '+919876543213',
            email: 'amit.sharma@gmail.com',
            defaultAddressLine: 'Flat 402, Sea View Apartments, Colaba, Mumbai',
            defaultPincode: '400001',
            activeSubscriptionPlan: 'ZEX_SHIELD_1MO',
            isVip: true,
            isLoggedIn: true,
          })
        );
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Desktop Helper Toolbar */}
      <div className="hidden lg:flex items-center justify-between px-6 py-2 bg-white/95 border-b border-slate-200 text-xs text-slate-600 z-50 sticky top-0 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
              <BrandMark size="xs" variant="default" badge={false} />
              GTS Ghar Tak Service App
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded border border-blue-200/60">
            Customer App Shell (CUST-SCR-01)
          </span>
          <span className="text-slate-500">
            Active Persona: <strong className="text-slate-800">Amit Sharma</strong> (+91 98765 43213 • Colaba 400001)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Viewport switch */}
          <button
            onClick={() => setIsFullWidth(!isFullWidth)}
            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <line x1="9" x2="9" y1="3" y2="21" />
            </svg>
            <span>{isFullWidth ? 'Switch to iPhone Frame' : 'Expand Fullscreen'}</span>
          </button>

          <span className="text-slate-300">|</span>

          {/* Quick Cross-Role Navigation */}
          <Link
            href="/partner"
            className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium transition-colors"
          >
            🏢 Partner CRM
          </Link>
          <Link
            href="/admin"
            className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-medium transition-colors"
          >
            👑 Admin CRM
          </Link>
          <Link
            href="/customer/login"
            className={`px-2 py-1 rounded border font-medium transition-colors ${
              pathname === '/customer/login'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            🔑 Phone OTP Login
          </Link>
        </div>
      </div>

      {/* Main Container: Mobile Frame Simulator or Responsive Viewport */}
      <div className={`flex-1 flex justify-center items-start ${isFullWidth ? 'w-full p-0' : 'p-0 sm:py-6 sm:px-4'}`}>
        <div
          className={`w-full bg-white flex flex-col relative transition-all duration-300 ${
            isFullWidth
              ? 'max-w-4xl min-h-screen shadow-md'
              : 'max-w-[430px] min-h-[880px] sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden'
          }`}
        >
          {/* Sleek Mobile Status Bar */}
          <div className="w-full bg-white text-slate-900 pt-3 pb-2 px-6 flex items-center justify-between text-xs font-semibold select-none z-40 border-b border-slate-100">
            <span className="tracking-tight font-medium text-[13px]">{currentTime}</span>

            {/* Dynamic Island / Speaker Pill for iPhone Frame */}
            {!isFullWidth && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] tracking-tight font-normal text-slate-300">ElectriCare 5G</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-slate-700">
              {/* Cellular Signal Icon */}
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M2 20h2v-4H2v4zm4 0h2v-8H6v8zm4 0h2v-12h-2v12zm4 0h2V4h-2v16zm4 0h2V1h-2v19z" />
              </svg>
              {/* WiFi Icon */}
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 2.5c3.84 0 7.33 1.48 9.94 3.91L12 18.25 2.06 10.41C4.67 7.98 8.16 6.5 12 6.5z" />
              </svg>
              {/* Battery Indicator */}
              <div className="flex items-center">
                <div className="w-5 h-2.5 rounded-xs border border-slate-700 p-0.5 flex items-center">
                  <div className="h-full w-full bg-slate-800 rounded-2xs"></div>
                </div>
                <div className="w-0.5 h-1 bg-slate-700 rounded-r-xs"></div>
              </div>
            </div>
          </div>

          {/* Child Page Content */}
          <div className="flex-1 flex flex-col bg-white overflow-y-auto">
            {children}
          </div>

          {/* Bottom Home Indicator Bar (Mobile Device Bar) */}
          <div className="w-full bg-white py-2 flex justify-center items-center select-none border-t border-slate-50">
            <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
