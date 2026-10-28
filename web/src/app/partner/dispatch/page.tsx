'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/api-client';
import { useRealtimeEvents } from '@/lib/use-realtime-events';
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

  const handlePartnerDispatchEvent = useCallback((event: any) => {
    if (event.type === 'TECH_LOCATION_UPDATE' && event.location) {
      // Ingest live GPS telemetry ping and smoothly update technician position
      setStandbyTechs((prev) =>
        prev.map((t) =>
          (event.technicianId && t.id === event.technicianId) ||
          (event.details?.technicianName && t.fullName === event.details.technicianName)
            ? { ...t, isOnline: true }
            : t
        )
      );

      // If associated with a job, update status
      if (event.jobId && event.status) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === event.jobId || j.jobTicketNumber === event.ticketNumber
              ? { ...j, status: event.status }
              : j
          )
        );
      }
    } else if (
      event.type === 'JOB_CREATED' ||
      event.type === 'TECH_DISPATCHED' ||
      event.type === 'TECH_ACCEPTED' ||
      event.type === 'TECH_ARRIVED' ||
      event.type === 'JOB_COMPLETED' ||
      event.type === 'EMERGENCY_SOS'
    ) {
      fetchJobs();
    }
  }, []);

  const { status: partnerDispatchBusStatus } = useRealtimeEvents({
    role: 'PARTNER',
    onEvent: handlePartnerDispatchEvent,
  });

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !selectedTechId) return;

    const tech = standbyTechs.find((t) => t.id === selectedTechId);
    if (!tech) return;

    try {
      setIsUpdating(true);
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/partner/dispatch', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          jobId: selectedJob.id,
          technicianId: tech.id,
          technicianName: tech.fullName,
          status: 'ASSIGNED',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Job #${selectedJob.jobTicketNumber} dispatched to ${tech.fullName}`);
        setSelectedJob(null);
        setSelectedTechId('');
        fetchJobs();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error dispatching technician:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAutoReassign = async (job: JobOrder) => {
    try {
      setIsUpdating(true);
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/partner/dispatch', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          jobId: job.id,
          action: 'REASSIGN',
          resetSla: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`✓ Work Order #${job.jobTicketNumber} reassigned! SLA timer reset to 15 mins.`);
        fetchJobs();
        setTimeout(() => setActionSuccessMsg(''), 4500);
      }
    } catch (err) {
      console.error('Error auto-reassigning job:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== 'ALL') {
      const s = (job.status || '').toUpperCase();
      if (statusFilter === 'COMPLETED' || statusFilter === 'WORK_COMPLETED') {
        if (!['WORK_COMPLETED', 'SETTLED', 'COMPLETED', 'DONE'].includes(s)) return false;
      } else if (statusFilter === 'IN_PROGRESS') {
        if (!['IN_PROGRESS', 'SAFETY_CHECKED', 'ARRIVED', 'STARTED'].includes(s)) return false;
      } else if (statusFilter === 'ASSIGNED') {
        if (!['ASSIGNED', 'EN_ROUTE'].includes(s)) return false;
      } else if (statusFilter === 'ESCALATED_SLA') {
        if (!['ESCALATED_SLA', 'ESCALATED'].includes(s)) return false;
      } else if (s !== statusFilter) {
        return false;
      }
    }

    if (pincodeFilter !== 'ALL' && job.pincode !== pincodeFilter) return false;

    if (priorityFilter !== 'ALL') {
      const p = (job.priority || '').toUpperCase();
      if (priorityFilter === 'EMERGENCY_SOS' || priorityFilter === 'EMERGENCY') {
        if (!p.includes('EMERGENCY')) return false;
      } else if (priorityFilter === 'URGENT_SLA' || priorityFilter === 'URGENT') {
        if (!p.includes('URGENT')) return false;
      } else if (priorityFilter === 'STANDARD') {
        if (p.includes('EMERGENCY') || p.includes('URGENT')) return false;
      } else if (p !== priorityFilter) {
        return false;
      }
    }

    if (search) {
      const q = search.toLowerCase();
      return (
        (job.jobTicketNumber && job.jobTicketNumber.toLowerCase().includes(q)) ||
        (job.customerName && job.customerName.toLowerCase().includes(q)) ||
        (job.serviceTitle && job.serviceTitle.toLowerCase().includes(q)) ||
        (job.pincode && job.pincode.includes(q)) ||
        (job.technicianName && job.technicianName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <Zap className="h-4 w-4 text-[#1B5E20]" />
            <span>PTNR-SCR-02 &bull; Territory Job Dispatch Console</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Territory Dispatch &amp; Work-Order Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live work orders executing within Maharashtra postal jurisdiction &bull; Proximity fleet allocation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Telemetry Metric Strip — Normal Clean White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Orders in Queue</span>
            <Wrench className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">
            {metrics?.totalTerritoryJobs ?? '0'}
          </div>
          <div className="mt-1 text-xs text-slate-500">Maharashtra Cluster</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 text-xs font-bold uppercase tracking-wider">
            <span>Critical SLA Breaches</span>
            <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
          </div>
          <div className="mt-2 text-3xl font-black text-rose-700">
            {metrics?.escalatedCount ?? '0'}
          </div>
          <div className="mt-1 text-xs text-rose-600">&lt; 30-min SLA timer active</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 text-xs font-bold uppercase tracking-wider">
            <span>Unassigned Orders</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-black text-amber-600">
            {metrics?.unassignedCount ?? '0'}
          </div>
          <div className="mt-1 text-xs text-amber-600">Awaiting dispatch</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-sky-600 text-xs font-bold uppercase tracking-wider">
            <span>In-Progress Jobs</span>
            <Wrench className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-2 text-3xl font-black text-sky-700">
            {metrics?.inProgressCount ?? '0'}
          </div>
          <div className="mt-1 text-xs text-sky-600">Technician on-site</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <span>Online Standby Techs</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-700">
            {metrics?.onlineStandbyCount ?? '0'}
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">Ready in territory</div>
        </div>
      </div>

      {/* Filter and Search Bar — Clean Normal White Background */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search ticket #, customer, service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">Filters:</span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress / Active</option>
            <option value="ASSIGNED">Assigned / En Route</option>
            <option value="ESCALATED_SLA">Escalated SLA</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={pincodeFilter}
            onChange={(e) => setPincodeFilter(e.target.value)}
            className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Pincodes</option>
            {Array.from(new Set(['400001', '400002', '400005', '400020', ...jobs.map((j) => j.pincode).filter(Boolean)])).map((pin) => (
              <option key={pin} value={pin}>{pin}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="STANDARD">Standard</option>
            <option value="URGENT_SLA">Urgent SLA</option>
            <option value="EMERGENCY_SOS">Emergency SOS</option>
          </select>
        </div>
      </div>

      {/* Work Orders List — Clean Normal White Cards */}
      <div className="space-y-3.5">
        {filteredJobs.map((job) => {
          const isEscalated = job.status === 'ESCALATED_SLA';
          const isInProgress = job.status === 'IN_PROGRESS';

          return (
            <div
              key={job.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                isEscalated
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/partner/jobs?ticket=${encodeURIComponent(job.jobTicketNumber.replace('#', ''))}`}
                    className="font-mono text-sm font-black text-slate-900 hover:text-emerald-700 hover:underline transition-colors"
                    title="View full lifecycle ticket details"
                  >
                    {job.jobTicketNumber}
                  </Link>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isEscalated
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                        : isInProgress
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {job.status.replace('_', ' ')}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600 border border-slate-200">
                    PIN: {job.pincode}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-semibold">Total Labor:</span>
                  <span className="font-black font-mono text-emerald-700 text-base">
                    ₹{job.totalAmountInr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Service & Customer details */}
              <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Service Requirement</div>
                  <div className="font-bold text-slate-900 mt-0.5 text-sm">{job.serviceTitle}</div>
                  <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{job.customerAddressText}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Customer Dossier</div>
                  <div className="font-bold text-slate-900 mt-0.5 text-sm">{job.customerName}</div>
                  <div className="flex items-center gap-1.5 text-slate-500 mt-1 font-mono">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{job.customerPhone}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Assigned Field Unit</div>
                  <div className="font-bold text-slate-900 mt-0.5 text-sm">
                    {job.technicianName || (
                      <span className="text-amber-600 font-semibold">⚠️ Unassigned &bull; Awaiting Allocation</span>
                    )}
                  </div>
                  {job.slaExpiryAt && (
                    <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>SLA: {new Date(job.slaExpiryAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action bar on work order */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${job.safetyGlovesConfirmed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Gloves Calibrated</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${job.safetyMcbSwitchConfirmed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>MCB Interlocked</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isEscalated && (
                    <button
                      onClick={() => handleAutoReassign(job)}
                      disabled={isUpdating}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs cursor-pointer animate-pulse"
                      title="Reset SLA timer to 15 mins and reassign to nearest standby technician"
                    >
                      <span>⚡</span>
                      <span>Auto-Reassign (15m SLA Reset)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setSelectedTechId(job.technicianId || '');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                  >
                    {job.technicianId ? 'Reassign Tech' : 'Assign Tech'}
                  </button>

                  <Link
                    href={`/partner/jobs?ticket=${encodeURIComponent(job.jobTicketNumber.replace('#', ''))}`}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-[#1B5E20] hover:bg-emerald-100 border border-emerald-200 font-bold text-xs transition cursor-pointer"
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
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2 shadow-xs">
            <div className="text-3xl">📋</div>
            <div className="text-base font-bold text-slate-800">No Work Orders Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No work orders in Maharashtra territory currently match your active query filters.
            </p>
          </div>
        )}
      </div>

      {/* Assign / Reassign Modal — Clean White Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Assign Fleet Technician</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Job {selectedJob.jobTicketNumber} &bull; {selectedJob.serviceTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignTechnician} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Standby Technician
                </label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                  required
                >
                  <option value="">-- Choose verified technician --</option>
                  {standbyTechs.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.fullName} ({tech.badgeNumber}) &bull; PIN: {tech.assignedPincode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedJob) {
                      handleAutoReassign(selectedJob);
                      setSelectedJob(null);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer text-center"
                >
                  ⚡ Reset SLA &amp; Auto-Reassign (15m)
                </button>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? 'Dispatching...' : 'Confirm Dispatch'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
