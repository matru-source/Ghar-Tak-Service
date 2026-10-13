'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, ShieldCheck } from '@/components/ui/icons';

export function PartnerTopbar() {
  const pathname = usePathname();
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

  const navLinks = [
    { name: 'Dashboard', href: '/partner' },
    { name: 'Technicians', href: '/partner/fleet' },
    { name: 'Jobs', href: '/partner/jobs' },
    { name: 'Finance', href: '/partner/invoices' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-[#1B5E20] text-white px-4 lg:px-8 shadow-md">
      {/* Brand Title: ElectricCare | Partner Portal */}
      <div className="flex items-center gap-6 pl-10 lg:pl-0">
        <Link href="/partner" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center border border-white/20 group-hover:bg-white/25 transition-colors">
            <Zap className="h-5 w-5 text-amber-300" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-lg tracking-tight text-white">ElectricCare</span>
            <span className="text-emerald-200/80 text-xs font-semibold">| Partner Portal</span>
          </div>
        </Link>

        {/* Center Navigation Links (Matching Client Mockup) */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/partner'
                ? pathname === '/partner'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-xs underline decoration-2 underline-offset-8'
                    : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* State Hub Pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-black/20 border border-white/15 px-3 py-1 text-xs text-emerald-100">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">Maharashtra Hub</span>
        </div>

        {/* Live IST clock */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-lg bg-black/15 border border-white/10 px-2.5 py-1 text-xs text-emerald-200 font-mono">
          <span>{timeStr || 'Loading...'}</span>
        </div>

        {/* Mobile companion shortcut */}
        <Link
          href="/partner-app"
          className="rounded-lg bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/50 px-2.5 py-1 text-xs font-bold text-white transition-colors shadow-xs"
          title="Switch to Mobile CRM App"
        >
          📱 Mobile View
        </Link>
      </div>
    </header>
  );
}
