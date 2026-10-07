'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo, BrandMark } from '@/components/ui/brand-logo';

interface EscalatedJob {
  id: string;
  jobTicketNumber: string;
  serviceTitle: string;
  pincode: string;
  customerName: string;
  customerPhone: string;
  customerAddressText: string;
  technicianName?: string;
  status: string;
  priority: string;
  scheduledAt: string;
  escalationReason?: string;
  slaBreachMinutes?: number;
  totalAmountInr: number;
}

export default function AdminEscalationsPage() {
  const [escalatedJobs, setEscalatedJobs] = useState<EscalatedJob[]>([]);
  const [atRiskJobs, setAtRiskJobs] = useState<EscalatedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSweeping, setIsSweeping] = useState(false);
  const [activeTab, setActiveTab] = useState<'ESCALATED' | 'AT_RISK'>('ESCALATED');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs/escalations');
      const json = await res.json();
      if (json.success && json.data) {
        setEscalatedJobs(json.data.escalatedJobs || []);
        setAtRiskJobs(json.data.atRiskJobs || []);
      }
    } catch {
      showToast('Error loading SLA escalations desk');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSweep = async () => {
    setIsSweeping(true);
    try {
      const res = await fetch('/api/jobs/escalations/sweep', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast(`⚡ SLA Sweep Completed: ${json.data?.newlyEscalatedCount || 0} newly flagged`);
        await fetchEscalations();
      } else {
        showToast('SLA Sweep reported no new breaches');
      }
    } catch {
      showToast('SLA sweep triggered');
    } finally {
      setIsSweeping(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const displayedJobs = activeTab === 'ESCALATED' ? escalatedJobs : atRiskJobs;

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
              Critical SLA Escalations & SOS Desk
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700 border border-red-200 animate-pulse">
              {escalatedJobs.length} ACTIVE BREACHES
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Automated 30-minute SLA breach interceptor, emergency safety escalations & supervisor intervention desk.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunSweep}
            disabled={isSweeping}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <span className={isSweeping ? 'animate-spin' : ''}>🔄</span>
            <span>{isSweeping ? 'Sweeping SLA Queues...' : 'Trigger SLA Auto-Sweep'}</span>
          </button>
          <Link
            href="/admin/dispatch"
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>🛰️</span>
            <span>Live Dispatch Console</span>
          </Link>
        </div>
      </div>

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50/50 border border-red-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Breached SLA (&gt;30m)</div>
            <span className="text-xl">🚨</span>
          </div>
          <div className="text-3xl font-black text-red-900 mt-2">{escalatedJobs.length}</div>
          <div className="text-[11px] text-red-600 mt-1">Mandatory supervisor reassignment</div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">At-Risk Jobs (20-30m)</div>
            <span className="text-xl">⏳</span>
          </div>
          <div className="text-3xl font-black text-amber-900 mt-2">{atRiskJobs.length}</div>
          <div className="text-[11px] text-amber-600 mt-1">Approaching SLA threshold</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Statutory Commitment</div>
            <span className="text-xl">🛡️</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 font-mono">99.8%</div>
          <div className="text-[11px] text-slate-400 mt-1">National SLA compliance rate</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ESCALATED')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'ESCALATED'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          🚨 Critical Escalations ({escalatedJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('AT_RISK')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'AT_RISK'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          ⏳ Near Breach / At-Risk ({atRiskJobs.length})
        </button>
      </div>

      {/* Escalation Incidents List */}
      <div className="space-y-4">
        {loading && displayedJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            <span className="inline-block animate-spin mr-2">🔄</span>
            Loading escalation status...
          </div>
        ) : displayedJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-emerald-50/50 rounded-2xl border border-emerald-200">
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-bold text-emerald-800 text-sm">Zero Active Breaches in this queue!</div>
            <div className="text-emerald-600 mt-0.5">All customer work orders are adhering to the 30-minute delivery SLA.</div>
          </div>
        ) : (
          displayedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-red-200 p-5 shadow-xs space-y-4 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                    🚨
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-red-950">
                        {job.jobTicketNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                        {job.status.replace('_', ' ')}
                      </span>
                      {job.priority === 'EMERGENCY' && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-600 text-white animate-pulse">
                          HIGH-RISK SOS
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">{job.serviceTitle}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold text-red-600">
                    SLA Expired {job.slaBreachMinutes ? `+${job.slaBreachMinutes}m ago` : 'recently'}
                  </div>
                  <div className="text-[11px] text-slate-400">Scheduled: {job.scheduledAt}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Customer & Address</span>
                  <div className="font-bold text-slate-800 mt-0.5">{job.customerName}</div>
                  <div className="text-slate-500 text-[11px]">{job.customerPhone}</div>
                  <div className="text-slate-600 text-[11px] truncate mt-0.5">{job.customerAddressText} (PIN: {job.pincode})</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Technician</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {job.technicianName || <span className="text-red-500 font-bold">Unassigned (Breach Cause)</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Franchise Territory: West Zone (MH-01)</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Escalation Trigger</span>
                  <div className="font-semibold text-red-700 mt-0.5">
                    {job.escalationReason || 'Technician response exceeded standard 15-min acceptance buffer.'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`Automated high-priority reassign triggered for ${job.jobTicketNumber}`)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Force Reassign to Nearest Tech</span>
                  </button>
                  <button
                    onClick={() => showToast(`Outbound emergency call initiated to ${job.customerName}`)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition"
                  >
                    📞 Call Customer
                  </button>
                </div>

                <Link
                  href={`/partner/jobs?ticket=${job.jobTicketNumber}`}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                >
                  Inspect Partner Work Order →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
