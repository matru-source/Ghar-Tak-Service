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
      { name: 'Manage Technicians', href: '/partner/fleet', icon: '👷' },
      { name: 'Job Management', href: '/partner/dispatch', icon: '⚡', badge: 'Dispatch', badgeColor: 'bg-emerald-700' },
    ],
  },
  {
    title: 'FINANCE & GOVERNANCE',
    items: [
      { name: 'Finance & Payouts', href: '/partner/invoices', icon: '🧾' },
      { name: 'Profile & Settings', href: '/partner/profile', icon: '🏢' },
      { name: 'Support & Zex Cyber', href: '/partner/support', icon: '🛡️' },
    ],
  },
];

interface PartnerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isExpanded?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function PartnerSidebar({
  isOpen = false,
  onClose,
  isExpanded = true,
  isPinned = false,
  onTogglePin,
  onMouseEnter,
  onMouseLeave,
}: PartnerSidebarProps) {
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
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white text-slate-800 border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shadow-lg lg:shadow-md ${
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isExpanded ? 'lg:w-72 shadow-xl' : 'lg:w-18'}`}
      >
        {/* Brand Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between min-h-[64px]">
          <Link href="/partner" onClick={onClose} className="flex items-center gap-2.5 overflow-hidden group">
            {isExpanded ? (
              <div className="flex flex-col gap-0.5 transition-opacity duration-200">
                <div className="flex items-center gap-2">
                  <BrandLogo variant="on-light" size="sm" priority />
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B5E20] border border-emerald-200">
                    PARTNER
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                  Maharashtra Regional Hub MH-01
                </div>
              </div>
            ) : (
              <div className="mx-auto flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-[#1B5E20]" title="Ghar Tak Service">
                <BrandMark size="sm" variant="default" badge={false} />
              </div>
            )}
          </Link>

          {/* Pin toggle button on desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {isExpanded && onTogglePin && (
              <button
                type="button"
                onClick={onTogglePin}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  isPinned
                    ? 'bg-emerald-100 text-[#1B5E20] font-bold shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title={isPinned ? 'Sidebar pinned open (click to unpin)' : 'Pin sidebar open'}
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

        {/* Territory Status Quick Chip */}
        {isExpanded ? (
          <div className="mx-3.5 mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs transition-opacity duration-200">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Jurisdiction</div>
              <div className="font-bold text-slate-800">Mumbai City &bull; 400001</div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
        ) : (
          <div
            className="mx-auto mt-3 p-2 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer"
            title="Jurisdiction: Mumbai City • 400001 (Active)"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2 lg:px-2.5 py-4 space-y-4 no-scrollbar">
          {PARTNER_NAVIGATION.map((section) => (
            <div key={section.title} className="space-y-1">
              {isExpanded && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === '/partner/dispatch' && (pathname === '/partner/dispatch' || pathname.startsWith('/partner/jobs')));
                return (
                  <div key={item.href} className="relative group/navitem">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center ${
                        isExpanded ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'
                      } rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-[#1B5E20] font-bold border border-emerald-200 shadow-xs'
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
                <div className="w-8 h-8 rounded-full bg-[#1B5E20] flex items-center justify-center text-xs font-bold text-white ring-2 ring-emerald-200 shadow-xs shrink-0">
                  MH
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate">Maharashtra Ops</div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    FRANCHISE_MH_01
                  </div>
                </div>
              </div>
              <Link
                href="/partner/login"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-200/60 transition font-bold shrink-0"
                title="Switch Hub / Sign Out"
              >
                🚪
              </Link>
            </>
          ) : (
            <div className="mx-auto" title="Maharashtra Ops • FRANCHISE_MH_01">
              <div className="w-8 h-8 rounded-full bg-[#1B5E20] flex items-center justify-center text-xs font-bold text-white ring-2 ring-emerald-200 shadow-xs">
                MH
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
