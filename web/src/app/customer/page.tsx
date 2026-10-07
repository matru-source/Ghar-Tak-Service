'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  ShieldCheck,
  Search,
  Filter,
  MapPin,
  Star,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Plus,
  ChevronRight,
  ChevronDown,
  Wrench,
  Sliders,
  Home,
  Calendar,
  Receipt,
  Navigation,
  User,
  X,
  Sparkles,
  AlertTriangle,
} from '@/components/ui/icons';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

interface CustomerSession {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  defaultAddressLine: string;
  defaultPincode: string;
  activeSubscriptionPlan?: string;
}

interface ActiveJob {
  id: string;
  jobTicketNumber: string;
  serviceTitle: string;
  status: string;
  priority: string;
  handoverOtp: string;
  totalAmountInr: number;
  scheduledAt: string;
  etaMinutes?: number;
  routeOrigin?: string;
  routeDestination?: string;
  technician?: {
    fullName: string;
    rating: number;
    phone: string;
    badgeNumber: string;
  };
}

interface ServiceItem {
  id: string;
  title: string;
  code: string;
  categoryName: string;
  categoryId: string;
  basePriceInr: number;
  estimatedDurationMinutes: number;
  isEmergencySosEligible: boolean;
  pricing: {
    totalPayableInr: number;
    formatted: string;
  };
  warrantyTag?: string;
  imageAlt?: string;
}

