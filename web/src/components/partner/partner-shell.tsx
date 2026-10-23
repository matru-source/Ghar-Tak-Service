'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PartnerTopbar } from './partner-topbar';
import { PartnerSidebar } from './partner-sidebar';

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  // Load pinned sidebar preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gts_partner_sidebar_pinned');
      if (saved !== null) {
        setIsDesktopExpanded(saved === 'true');
      } else {
        // Default to false for compact modern view
        setIsDesktopExpanded(false);
      }
    } catch {
      // ignore SSR
    }
  }, []);

  const handleToggleDesktop = () => {
    setIsDesktopExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gts_partner_sidebar_pinned', String(next));
      } catch {}
      return next;
    });
  };

  const isExpanded = isDesktopExpanded || isHovered;

  const mobileTabs = [
    { name: 'Dashboard', href: '/partner', icon: '📊' },
    { name: 'Technicians', href: '/partner/fleet', icon: '👷' },
    { name: 'Jobs', href: '/partner/dispatch', icon: '⚡' },
    { name: 'Finance', href: '/partner/invoices', icon: '🧾' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased max-w-full overflow-x-hidden">
      {/* Navigation Sidebar (Desktop push-reflow + Mobile slide-over) */}
      <PartnerSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isExpanded={isExpanded}
        isPinned={isDesktopExpanded}
        onTogglePin={handleToggleDesktop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Main Application Canvas — Smooth Content Push Reflow so content is NEVER hidden */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 max-w-full overflow-x-hidden transition-[padding] duration-300 ease-in-out ${
          isExpanded ? 'lg:pl-72' : 'lg:pl-18'
        }`}
      >
        <PartnerTopbar
          onToggleSidebar={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setIsMobileSidebarOpen(!isMobileSidebarOpen);
            } else {
              handleToggleDesktop();
            }
          }}
          isSidebarExpanded={isExpanded}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Sticky Mobile Bottom Navigation Bar (Visible on mobile/small screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-4 gap-1 text-center">
          {mobileTabs.map((tab) => {
            const isActive =
              tab.href === '/partner'
                ? pathname === '/partner'
                : pathname.startsWith(tab.href) ||
                  (tab.href === '/partner/dispatch' && pathname.startsWith('/partner/jobs'));
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex flex-col items-center py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#1B5E20] font-black bg-emerald-50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="text-base leading-tight">{tab.icon}</span>
                <span className="text-[10px] tracking-tight">{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
