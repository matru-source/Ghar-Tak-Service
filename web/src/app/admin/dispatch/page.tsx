'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

interface DispatchJob {
  id: string;
  jobTicketNumber: string;
  serviceTitle: string;
  pincode: string;
  customerName: string;
  customerPhone: string;
  customerAddressText: string;
  technicianId?: string;
  technicianName?: string;
  partnerId?: string;
  status: string;
  priority: string;
  scheduledAt: string;
  totalAmountInr: number;
  slaMinutesRemaining?: number;
}

interface TechnicianLive {
  id: string;
  fullName: string;
  phone: string;
  pincode: string;
  isOnline: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  activeJobsCount?: number;
  rating?: number;
}

export default function AdminDispatchPage() {
  const [jobs, setJobs] = useState<DispatchJob[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianLive[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<DispatchJob | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, techsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/technicians'),
      ]);
      const jobsData = await jobsRes.json();
      const techsData = await techsRes.json();

      if (jobsData.success && jobsData.data?.jobs) {
        setJobs(jobsData.data.jobs);
      }
      if (techsData.success && techsData.data?.technicians) {
        setTechnicians(techsData.data.technicians);
      }
      setLastRefreshed(new Date().toLocaleTimeString('en-IN'));
    } catch {
      showToast('Error loading live dispatch telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === 'ACTIVE') {
      const activeStatuses = ['PENDING_DISPATCH', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'SAFETY_CHECKED'];
      if (!activeStatuses.includes(job.status)) return false;
    } else if (statusFilter !== 'ALL' && job.status !== statusFilter) {
      return false;
    }

    if (regionFilter !== 'ALL') {
      if (regionFilter === 'MUMBAI' && !job.pincode.startsWith('400')) return false;
      if (regionFilter === 'BENGALURU' && !job.pincode.startsWith('560')) return false;
      if (regionFilter === 'DELHI' && !job.pincode.startsWith('110')) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTicket = job.jobTicketNumber?.toLowerCase().includes(q);
      const matchCustomer = job.customerName?.toLowerCase().includes(q);
      const matchTech = job.technicianName?.toLowerCase().includes(q);
      const matchPincode = job.pincode?.includes(q);
      if (!matchTicket && !matchCustomer && !matchTech && !matchPincode) return false;
    }

    return true;
  });

  const onlineTechs = technicians.filter((t) => t.isOnline);
  const activeDispatchesCount = jobs.filter((j) => ['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(j.status)).length;
  const pendingDispatchCount = jobs.filter((j) => j.status === 'PENDING_DISPATCH').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2">
          <BrandMark size="xs" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              National Dispatch Console
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Real-time multi-state field coordination, automated dispatch queue & technician route monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <span>🔄</span>
            <span>Refresh</span>
            {lastRefreshed && <span className="text-[10px] text-slate-400 font-normal">({lastRefreshed})</span>}
          </button>
          <Link
            href="/admin/escalations"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-900/20"
          >
            <span>🚨</span>
            <span>Escalation SOS</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Active Dispatches</div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
            {activeDispatchesCount}
            <span className="text-xs text-emerald-600 font-bold">In Transit/Field</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Awaiting Assignment</div>
          <div className="text-2xl font-black text-amber-600 mt-1 flex items-baseline gap-2">
            {pendingDispatchCount}
            <span className="text-xs text-amber-500 font-bold">Needs Tech</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Technicians Online</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 flex items-baseline gap-2">
            {onlineTechs.length}
            <span className="text-xs text-slate-400 font-normal">/ {technicians.length} Total</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Target SLA Commitment</div>
          <div className="text-2xl font-black text-purple-700 mt-1 flex items-baseline gap-2">
            &lt; 30 Mins
            <span className="text-xs text-purple-500 font-bold">Guaranteed</span>
          </div>
        </div>
      </div>

      {/* Controls: Region Filter, Status Filter, Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ACTIVE' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Live
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_DISPATCH')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'PENDING_DISPATCH' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unassigned
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records
            </button>
          </div>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Hubs (India)</option>
            <option value="MUMBAI">Mumbai (MH-01)</option>
            <option value="BENGALURU">Bengaluru (KA-01)</option>
            <option value="DELHI">Delhi NCR (DL-01)</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search ticket, tech, customer, pin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white"
          />
          <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dispatch Orders Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>🛰️</span>
              <span>Live Dispatches Queue ({filteredJobs.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400">Click a work order for details</span>
          </div>

          {loading && jobs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <div className="inline-block animate-spin mb-2">🔄</div>
              <div>Loading real-time dispatch telematics...</div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No dispatches found matching the selected filters.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {filteredJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                let statusBadgeColor = 'bg-slate-100 text-slate-700';
                if (job.status === 'EN_ROUTE') statusBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                if (job.status === 'ARRIVED') statusBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                if (job.status === 'IN_PROGRESS' || job.status === 'SAFETY_CHECKED') statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                if (job.status === 'PENDING_DISPATCH') statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-4 transition cursor-pointer hover:bg-slate-50 flex items-center justify-between gap-4 ${
                      isSelected ? 'bg-purple-50/60 border-l-4 border-purple-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0 font-bold">
                        ⚡
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-purple-900">
                            {job.jobTicketNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeColor}`}>
                            {job.status.replace('_', ' ')}
                          </span>
                          {job.priority === 'EMERGENCY' && (
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-red-600 text-white animate-pulse">
                              SOS
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                          {job.serviceTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>👤 {job.customerName}</span>
                          <span>•</span>
                          <span>📍 {job.pincode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-800">
                        {job.technicianName || <span className="text-red-500 font-bold">Unassigned</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        ₹{job.totalAmountInr.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Details & Fleet Readiness (1 Col) */}
        <div className="space-y-4">
          {/* Selected Work Order Dossier */}
          {selectedJob ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="text-[11px] font-bold text-purple-700 uppercase">Work Order Selected</div>
                  <div className="font-mono font-extrabold text-sm text-slate-900">{selectedJob.jobTicketNumber}</div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Service:</span>
                  <div className="font-bold text-slate-800">{selectedJob.serviceTitle}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Customer & Destination:</span>
                  <div className="font-semibold text-slate-800">{selectedJob.customerName} ({selectedJob.customerPhone})</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">{selectedJob.customerAddressText} (Pincode: {selectedJob.pincode})</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Assigned Field Technician:</span>
                  <div className="font-semibold text-slate-800">{selectedJob.technicianName || 'None assigned yet'}</div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Billed Fare (incl. GST):</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">₹{selectedJob.totalAmountInr}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => showToast(`Simulated telemetry ping sent to ${selectedJob.technicianName || 'Hub Manager'}`)}
                  className="w-full py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition"
                >
                  📍 Send High-Precision GPS Ping
                </button>
                <Link
                  href={`/partner/jobs?ticket=${selectedJob.jobTicketNumber}`}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition block text-center"
                >
                  Inspect Partner Work Order →
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-xs text-slate-500">
              Select any work order from the queue to view full customer telemetry, safety checkpoints, and technician tracking.
            </div>
          )}

          {/* Technicians On Duty Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>👷</span>
                <span>Active Field Technicians</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-600">
                {onlineTechs.length} Online
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {technicians.slice(0, 6).map((tech) => (
                <div
                  key={tech.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${tech.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <div>
                      <div className="font-bold text-slate-800">{tech.fullName}</div>
                      <div className="text-[10px] text-slate-500">Pincode {tech.pincode} • ⭐ {tech.rating || 4.9}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast(`Direct alert sent to ${tech.fullName}`)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-purple-700 hover:bg-purple-50 shadow-2xs"
                  >
                    Alert
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
