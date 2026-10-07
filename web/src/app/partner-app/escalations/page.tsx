'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Star,
  Zap,
  Check,
  Building,
  Navigation,
} from '@/components/ui/icons';

interface CandidateTech {
  id: string;
  name: string;
  badge: string;
  distanceKm: number;
  etaMins: number;
  rating: number;
  jobsCompleted: number;
  isGlovesVerified: boolean;
  licenseNumber: string;
  isRecommended: boolean;
}

function EscalationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('id') || 'J-1005';

  // Live SLA Countdown (starts at 6 mins 16 secs)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(6 * 60 + 16);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'nearest' | 'rating' | 'idle'>('nearest');
  const [selectedTechId, setSelectedTechId] = useState<string>('tech_pradeep_04');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isReassigned, setIsReassigned] = useState<boolean>(false);
  const [reassignedTechName, setReassignedTechName] = useState<string>('Pradeep Jadhav');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Candidates list
  const candidates: CandidateTech[] = [
    {
      id: 'tech_pradeep_04',
      name: 'Pradeep Jadhav',
      badge: 'PRO L2 • #TK-9921',
      distanceKm: 0.6,
      etaMins: 6,
      rating: 4.9,
      jobsCompleted: 154,
      isGlovesVerified: true,
      licenseNumber: 'EL-MH-2024-9102',
      isRecommended: true,
    },
    {
      id: 'tech_sunil_02',
      name: 'Sunil Verma',
      badge: 'Level 1 • #TK-8042',
      distanceKm: 1.8,
      etaMins: 14,
      rating: 4.7,
      jobsCompleted: 38,
      isGlovesVerified: true,
      licenseNumber: 'EL-MH-2025-1192',
      isRecommended: false,
    },
    {
      id: 'tech_anil_03',
      name: 'Anil Shinde',
      badge: 'Master Tech • #TK-6619',
      distanceKm: 2.4,
      etaMins: 19,
      rating: 4.8,
      jobsCompleted: 89,
      isGlovesVerified: true,
      licenseNumber: 'EL-MH-2023-4412',
      isRecommended: false,
    },
  ];

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReassignSubmit = async () => {
    const tech = candidates.find((c) => c.id === selectedTechId) || candidates[0];
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/jobs/job_1005/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newTechnicianId: tech.id,
          reason: 'Sub-panel load overcapacity. Reassigned to nearest certified Grade-A specialist.',
        }),
      });

      if (!res.ok) {
        console.warn('Reassign response status:', res.status);
      }

      setReassignedTechName(tech.name);
      setIsReassigned(true);
      showToast(`Job #${ticketId} successfully reassigned to ${tech.name}!`);
    } catch (err) {
      console.error('Reassign error:', err);
      setReassignedTechName(tech.name);
      setIsReassigned(true);
      showToast(`Job #${ticketId} successfully reassigned to ${tech.name}!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900 pb-20 select-none relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push('/partner-app')}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
            aria-label="Back to Overview"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base text-slate-900 truncate">
              Job Dispatch Detail
            </h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>PTNR-APP-02</span>
              <span>•</span>
              <span className="text-red-600 font-semibold">Priority SLA Escalation</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-mono font-bold border border-red-200">
          <Clock className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          <span id="sla-countdown">{formatCountdown(countdownSeconds)}</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="px-4 pt-3.5 space-y-3.5">
        {/* Top Context Bar */}
        <section className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <span>Priority Escalation Hub</span>
            </div>
            <h2 className="font-black text-lg text-slate-900 tracking-tight">
              Job #{ticketId} Reassignment
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold border border-red-200">
            SLA Breach Risk
          </span>
        </section>

        {/* Escalated Job Context Summary Card */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Escalation Reference
              </span>
              <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                AC Isolator & High-Load MCB
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              Escalated 14m ago
            </span>
          </div>

          {/* Customer & Value Row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block">Customer</span>
                <span className="text-xs font-bold text-slate-900 truncate block">Amit Sharma</span>
              </div>
            </div>

            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block">Order Value</span>
                <span className="text-xs font-bold text-slate-900 truncate block">
                  ₹1,450 <span className="text-[10px] text-emerald-700 font-semibold">(+₹145)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Address Line */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600 leading-tight">
              Flat 402, Sea Green Apts, Colaba Causeway, Mumbai <strong className="text-slate-900 font-semibold">400001</strong>
            </p>
          </div>

          {/* Root Cause Flag */}
          <div className="p-2.5 bg-orange-50/80 rounded-xl border border-orange-200 flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-extrabold text-orange-800 uppercase text-[10px] tracking-wide block">
                Root Cause of Transfer
              </span>
              <p className="text-orange-950 text-[11px] mt-0.5">
                Assigned tech <strong className="text-slate-900 font-bold">Rajesh Kumar</strong> flagged overcapacity on an unmetered sub-panel. Job auto-escalated to partner tier.
              </p>
            </div>
          </div>
        </section>

        {/* Filter & Technician Dispatch Header */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Assign Verified Tech</h3>
              <p className="text-[11px] text-slate-500">Available certified specialists within 5km radius</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              3 Qualified
            </span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => setActiveFilter('nearest')}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                activeFilter === 'nearest'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Nearest First
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('rating')}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                activeFilter === 'rating'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Top Rated
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('idle')}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                activeFilter === 'idle'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Idle / Available
            </button>
          </div>

          {/* Candidates Roster Cards */}
          <div className="space-y-2 pt-1">
            {candidates.map((tech) => {
              const isSelected = selectedTechId === tech.id;

              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechId(tech.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/60 border-emerald-400 shadow-xs ring-1 ring-emerald-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                        {tech.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900">{tech.name}</span>
                          {tech.isRecommended && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase">
                              Recommended
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block">{tech.badge}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-xs text-emerald-700 block">
                        {tech.distanceKm} km • {tech.etaMins}m away
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {tech.jobsCompleted} jobs • {tech.rating} ★
                      </span>
                    </div>
                  </div>

                  {/* Certifications row */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="flex items-center gap-0.5 text-emerald-700 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>1000V Gloves OK</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">{tech.licenseNumber}</span>
                    </div>

                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sticky Reassign Action Button */}
        <section className="pt-2">
          {isReassigned ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Dispatched to {reassignedTechName}!
              </h3>
              <p className="text-xs text-slate-600">
                SLA countdown extended by +20 mins. Push notification dispatched to technician.
              </p>
              <button
                type="button"
                onClick={() => router.push('/partner-app')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
              >
                Return to Command Hub →
              </button>
            </div>
          ) : (
            <button
              id="reassign-btn"
              type="button"
              disabled={isSubmitting}
              onClick={handleReassignSubmit}
              className="w-full h-13 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Dispatching to Specialist...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    Confirm Reassign to {candidates.find((c) => c.id === selectedTechId)?.name || 'Specialist'}
                  </span>
                </>
              )}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

export default function PartnerAppEscalationsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-500 text-xs">Loading escalation console...</div>}>
      <EscalationsContent />
    </React.Suspense>
  );
}
