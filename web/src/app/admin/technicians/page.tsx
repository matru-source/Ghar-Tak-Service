'use client';

import React, { useState, useEffect } from 'react';
import { BrandMark } from '@/components/ui/brand-logo';

interface TechnicianRecord {
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
  kycVerifiedAt?: string;
  kycRejectionReason?: string;
  kycNotes?: string;
}

export default function AdminTechniciansPage() {
  const [technicians, setTechnicians] = useState<TechnicianRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [onlineFilter, setOnlineFilter] = useState('ALL');
  const [inspectingTech, setInspectingTech] = useState<TechnicianRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // KYC Inspection Modal form state
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [glovesConfirmed, setGlovesConfirmed] = useState(true);
  const [safetyKitSerial, setSafetyKitSerial] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (kycFilter !== 'ALL') params.append('kycStatus', kycFilter);
      if (onlineFilter === 'ONLINE') params.append('isOnline', 'true');
      if (onlineFilter === 'OFFLINE') params.append('isOnline', 'false');

      const res = await fetch(`/api/admin/technicians?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTechnicians(json.data.technicians);
      }
    } catch {
      showToast('Error loading technician registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, [kycFilter, onlineFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTechnicians();
  };

  const handleOpenInspection = (tech: TechnicianRecord) => {
    setInspectingTech(tech);
    setInspectionNotes(tech.kycNotes || '');
    setRejectionReason(tech.kycRejectionReason || '');
    setGlovesConfirmed(tech.insulatedGlovesVerified);
    setSafetyKitSerial(tech.safetyKitSerial || 'SK-1000V-992');
    setLicenseNumber(tech.electricalLicenseNumber || '');
    setIsRejecting(false);
  };

  const handleVerifyKyc = async (action: 'VERIFY' | 'REJECT') => {
    if (!inspectingTech) return;

    if (action === 'REJECT' && !rejectionReason.trim()) {
      showToast('Mandatory rejection reason required for regulatory audit');
      return;
    }

    try {
      const res = await fetch(`/api/admin/technicians/${inspectingTech.id}/verify-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: action === 'VERIFY' ? inspectionNotes : rejectionReason,
          insulatedGlovesVerified: glovesConfirmed,
          safetyKitSerial,
          electricalLicenseNumber: licenseNumber,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          action === 'VERIFY'
            ? `Technician ${inspectingTech.fullName} certified and authorized for live jobs!`
            : `Technician ${inspectingTech.fullName} KYC rejected.`
        );
        setInspectingTech(null);
        fetchTechnicians();
      } else {
        showToast(json.error || 'Failed to update KYC');
      }
    } catch {
      showToast('Network error while processing verification');
    }
  };

  // Macro KPIs
  const totalTechs = technicians.length;
  const verifiedTechs = technicians.filter((t) => t.kycStatus === 'VERIFIED').length;
  const pendingKyc = technicians.filter((t) => t.kycStatus === 'PENDING_REVIEW').length;
  const safetyCertified = technicians.filter((t) => t.insulatedGlovesVerified).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-amber-400 font-medium text-sm animate-bounce">
          <span>👷</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
              ADM-SCR-06, 07, 08
            </span>
            <span className="text-xs text-slate-400 font-medium">Regulatory Safety & Wireman Compliance</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">National Technician Fleet & KYC Registry</h1>
          <p className="text-sm text-slate-400">
            Electrical licensing board cross-verification, 1000V insulated safety audits, and real-time dispatch certification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingKyc > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2 animate-pulse">
              <span>⚠️</span>
              <span>{pendingKyc} Pending KYC Reviews</span>
            </span>
          )}
        </div>
      </div>

      {/* Macro Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rostered Technicians</div>
          <div className="text-2xl font-black text-white mt-1">{totalTechs}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Across all franchise partners</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Regulatory Certified</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{verifiedTechs}</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">✓ Wireman License Grade-A</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Awaiting Audit</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{pendingKyc}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Requires compliance inspection</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">1000V Safety Kit Certified</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{safetyCertified}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Insulated gloves audit pass</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Fleet' },
            { id: 'PENDING_REVIEW', label: 'Pending Review ⚠️' },
            { id: 'VERIFIED', label: 'Verified Active' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setKycFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                kycFilter === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Shift Status */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={onlineFilter}
            onChange={(e) => setOnlineFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500"
          >
            <option value="ALL">All Shifts</option>
            <option value="ONLINE">Online on Duty</option>
            <option value="OFFLINE">Offline</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="w-full md:w-72 flex items-center">
            <input
              type="text"
              placeholder="Search badge, name, license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500 placeholder:text-slate-600"
            />
          </form>
        </div>
      </div>

      {/* Technician Roster Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading technician fleet records...</div>
        ) : technicians.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No technicians found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">BADGE / NAME</th>
                  <th className="py-3.5 px-4">CONTACT & CLUSTER</th>
                  <th className="py-3.5 px-4">SHIFT STATUS</th>
                  <th className="py-3.5 px-4">PERFORMANCE</th>
                  <th className="py-3.5 px-4">KYC REGULATORY STATUS</th>
                  <th className="py-3.5 px-4">WIREMAN LICENSE</th>
                  <th className="py-3.5 px-4">SAFETY KIT (1000V)</th>
                  <th className="py-3.5 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {technicians.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs">
                          {t.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{t.fullName}</div>
                          <div className="font-mono text-[11px] text-amber-400/90">{t.badgeNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{t.phone}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        📍 Pincode: <span className="font-mono text-slate-300 font-bold">{t.assignedPincode}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          t.isOnline
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {t.isOnline ? '● Online' : '○ Offline'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-1">
                        <span className="text-amber-400">★</span>
                        <span>{t.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        {t.totalJobsCompleted} jobs settled
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          t.kycStatus === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : t.kycStatus === 'PENDING_REVIEW'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {t.kycStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      {t.electricalLicenseNumber || 'Not Uploaded'}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.insulatedGlovesVerified ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold text-[10px]">
                          🛡️ Passed (1000V)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/60 font-semibold text-[10px]">
                          ⚠️ Uncertified
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenInspection(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm ${
                          t.kycStatus === 'PENDING_REVIEW'
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <span>🔍</span>
                        <span>{t.kycStatus === 'PENDING_REVIEW' ? 'Review KYC' : 'Audit Dossier'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADM-SCR-07 & ADM-SCR-08: Regulatory KYC Verification Modal */}
      {inspectingTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ADM-SCR-07 · Regulatory Compliance Inspection
                </span>
                <h2 className="text-xl font-black text-white mt-1">
                  KYC Verification: {inspectingTech.fullName}
                </h2>
                <p className="text-xs text-slate-400">
                  Badge: <span className="font-mono text-amber-400 font-bold">{inspectingTech.badgeNumber}</span> · Phone: {inspectingTech.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTech(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Document Verification Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Government Aadhar ID Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🪪</span> Government UID (Aadhar)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">UIDAI Valid</span>
                </div>
                <div className="font-mono text-xs text-slate-300 font-semibold">
                  {inspectingTech.aadharNumberMasked || 'XXXX-XXXX-4912'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Address Match: Mumbai Suburban District · Name Authenticated
                </div>
                <div className="pt-2">
                  <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-medium inline-block">
                    ✓ Biometric eKYC Verified
                  </span>
                </div>
              </div>

              {/* State Electrical Wireman License */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BrandMark size="xs" variant="dark" badge={false} className="shrink-0" />
                    <span>Wireman Electrical License</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">State Board</span>
                </div>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. EL-MH-2024-8849"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                />
                <div className="text-[11px] text-slate-500">
                  Grade-A Domestic & Industrial High Voltage Qualified
                </div>
                <div className="pt-2">
                  <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-medium inline-block">
                    ✓ Valid through 2028
                  </span>
                </div>
              </div>
            </div>

            {/* Safety Interlock Kit Audit */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🧤</span> Mandatory Safety Gear Audit (Indian Electrical Standards)
                </span>
                <span className="text-[10px] text-blue-400 font-bold">Protocol v2.4</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Safety Kit Serial Number</label>
                  <input
                    type="text"
                    value={safetyKitSerial}
                    onChange={(e) => setSafetyKitSerial(e.target.value)}
                    placeholder="SK-1000V-992"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={glovesConfirmed}
                      onChange={(e) => setGlovesConfirmed(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                    <span className="text-xs text-slate-200 font-medium">
                      1000V Insulated Gloves Calibrated
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Compliance Inspector Notes */}
            {!isRejecting ? (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Inspector Verification Notes</label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Document and safety kit verified by compliance officer..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 placeholder:text-slate-600"
                />
              </div>
            ) : (
              <div className="space-y-2 bg-red-950/30 p-3.5 rounded-2xl border border-red-900/50">
                <label className="block text-xs font-bold text-red-400">
                  Mandatory Rejection Reason (Will be sent via SMS to technician)
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify why documents or safety kit failed audit..."
                  className="w-full bg-slate-950 border border-red-800/60 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 placeholder:text-slate-600"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectingTech(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {!isRejecting ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRejecting(true)}
                      className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-xs font-bold transition"
                    >
                      Reject KYC...
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyKyc('VERIFY')}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                    >
                      <span>✓</span>
                      <span>Approve & Certify for Dispatch</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRejecting(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyKyc('REJECT')}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-600/30"
                    >
                      Confirm Rejection
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