export default function CustomerDashboardPage() {
  const [session, setSession] = useState<CustomerSession>({
    id: 'cust_amit_01',
    fullName: 'Amit Sharma',
    phone: '+919876543213',
    email: 'amit.sharma@gmail.com',
    defaultAddressLine: 'Flat 402, Sea Green Apartments, Colaba, Mumbai',
    defaultPincode: '400001',
    activeSubscriptionPlan: 'ZEX_SHIELD_1MO',
  });

  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Interactive Modals
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [sosSuccess, setSosSuccess] = useState<string | null>(null);
  const [selectedHazard, setSelectedHazard] = useState('MCB Tripping / Sparking in Switchboard');

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showSafetyChecklistModal, setShowSafetyChecklistModal] = useState(false);
  const [bookingCartModal, setBookingCartModal] = useState<ServiceItem | null>(null);

  // Load customer context and services
  useEffect(() => {
    // Read local session if present
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('electriCare_customer_session');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setSession((prev) => ({ ...prev, ...parsed }));
        } catch {
          // ignore
        }
      }
    }

    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch customer profile & active job
        const profileRes = await fetch('/api/customer/profile?customerId=cust_amit_01');
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data?.activeJob) {
          setActiveJob(profileData.data.activeJob);
        }

        // Fetch services
        const servicesRes = await fetch('/api/services');
        const servicesData = await servicesRes.json();
        if (servicesData.success && servicesData.data?.services) {
          const mapped = servicesData.data.services.map((s: any, idx: number) => {
            const tags = ['1 Yr Warranty', 'Quick Fix', 'High Demand', 'Heavy Duty', 'ISO Certified'];
            return {
              ...s,
              warrantyTag: tags[idx % tags.length],
            };
          });
          setServices(mapped);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtered services
  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'REPAIR') return s.categoryId.includes('repairs') || s.title.toLowerCase().includes('repair');
    if (selectedCategory === 'INSTALL') return s.categoryId.includes('install') || s.title.toLowerCase().includes('installation');
    if (selectedCategory === 'EMERGENCY') return s.isEmergencySosEligible;
    if (selectedCategory === 'AUDIT') return s.categoryId.includes('commercial') || s.title.toLowerCase().includes('audit');
    return true;
  });

  // Handle Instant SOS Dispatch Trigger
  const handleTriggerEmergencySos = async () => {
    setSosSubmitting(true);
    setSosSuccess(null);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: session.id,
          serviceId: 'srv_mcb_02', // Circuit Breaker Tripping & Short-Circuit Diagnostic
          pincode: session.defaultPincode,
          customerAddressText: `${session.defaultAddressLine} (${selectedHazard})`,
          priority: 'EMERGENCY_SOS_247',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch emergency technician');

      const newJob = data.data;
      setActiveJob({
        id: newJob.id,
        jobTicketNumber: newJob.jobTicketNumber,
        serviceTitle: newJob.serviceTitle,
        status: newJob.status,
        priority: 'EMERGENCY_SOS_247',
        handoverOtp: newJob.handoverOtp,
        totalAmountInr: newJob.totalAmountInr,
        scheduledAt: newJob.scheduledAt,
        etaMinutes: 15,
        routeOrigin: 'Colaba Rapid Standby Hub',
        routeDestination: session.defaultAddressLine,
        technician: {
          fullName: newJob.technicianName || 'Rajesh Kumar (Lead Tech)',
          rating: 4.8,
          phone: '+919876543212',
          badgeNumber: 'TECH-4819',
        },
      });

      setSosSuccess(`Emergency Unit Dispatched! Job #${newJob.jobTicketNumber}. Electrician ETA: 15 Mins.`);
      setTimeout(() => {
        setShowSosModal(false);
        setSosSuccess(null);
      }, 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Emergency trigger failed');
    } finally {
      setSosSubmitting(false);
    }
  };

  // Change pincode / address
  const handleSelectPincode = (pincode: string, area: string) => {
    setSession((prev) => ({
      ...prev,
      defaultPincode: pincode,
      defaultAddressLine: `Flat 402, Sea View, ${area}`,
    }));
    setShowLocationModal(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-slate-900 pb-20 select-none">
      {/* 1. TOP APP BAR (Figma Header) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo & Location Picker */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <BrandMark size="sm" badgeBg="bg-blue-50 border border-blue-200 shadow-2xs" />

            <button
              onClick={() => setShowLocationModal(true)}
              className="flex flex-col items-start min-w-0 text-left py-0.5 pr-1 group hover:opacity-80 transition-opacity"
              type="button"
            >
              <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-orange-600 fill-current" />
                <span>Current Location</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:translate-y-0.5 transition-transform" />
              </span>
              <span className="text-xs font-bold text-slate-900 truncate w-full max-w-[160px]">
                {session.defaultPincode === '400001' ? 'Colaba, Mumbai 400001' : `${session.defaultPincode} • South Mumbai`}
              </span>
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotificationsModal(true)}
              aria-label="Notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
              type="button"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-600 ring-2 ring-white"></span>
            </button>

            {/* Profile Avatar */}
            <Link
              href="/customer/login"
              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:ring-2 hover:ring-blue-300 transition-all"
              title="Amit Sharma - Switch Account / Login"
            >
              <span>AS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. GREETING & CONTEXT BAR */}
      <section className="px-4 pt-3.5 pb-2 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandMark size="md" badgeBg="bg-blue-50 border border-blue-100 shadow-2xs" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base text-slate-900 truncate">Hello, {session.fullName}</h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">{session.defaultPincode} • Colaba, Mumbai</p>
            </div>
          </div>

          {/* 24/7 Rapid Help Emergency Chip (Figma Secondary-Container Pill) */}
          <button
            onClick={() => setShowSosModal(true)}
            aria-label="24/7 Emergency Assistance"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-600 text-white shadow-sm hover:bg-orange-700 active:scale-95 transition-all animate-pulse"
            type="button"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-200" />
            <span className="text-xs font-bold tracking-tight">24/7 SOS</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="relative flex items-center mt-0.5">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white placeholder:text-slate-400 transition-all font-medium"
            placeholder="Search electrical services (Fan, MCB, Wire)..."
            type="search"
          />
          <button
            onClick={() => setSelectedCategory(selectedCategory === 'ALL' ? 'EMERGENCY' : 'ALL')}
            aria-label="Filter Services"
            className="absolute right-2 w-7 h-7 rounded-lg bg-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-300 transition-colors"
            type="button"
            title="Filter by Emergency"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 3. LIVE DISPATCH ACTIVITY TRACKER CARD (Job #J-1001) */}
      {activeJob && (
        <section className="px-4 py-2">
          <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
            {/* Accent Top Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500"></div>

            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                <span className="text-[11px] text-orange-600 font-extrabold uppercase tracking-wider">
                  Live Booking Status
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span>En Route • 12 mins</span>
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  <span>RK</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-slate-900 truncate">
                    {activeJob.technician?.fullName || 'Rajesh Kumar'}
                  </p>
                  <div className="flex items-center gap-0.5 text-slate-900">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span className="text-xs font-bold">{activeJob.technician?.rating || 4.8}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 truncate font-medium">
                  Task: {activeJob.serviceTitle}
                </p>
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate">Marine Drive → Colaba</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                  OTP: {activeJob.handoverOtp}
                </span>

                <Link
                  href="/customer/track"
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  <span>Track Live</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. QUICK CATEGORY ICON ACTIONS (Figma 4 Grid Buttons) */}
      <section className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-bold text-sm text-slate-900">Quick Services</h2>
          <span className="text-xs text-blue-600 font-semibold">4 Categories</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Repair */}
          <button
            onClick={() => setSelectedCategory(selectedCategory === 'REPAIR' ? 'ALL' : 'REPAIR')}
            className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
              selectedCategory === 'REPAIR' ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
            }`}
            type="button"
          >
            <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform border border-blue-100">
              <Wrench className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Repair</span>
          </button>

          {/* Installation */}
          <button
            onClick={() => setSelectedCategory(selectedCategory === 'INSTALL' ? 'ALL' : 'INSTALL')}
            className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
              selectedCategory === 'INSTALL' ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
            }`}
            type="button"
          >
            <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform border border-blue-100">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Install</span>
          </button>

          {/* Rapid SOS */}
          <button
            onClick={() => setShowSosModal(true)}
            className="group flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-orange-50 transition-colors"
            type="button"
          >
            <div className="w-13 h-13 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform border border-orange-200">
              <Zap className="w-6 h-6 fill-current text-orange-600" />
            </div>
            <span className="text-xs font-bold text-orange-700">Rapid SOS</span>
          </button>

          {/* Safety Audit */}
          <button
            onClick={() => setSelectedCategory(selectedCategory === 'AUDIT' ? 'ALL' : 'AUDIT')}
            className={`group flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
              selectedCategory === 'AUDIT' ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
            }`}
            type="button"
          >
            <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform border border-blue-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Audit</span>
          </button>
        </div>
      </section>

      {/* 5. POPULAR SERVICES GRID (Figma 2-Column Cards) */}
      <section className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Popular Services</h2>
            <p className="text-[11px] text-slate-500">Standardized pricing with warranty & GST</p>
          </div>
          {selectedCategory !== 'ALL' && (
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Reset ({filteredServices.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {filteredServices.slice(0, 4).map((svc) => (
            <div
              key={svc.id}
              className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-slate-100 flex items-center justify-center">
                {/* Visual Icon Illustration */}
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <span className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-700 shadow-2xs border border-slate-100">
                  {svc.warrantyTag || '1 Yr Warranty'}
                </span>
              </div>

              <div className="flex flex-col flex-1">
                <h3 className="font-bold text-xs text-slate-900 line-clamp-1">{svc.title}</h3>
                <p className="text-[10px] text-slate-500 line-clamp-1 mb-1.5">
                  {svc.estimatedDurationMinutes} mins • {svc.categoryName}
                </p>

                <div className="mt-auto flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="font-extrabold text-xs text-slate-900">
                    ₹{Math.round(svc.pricing?.totalPayableInr || svc.basePriceInr * 1.18)}
                  </span>
                  <button
                    onClick={() => setBookingCartModal(svc)}
                    aria-label={`Book ${svc.title}`}
                    className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors active:scale-95 shadow-2xs"
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. ELECTRICARE SHIELD™ TRUST & SAFETY CARD */}
      <section className="px-4 pt-2 pb-4">
        <div className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h4 className="font-bold text-xs text-slate-900">ElectriCare Shield™</h4>
              <p className="text-[10px] text-slate-500">Uncompromising safety & compliance guarantee</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700 mt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px]">1,000V Insulated VDE certified field gear mandatory</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px]">Police verified & Wireman Grade-A licensed electricians</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px]">
                Up to <strong className="text-slate-900">₹10,000</strong> complimentary transit damage cover
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              ISO 9001:2015 Standards
            </span>
            <button
              onClick={() => setShowSafetyChecklistModal(true)}
              className="text-[11px] text-blue-600 font-bold flex items-center gap-0.5 hover:underline"
              type="button"
            >
              <span>Read Checklist</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. FIXED BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_16px_rgba(11,28,48,0.06)]">
        <div className="flex justify-around items-center h-15 px-2">
          {/* Home Tab */}
          <Link
            href="/customer"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-blue-600 font-bold"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>

          {/* Bookings Tab */}
          <Link
            href="/customer/bookings"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Bookings</span>
          </Link>

          {/* Track Tab */}
          <Link
            href="/customer/track"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Navigation className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Track</span>
          </Link>

          {/* History Tab */}
          <Link
            href="/customer/history"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">History</span>
          </Link>

          {/* Profile Tab */}
          <Link
            href="/customer/login"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      {/* =========================================================================
          MODALS & OVERLAYS
          ========================================================================= */}

      {/* 1. 24/7 RAPID SOS EMERGENCY MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">24/7 Rapid SOS Emergency</h3>
                  <p className="text-[11px] text-orange-600 font-bold">⚡ 15-Minute Response Guaranteed</p>
                </div>
              </div>
              <button
                onClick={() => setShowSosModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sosSuccess ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-base text-slate-900">Emergency Dispatched!</h4>
                <p className="text-xs text-slate-600 mt-1">{sosSuccess}</p>
              </div>
            ) : (
              <div className="pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Electrical Hazard Type
                  </label>
                  <div className="space-y-2">
                    {[
                      'MCB Tripping / Sparking in Switchboard',
                      'Burning Smell / Short Circuit in Meter',
                      'Total Sudden Power Outage in Premises',
                      'Exposed High-Voltage Live Wire',
                    ].map((hazard) => (
                      <div
                        key={hazard}
                        onClick={() => setSelectedHazard(hazard)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between font-medium ${
                          selectedHazard === hazard
                            ? 'border-orange-600 bg-orange-50 text-orange-950 font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span>{hazard}</span>
                        {selectedHazard === hazard && (
                          <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Destination: {session.defaultAddressLine}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Lead Technician on standby in Colaba Pincode 400001
                  </p>
                </div>

                <button
                  type="button"
                  disabled={sosSubmitting}
                  onClick={handleTriggerEmergencySos}
                  className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {sosSubmitting ? (
                    <span>Allocating Standby Electrician...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Confirm 15-Min Rapid Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. LOCATION SWITCHER MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Select Service Location</h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2.5">
              {[
                { pin: '400001', area: 'Colaba, Mumbai Hub', eta: '15 Mins' },
                { pin: '400005', area: 'Cuffe Parade & Colaba Post Office', eta: '18 Mins' },
                { pin: '400020', area: 'Churchgate & Marine Drive Sector', eta: '20 Mins' },
                { pin: '400021', area: 'Nariman Point Financial District', eta: '15 Mins' },
              ].map((loc) => (
                <div
                  key={loc.pin}
                  onClick={() => handleSelectPincode(loc.pin, loc.area)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    session.defaultPincode === loc.pin
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {loc.pin} • {loc.area}
                    </div>
                    <div className="text-[11px] text-emerald-700">⚡ Guaranteed ETA: {loc.eta}</div>
                  </div>
                  {session.defaultPincode === loc.pin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. NOTIFICATIONS MODAL */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
              </div>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                <div className="font-bold text-blue-900">Technician En Route</div>
                <p className="text-slate-600 mt-0.5">
                  Rajesh Kumar is arriving in approx. 12 mins for Job #J-1001. Keep Handover OTP ready.
                </p>
                <span className="text-[10px] text-blue-700 font-mono mt-1 block">5 mins ago</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">Zex Shield Active</div>
                <p className="text-slate-600 mt-0.5">
                  Your residential electrical surge protection plan is active until Nov 15, 2026.
                </p>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">Yesterday</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SAFETY CHECKLIST MODAL */}
      {showSafetyChecklistModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">ElectriCare Safety Standard</h3>
              </div>
              <button
                onClick={() => setShowSafetyChecklistModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-700">
              <p className="font-medium text-slate-600">
                Every technician dispatched under ElectriCare undergoes strict statutory compliance checks:
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>1,000V Insulated Gloves:</strong> Tested & calibrated up to IEC 60903 standards.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Main MCB Isolation:</strong> Mandatory power disconnect verified before service.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Photo Evidence:</strong> High-resolution before & after condition captured.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD TO CART / INSTANT BOOKING MODAL */}
      {bookingCartModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Book Electrical Service</h3>
              <button
                onClick={() => setBookingCartModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <h4 className="font-bold text-sm text-slate-900">{bookingCartModal.title}</h4>
                <p className="text-slate-600 mt-0.5">
                  Duration: {bookingCartModal.estimatedDurationMinutes} mins • {bookingCartModal.categoryName}
                </p>
                <div className="mt-2 text-base font-extrabold text-blue-900">
                  Total: ₹{Math.round(bookingCartModal.pricing?.totalPayableInr || bookingCartModal.basePriceInr * 1.18)}{' '}
                  <span className="text-xs font-normal text-slate-500">(incl. 18% GST)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-600">Location:</span>
                <span className="font-bold text-slate-900">{session.defaultAddressLine}</span>
              </div>

              <Link
                href="/customer/bookings"
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all block text-center"
              >
                <span>Proceed to Slot & Payment</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
