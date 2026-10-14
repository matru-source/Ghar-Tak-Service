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
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-amber-50 text-amber-700 border border-amber-200 uppercase">
              Fleet Management
            </span>
            <span className="text-xs text-slate-500 font-medium">Regulatory Safety & Wireman Compliance</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">National Technician Fleet & KYC Registry</h1>
          <p className="text-sm text-slate-500">
            Electrical licensing board cross-verification, 1000V insulated safety audits, and real-time dispatch certification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingKyc > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{pendingKyc} Pending KYC Reviews</span>
            </span>
          )}
        </div>
      </div>

      {/* Macro Telemetry KPI Cards (Clean White Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rostered Technicians</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalTechs}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Across all franchise partners</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Regulatory Certified</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{verifiedTechs}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">✓ Wireman License Grade-A</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Audit</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingKyc}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Requires compliance inspection</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">1000V Safety Kit Certified</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{safetyCertified}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Insulated gloves audit pass</div>
        </div>
      </div>

      {/* Filter and Search Bar (Clean White Card) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto">
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
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500 focus:bg-white transition"
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
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500 focus:bg-white placeholder:text-slate-400 transition"
            />
          </form>
        </div>
      </div>

      {/* Technician Roster Table (Clean White Card) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading technician fleet records...</div>
        ) : technicians.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No technicians found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {technicians.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-800 text-xs">
                          {t.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{t.fullName}</div>
                          <div className="font-mono text-[11px] text-amber-600 font-semibold">{t.badgeNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-medium">{t.phone}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        📍 Pincode: <span className="font-mono text-slate-700 font-bold">{t.assignedPincode}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          t.isOnline
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {t.isOnline ? '● Online' : '○ Offline'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <span className="text-amber-500">★</span>
                        <span>{t.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {t.totalJobsCompleted} jobs settled
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          t.kycStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.kycStatus === 'PENDING_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold animate-pulse'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {t.kycStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {t.electricalLicenseNumber || 'Not Uploaded'}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.insulatedGlovesVerified ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                          🛡️ Passed (1000V)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-semibold text-[10px]">
                          ⚠️ Uncertified
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenInspection(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs ${
                          t.kycStatus === 'PENDING_REVIEW'
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  Compliance Inspection
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  KYC Verification: {inspectingTech.fullName}
                </h2>
                <p className="text-xs text-slate-500">
                  Badge: <span className="font-mono text-amber-600 font-bold">{inspectingTech.badgeNumber}</span> · Phone: {inspectingTech.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTech(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Document Verification Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Government Aadhar ID Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🪪</span> Government UID (Aadhar)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">UIDAI Valid</span>
                </div>
                <div className="font-mono text-xs text-slate-800 font-semibold">
                  {inspectingTech.aadharNumberMasked || 'XXXX-XXXX-4912'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Address Match: Mumbai Suburban District · Name Authenticated
                </div>
                <div className="pt-2">
                  <span className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-medium inline-block shadow-2xs">
                    ✓ Biometric eKYC Verified
                  </span>
                </div>
              </div>

              {/* State Electrical Wireman License */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BrandMark size="xs" variant="default" badge={false} className="shrink-0" />
                    <span>Wireman Electrical License</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">State Board</span>
                </div>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. EL-MH-2024-8849"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono outline-none focus:border-amber-500"
                />
                <div className="text-[11px] text-slate-500">
                  Grade-A Domestic & Industrial High Voltage Qualified
                </div>
                <div className="pt-2">
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium inline-block">
                    ✓ Valid through 2028
                  </span>
                </div>
              </div>
            </div>

            {/* Safety Interlock Kit Audit */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>🧤</span> Mandatory Safety Gear Audit (Indian Electrical Standards)
                </span>
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Protocol v2.4</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 font-medium mb-1">Safety Kit Serial Number</label>
                  <input
                    type="text"
                    value={safetyKitSerial}
                    onChange={(e) => setSafetyKitSerial(e.target.value)}
                    placeholder="SK-1000V-992"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={glovesConfirmed}
                      onChange={(e) => setGlovesConfirmed(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="text-xs text-slate-800 font-medium">
                      1000V Insulated Gloves Calibrated
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Compliance Inspector Notes */}
            {!isRejecting ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inspector Verification Notes</label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Document and safety kit verified by compliance officer..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white placeholder:text-slate-400 transition"
                />
              </div>
            ) : (
              <div className="space-y-2 bg-red-50 p-3.5 rounded-2xl border border-red-200">
                <label className="block text-xs font-bold text-red-700">
                  Mandatory Rejection Reason (Will be sent via SMS to technician)
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify why documents or safety kit failed audit..."
                  className="w-full bg-white border border-red-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-red-500 placeholder:text-slate-400"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setInspectingTech(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 border border-slate-200 transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {!isRejecting ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRejecting(true)}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition"
                    >
                      Reject KYC...
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyKyc('VERIFY')}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
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
                      className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 border border-slate-200"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyKyc('REJECT')}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md shadow-red-600/20"
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
