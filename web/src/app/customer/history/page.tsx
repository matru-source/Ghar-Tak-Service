'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  MapPin,
  ChevronRight,
  Receipt,
  RefreshCw,
  Navigation,
  Home,
  User,
  AlertCircle,
  Sparkles,
} from '@/components/ui/icons';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

interface HistoryJob {
  id: string;
  jobTicketNumber: string;
  serviceTitle: string;
  category?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING_DISPATCH' | 'CANCELLED';
  createdAt: string;
  completedAt?: string;
  totalAmountInr: number;
  paymentMethod?: string;
  technicianName?: string;
  technicianBadge?: string;
  customerAddressText?: string;
  invoiceNumber?: string;
  pincode?: string;
}

const SEED_HISTORY_JOBS: HistoryJob[] = [
  {
    id: 'job_hist_01',
    jobTicketNumber: 'TKT-4001',
    serviceTitle: 'Ceiling Fan Installation & Dynamic Balancing',
    category: 'Electrical',
    status: 'COMPLETED',
    createdAt: '2026-10-27T10:15:00Z',
    completedAt: '2026-10-27T11:45:00Z',
    totalAmountInr: 1250,
    paymentMethod: 'UPI (Google Pay)',
    technicianName: 'Ramesh Kumar',
    technicianBadge: '#TECH-4001',
    customerAddressText: 'Flat 402, Sea Green Apts, Colaba, Mumbai',
    invoiceNumber: 'INV-2026-001',
    pincode: '400001',
  },
  {
    id: 'job_hist_02',
    jobTicketNumber: 'TKT-3890',
    serviceTitle: 'Split AC Deep Foam Jet Servicing (1.5 Ton)',
    category: 'HVAC & Cooling',
    status: 'COMPLETED',
    createdAt: '2026-10-18T14:00:00Z',
    completedAt: '2026-10-18T15:30:00Z',
    totalAmountInr: 1899,
    paymentMethod: 'Credit Card',
    technicianName: 'Vikram Shinde',
    technicianBadge: '#TECH-4002',
    customerAddressText: 'Flat 402, Sea Green Apts, Colaba, Mumbai',
    invoiceNumber: 'INV-2026-002',
    pincode: '400001',
  },
  {
    id: 'job_hist_03',
    jobTicketNumber: 'TKT-3742',
    serviceTitle: 'Main MCB Trip & Distribution Board Diagnostic',
    category: 'Emergency Electrical',
    status: 'COMPLETED',
    createdAt: '2026-09-29T18:20:00Z',
    completedAt: '2026-09-29T19:10:00Z',
    totalAmountInr: 850,
    paymentMethod: 'UPI (PhonePe)',
    technicianName: 'Amit Patil',
    technicianBadge: '#TECH-4003',
    customerAddressText: 'Flat 402, Sea Green Apts, Colaba, Mumbai',
    invoiceNumber: 'INV-2026-003',
    pincode: '400001',
  },
  {
    id: 'job_hist_04',
    jobTicketNumber: 'TKT-3510',
    serviceTitle: 'RO Water Purifier Filter Cartridge Replacement',
    category: 'Appliances',
    status: 'CANCELLED',
    createdAt: '2026-09-12T09:30:00Z',
    totalAmountInr: 1100,
    customerAddressText: 'Flat 402, Sea Green Apts, Colaba, Mumbai',
    pincode: '400001',
  },
];

