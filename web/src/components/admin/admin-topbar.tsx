'use client';

import React from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-logo';

interface AdminTopbarProps {
  onToggleSidebar?: () => void;
  isSidebarExpanded?: boolean;
}

export function AdminTopbar({ onToggleSidebar, isSidebarExpanded = false }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
      {/* Sidebar Toggle & Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Toggle Navigation Sidebar"
            title={isSidebarExpanded ? 'Collapse Sidebar to Icon Rail' : 'Expand Sidebar to Full Width'}
          >
            <span className="text-sm font-bold">{isSidebarExpanded ? '◀' : '☰'}</span>
          </button>
        )}
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
    </header>
  );
}
