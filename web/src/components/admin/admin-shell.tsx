'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminTopbar } from './admin-topbar';
import { AdminSidebar } from './admin-sidebar';
import { AdminLiveProvider } from './admin-live-provider';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  // Route isolation: Login portal must render completely standalone (no shell, sidebar, or topbar)
  if (pathname?.startsWith('/admin/login')) {
    return <>{children}</>;
  }

  // Load pinned sidebar preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gts_admin_sidebar_pinned');
      if (saved !== null) {
        setIsDesktopExpanded(saved === 'true');
      } else {
        // Default to false for modern compact icon view with hover expand
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
        localStorage.setItem('gts_admin_sidebar_pinned', String(next));
      } catch {}
      return next;
    });
  };

  const isExpanded = isDesktopExpanded || isHovered;

  return (
    <AdminLiveProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased max-w-full overflow-x-hidden">
        {/* Navigation Sidebar (Desktop push-reflow + Mobile slide-over) */}
        <AdminSidebar
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
          <AdminTopbar
            onToggleSidebar={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setIsMobileSidebarOpen(!isMobileSidebarOpen);
              } else {
                handleToggleDesktop();
              }
            }}
            isSidebarExpanded={isExpanded}
          />

          <main className="flex-1 p-3.5 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden pb-12">
            {children}
          </main>
        </div>
      </div>
    </AdminLiveProvider>
  );
}
