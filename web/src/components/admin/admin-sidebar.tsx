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

const ADMIN_NAVIGATION: NavSection[] = [
  {
    title: 'NATIONAL OPERATIONS',
    items: [
      { name: 'National Telemetry', href: '/admin', icon: '⚡' },
      { name: 'Live Dispatch Console', href: '/admin/dispatch', icon: '🛰️', badge: 'Live', badgeColor: 'bg-emerald-500' },
      { name: 'Work Orders Queue', href: '/admin/jobs', icon: '📋', badge: '3', badgeColor: 'bg-blue-600' },
      { name: 'Critical SLA Escalations', href: '/admin/escalations', icon: '🚨', badge: '1', badgeColor: 'bg-red-500 animate-pulse' },
    ],
  },
  {
    title: 'FLEET & TERRITORY',
    items: [
      { name: 'Franchise Partners', href: '/admin/partners', icon: '🏢' },
      { name: 'Pincode Territories', href: '/admin/pincodes', icon: '📍' },
      { name: 'Technician Fleet & KYC', href: '/admin/technicians', icon: '👷', badge: '1 KYC', badgeColor: 'bg-amber-500' },
      { name: 'Customer Lifetime Profiles', href: '/admin/customers', icon: '👥' },
    ],
  },
  {
    title: 'FINANCE & TREASURY',
    items: [
      { name: 'Central Ledgers & Escrow', href: '/admin/finance', icon: '🏦' },
      { name: 'Commission Split Rules', href: '/admin/commissions', icon: '⚖️' },
      { name: '18% GST Tax Invoices', href: '/admin/invoices', icon: '🧾' },
    ],
  },
  {
    title: 'GOVERNANCE & AUDIT',
    items: [
      { name: 'Zex Shield Subscriptions', href: '/admin/subscriptions', icon: '🛡️' },
      { name: 'Support Tickets Desk', href: '/admin/support', icon: '🎫' },
      { name: 'Tamper-Evident WORM Logs', href: '/admin/audit', icon: '📜' },
      { name: 'Platform Settings & APIs', href: '/admin/settings', icon: '⚙️' },
    ],
  },
];

export function AdminSidebar() {
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
          <Link href="/admin" className="flex flex-col gap-2.5 group">
            <div className="flex items-center justify-between">
              <BrandLogo variant="on-light" size="sm" priority />
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-[#4A148C] border border-purple-200 shadow-2xs">
                ADMIN CRM
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>National Command Console</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                v2.4
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Section Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          {ADMIN_NAVIGATION.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5 mt-1.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-purple-50 text-[#4A148C] font-bold border border-purple-200 shadow-xs'
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
                          className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full ${
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
            </div>
          ))}
        </div>

        {/* Footer Account Status */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#4A148C] flex items-center justify-center text-xs font-bold text-white ring-2 ring-purple-200 shadow-xs">
              VM
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">Vikram Malhotra</div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                SUPER_ADMIN
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/api/auth/me"
              className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-200/60 transition"
              title="Inspect JWT Token"
            >
              🔑
            </Link>
            <Link
              href="/admin/login"
              className="text-xs text-slate-400 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition"
              title="Lock Terminal / Sign Out"
            >
              🚪
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
