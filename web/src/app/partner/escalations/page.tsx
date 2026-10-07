'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Wrench,
  MapPin,
  ChevronRight,
  User,
  Zap,
  Phone,
  Check,
} from '@/components/ui/icons';

interface EscalatedJob {
  id: string;
  jobTicketNumber: string;
  customerName: string;
  customerPhone: string;
  technicianName?: string;
  serviceTitle: string;
  pincode: string;
  customerAddressText: string;
  status: string;
  priority: string;
  slaExpiryAt: string;
  remainingMinutes: number;
  isBreached: boolean;
  totalAmountInr: number;
}

interface ProximityCandidate {
  id: string;
  badgeNumber: string;
  fullName: string;
  phone: string;
  rating: number;
  distanceKm: number;
  etaMinutes: number;
  isOnline: boolean;
  isEligible: boolean;
  assignedPincode: string;
}

export default function PartnerEscalationsPage() {
  const [escalatedJobs, setEscalatedJobs] = useState<EscalatedJob[]>([]);
  const [candidates, setCandidates] = useState<ProximityCandidate[]>([]);
  const [counts, setCounts] = useState<{ totalEscalated: number; totalAtRisk: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Proximity Reassignment Modal State (PTNR-SCR-05)
  const [selectedJob, setSelectedJob] = useState<EscalatedJob | null>(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [reason, setReason] = useState('30-minute SLA breach timer breached without dispatch acceptance in Colaba Hub');
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
    } catch (err) {
      console.error('Error fetching escalations:', err);
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

    try {
      setIsReassigning(true);
      setErrorMessage('');
      const res = await fetch('/api/partner/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          reassignTechnicianId: selectedTechId,
          reason,
          slaExtensionMinutes: 20,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(
          `Job ${selectedJob.jobTicketNumber} successfully reassigned to ${data.result.reassignedTechnician.fullName}! +20m SLA grace period applied and logged to WORM audit trail.`
        );
        setSelectedJob(null);
        setSelectedTechId('');
        await fetchEscalations();
        setTimeout(() => setActionSuccessMsg(''), 5000);
      } else {
        setErrorMessage(data.error || 'Failed to reassign technician');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing reassignment');
    } finally {
      setIsReassigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <AlertTriangle className="h-4 w-4" />
            <span>PTNR-SCR-04 &bull; PTNR-SCR-05 &bull; Emergency SLA Escalations Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">
            Critical SLA Escalations &amp; Proximity Reassignment
          </h1>
          <p className="text-sm text-slate-400">
            30-minute response breach monitor, proximity Haversine sorting &amp; automated emergency dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEscalations}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Scan SLA Timers
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>Critical Breaches</span>
            <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-200">
            {counts?.totalEscalated ?? 1} Overdue
          </div>
          <div className="mt-1 text-[11px] text-rose-300/80">30-min SLA timer expired</div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>At-Risk Orders (&lt; 10m)</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300">
            {counts?.totalAtRisk ?? 0} Orders
          </div>
          <div className="mt-1 text-[11px] text-amber-400/80">Within warning threshold</div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>Available Standby Fleet</span>
            <Wrench className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-300">
            {candidates.filter((c) => c.isEligible).length} Technicians
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80">1000V Gloves certified</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Proximity Distance</span>
            <MapPin className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100">
            0.59 km
          </div>
          <div className="mt-1 text-[11px] text-slate-400">ETA 4 mins to Colaba sector</div>
        </div>
      </div>

      {/* Escalated Orders List (PTNR-SCR-04) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Active Escalation Queue</span>
            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300 font-mono">
              {escalatedJobs.length} Emergency
            </span>
          </h2>
        </div>

        <div className="space-y-4">
          {escalatedJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-rose-500/50 bg-gradient-to-r from-rose-950/40 via-slate-900/90 to-slate-900 p-5 shadow-xl shadow-rose-950/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-bold text-white">
                    {job.jobTicketNumber}
                  </span>
                  <span className="rounded-full bg-rose-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-300 border border-rose-500/50 animate-pulse">
                    30-Min SLA Breached
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                    PIN: {job.pincode}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold font-mono">
                  <Clock className="h-4 w-4" />
                  <span>OVERDUE BY {Math.abs(job.remainingMinutes || 35)} MINUTES</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Hazard / Service Description</div>
                  <div className="font-bold text-slate-100 text-sm mt-0.5">{job.serviceTitle}</div>
                  <div className="flex items-center gap-1.5 text-slate-300 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    <span>{job.customerAddressText}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Customer Emergency Contact</div>
                  <div className="font-bold text-slate-200 mt-0.5">{job.customerName}</div>
                  <div className="flex items-center gap-1.5 text-slate-400 mt-1 font-mono">
                    <Phone className="h-3 w-3 text-sky-400 shrink-0" />
                    <span>{job.customerPhone}</span>
                  </div>
                  <div className="text-[11px] text-amber-400 mt-1">
                    Risk Level: Short-Circuit / Building Inverter Trip
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Standby Recovery Unit</div>
                  <div className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Pradeep Jadhav (0.59 km away)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Estimated Transit Time: <strong className="text-white">4 Minutes</strong>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-[11px] text-slate-400">
                  Proximity sort evaluated via Haversine distance matrix.
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      const best = candidates.find((c) => c.isEligible);
                      setSelectedTechId(best ? best.id : 'tech_pradeep_04');
                    }}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/30"
                  >
                    Trigger Emergency Reassignment &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))}

          {escalatedJobs.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400 text-xs">
              All work orders in Maharashtra Hub are operating within standard 30-min SLA bounds.
            </div>
          )}
        </div>
      </div>

      {/* Proximity Reassignment Modal (PTNR-SCR-05) */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>Emergency Proximity Dispatch</span>
                  <span className="rounded bg-rose-500/20 text-rose-300 px-2 py-0.5 text-[10px] font-mono font-bold">
                    PTNR-SCR-05
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Job {selectedJob.jobTicketNumber} &bull; Colaba Market Sector
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Candidate Fleet Sorted by Proximity */}
            <form onSubmit={handleConfirmReassign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Nearby Standby Technician (Haversine Distance Sort)
                </label>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {candidates.map((tech) => {
                    const isSelected = selectedTechId === tech.id;
                    const isClosest = tech.distanceKm <= 1.0;

                    return (
                      <div
                        key={tech.id}
                        onClick={() => tech.isEligible && setSelectedTechId(tech.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          !tech.isEligible
                            ? 'opacity-40 border-slate-800 bg-slate-950 cursor-not-allowed'
                            : isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                            : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="candidateTech"
                              checked={isSelected}
                              onChange={() => setSelectedTechId(tech.id)}
                              disabled={!tech.isEligible}
                              className="text-emerald-500"
                            />
                            <div>
                              <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                                <span>{tech.fullName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({tech.badgeNumber})</span>
                                {isClosest && (
                                  <span className="rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 text-[9px] font-bold">
                                    Nearest Standby
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Distance: <strong className="text-emerald-400">{tech.distanceKm} km</strong> &bull; ETA: <strong className="text-white">{tech.etaMinutes} mins</strong>
                              </div>
                            </div>
                          </div>

                          <div className="text-right text-xs">
                            <span className="text-amber-400 font-bold">★ {tech.rating}</span>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dispatcher Escalation Reason (Committed to Immutable WORM Trail)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-[11px] text-emerald-300 flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  SLA grace period extension (+20 minutes) will be applied upon confirmation.
                </span>
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
                  disabled={isReassigning || !selectedTechId}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
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
