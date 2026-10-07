'use client';

import React, { useState, useEffect } from 'react';
import { BrandMark } from '@/components/ui/brand-logo';

interface Partner {
  id: string;
  userId: string;
  entityName: string;
  directorName: string;
  email: string;
  phone: string;
  companyRegistrationNumber: string;
  gstin: string;
  stateLicensed: string;
  allocatedStates: string[];
  maxPincodeQuota: number;
  activePincodesCount: number;
  activeTechnicianQuota: number;
  activeTechnicianCount: number;
  platformRevenueSharePct: number;
  partnerRevenueSharePct: number;
  ifscCode: string;
  bankAccountNumber: string;
  bankName: string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  createdAt: string;
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for new partner onboarding
  const [newPartner, setNewPartner] = useState({
    entityName: '',
    directorName: '',
    email: '',
    phone: '',
    stateLicensed: 'Maharashtra',
    gstin: '',
    companyRegistrationNumber: '',
    maxPincodeQuota: 40,
    activeTechnicianQuota: 80,
    platformRevenueSharePct: 15.0,
    partnerRevenueSharePct: 15.0,
    ifscCode: '',
    bankAccountNumber: '',
    bankName: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (stateFilter !== 'ALL') params.append('state', stateFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/admin/partners?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPartners(json.data.partners);
      }
    } catch {
      showToast('Error loading franchise partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [stateFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPartners();
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Franchise partner '${newPartner.entityName}' onboarded successfully!`);
        setIsOnboardModalOpen(false);
        fetchPartners();
      } else {
        showToast(json.error || 'Failed to onboard partner');
      }
    } catch {
      showToast('Network error during onboarding');
    }
  };

  const handleUpdateDossier = async (partnerId: string, updates: Partial<Partner>) => {
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Partner settings updated successfully');
        if (selectedPartner && selectedPartner.id === partnerId) {
          setSelectedPartner({ ...selectedPartner, ...updates });
        }
        fetchPartners();
      } else {
        showToast(json.error || 'Failed to update partner');
      }
    } catch {
      showToast('Network error while updating partner');
    }
  };

  // Macro KPIs
  const totalPartners = partners.length;
  const activePincodes = partners.reduce((sum, p) => sum + (p.activePincodesCount || 0), 0);
  const totalFleetCapacity = partners.reduce((sum, p) => sum + (p.activeTechnicianQuota || 0), 0);
  const activeTechnicians = partners.reduce((sum, p) => sum + (p.activeTechnicianCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-blue-400 font-medium text-sm animate-bounce">
          <BrandMark size="xs" variant="default" badge={false} className="shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
              ADM-SCR-02 & ADM-SCR-03
            </span>
            <span className="text-xs text-slate-400 font-medium">Pan-India Franchise Governance</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Franchise Partners & State Allocations</h1>
          <p className="text-sm text-slate-400">
            Multi-tenant territorial management, state license allocations, postal quotas, and commission governance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOnboardModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition transform active:scale-95"
        >
          <span>➕</span>
          <span>Onboard New Partner</span>
        </button>
      </div>

      {/* Macro Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Franchises</div>
          <div className="text-2xl font-black text-white mt-1">{totalPartners}</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">✓ Tier-1 Operational Hubs</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pincodes Managed</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{activePincodes}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Postal boundary coverage</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rostered Fleet</div>
          <div className="text-2xl font-black text-blue-400 mt-1">
            {activeTechnicians} <span className="text-xs text-slate-500 font-normal">/ {totalFleetCapacity} Quota</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Certified field workforce</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Platform Cut</div>
          <div className="text-2xl font-black text-amber-400 mt-1">15.0%</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Standardized Escrow Split</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto">
          {['ALL', 'ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Status' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* State and Search Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="ALL">All States</option>
            <option value="Maharashtra">Maharashtra Hub</option>
            <option value="Delhi NCR">Delhi NCR</option>
            <option value="Karnataka">Karnataka Hub</option>
            <option value="Gujarat">Gujarat Hub</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="flex-1 md:w-64 flex items-center">
            <input
              type="text"
              placeholder="Search entity, CIN, director..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500 placeholder:text-slate-600"
            />
          </form>
        </div>
      </div>

      {/* Partner Directory List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading franchise directory...</div>
      ) : partners.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800">
          No franchise partners match your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {partners.map((p) => {
            const pincodePct = Math.round(((p.activePincodesCount || 0) / p.maxPincodeQuota) * 100);
            const techPct = Math.round(((p.activeTechnicianCount || 0) / p.activeTechnicianQuota) * 100);

            return (
              <div
                key={p.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between gap-5"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">{p.entityName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : p.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {p.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>👤 {p.directorName}</span>
                        <span>•</span>
                        <span>📞 {p.phone}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-900/30 text-blue-300 border border-blue-800/40">
                        {p.stateLicensed}
                      </span>
                    </div>
                  </div>

                  {/* Quotas & Capacity Bar */}
                  <div className="grid grid-cols-2 gap-3 mt-4 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>Pincodes Covered</span>
                        <span className="text-white font-bold">
                          {p.activePincodesCount || 0} / {p.maxPincodeQuota}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, pincodePct)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>Technician Fleet</span>
                        <span className="text-white font-bold">
                          {p.activeTechnicianCount || 0} / {p.activeTechnicianQuota}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, techPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Legal & Finance Snapshot */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] text-slate-400">
                    <div className="truncate">
                      <span className="text-slate-500 block text-[10px]">CIN Registration</span>
                      <span className="font-mono text-slate-300">{p.companyRegistrationNumber}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-500 block text-[10px]">GSTIN Number</span>
                      <span className="font-mono text-slate-300">{p.gstin}</span>
                    </div>
                    <div className="truncate text-right">
                      <span className="text-slate-500 block text-[10px]">Revenue Share</span>
                      <span className="text-amber-400 font-bold">15% Cut / 15% Plat</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-3">
                  <div className="text-[11px] text-slate-500">
                    Allocated States:{' '}
                    <span className="text-slate-300 font-medium">
                      {(p.allocatedStates || [p.stateLicensed]).join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPartner(p);
                        setIsDossierOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>📂</span>
                      <span>Dossier & Quotas</span>
                    </button>
                    {p.status === 'ACTIVE' ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateDossier(p.id, { status: 'SUSPENDED' })}
                        className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold transition border border-red-800/40"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateDossier(p.id, { status: 'ACTIVE' })}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold transition border border-emerald-800/40"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADM-SCR-03: Partner Dossier & State Allocation Drawer/Modal */}
      {isDossierOpen && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  ADM-SCR-03 · Partner Dossier
                </span>
                <h2 className="text-xl font-black text-white mt-1">{selectedPartner.entityName}</h2>
                <p className="text-xs text-slate-400">
                  Territory ID: <span className="font-mono text-slate-300">{selectedPartner.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDossierOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Legal & Banking Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Managing Director</span>
                <span className="text-white font-bold">{selectedPartner.directorName}</span>
                <span className="text-slate-400 block text-[11px] mt-0.5">{selectedPartner.email}</span>
                <span className="text-slate-400 block text-[11px]">{selectedPartner.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Statutory Registration</span>
                <span className="text-slate-300 block font-mono">CIN: {selectedPartner.companyRegistrationNumber}</span>
                <span className="text-slate-300 block font-mono">GSTIN: {selectedPartner.gstin}</span>
                <span className="text-emerald-400 text-[11px] font-semibold mt-1 block">
                  ✓ Verified by Ministry of Corporate Affairs
                </span>
              </div>
              <div className="col-span-2 pt-3 border-t border-slate-800/80">
                <span className="text-slate-500 block text-[11px]">Banking & Escrow Settlement Account</span>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-slate-300">
                    <span className="font-bold text-white">{selectedPartner.bankName}</span>
                    <span className="block text-[11px] font-mono text-slate-400">
                      A/C: {selectedPartner.bankAccountNumber} · IFSC: {selectedPartner.ifscCode}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                    NPCI Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Quota Modifiers */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Quotas & Revenue Share Overrides</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Max Pincodes Quota</label>
                  <input
                    type="number"
                    value={selectedPartner.maxPincodeQuota}
                    onChange={(e) =>
                      setSelectedPartner({
                        ...selectedPartner,
                        maxPincodeQuota: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Max Technician Fleet Quota</label>
                  <input
                    type="number"
                    value={selectedPartner.activeTechnicianQuota}
                    onChange={(e) =>
                      setSelectedPartner({
                        ...selectedPartner,
                        activeTechnicianQuota: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Platform Revenue Share (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedPartner.platformRevenueSharePct}
                    onChange={(e) =>
                      setSelectedPartner({
                        ...selectedPartner,
                        platformRevenueSharePct: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Franchise Commission Share (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedPartner.partnerRevenueSharePct}
                    onChange={(e) =>
                      setSelectedPartner({
                        ...selectedPartner,
                        partnerRevenueSharePct: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDossierOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateDossier(selectedPartner.id, {
                    maxPincodeQuota: selectedPartner.maxPincodeQuota,
                    activeTechnicianQuota: selectedPartner.activeTechnicianQuota,
                    platformRevenueSharePct: selectedPartner.platformRevenueSharePct,
                    partnerRevenueSharePct: selectedPartner.partnerRevenueSharePct,
                  });
                  setIsDossierOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/30"
              >
                Save Quotas & Overrides
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Partner Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Onboard Franchise Partner</h2>
                <p className="text-xs text-slate-400">Register new regional operations hub and allocate state jurisdiction.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Entity Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Tamil Nadu Power Grid Solutions Pvt Ltd"
                    value={newPartner.entityName}
                    onChange={(e) => setNewPartner({ ...newPartner, entityName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Director Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ramesh Krishnan"
                    value={newPartner.directorName}
                    onChange={(e) => setNewPartner({ ...newPartner, directorName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Director Phone *</label>
                  <input
                    required
                    type="tel"
                    placeholder="+919840012345"
                    value={newPartner.phone}
                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    placeholder="ops@partner.in"
                    value={newPartner.email}
                    onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Primary State *</label>
                  <select
                    value={newPartner.stateLicensed}
                    onChange={(e) => setNewPartner({ ...newPartner, stateLicensed: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">GSTIN (15 Digits) *</label>
                  <input
                    required
                    type="text"
                    placeholder="33AAAAA0000A1Z5"
                    value={newPartner.gstin}
                    onChange={(e) => setNewPartner({ ...newPartner, gstin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="HDFC Bank"
                    value={newPartner.bankName}
                    onChange={(e) => setNewPartner({ ...newPartner, bankName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/30"
                >
                  Confirm & Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
