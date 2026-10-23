'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Wrench,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Check,
} from '@/components/ui/icons';

interface EscalatedJob {
  id: string;
  jobTicketNumber: string;
  customerName: string;
  customerPhone: string;
  serviceTitle: string;
  pincode: string;
  customerAddressText: string;
  status: string;
  priority: string;
  assignedTechnicianName?: string;
  scheduledAt: string;
  slaBreachMinutes: number;
  totalAmountInr: number;
}

interface ProximityCandidate {
  id: string;
  fullName: string;
  badgeNumber: string;
  rating: number;
  assignedPincode: string;
  distanceKm: number;
  etaMinutes: number;
  isEligible: boolean;
}

export default function PartnerEscalationsPage() {
  const [escalatedJobs, setEscalatedJobs] = useState<EscalatedJob[]>([]);
  const [candidates, setCandidates] = useState<ProximityCandidate[]>([]);
  const [counts, setCounts] = useState<{ totalEscalated: number; totalAtRisk: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Recovery Reassignment Modal State (PTNR-SCR-05)
  const [selectedJob, setSelectedJob] = useState<EscalatedJob | null>(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [reason, setReason] = useState('Primary technician uncontactable &gt; 15 mins. Automated proximity reroute.');
  const [isReassigning, setIsReassigning] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partner/escalations');
      const data = await res.json();
      if (data.success) {
        setEscalatedJobs(data.escalatedJobs || []);
        setCandidates(data.proximityCandidates || []);
        setCounts(data.counts || null);
      }
    } catch (err: any) {
      console.error('Error fetching partner escalations:', err);
      setErrorMessage(err.message || 'Error loading SLA escalations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const handleConfirmReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !selectedTechId) return;

    const chosenTech = candidates.find((c) => c.id === selectedTechId);
    if (!chosenTech) return;

    try {
      setIsReassigning(true);
      setErrorMessage('');

      const token = typeof window !== 'undefined' ? localStorage.getItem('gts_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/partner/escalations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobId: selectedJob.id,
          newTechnicianId: chosenTech.id,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Job #${selectedJob.jobTicketNumber} reassigned to ${chosenTech.fullName} (${chosenTech.badgeNumber})`);
        setSelectedJob(null);
        setSelectedTechId('');
        fetchEscalations();
        setTimeout(() => setActionSuccessMsg(''), 5000);
      } else {
        setErrorMessage(data.error || 'Failed to reassign technician');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing proximity reroute');
    } finally {
      setIsReassigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner — Clean White Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>PTNR-SCR-04 &bull; SLA Breach Escalation &amp; Recovery Dispatch</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Critical SLA Escalations &amp; Proximity Reassignment
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            30-minute response breach monitor, proximity Haversine sorting &amp; automated emergency dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchEscalations}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Scan SLA Timers
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-xs">
          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SLA Metric Cards — Clean White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 text-xs font-bold uppercase tracking-wider">
            <span>Critical Breaches</span>
            <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
          </div>
          <div className="mt-2 text-3xl font-black text-rose-700">
            {counts?.totalEscalated ?? 1} Overdue
          </div>
          <div className="mt-1 text-xs text-rose-600">30-min SLA timer expired</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 text-xs font-bold uppercase tracking-wider">
            <span>At-Risk Orders (&lt; 10m)</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-black text-amber-600">
            {counts?.totalAtRisk ?? 0} Orders
          </div>
          <div className="mt-1 text-xs text-amber-600">Within warning threshold</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <span>Available Standby Fleet</span>
            <Wrench className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-700">
            {candidates.filter((c) => c.isEligible).length} Technicians
          </div>
          <div className="mt-1 text-xs text-emerald-600">1000V Gloves certified</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Avg Proximity Distance</span>
            <MapPin className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">
            0.59 km
          </div>
          <div className="mt-1 text-xs text-slate-500">ETA 4 mins to Colaba sector</div>
        </div>
      </div>

      {/* Escalated Orders List (PTNR-SCR-04) — Clean White Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>Active Escalation Queue</span>
            <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 text-xs font-bold font-mono">
              {escalatedJobs.length} Emergency
            </span>
          </h2>
        </div>

        <div className="space-y-4">
          {escalatedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs transition-all hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-black text-slate-900">
                    {job.jobTicketNumber}
                  </span>
                  <span className="rounded-full bg-rose-100 text-rose-800 px-3 py-0.5 text-xs font-bold uppercase tracking-wider border border-rose-300 animate-pulse">
                    30-Min SLA Breached
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-600 border border-slate-200">
                    PIN: {job.pincode}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-rose-700 text-xs font-black font-mono">
                  <Clock className="h-4 w-4 animate-spin text-rose-600" />
                  <span>+{job.slaBreachMinutes} mins OVERDUE</span>
                </div>
              </div>

              {/* Job Details Grid */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Service Scope</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{job.serviceTitle}</div>
                  <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{job.customerAddressText}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Customer Dossier</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{job.customerName}</div>
                  <div className="text-slate-500 mt-1 font-mono">{job.customerPhone}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Defaulting Electrician</div>
                  <div className="font-bold text-rose-700 text-sm mt-0.5">
                    {job.assignedTechnicianName || 'Primary unit unreachable'}
                  </div>
                  <div className="text-slate-500 mt-1 text-[11px]">
                    No GPS telemetry update in &gt; 18 mins.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Total Order Value: <strong className="font-mono text-emerald-700 font-black">₹{job.totalAmountInr.toLocaleString('en-IN')}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/partner/jobs?ticket=${encodeURIComponent(job.jobTicketNumber.replace('#', ''))}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
                  >
                    <span>View Ticket</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setSelectedTechId(candidates.find((c) => c.isEligible)?.id || '');
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-1.5 text-xs font-bold text-white transition shadow-xs cursor-pointer"
                  >
                    <span>Proximity Reroute</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {escalatedJobs.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2 shadow-xs">
              <div className="text-3xl">🛡️</div>
              <div className="text-base font-bold text-slate-800">No Escalations Active</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All work orders in Maharashtra Hub are operating within standard 30-min SLA bounds.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Proximity Reassignment Modal (PTNR-SCR-05) — Clean White Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span>Emergency Proximity Dispatch</span>
                  <span className="rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[10px] font-mono font-bold">
                    PTNR-SCR-05
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Job {selectedJob.jobTicketNumber} &bull; Colaba Market Sector
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Candidate Fleet Sorted by Proximity */}
            <form onSubmit={handleConfirmReassign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Nearby Standby Technician (Haversine Distance Sort)
                </label>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {candidates.map((tech) => {
                    const isSelected = selectedTechId === tech.id;
                    const isClosest = tech.distanceKm <= 1.0;

                    return (
                      <div
                        key={tech.id}
                        onClick={() => tech.isEligible && setSelectedTechId(tech.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          !tech.isEligible
                            ? 'opacity-40 border-slate-200 bg-slate-100 cursor-not-allowed'
                            : isSelected
                            ? 'border-emerald-500 bg-emerald-50 shadow-2xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="candidateTech"
                              checked={isSelected}
                              onChange={() => setSelectedTechId(tech.id)}
                              disabled={!tech.isEligible}
                              className="accent-emerald-600"
                            />
                            <div>
                              <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{tech.fullName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">({tech.badgeNumber})</span>
                                {isClosest && (
                                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.2 text-[9px] font-bold">
                                    Nearest Standby
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-600 mt-0.5">
                                Distance: <strong className="text-emerald-700">{tech.distanceKm} km</strong> &bull; ETA: <strong className="text-slate-900">{tech.etaMinutes} mins</strong>
                              </div>
                            </div>
                          </div>

                          <div className="text-right text-xs">
                            <span className="text-amber-500 font-black">★ {tech.rating}</span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              PIN {tech.assignedPincode}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dispatcher Escalation Reason (Committed to Immutable WORM Trail)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-800 flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  SLA grace period extension (+20 minutes) will be applied upon confirmation.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning || !selectedTechId}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isReassigning ? 'Dispatching Recovery Tech...' : 'Confirm Emergency Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
