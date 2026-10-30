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

  // Dynamic Indian States & Territory Pincodes State
  const [allStates, setAllStates] = useState<string[]>([]);
  const [availablePincodes, setAvailablePincodes] = useState<
    Array<{ pincode: string; district: string; state: string }>
  >([]);
  const [selectedPincodes, setSelectedPincodes] = useState<string[]>([]);
  const [districtsList, setDistrictsList] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [pincodeSearch, setPincodeSearch] = useState<string>('');
  const [pincodesLoading, setPincodesLoading] = useState<boolean>(false);
  const [assignedInStateCount, setAssignedInStateCount] = useState<number>(0);
  const [totalInStateCount, setTotalInStateCount] = useState<number>(0);

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
    ifscCode: 'HDFC0001234',
    bankAccountNumber: '50200088912345',
    bankName: 'HDFC Bank',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAvailablePincodes = async (state: string) => {
    if (!state) return;
    setPincodesLoading(true);
    try {
      const res = await fetch(`/api/admin/pincodes/available?state=${encodeURIComponent(state)}`);
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.states && json.data.states.length > 0) {
          setAllStates(json.data.states);
        }
        setAvailablePincodes(json.data.pincodes || []);
        setDistrictsList(json.data.districts || []);
        setAssignedInStateCount(json.data.assignedPincodesInState || 0);
        setTotalInStateCount(json.data.totalPincodesInState || 0);
      }
    } catch (err) {
      console.error('Failed to load dynamic pincodes:', err);
    } finally {
      setPincodesLoading(false);
    }
  };

  const handleStateChange = (newState: string) => {
    setNewPartner((prev) => ({ ...prev, stateLicensed: newState }));
    setSelectedPincodes([]);
    setSelectedDistrict('ALL');
    setPincodeSearch('');
    fetchAvailablePincodes(newState);
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
        if (json.data.metrics?.uniqueStates && json.data.metrics.uniqueStates.length > 0) {
          setAllStates((prev) => Array.from(new Set([...prev, ...json.data.metrics.uniqueStates])));
        }
      }
    } catch {
      showToast('Error loading franchise partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
    // Preload available states
    fetch('/api/admin/pincodes/available')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.states) {
          setAllStates(d.data.states);
        }
      })
      .catch(() => {});
  }, [stateFilter, statusFilter]);

  // Load available pincodes whenever the onboarding modal opens
  useEffect(() => {
    if (isOnboardModalOpen) {
      fetchAvailablePincodes(newPartner.stateLicensed || 'Maharashtra');
    }
  }, [isOnboardModalOpen]);

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
        body: JSON.stringify({
          ...newPartner,
          allocatedPincodes: selectedPincodes,
          maxPincodeQuota: Math.max(newPartner.maxPincodeQuota, selectedPincodes.length + 10),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          `Franchise partner '${newPartner.entityName}' onboarded with ${selectedPincodes.length} allocated pincodes!`
        );
        setIsOnboardModalOpen(false);
        setSelectedPincodes([]);
        setPincodeSearch('');
        fetchPartners();
      } else {
        showToast(json.error || 'Failed to onboard partner');
      }
    } catch {
      showToast('Network error during onboarding');
    }
  };

  const togglePincode = (pin: string) => {
    setSelectedPincodes((prev) =>
      prev.includes(pin) ? prev.filter((p) => p !== pin) : [...prev, pin]
    );
  };

  const selectAllFiltered = (filteredPins: string[]) => {
    setSelectedPincodes((prev) => Array.from(new Set([...prev, ...filteredPins])));
  };

  const clearSelectedPincodes = () => {
    setSelectedPincodes([]);
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
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              ADM-SCR-02 & ADM-SCR-03
            </span>
            <span className="text-xs text-slate-500 font-medium">Pan-India Franchise Governance</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Franchise Partners & State Allocations</h1>
          <p className="text-sm text-slate-500">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Franchises</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalPartners}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">✓ Tier-1 Operational Hubs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pincodes Managed</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activePincodes}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Postal boundary coverage</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rostered Fleet</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {activeTechnicians} <span className="text-xs text-slate-500 font-normal">/ {totalFleetCapacity} Quota</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Certified field workforce</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Platform Cut</div>
          <div className="text-2xl font-black text-amber-600 mt-1">15.0%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Standardized Escrow Split</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto">
          {['ALL', 'ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:bg-white font-medium"
          >
            <option value="ALL">All States</option>
            {allStates.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <form onSubmit={handleSearchSubmit} className="flex-1 md:w-64 flex items-center">
            <input
              type="text"
              placeholder="Search entity, CIN, director..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:bg-white placeholder:text-slate-400"
            />
          </form>
        </div>
      </div>

      {/* Partner Directory List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading franchise directory...</div>
      ) : partners.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
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
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition flex flex-col justify-between gap-5 shadow-xs"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900">{p.entityName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {p.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>👤 {p.directorName}</span>
                        <span>•</span>
                        <span>📞 {p.phone}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {p.stateLicensed}
                      </span>
                    </div>
                  </div>

                  {/* Quotas & Capacity Bar */}
                  <div className="grid grid-cols-2 gap-3 mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-slate-600">
                        <span>Pincodes Covered</span>
                        <span className="text-slate-900 font-bold">
                          {p.activePincodesCount || 0} / {p.maxPincodeQuota}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, pincodePct)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-slate-600">
                        <span>Technician Fleet</span>
                        <span className="text-slate-900 font-bold">
                          {p.activeTechnicianCount || 0} / {p.activeTechnicianQuota}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, techPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Legal & Finance Snapshot */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] text-slate-500">
                    <div className="truncate">
                      <span className="text-slate-500 block text-[10px]">CIN Registration</span>
                      <span className="font-mono text-slate-800 font-semibold">{p.companyRegistrationNumber}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-500 block text-[10px]">GSTIN Number</span>
                      <span className="font-mono text-slate-800 font-semibold">{p.gstin}</span>
                    </div>
                    <div className="truncate text-right">
                      <span className="text-slate-500 block text-[10px]">Revenue Share</span>
                      <span className="text-amber-700 font-bold">15% Cut / 15% Plat</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
                  <div className="text-[11px] text-slate-500">
                    Allocated States:{' '}
                    <span className="text-slate-800 font-medium">
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
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>📂</span>
                      <span>Dossier & Quotas</span>
                    </button>
                    {p.status === 'ACTIVE' ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateDossier(p.id, { status: 'SUSPENDED' })}
                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition border border-red-200"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateDossier(p.id, { status: 'ACTIVE' })}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition border border-emerald-200"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  ADM-SCR-03 · Partner Dossier
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">{selectedPartner.entityName}</h2>
                <p className="text-xs text-slate-500">
                  Territory ID: <span className="font-mono text-slate-700">{selectedPartner.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDossierOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Legal & Banking Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Managing Director</span>
                <span className="text-slate-900 font-bold">{selectedPartner.directorName}</span>
                <span className="text-slate-600 block text-[11px] mt-0.5">{selectedPartner.email}</span>
                <span className="text-slate-600 block text-[11px]">{selectedPartner.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Statutory Registration</span>
                <span className="text-slate-800 block font-mono font-medium">CIN: {selectedPartner.companyRegistrationNumber}</span>
                <span className="text-slate-800 block font-mono font-medium">GSTIN: {selectedPartner.gstin}</span>
                <span className="text-emerald-700 text-[11px] font-semibold mt-1 block">
                  ✓ Verified by Ministry of Corporate Affairs
                </span>
              </div>
              <div className="col-span-2 pt-3 border-t border-slate-200">
                <span className="text-slate-500 block text-[11px] font-medium">Banking & Escrow Settlement Account</span>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-slate-700">
                    <span className="font-bold text-slate-900">{selectedPartner.bankName}</span>
                    <span className="block text-[11px] font-mono text-slate-500">
                      A/C: {selectedPartner.bankAccountNumber} · IFSC: {selectedPartner.ifscCode}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    NPCI Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Quota Modifiers */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Quotas & Revenue Share Overrides</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Pincodes Quota</label>
                  <input
                    type="number"
                    value={selectedPartner.maxPincodeQuota}
                    onChange={(e) =>
                      setSelectedPartner({
                        ...selectedPartner,
                        maxPincodeQuota: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Technician Fleet Quota</label>
                  <input
                    type="number"
                    value={selectedPartner.activeTechnicianQuota}
                    onChange={(e) =>
                      setSelectedPartner({
                        ...selectedPartner,
                        activeTechnicianQuota: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Platform Revenue Share (%)</label>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Franchise Commission Share (%)</label>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsDossierOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition border border-slate-200"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Onboard Franchise Partner</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register regional operations entity, select dynamic state territory, and assign exclusive pincodes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOnboardModalOpen(false);
                  setSelectedPincodes([]);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Entity Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Odisha Eastern Operations Hub Pvt Ltd"
                    value={newPartner.entityName}
                    onChange={(e) => setNewPartner({ ...newPartner, entityName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Director Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ramesh Krishnan"
                    value={newPartner.directorName}
                    onChange={(e) => setNewPartner({ ...newPartner, directorName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Director Phone *</label>
                  <input
                    required
                    type="tel"
                    placeholder="+919840012345"
                    value={newPartner.phone}
                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    placeholder="ops@partner.in"
                    value={newPartner.email}
                    onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN (15 Digits) *</label>
                  <input
                    required
                    type="text"
                    placeholder="27AABCU9603R1ZM"
                    value={newPartner.gstin}
                    onChange={(e) => setNewPartner({ ...newPartner, gstin: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Primary State Jurisdiction *</label>
                  <select
                    value={newPartner.stateLicensed}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    {allStates.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Settlement Bank Name</label>
                  <input
                    type="text"
                    placeholder="HDFC Bank"
                    value={newPartner.bankName}
                    onChange={(e) => setNewPartner({ ...newPartner, bankName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Exclusive Pincode Territory Allocation */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <span>Exclusive Service Pincodes</span>
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {newPartner.stateLicensed}
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Assigned pincodes become exclusive to this partner. Pincodes already claimed by other partners are hidden automatically.
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {pincodesLoading ? 'Loading...' : `${availablePincodes.length} Available in State`}
                    </span>
                    {assignedInStateCount > 0 && (
                      <div className="text-[10px] text-slate-400 mt-1">
                        ({assignedInStateCount} already allocated • hidden)
                      </div>
                    )}
                  </div>
                </div>

                {/* Filters & Selection Controls */}
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between bg-slate-100 p-2.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none font-semibold shrink-0 cursor-pointer"
                    >
                      <option value="ALL">All Districts ({districtsList.length})</option>
                      {districtsList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Filter 6-digit PIN or district..."
                      value={pincodeSearch}
                      onChange={(e) => setPincodeSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 placeholder:text-slate-400"
                    />
                  </div>

                  {(() => {
                    const filtered = availablePincodes.filter((p) => {
                      if (selectedDistrict !== 'ALL' && p.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
                        return false;
                      }
                      if (pincodeSearch.trim()) {
                        const q = pincodeSearch.trim().toLowerCase();
                        return p.pincode.includes(q) || p.district.toLowerCase().includes(q);
                      }
                      return true;
                    });

                    return (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => selectAllFiltered(filtered.map((p) => p.pincode))}
                          disabled={pincodesLoading || filtered.length === 0}
                          className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                        >
                          + Select All Visible ({filtered.length})
                        </button>
                        {selectedPincodes.length > 0 && (
                          <button
                            type="button"
                            onClick={clearSelectedPincodes}
                            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-white hover:bg-rose-50 border border-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            Clear ({selectedPincodes.length})
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Selected Pincodes Badges */}
                {selectedPincodes.length > 0 && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span>✓ {selectedPincodes.length} Pincode(s) Selected for Allocation:</span>
                      <span className="text-[10px] text-emerald-600 font-normal">Click any tag to deselect</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {selectedPincodes.map((pin) => (
                        <button
                          key={pin}
                          type="button"
                          onClick={() => togglePincode(pin)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-emerald-900 text-xs font-bold font-mono rounded-lg border border-emerald-300 shadow-2xs hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition cursor-pointer"
                          title="Click to remove from partner"
                        >
                          <span>{pin}</span>
                          <span className="text-slate-400 hover:text-rose-600">✕</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scrollable Available Pincodes Grid */}
                {(() => {
                  const filtered = availablePincodes.filter((p) => {
                    if (selectedDistrict !== 'ALL' && p.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
                      return false;
                    }
                    if (pincodeSearch.trim()) {
                      const q = pincodeSearch.trim().toLowerCase();
                      return p.pincode.includes(q) || p.district.toLowerCase().includes(q);
                    }
                    return true;
                  });

                  return (
                    <div className="border border-slate-200 rounded-2xl bg-slate-50 p-3 max-h-52 overflow-y-auto">
                      {pincodesLoading ? (
                        <div className="py-10 text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Fetching official postal directory for {newPartner.stateLicensed}...</span>
                        </div>
                      ) : filtered.length === 0 ? (
                        <div className="py-10 text-center text-xs text-slate-500 space-y-1">
                          <div className="font-bold text-slate-700">No Unassigned Pincodes Found</div>
                          <div>
                            {availablePincodes.length === 0
                              ? `All pincodes in ${newPartner.stateLicensed} are already claimed by existing partners.`
                              : 'No unassigned pincodes match your current district or search filter.'}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {filtered.map((item) => {
                            const isSelected = selectedPincodes.includes(item.pincode);
                            return (
                              <button
                                key={item.pincode}
                                type="button"
                                onClick={() => togglePincode(item.pincode)}
                                className={`flex items-center justify-between p-2 rounded-xl text-left text-xs transition border cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-black'
                                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                                }`}
                              >
                                <div>
                                  <div className="font-mono font-bold leading-tight tracking-wide">{item.pincode}</div>
                                  <div
                                    className={`text-[10px] truncate max-w-[110px] ${
                                      isSelected ? 'text-emerald-100 font-normal' : 'text-slate-400 font-medium'
                                    }`}
                                  >
                                    {item.district}
                                  </div>
                                </div>
                                <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                  {isSelected ? '✓' : '+'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsOnboardModalOpen(false);
                    setSelectedPincodes([]);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-500 transition shadow-lg shadow-blue-600/30 cursor-pointer flex items-center gap-2"
                >
                  <span>Confirm & Onboard</span>
                  {selectedPincodes.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-700 text-[11px] font-mono">
                      {selectedPincodes.length} Pincodes
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
