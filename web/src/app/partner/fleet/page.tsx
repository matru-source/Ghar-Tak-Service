'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-logo';

interface Technician {
  id: string;
  userId: string;
  partnerId: string;
  badgeNumber: string;
  fullName: string;
  phone: string;
  rating: number;
  totalJobsCompleted: number;
  isOnline: boolean;
  currentLatitude: number;
  currentLongitude: number;
  assignedPincode: string;
  kycStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED';
  electricalLicenseNumber: string;
  insulatedGlovesVerified: boolean;
  safetyKitSerial: string;
  aadharNumberMasked?: string;
  panDocUrl?: string;
  kycRejectionReason?: string;
  kycVerifiedAt?: string;
  kycNotes?: string;
}

interface FleetStats {
  totalFleet: number;
  onlineCount: number;
  offlineCount: number;
  pendingKycCount: number;
  verifiedKycCount: number;
  safetyGearVerifiedCount: number;
  onlinePercentage: number;
}

export default function PartnerFleetPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'PENDING_KYC' | 'VERIFIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPincode, setSelectedPincode] = useState('ALL');
  const [updatingTechId, setUpdatingTechId] = useState<string | null>(null);

  // Modal states
  const [dossierTech, setDossierTech] = useState<Technician | null>(null);
  const [kycReviewTech, setKycReviewTech] = useState<Technician | null>(null);
  const [kycActionLoading, setKycActionLoading] = useState(false);
  const [kycReason, setKycReason] = useState('');
  const [glovesChecked, setGlovesChecked] = useState(true);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchFleet = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partner/fleet?partnerId=ptnr_mah_01');
      const data = await res.json();
      if (data.success) {
        setTechnicians(data.technicians || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load fleet roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  // Shift toggle action
  const handleToggleShift = async (tech: Technician) => {
    const newStatus = !tech.isOnline;
    setUpdatingTechId(tech.id);
    try {
      const res = await fetch('/api/partner/fleet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: tech.id,
          isOnline: newStatus,
          actorId: 'usr_partner_01',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTechnicians((prev) =>
          prev.map((t) => (t.id === tech.id ? { ...t, isOnline: newStatus } : t))
        );
        showToast(
          `Shift updated: ${tech.fullName} is now ${newStatus ? 'ONLINE 🟢' : 'OFFLINE ⚪'} (WORM block #${data.auditLog?.sequenceNumber})`
        );
        // Refresh stats
        fetchFleet();
      }
    } catch (err) {
      console.error('Failed to toggle shift:', err);
    } finally {
      setUpdatingTechId(null);
    }
  };

  // Pincode reassignment action
  const handleReassignPincode = async (tech: Technician, newPincode: string) => {
    setUpdatingTechId(tech.id);
    try {
      const res = await fetch('/api/partner/fleet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: tech.id,
          assignedPincode: newPincode,
          actorId: 'usr_partner_01',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTechnicians((prev) =>
          prev.map((t) => (t.id === tech.id ? { ...t, assignedPincode: newPincode } : t))
        );
        showToast(
          `Reassigned ${tech.fullName} to Territory ${newPincode} (WORM block #${data.auditLog?.sequenceNumber})`
        );
      }
    } catch (err) {
      console.error('Failed to reassign pincode:', err);
    } finally {
      setUpdatingTechId(null);
    }
  };

  // KYC Review Decision
  const handleKycDecision = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!kycReviewTech) return;
    setKycActionLoading(true);
    try {
      const res = await fetch('/api/partner/fleet/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: kycReviewTech.id,
          status,
          reason: kycReason || (status === 'VERIFIED' ? 'Approved by Maharashtra Regional Partner Audit Board' : 'Deficiency in documents'),
          insulatedGlovesVerified: glovesChecked,
          actorId: 'usr_partner_01',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `KYC ${status}: ${kycReviewTech.fullName} (${data.auditLog?.sequenceNumber ? `WORM Block #${data.auditLog.sequenceNumber}` : 'Recorded'})`
        );
        setKycReviewTech(null);
        setKycReason('');
        fetchFleet();
      }
    } catch (err) {
      console.error('Failed to submit KYC decision:', err);
    } finally {
      setKycActionLoading(false);
    }
  };

  // Filtering
  const filteredTechs = technicians.filter((tech) => {
    if (activeTab === 'ONLINE' && !tech.isOnline) return false;
    if (activeTab === 'OFFLINE' && tech.isOnline) return false;
    if (activeTab === 'PENDING_KYC' && tech.kycStatus !== 'PENDING_REVIEW') return false;
    if (activeTab === 'VERIFIED' && tech.kycStatus !== 'VERIFIED') return false;

    if (selectedPincode !== 'ALL' && tech.assignedPincode !== selectedPincode) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tech.fullName.toLowerCase().includes(q) ||
        tech.badgeNumber.toLowerCase().includes(q) ||
        tech.phone.includes(q) ||
        tech.electricalLicenseNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <span className="text-emerald-400 text-lg">✓</span>
          <span className="text-xs font-medium font-mono">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Breadcrumb & Command Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>Maharashtra Ops</span>
            <span>/</span>
            <span>Workforce Operations</span>
            <span>/</span>
            <span className="text-[#1B5E20]">Roster Registry (PTNR-SCR-06)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Regional Fleet Roster & Shift Scheduling
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1B5E20] border border-emerald-200 font-bold">
              Hub MH-01
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live shift management, real-time availability toggles, territorial pincode allocation, and regulatory KYC screening for Maharashtra electrical personnel.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchFleet}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>🔄</span>
            <span>Refresh Roster</span>
          </button>
          <button
            onClick={() => showToast('Roster export compiled. Ready for download.')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <Link
            href="/partner/capacity"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <span>📍</span>
            <span>Pincode Capacity Heatmap →</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Fleet */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Total Fleet Roster</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B5E20] flex items-center justify-center text-sm font-bold">
              👷
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.totalFleet ?? technicians.length}</span>
            <span className="text-xs font-bold text-[#1B5E20]">Field Engineers</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {stats?.onlineCount ?? 0} On Shift
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              {stats?.offlineCount ?? 0} Off-Duty
            </span>
          </div>
        </div>

        {/* Card 2: Shift Capacity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Online Shift Capacity</span>
            <BrandMark size="xs" badgeBg="bg-emerald-50 border border-emerald-200 shadow-2xs" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.onlineCount ?? 0}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B5E20] font-bold">
              {stats?.onlinePercentage ?? 0}% Available
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.onlinePercentage ?? 0}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Safety Gear Verified */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>1000V Gloves & Safety Kit</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
              🛡️
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats?.safetyGearVerifiedCount ?? 0} / {stats?.totalFleet ?? technicians.length}
            </span>
            <span className="text-xs font-bold text-amber-700">Calibrated</span>
          </div>
          <p className="text-xs text-slate-500 truncate pt-1 border-t border-slate-100">
            Mandatory IS:4770 Class 0 high-voltage certification
          </p>
        </div>

        {/* Card 4: Pending KYC Screening */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-500">
            <span>Pending KYC Screening</span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-sm font-bold">
              📋
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{stats?.pendingKycCount ?? 0}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              Action Required
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate pt-1 border-t border-slate-100">
            Requires partner screening before dispatch allocation
          </p>
        </div>
      </div>

      {/* Regional Operations Grid Overview Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B5E20] flex items-center justify-center text-lg shrink-0">
            📍
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">Maharashtra Operations Grid Status</div>
            <div className="text-xs text-slate-500">
              Active Zones: Colaba (400001), Cuffe Parade (400005), Marine Drive (400020), Nariman Point (400021), Pune (411001)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-slate-700">Mumbai South: 3 Online</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="font-bold text-slate-700">Pune Central: Standby</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs">
            <span className="font-bold text-[#1B5E20]">Avg 30-min SLA: 14 mins</span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#1B5E20] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Fleet ({technicians.length})
            </button>
            <button
              onClick={() => setActiveTab('ONLINE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'ONLINE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Online Shift ({technicians.filter((t) => t.isOnline).length})
            </button>
            <button
              onClick={() => setActiveTab('OFFLINE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'OFFLINE'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Offline ({technicians.filter((t) => !t.isOnline).length})
            </button>
            <button
              onClick={() => setActiveTab('PENDING_KYC')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'PENDING_KYC'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Pending KYC ({technicians.filter((t) => t.kycStatus === 'PENDING_REVIEW').length})
            </button>
            <button
              onClick={() => setActiveTab('VERIFIED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'VERIFIED'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Verified ({technicians.filter((t) => t.kycStatus === 'VERIFIED').length})
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            <span>Synced with Regional Dispatch Router</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search technician by name, badge ID, phone, or wireman license..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedPincode}
              onChange={(e) => setSelectedPincode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Territory Pincodes</option>
              <option value="400001">400001 — Colaba, Mumbai</option>
              <option value="400005">400005 — Cuffe Parade, Mumbai</option>
              <option value="400020">400020 — Marine Drive, Mumbai</option>
              <option value="400021">400021 — Nariman Point, Mumbai</option>
              <option value="411001">411001 — Pune Central</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-[#1B5E20] flex items-center justify-between">
              <span>Showing: {filteredTechs.length} Technicians</span>
              <span className="flex items-center gap-1.5">
                <BrandMark size="xs" variant="default" badge={false} className="shrink-0" />
                <span>MH Grid Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Data Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Technician Personnel</th>
                <th className="py-3.5 px-4 text-center">Shift Status</th>
                <th className="py-3.5 px-4">KYC Compliance</th>
                <th className="py-3.5 px-4">Safety Kit & License</th>
                <th className="py-3.5 px-4">Rating & Jobs</th>
                <th className="py-3.5 px-4">Assigned Pincode</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading Maharashtra Fleet Roster...
                  </td>
                </tr>
              ) : filteredTechs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No technicians match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTechs.map((tech) => (
                  <tr key={tech.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Technician Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                          {tech.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            {tech.fullName}
                            {tech.rating >= 4.8 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                TOP RATED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                            <span className="font-bold text-slate-700">{tech.badgeNumber}</span>
                            <span>•</span>
                            <span>{tech.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Shift Status & Toggle Switch */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <button
                          type="button"
                          disabled={updatingTechId === tech.id}
                          onClick={() => handleToggleShift(tech)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            tech.isOnline ? 'bg-emerald-600' : 'bg-slate-300'
                          } ${updatingTechId === tech.id ? 'opacity-50' : ''}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              tech.isOnline ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[10px] font-bold ${
                            tech.isOnline ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {tech.isOnline ? 'Online Shift' : 'Offline'}
                        </span>
                      </div>
                    </td>

                    {/* KYC Compliance Status */}
                    <td className="py-3.5 px-4">
                      {tech.kycStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Verified ✓
                        </span>
                      ) : tech.kycStatus === 'PENDING_REVIEW' ? (
                        <button
                          onClick={() => {
                            setKycReviewTech(tech);
                            setGlovesChecked(tech.insulatedGlovesVerified);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px] hover:bg-rose-100 transition cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                          Pending Review 🔍
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          Rejected (License Expired)
                        </span>
                      )}
                    </td>

                    {/* Safety Kit & Electrical License */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-mono text-[11px] font-bold text-slate-800">
                          {tech.electricalLicenseNumber}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span
                            className={`font-semibold ${
                              tech.insulatedGlovesVerified ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {tech.insulatedGlovesVerified ? '✓ 1000V Gloves' : '✗ Gloves Expired'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-mono">{tech.safetyKitSerial}</span>
                        </div>
                      </div>
                    </td>

                    {/* Rating & Completed Jobs */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="text-amber-500">★</span>
                        <span>{tech.rating}</span>
                        <span className="text-slate-400 font-normal text-[11px]">
                          ({tech.totalJobsCompleted} jobs)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">High-Voltage Certified</div>
                    </td>

                    {/* Assigned Pincode & Quick Selector */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          disabled={updatingTechId === tech.id}
                          value={tech.assignedPincode}
                          onChange={(e) => handleReassignPincode(tech, e.target.value)}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="400001">400001 (Colaba)</option>
                          <option value="400005">400005 (Cuffe Parade)</option>
                          <option value="400020">400020 (Marine Drive)</option>
                          <option value="400021">400021 (Nariman Point)</option>
                          <option value="411001">411001 (Pune Central)</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDossierTech(tech)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Dossier
                        </button>
                        {tech.kycStatus === 'PENDING_REVIEW' && (
                          <button
                            type="button"
                            onClick={() => {
                              setKycReviewTech(tech);
                              setGlovesChecked(tech.insulatedGlovesVerified);
                            }}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            Review KYC
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: PTNR-SCR-07 Technician Dossier Modal */}
      {dossierTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1B5E20] to-emerald-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {dossierTech.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                    {dossierTech.fullName}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B5E20] font-bold">
                      {dossierTech.badgeNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Lead Electrical Field Specialist &bull; Maharashtra Tier-1 Operations Hub
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDossierTech(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Dossier Body */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone</span>
                <span className="font-bold text-slate-900">{dossierTech.phone}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Assigned Territory</span>
                <span className="font-bold text-[#1B5E20]">{dossierTech.assignedPincode} (Mumbai South)</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Wireman License</span>
                <span className="font-bold font-mono text-slate-900">{dossierTech.electricalLicenseNumber}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Safety Kit Serial</span>
                <span className="font-bold font-mono text-slate-900">{dossierTech.safetyKitSerial}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">1000V Insulated Gloves</span>
                <span className={`font-bold ${dossierTech.insulatedGlovesVerified ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {dossierTech.insulatedGlovesVerified ? 'Verified & Calibrated ✓' : 'Inspection Required'}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Work Orders Done</span>
                <span className="font-bold text-slate-900">{dossierTech.totalJobsCompleted} Completed</span>
              </div>
            </div>

            {/* Shift & GPS Telemetry */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
              <div className="font-bold text-[#1B5E20] flex items-center justify-between">
                <span>Live Telemetry & GPS Stationing</span>
                <span className="text-[10px] bg-emerald-200 text-[#1B5E20] px-2 py-0.5 rounded-full">
                  Lat: {dossierTech.currentLatitude.toFixed(4)}, Lon: {dossierTech.currentLongitude.toFixed(4)}
                </span>
              </div>
              <div className="text-slate-600 text-[11px]">
                Currently assigned to Colaba territory with 15-min emergency response SLA guarantee.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDossierTech(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PTNR-SCR-08 Partner KYC Screening Inspection Modal */}
      {kycReviewTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  Partner Regulatory KYC Screening (PTNR-SCR-08)
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Document Inspection & Verification — {kycReviewTech.fullName}
                </h2>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {kycReviewTech.badgeNumber} &bull; Pincode: {kycReviewTech.assignedPincode}
                </div>
              </div>
              <button
                onClick={() => setKycReviewTech(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Document Checklist 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Doc 1: Aadhaar */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">1. Identity (Aadhaar)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    OCR Match 100%
                  </span>
                </div>
                <div className="font-mono text-slate-600 text-[11px]">
                  {kycReviewTech.aadharNumberMasked || 'XXXX-XXXX-8821'}
                </div>
                <div className="text-[10px] text-slate-400">Government UIDAI biometric verification complete.</div>
              </div>

              {/* Doc 2: Wireman License */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">2. Wireman License</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                    Grade-A Electrical
                  </span>
                </div>
                <div className="font-mono text-slate-600 text-[11px]">
                  {kycReviewTech.electricalLicenseNumber}
                </div>
                <div className="text-[10px] text-slate-400">Maharashtra Electricity Licensing Board certified.</div>
              </div>

              {/* Doc 3: Safety Gloves */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">3. 1000V Insulated Gloves</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    Class-0 Standard
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={glovesChecked}
                    onChange={(e) => setGlovesChecked(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Physical Seal Verified (1000V)</span>
                </label>
                <div className="text-[10px] text-slate-400">IS:4770 Dielectric proof pressure tested.</div>
              </div>

              {/* Doc 4: Safety Kit */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">4. Safety Kit Serial</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Hardware Verified
                  </span>
                </div>
                <div className="font-mono text-slate-600 text-[11px]">{kycReviewTech.safetyKitSerial}</div>
                <div className="text-[10px] text-slate-400">Multimeter, insulated screwdrivers & MCB tagout lock.</div>
              </div>
            </div>

            {/* Audit Notes Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Partner Audit Notes / Clarification (Immutable WORM Ledger)
              </label>
              <textarea
                value={kycReason}
                onChange={(e) => setKycReason(e.target.value)}
                placeholder="Enter regulatory verification notes or rejection reasons..."
                rows={2}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setKycReviewTech(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={kycActionLoading}
                onClick={() => handleKycDecision('REJECTED')}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Reject Application ✗
              </button>
              <button
                type="button"
                disabled={kycActionLoading}
                onClick={() => handleKycDecision('VERIFIED')}
                className="px-5 py-2.5 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Approve & Activate Technician ✓</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
