'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-logo';

interface PartnerTopbarProps {
  onToggleSidebar?: () => void;
  isSidebarExpanded?: boolean;
}

export function PartnerTopbar({ onToggleSidebar, isSidebarExpanded = false }: PartnerTopbarProps) {
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
    <header className="sticky top-0 z-30 flex h-16 w-full max-w-full items-center justify-between bg-[#1B5E20] text-white px-3 sm:px-6 lg:px-8 shadow-md">
      {/* Brand Title: Ghar Tak Service | Partner Portal */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-5">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15 cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Toggle Navigation Sidebar"
            title={isSidebarExpanded ? 'Collapse Sidebar to Icon Rail' : 'Expand Sidebar to Full Width'}
          >
            <span className="text-base leading-none font-bold">
              {isSidebarExpanded ? '◀' : '☰'}
            </span>
          </button>
        )}

        <Link href="/partner" className="flex items-center gap-2 group">
          <BrandMark size="sm" />
          <div className="flex items-baseline gap-1.5 truncate">
            <span className="font-black text-base sm:text-lg tracking-tight text-white">GTS Ghar Tak Service</span>
            <span className="hidden sm:inline text-emerald-200/80 text-xs font-semibold">| Partner Portal</span>
          </div>
        </Link>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* State Hub Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-100">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Maharashtra Hub</span>
        </div>

        {/* Live IST Clock */}
        <div className="font-mono text-xs px-2.5 py-1 rounded-lg bg-black/20 text-emerald-100 border border-white/10">
          {timeStr || '00:00:00 IST'}
        </div>
      </div>
    </header>
  );
}
