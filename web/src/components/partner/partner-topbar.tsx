'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-logo';

export function PartnerTopbar() {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 lg:px-8 backdrop-blur-md">
      {/* Territory Indicator & Mobile Brand Mark */}
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        <Link href="/partner" className="lg:hidden shrink-0" title="GTS Partner Hub">
          <BrandMark size="xs" badgeBg="bg-emerald-50 border border-emerald-200" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-sm text-slate-900">
            Maharashtra Operations Hub (MH-01)
          </span>
        </div>
        <span className="hidden sm:inline-block rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-mono text-slate-700 border border-slate-200">
          Dir: Suresh Patil &bull; GSTIN: 27AABCU9603R1ZM
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Live IST clock */}
        <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 font-mono shadow-xs">
          <span className="text-emerald-600">⏱️</span>
          <span>{timeStr || 'Loading IST...'}</span>
        </div>

        {/* Quick Persona Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/admin"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50 transition-all font-semibold shadow-xs"
          >
            👑 Super Admin
          </Link>
          <span className="rounded-lg bg-[#1B5E20] border border-emerald-600 px-2.5 py-1 text-white font-bold shadow-xs">
            🏢 Partner
          </span>
        </div>
      </div>
    </header>
  );
}
