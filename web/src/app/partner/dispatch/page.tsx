'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Users,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  Wrench,
  Check,
  Phone,
  ChevronRight,
  ExternalLink,
} from '@/components/ui/icons';

interface JobOrder {
  id: string;
  jobTicketNumber: string;
  customerName: string;
  customerPhone: string;
  technicianId?: string;
  technicianName?: string;
  serviceTitle: string;
  pincode: string;
  customerAddressText: string;
  status: string;
  priority: string;
  handoverOtp?: string;
  totalAmountInr: number;
  scheduledAt: string;
  slaExpiryAt?: string;
  safetyGlovesConfirmed: boolean;
  safetyMcbSwitchConfirmed: boolean;
}

interface DispatchMetrics {
  totalTerritoryJobs: number;
  unassignedCount: number;
  inProgressCount: number;
  escalatedCount: number;
  completedCount: number;
  onlineStandbyCount: number;
}

interface TechnicianStandby {
  id: string;
  badgeNumber: string;
  fullName: string;
  phone: string;
  rating: number;
  isOnline: boolean;
  assignedPincode: string;
}

export default function PartnerDispatchPage() {
  const [jobs, setJobs] = useState<JobOrder[]>([]);
  const [metrics, setMetrics] = useState<DispatchMetrics | null>(null);
  const [standbyTechs, setStandbyTechs] = useState<TechnicianStandby[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pincodeFilter, setPincodeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Quick Reassign Modal state
  const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partner/dispatch');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
        setMetrics(data.metrics || null);
        setStandbyTechs(data.standbyTechnicians || []);
      }
    } catch (err) {
      console.error('Error fetching dispatch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !selectedTechId) return;

    const tech = standbyTechs.find((t) => t.id === selectedTechId);
    if (!tech) return;

    try {
      setIsUpdating(true);
      const res = await fetch('/api/partner/dispatch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          technicianId: tech.id,
          technicianName: tech.fullName,
          status: 'ASSIGNED',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Job ${selectedJob.jobTicketNumber} dispatched to ${tech.fullName}!`);
        setSelectedJob(null);
        setSelectedTechId('');
        await fetchJobs();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error dispatching technician:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== 'ALL' && job.status !== statusFilter) return false;
    if (pincodeFilter !== 'ALL' && job.pincode !== pincodeFilter) return false;
    if (priorityFilter !== 'ALL' && job.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        job.jobTicketNumber.toLowerCase().includes(q) ||
        job.customerName.toLowerCase().includes(q) ||
        job.serviceTitle.toLowerCase().includes(q) ||
        job.pincode.includes(q) ||
        (job.technicianName && job.technicianName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Zap className="h-4 w-4" />
            <span>PTNR-SCR-02 &bull; Territory Job Dispatch Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">
            Territory Dispatch &amp; Work-Order Queue
          </h1>
          <p className="text-sm text-slate-400">
            Live work orders executing within Maharashtra postal jurisdiction &bull; Proximity fleet allocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Telemetry Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Orders in Queue</span>
            <Wrench className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100">
            {metrics?.totalTerritoryJobs ?? '...'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Maharashtra Cluster</div>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>Critical SLA Breaches</span>
            <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-300">
            {metrics?.escalatedCount ?? '...'}
          </div>
          <div className="mt-1 text-[11px] text-rose-400/90">&lt; 30-min SLA timer active</div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>Unassigned Orders</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300">
            {metrics?.unassignedCount ?? '...'}
          </div>
          <div className="mt-1 text-[11px] text-amber-400/90">Awaiting dispatch</div>
        </div>

        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-sky-400 text-xs font-semibold">
            <span>In-Progress Jobs</span>
            <Wrench className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-300">
            {metrics?.inProgressCount ?? '...'}
          </div>
          <div className="mt-1 text-[11px] text-sky-400/90">Technician on-site</div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>Online Standby Techs</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-300">
            {metrics?.onlineStandbyCount ?? '...'}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/90 font-medium">Ready in territory</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search ticket #, customer, service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ESCALATED_SLA">Escalated SLA</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={pincodeFilter}
            onChange={(e) => setPincodeFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Pincodes</option>
            <option value="400001">400001 (Colaba)</option>
            <option value="400005">400005 (Cuffe Parade)</option>
            <option value="400020">400020 (Marine Drive)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="STANDARD">Standard</option>
            <option value="URGENT_SLA">Urgent SLA</option>
            <option value="EMERGENCY_SOS">Emergency SOS</option>
          </select>
        </div>
      </div>

      {/* Work Orders List (PTNR-SCR-02) */}
      <div className="space-y-3">
        {filteredJobs.map((job) => {
          const isEscalated = job.status === 'ESCALATED_SLA';
          const isInProgress = job.status === 'IN_PROGRESS';

          return (
            <div
              key={job.id}
              className={`rounded-xl border p-4 backdrop-blur transition-all ${
                isEscalated
                  ? 'border-rose-500/50 bg-rose-500/5'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-white">
                    {job.jobTicketNumber}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isEscalated
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-500/20 animate-pulse'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    }`}
                  >
                    {job.status.replace('_', ' ')}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    PIN: {job.pincode}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Total Labor:</span>
                  <span className="font-bold font-mono text-emerald-400 text-sm">
                    ₹{job.totalAmountInr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Service & Customer details */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Service Requirement</div>
                  <div className="font-bold text-slate-100 mt-0.5 text-sm">{job.serviceTitle}</div>
                  <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{job.customerAddressText}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Customer Dossier</div>
                  <div className="font-bold text-slate-200 mt-0.5">{job.customerName}</div>
                  <div className="flex items-center gap-1.5 text-slate-400 mt-1 font-mono">
                    <Phone className="h-3 w-3 text-sky-400 shrink-0" />
                    <span>{job.customerPhone}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Assigned Fleet Technician</div>
                  <div className="font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{job.technicianName || 'Unassigned (Standby Needed)'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    {job.handoverOtp ? (
                      <span className="text-emerald-400 font-mono">
                        Handover OTP: <strong>{job.handoverOtp}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-500">OTP pending dispatch</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 text-[11px]">
                  {job.safetyGlovesConfirmed ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> 1000V Gloves &amp; MCB Off Verified
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Safety Checklist Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setSelectedTechId(job.technicianId || '');
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    Assign / Reassign Tech
                  </button>

                  <Link
                    href={`/partner/jobs?ticket=${job.jobTicketNumber}`}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                  >
                    <span>Inspect Lifecycle</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500 text-xs">
            No work orders in Maharashtra territory match current query filters.
          </div>
        )}
      </div>

      {/* Assign / Reassign Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Assign Fleet Technician</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Job {selectedJob.jobTicketNumber} &bull; {selectedJob.serviceTitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignTechnician} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Online Standby Electrician
                </label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- Choose Technician --</option>
                  {standbyTechs.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.fullName} ({tech.badgeNumber}) - Pincode {tech.assignedPincode} (Rating: {tech.rating} ★)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Only KYC-verified technicians with calibrated 1000V safety kits are eligible.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !selectedTechId}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
