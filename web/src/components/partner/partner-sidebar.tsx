'use client';

import React from 'react';
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
    title: 'OPERATIONS CORE',
    items: [
      { name: 'Dashboard', href: '/partner', icon: '📊' },
      { name: 'Service Catalog', href: '/partner/services', icon: '🛠️', badge: 'Live', badgeColor: 'bg-blue-600' },
      { name: 'Manage Technicians', href: '/partner/fleet', icon: '👷', badge: '18 Active', badgeColor: 'bg-emerald-600' },
      { name: 'Job Management', href: '/partner/jobs', icon: '⚡', badge: '3 Escalated', badgeColor: 'bg-amber-600' },
    ],
  },
  {
    title: 'FINANCE & GOVERNANCE',
    items: [
      { name: 'Finance & Payouts', href: '/partner/invoices', icon: '🧾', badge: '₹4.2L', badgeColor: 'bg-emerald-700' },
      { name: 'Profile & Settings', href: '/partner/profile', icon: '🏢' },
      { name: 'Support & Zex Cyber', href: '/partner/support', icon: '🛡️', badge: '3 Mo Free', badgeColor: 'bg-amber-500' },
    ],
  },
];

interface PartnerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PartnerSidebar({ isOpen = false, onClose }: PartnerSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white text-slate-800 border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <Link href="/partner" onClick={onClose} className="flex flex-col gap-1 group">
            <div className="flex items-center gap-2">
              <BrandLogo variant="on-light" size="sm" priority />
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B5E20] border border-emerald-200">
                PARTNER
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Maharashtra Regional Hub MH-01
            </div>
          </Link>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close navigation"
            >
              <span className="text-xl leading-none">✕</span>
            </button>
          )}
        </div>

        {/* Territory Status Quick Chip */}
        <div className="mx-4 mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
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
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
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
                    onClick={onClose}
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
            onClick={onClose}
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
