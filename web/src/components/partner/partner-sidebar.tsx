'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

export interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const PARTNER_NAVIGATION: NavSection[] = [
  {
    title: 'REGIONAL OPERATIONS',
    items: [
      { name: 'Regional Command Hub', href: '/partner', icon: '⚡' },
      { name: 'Territory Dispatch Queue', href: '/partner/dispatch', icon: '🛰️', badge: 'Live', badgeColor: 'bg-emerald-500' },
      { name: 'Critical SLA Escalations', href: '/partner/escalations', icon: '🚨', badge: '1 Breach', badgeColor: 'bg-rose-500 animate-pulse' },
    ],
  },
  {
    title: 'FLEET & CAPACITY',
    items: [
      { name: 'Technician Fleet Roster', href: '/partner/fleet', icon: '👷', badge: '2 Online', badgeColor: 'bg-emerald-600' },
      { name: 'Pincode Capacity Heatmap', href: '/partner/capacity', icon: '📍' },
    ],
  },
  {
    title: 'FINANCE & GOVERNANCE',
    items: [
      { name: 'GST Invoices & Ledgers', href: '/partner/invoices', icon: '🧾' },
      { name: 'Franchise Bank Profile', href: '/partner/profile', icon: '🏦' },
      { name: 'Partner Operations Helpdesk', href: '/partner/support', icon: '🎧', badge: '2 Open', badgeColor: 'bg-amber-500' },
    ],
  },
];

export function PartnerSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-3 left-4 z-50 p-2 rounded-lg bg-slate-900 border border-slate-700 text-white shadow-lg"
        aria-label="Toggle Navigation Drawer"
      >
        <span className="text-xl">{isMobileOpen ? '✕' : '☰'}</span>
      </button>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-white text-slate-800 border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200">
          <Link href="/partner" className="flex flex-col gap-2.5 group">
            <div className="flex items-center justify-between">
              <BrandLogo variant="on-light" size="sm" priority />
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B5E20] border border-emerald-200 shadow-2xs">
                PARTNER HUB
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Maharashtra Regional Hub MH-01</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </span>
            </div>
          </Link>
        </div>

        {/* Territory Status Quick Chip */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Jurisdiction</div>
            <div className="font-bold text-slate-800">Mumbai City &bull; 400001</div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {PARTNER_NAVIGATION.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-[#1B5E20] font-bold border border-emerald-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon === '⚡' ? (
                        <BrandMark size="xs" variant="default" badge={false} className="shrink-0" />
                      ) : (
                        <span className="text-base">{item.icon}</span>
                      )}
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${
                          item.badgeColor || 'bg-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Account Status */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1B5E20] flex items-center justify-center text-xs font-bold text-white ring-2 ring-emerald-200 shadow-xs">
              MH
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">Maharashtra Ops</div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                FRANCHISE_MH_01
              </div>
            </div>
          </div>
          <Link
            href="/partner/login"
            className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-200/60 transition font-bold"
            title="Switch Hub / Sign Out"
          >
            🚪
          </Link>
        </div>
      </aside>
    </>
  );
}
