'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-logo';

export function AdminTopbar() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [activeRole, setActiveRole] = useState('SUPER_ADMIN');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const roles = [
    { role: 'SUPER_ADMIN', name: 'Vikram Malhotra', desc: 'Full National Telemetry & Command', path: '/admin' },
    { role: 'PARTNER', name: 'Suresh Patil (Director)', desc: 'Maharashtra Regional Hub Operations', path: '/admin/partners' },
    { role: 'TECHNICIAN', name: 'Rajesh Kumar (TECH-7821)', desc: 'Field Work Orders & Payouts', path: '/admin/technicians' },
    { role: 'CUSTOMER', name: 'Amit Sharma', desc: 'Home Booking & Handover OTP', path: '/admin/customers' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between">
      {/* Search Bar & Mobile Brand Mark */}
      <div className="flex items-center gap-3 pl-12 lg:pl-0 flex-1 max-w-md">
        <Link href="/admin" className="lg:hidden shrink-0" title="GTS Admin">
          <BrandMark size="xs" badgeBg="bg-purple-50 border border-purple-200" />
        </Link>
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search work orders (e.g. J-1001), pincode (400001), tech..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* Right Telemetry Controls */}
      <div className="flex items-center gap-3 lg:gap-5">
        {/* Live System Health Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Core System Healthy</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 font-mono text-[10px]">{currentTime || '05:30 PM IST'}</span>
        </div>

        {/* Urgent SLA Breach Warning Pill */}
        <Link
          href="/admin/escalations"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold hover:bg-red-100 transition shadow-xs"
        >
          <span className="animate-bounce">⚠️</span>
          <span className="hidden md:inline">1 SLA Escalated</span>
        </Link>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 transition shadow-xs"
          >
            <span className="text-amber-500">👑</span>
            <span className="hidden sm:inline">{activeRole}</span>
            <span className="text-[10px] text-slate-400">▼</span>
          </button>

          {roleSwitcherOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] font-extrabold uppercase px-2.5 py-1 text-slate-400 border-b border-slate-100 mb-1">
                Simulate System Persona
              </div>
              {roles.map((r) => {
                const isSelected = activeRole === r.role;
                const roleColorClass =
                  r.role === 'SUPER_ADMIN'
                    ? isSelected ? 'bg-purple-50 border border-purple-200 text-purple-900 font-bold' : 'text-slate-700 hover:bg-purple-50/50'
                    : r.role === 'PARTNER'
                    ? isSelected ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold' : 'text-slate-700 hover:bg-emerald-50/50'
                    : r.role === 'TECHNICIAN'
                    ? isSelected ? 'bg-orange-50 border border-orange-200 text-orange-900 font-bold' : 'text-slate-700 hover:bg-orange-50/50'
                    : isSelected ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold' : 'text-slate-700 hover:bg-blue-50/50';

                const roleBadgeColor =
                  r.role === 'SUPER_ADMIN'
                    ? 'text-purple-700 font-bold'
                    : r.role === 'PARTNER'
                    ? 'text-emerald-700 font-bold'
                    : r.role === 'TECHNICIAN'
                    ? 'text-orange-700 font-bold'
                    : 'text-blue-700 font-bold';

                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => {
                      setActiveRole(r.role);
                      setRoleSwitcherOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition text-xs flex flex-col ${roleColorClass}`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{r.name}</span>
                      <span className={`text-[10px] font-mono ${roleBadgeColor}`}>{r.role}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{r.desc}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