export default function CustomerHistoryPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'COMPLETED' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<HistoryJob[]>(SEED_HISTORY_JOBS);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    let isCancelled = false;
    async function loadCustomerJobs() {
      setIsLoading(true);
      try {
        let customerId = '';
        let phone = '';
        if (typeof window !== 'undefined') {
          try {
            const raw = sessionStorage.getItem('ghartak_session') || localStorage.getItem('gts_session');
            if (raw) {
              const parsed = JSON.parse(raw);
              customerId = parsed.id || parsed.customerId || '';
              phone = parsed.phone || '';
            }
          } catch (_) {}
        }

        const queryParams = new URLSearchParams();
        if (customerId) queryParams.set('customerId', customerId);
        if (phone) queryParams.set('phone', phone);
        queryParams.set('limit', '30');

        const res = await fetch(`/api/jobs?${queryParams.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        const apiJobs: any[] = json.data || json.jobs || [];

        if (!isCancelled && Array.isArray(apiJobs) && apiJobs.length > 0) {
          const mappedJobs: HistoryJob[] = apiJobs.map((j) => ({
            id: j.id,
            jobTicketNumber: j.jobTicketNumber || j.id.slice(-6).toUpperCase(),
            serviceTitle: j.serviceTitle || 'Home Service Repair',
            category: j.category || 'Doorstep Service',
            status: j.status || 'COMPLETED',
            createdAt: j.createdAt || new Date().toISOString(),
            completedAt: j.completedAt,
            totalAmountInr: j.totalAmountInr || j.totalAmount || 1250,
            paymentMethod: j.paymentMethod || 'UPI',
            technicianName: j.technician?.name || j.technicianName || 'Verified Technician',
            technicianBadge: j.technician?.badgeNumber || j.technicianBadge || '#TECH-VERIFIED',
            customerAddressText: j.customerAddressText || 'Mumbai Doorstep Location',
            invoiceNumber: j.invoiceNumber || j.invoice?.invoiceNumber || `INV-${j.id.slice(-6).toUpperCase()}`,
            pincode: j.pincode || '400001',
          }));

          // Merge API jobs with seeds ensuring no duplicate IDs
          const existingIds = new Set(mappedJobs.map((m) => m.id));
          const complementarySeeds = SEED_HISTORY_JOBS.filter((s) => !existingIds.has(s.id));
          setJobs([...mappedJobs, ...complementarySeeds]);
        }
      } catch (err) {
        console.warn('Failed to fetch jobs from API, maintaining seed history:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadCustomerJobs();
    const interval = setInterval(loadCustomerJobs, 20000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Filter & Search Logic
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Tab filter
      if (activeTab === 'COMPLETED' && job.status !== 'COMPLETED') return false;
      if (activeTab === 'CANCELLED' && job.status !== 'CANCELLED') return false;
      if (activeTab === 'ACTIVE' && (job.status === 'COMPLETED' || job.status === 'CANCELLED')) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = job.serviceTitle.toLowerCase().includes(query);
        const matchTicket = job.jobTicketNumber.toLowerCase().includes(query);
        const matchTech = (job.technicianName || '').toLowerCase().includes(query);
        const matchAddr = (job.customerAddressText || '').toLowerCase().includes(query);
        if (!matchTitle && !matchTicket && !matchTech && !matchAddr) return false;
      }
      return true;
    });
  }, [jobs, activeTab, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return 'Recently';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 pb-24 select-none min-h-screen">
      {/* Top App Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/customer"
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <BrandMark size="xs" badgeBg="bg-blue-50 border border-blue-200 shadow-2xs" />
              <div>
                <h1 className="font-extrabold text-sm text-slate-900 leading-tight">Service History</h1>
                <p className="text-[10px] text-slate-500 font-medium">All Doorstep Orders & Tax Receipts</p>
              </div>
            </div>
          </div>

          <Link
            href="/customer/bookings"
            className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
          >
            + New Booking
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by service, ticket #, or technician..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-0.5">
          {(
            [
              { key: 'ALL', label: 'All Orders' },
              { key: 'COMPLETED', label: 'Completed' },
              { key: 'ACTIVE', label: 'In Progress' },
              { key: 'CANCELLED', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-4 space-y-3">
        {/* Total Count Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>
            Showing <strong className="text-slate-800">{filteredJobs.length}</strong> orders
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* List of Orders */}
        {paginatedJobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-2xs mt-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">No service bookings found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}". Try clearing search.`
                : 'You have not booked any services matching this filter.'}
            </p>
            <div className="mt-4">
              <Link
                href="/customer/bookings"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Zap className="w-4 h-4" />
                <span>Book a Service Now</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedJobs.map((job) => {
              const isCompleted = job.status === 'COMPLETED';
              const isCancelled = job.status === 'CANCELLED';
              const isActive = !isCompleted && !isCancelled;

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200 hover:border-slate-300 transition-all group"
                >
                  {/* Top Bar: Ticket # & Status */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-slate-900">
                        #{job.jobTicketNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        • {formatDate(job.createdAt)}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isCancelled
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-600'
                            : isCancelled
                            ? 'bg-rose-600'
                            : 'bg-amber-600 animate-ping'
                        }`}
                      />
                      {job.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Service Title & Price */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                        {job.serviceTitle}
                      </h3>
                      {job.customerAddressText && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate max-w-[280px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{job.customerAddressText}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-black text-slate-900 block">
                        ₹{job.totalAmountInr.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {job.paymentMethod || 'Paid'}
                      </span>
                    </div>
                  </div>

                  {/* Technician attribution */}
                  {job.technicianName && (
                    <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-100 text-xs">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold shrink-0">
                        👨‍🔧
                      </div>
                      <span className="text-[11px] text-slate-600 font-medium truncate">
                        Tech: <strong className="text-slate-800">{job.technicianName}</strong>
                      </span>
                      {job.technicianBadge && (
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
                          {job.technicianBadge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-100">
                    {/* View Tax Invoice Button */}
                    <Link
                      href={`/customer/invoices/${encodeURIComponent(job.invoiceNumber || job.id)}?jobId=${encodeURIComponent(job.id)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5 text-slate-600" />
                      <span>Inspect Invoice</span>
                    </Link>

                    {/* Active Track or Rebook */}
                    {isActive ? (
                      <Link
                        href={`/customer/track?jobId=${encodeURIComponent(job.id)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Track Live</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/customer/bookings?service=${encodeURIComponent(job.serviceTitle)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Book Again</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 pb-4">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Bottom Customer Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_16px_rgba(11,28,48,0.06)]">
        <div className="flex justify-around items-center h-15 px-2">
          <Link
            href="/customer"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Home</span>
          </Link>
          <Link
            href="/customer/bookings"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Bookings</span>
          </Link>
          <Link
            href="/customer/track"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Navigation className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Track</span>
          </Link>
          <Link
            href="/customer/history"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-blue-600 font-bold"
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">History</span>
          </Link>
          <Link
            href="/customer/login"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] tracking-tight font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
