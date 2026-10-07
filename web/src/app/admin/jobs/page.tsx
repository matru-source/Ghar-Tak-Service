'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

interface AdminJob {
  id: string;
  jobTicketNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddressText: string;
  technicianId?: string;
  technicianName?: string;
  partnerId?: string;
  serviceTitle: string;
  pincode: string;
  status: string;
  priority: string;
  scheduledAt: string;
  totalAmountInr: number;
  safetyGlovesConfirmed?: boolean;
  safetyMcbSwitchConfirmed?: boolean;
  handoverOtp?: string;
  createdAt: string;
}

export default function AdminJobsQueuePage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs');
      const json = await res.json();
      if (json.success && json.data?.jobs) {
        setJobs(json.data.jobs);
      }
    } catch {
      showToast('Error fetching national work orders queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && j.priority !== priorityFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      const matchTicket = j.jobTicketNumber?.toLowerCase().includes(q);
      const matchCust = j.customerName?.toLowerCase().includes(q);
      const matchPhone = j.customerPhone?.includes(q);
      const matchTech = j.technicianName?.toLowerCase().includes(q);
      const matchPin = j.pincode?.includes(q);
      const matchService = j.serviceTitle?.toLowerCase().includes(q);
      if (!matchTicket && !matchCust && !matchPhone && !matchTech && !matchPin && !matchService) {
        return false;
      }
    }
    return true;
  });

  const totalRevenue = jobs.reduce((sum, j) => sum + (j.totalAmountInr || 0), 0);
  const completedJobsCount = jobs.filter((j) => j.status === 'WORK_COMPLETED' || j.status === 'SETTLED').length;
  const inProgressCount = jobs.filter((j) => ['IN_PROGRESS', 'SAFETY_CHECKED', 'EN_ROUTE', 'ARRIVED'].includes(j.status)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2">
          <BrandMark size="xs" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              National Work Orders Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
              {jobs.length} TOTAL TICKETS
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Master lifecycle queue of electrical service bookings, field safety verification & customer handovers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <span>🔄</span>
            <span>Refresh Queue</span>
          </button>
          <Link
            href="/admin/dispatch"
            className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>🛰️</span>
            <span>Live Dispatch Console</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Bookings</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{jobs.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All India clusters</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Active In Field</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{inProgressCount}</div>
          <div className="text-[11px] text-blue-500 mt-0.5">En route or on site</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Completed & Settled</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{completedJobsCount}</div>
          <div className="text-[11px] text-emerald-500 mt-0.5">With OTP handover</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Gross Booking Value</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Inclusive of 18% GST</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_DISPATCH">Pending Dispatch</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="EN_ROUTE">En Route</option>
            <option value="ARRIVED">Arrived</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SAFETY_CHECKED">Safety Checked</option>
            <option value="WORK_COMPLETED">Work Completed</option>
            <option value="ESCALATED_SLA">SLA Escalated</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="EMERGENCY">Emergency (SOS)</option>
            <option value="HIGH">High Priority</option>
            <option value="NORMAL">Standard / Normal</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search ticket #, customer, technician, pincode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket & Service</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Pincode</th>
                <th className="py-3 px-4">Field Technician</th>
                <th className="py-3 px-4">Safety Status</th>
                <th className="py-3 px-4">Status & Priority</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <span className="inline-block animate-spin mr-2">🔄</span>
                    Loading work orders...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No work orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  let statusBadge = 'bg-slate-100 text-slate-700';
                  if (job.status === 'WORK_COMPLETED' || job.status === 'SETTLED') statusBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                  else if (job.status === 'IN_PROGRESS' || job.status === 'SAFETY_CHECKED') statusBadge = 'bg-blue-50 text-blue-700 border border-blue-200';
                  else if (job.status === 'EN_ROUTE' || job.status === 'ARRIVED') statusBadge = 'bg-purple-50 text-purple-700 border border-purple-200';
                  else if (job.status === 'PENDING_DISPATCH') statusBadge = 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse';
                  else if (job.status === 'ESCALATED_SLA') statusBadge = 'bg-red-50 text-red-700 border border-red-200 animate-pulse';

                  return (
                    <tr key={job.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-purple-900">{job.jobTicketNumber}</div>
                        <div className="font-semibold text-slate-900 mt-0.5">{job.serviceTitle}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{job.customerName}</div>
                        <div className="text-[11px] text-slate-500">{job.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {job.pincode}
                      </td>
                      <td className="py-3.5 px-4">
                        {job.technicianName ? (
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {job.technicianName}
                          </div>
                        ) : (
                          <span className="text-amber-600 font-bold text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span
                            title="1000V Insulated Gloves"
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              job.safetyGlovesConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            🧤 Gloves
                          </span>
                          <span
                            title="Main MCB Lockout"
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              job.safetyMcbSwitchConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            ⚡ MCB
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge}`}>
                            {job.status.replace('_', ' ')}
                          </span>
                          {job.priority === 'EMERGENCY' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-600 text-white">
                              EMERGENCY
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{job.totalAmountInr.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Slideout Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BrandMark size="sm" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Work Order Details</div>
                  <div className="font-mono font-extrabold text-base text-slate-900">{selectedJob.jobTicketNumber}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 flex justify-between items-center">
                <div>
                  <div className="text-[11px] text-purple-600 font-medium">Service</div>
                  <div className="font-bold text-slate-900 text-sm">{selectedJob.serviceTitle}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-purple-600 font-medium">Total Billed</div>
                  <div className="font-mono font-black text-slate-900 text-base">₹{selectedJob.totalAmountInr}</div>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase">Customer</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">{selectedJob.customerName}</div>
                <div className="text-slate-600">{selectedJob.customerPhone}</div>
                <div className="text-slate-600 mt-0.5">{selectedJob.customerAddressText} (Pincode: {selectedJob.pincode})</div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase">Assigned Field Technician</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {selectedJob.technicianName || <span className="text-amber-600 font-semibold">Not assigned</span>}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase">1000V Industrial Safety Interlock</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className={`p-2.5 rounded-xl border text-[11px] font-bold ${
                    selectedJob.safetyGlovesConfirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    {selectedJob.safetyGlovesConfirmed ? '✓ VDE Insulated Gloves' : '○ Gloves Pending'}
                  </div>
                  <div className={`p-2.5 rounded-xl border text-[11px] font-bold ${
                    selectedJob.safetyMcbSwitchConfirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    {selectedJob.safetyMcbSwitchConfirmed ? '✓ MCB Lockout Tagged' : '○ MCB Pending'}
                  </div>
                </div>
              </div>

              {selectedJob.handoverOtp && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                  <span className="font-bold text-emerald-800">Verified Handover OTP:</span>
                  <span className="font-mono font-black text-base text-emerald-900 tracking-wider">
                    {selectedJob.handoverOtp}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Link
                href={`/partner/jobs?ticket=${selectedJob.jobTicketNumber}`}
                className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs text-center transition"
              >
                Inspect in Partner CRM →
              </Link>
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
