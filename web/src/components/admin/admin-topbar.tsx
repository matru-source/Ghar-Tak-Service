'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-logo';

export function AdminTopbar() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between">
      {/* Search Bar & Mobile Brand Mark */}
      <div className="flex items-center gap-3 pl-12 lg:pl-0 flex-1 max-w-md">
        <Link href="/admin" className="lg:hidden shrink-0" title="GTS Admin">
          <BrandMark size="xs" badgeBg="bg-purple-50 border border-purple-200" />
        </Link>
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search orders (e.g. J-1001), pincodes, technicians..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* Right Telemetry Controls */}
      <div className="flex items-center gap-3 lg:gap-5">
        {/* Live System Health Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Healthy</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 font-mono text-[10px]">{currentTime || '05:30 PM IST'}</span>
        </div>

        {/* Urgent SLA Breach Warning Pill */}
        <Link
          href="/admin/escalations"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold hover:bg-red-100 transition shadow-xs"
        >
          <span className="animate-bounce">⚠️</span>
          <span className="hidden md:inline">1 SLA Escalated</span>
        </Link>
      </div>
    </header>
  );
}
