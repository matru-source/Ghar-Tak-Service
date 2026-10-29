'use client';

import React, { useState, useEffect } from 'react';
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
    title: 'OPERATIONS',
    items: [
      { name: 'Dashboard', href: '/admin', icon: '⚡' },
      { name: 'Live Dispatch', href: '/admin/dispatch', icon: '🛰️', badge: 'Live', badgeColor: 'bg-emerald-500' },
      { name: 'Work Orders', href: '/admin/jobs', icon: '📋' },
      { name: 'Safety Queue', href: '/admin/safety', icon: '🛡️', badge: 'Audit', badgeColor: 'bg-amber-500' },
      { name: 'Escalations', href: '/admin/escalations', icon: '🚨' },
    ],
  },
  {
    title: 'PARTNERS & FLEET',
    items: [
      { name: 'Partners', href: '/admin/partners', icon: '🏢' },
      { name: 'Pincodes & Areas', href: '/admin/pincodes', icon: '📍' },
      { name: 'Technicians', href: '/admin/technicians', icon: '👷' },
      { name: 'Customers', href: '/admin/customers', icon: '👥' },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { name: 'Accounts & Ledgers', href: '/admin/finance', icon: '🏦' },
      { name: 'Commissions', href: '/admin/commissions', icon: '⚖️' },
      { name: 'Invoices', href: '/admin/invoices', icon: '🧾' },
    ],
  },
  {
    title: 'SUPPORT & SYSTEM',
    items: [
      { name: 'Disputes & Ratings', href: '/admin/disputes', icon: '⚖️', badge: 'Dispute', badgeColor: 'bg-rose-500' },
      { name: 'Subscriptions', href: '/admin/subscriptions', icon: '🛡️' },
      { name: 'Support Tickets', href: '/admin/support', icon: '🎫' },
      { name: 'Audit Logs', href: '/admin/audit', icon: '📜' },
      { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
    ],
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isExpanded?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function AdminSidebar({
  isOpen = false,
  onClose,
  isExpanded = true,
  isPinned = false,
  onTogglePin,
  onMouseEnter,
  onMouseLeave,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    document.cookie = 'gts_token=; path=/; max-age=0';
    document.cookie = 'gts_auth_token=; path=/; max-age=0';
    document.cookie = 'gts_user_role=; path=/; max-age=0';
    document.cookie = 'token=; path=/; max-age=0';
    localStorage.removeItem('gts_token');
    localStorage.removeItem('gts_auth_token');
    localStorage.removeItem('gts_user_role');
    localStorage.removeItem('gts_user');
    localStorage.removeItem('token');
    if (onClose) onClose();
    window.location.href = '/admin/login';
  };
  const [adminUser, setAdminUser] = useState({ name: 'Platform Admin', initials: 'PA' });

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem('gts_admin_session') ||
        localStorage.getItem('electriCare_admin_session') ||
        localStorage.getItem('admin_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName || parsed.name) {
          const name = parsed.fullName || parsed.name;
          const initials = name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          setAdminUser({ name, initials });
        }
      }
    } catch (_) {}
  }, []);

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
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white text-slate-800 border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shadow-lg lg:shadow-md ${
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isExpanded ? 'lg:w-72 shadow-xl' : 'lg:w-18'}`}
      >
        {/* Brand Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between min-h-[64px]">
          <Link href="/admin" onClick={onClose} className="flex items-center gap-2.5 overflow-hidden group">
            {isExpanded ? (
              <div className="flex flex-col gap-1 transition-opacity duration-200">
                <div className="flex items-center gap-2">
                  <BrandLogo variant="on-light" size="sm" priority />
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-[#4A148C] border border-purple-200 shadow-2xs">
                    ADMIN CRM
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium whitespace-nowrap">
                  <span>Operations Console</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    v2.4
                  </span>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-[#4A148C]" title="GTS Admin Console">
                <BrandMark size="sm" variant="default" badge={false} />
              </div>
            )}
          </Link>

          {/* Desktop Pin Toggle Button */}
          <div className="hidden lg:flex items-center gap-1">
            {isExpanded && onTogglePin && (
              <button
                type="button"
                onClick={onTogglePin}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  isPinned
                    ? 'bg-purple-100 text-[#4A148C] font-bold shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title={isPinned ? 'Sidebar pinned open (click to unpin & auto-collapse on hover)' : 'Pin sidebar open'}
              >
                {isPinned ? '📌' : '📍'}
              </button>
            )}
          </div>

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

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2 lg:px-2.5 py-4 space-y-4 no-scrollbar">
          {ADMIN_NAVIGATION.map((section) => (
            <div key={section.title} className="space-y-1">
              {isExpanded && (
                <div className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase truncate">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <div key={item.href} className="relative group/navitem">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center ${
                        isExpanded ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'
                      } rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-purple-50 text-[#4A148C] font-bold border border-purple-200 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon === '⚡' ? (
                          <BrandMark size="xs" variant="default" badge={false} className="shrink-0" />
                        ) : (
                          <span className="text-lg leading-none shrink-0">{item.icon}</span>
                        )}
                        {isExpanded && <span className="truncate">{item.name}</span>}
                      </div>
                      {isExpanded && item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0 ${
                            item.badgeColor || 'bg-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>

                    {/* Floating Tooltip when collapsed */}
                    {!isExpanded && (
                      <div className="hidden lg:group-hover/navitem:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95">
                        <span>{item.name}</span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded text-white ${
                              item.badgeColor || 'bg-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Account Status */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between min-h-[58px]">
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#4A148C] flex items-center justify-center text-xs font-bold text-white ring-2 ring-purple-200 shadow-xs shrink-0">
                  {adminUser.initials}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate">{adminUser.name}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Super Admin
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href="/api/auth/me"
                  className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-200/60 transition"
                  title="Inspect JWT Token"
                >
                  🔑
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs text-slate-400 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition cursor-pointer"
                  title="Lock Terminal / Sign Out"
                >
                  🚪
                </button>
              </div>
            </>
          ) : (
            <div className="mx-auto" title={`${adminUser.name} • Super Admin`}>
              <div className="w-8 h-8 rounded-full bg-[#4A148C] flex items-center justify-center text-xs font-bold text-white ring-2 ring-purple-200 shadow-xs">
                {adminUser.initials}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
