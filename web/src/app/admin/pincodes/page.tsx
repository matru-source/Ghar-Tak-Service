'use client';

import React, { useState, useEffect } from 'react';

interface PincodeTerritory {
  id: string;
  pincode: string;
  areaName: string;
  district: string;
  state: string;
  partnerId: string;
  isActive: boolean;
  isExclusive: boolean;
  density: string;
  targetEtaMinutes: number;
  activeCapacityCount: number;
  perimeterRadiusKm?: number;
  partner?: {
    id: string;
    entityName: string;
  } | null;
}

export default function AdminPincodesPage() {
  const [pincodes, setPincodes] = useState<PincodeTerritory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [densityFilter, setDensityFilter] = useState('ALL');
  const [selectedPincode, setSelectedPincode] = useState<PincodeTerritory[] | null>(null);
  const [editingPin, setEditingPin] = useState<PincodeTerritory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New pincode form
  const [newPin, setNewPin] = useState({
    pincode: '',
    areaName: '',
    district: '',
    state: 'Maharashtra',
    partnerId: 'ptnr_mah_01',
    density: 'URBAN_HIGH_DENSITY',
    targetEtaMinutes: 20,
    isExclusive: true,
    perimeterRadiusKm: 6.0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPincodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (stateFilter !== 'ALL') params.append('state', stateFilter);

      const res = await fetch(`/api/admin/pincodes?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        let list: PincodeTerritory[] = json.data.pincodes;
        if (densityFilter !== 'ALL') {
          list = list.filter((p) => p.density === densityFilter);
        }
        setPincodes(list);
      }
    } catch {
      showToast('Error loading pincode territories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPincodes();
  }, [stateFilter, densityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPincodes();
  };

  const handleToggleActive = async (pin: PincodeTerritory) => {
    try {
      const res = await fetch('/api/admin/pincodes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pin.id, isActive: !pin.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Territory ${pin.pincode} status changed to ${!pin.isActive ? 'ACTIVE' : 'INACTIVE'}`);
        fetchPincodes();
      }
    } catch {
      showToast('Network error updating status');
    }
  };

  const handleSavePinSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPin) return;

    try {
      const res = await fetch('/api/admin/pincodes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPin.id,
          targetEtaMinutes: editingPin.targetEtaMinutes,
          density: editingPin.density,
          isExclusive: editingPin.isExclusive,
          perimeterRadiusKm: editingPin.perimeterRadiusKm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Settings saved for postal cluster ${editingPin.pincode}`);
        setEditingPin(null);
        fetchPincodes();
      } else {
        showToast(json.error || 'Failed to update');
      }
    } catch {
      showToast('Network error while saving settings');
    }
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/pincodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPin),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Postal territory ${newPin.pincode} added to active dispatch matrix`);
        setIsAddModalOpen(false);
        fetchPincodes();
      } else {
        showToast(json.error || 'Failed to create pincode territory');
      }
    } catch {
      showToast('Network error while creating territory');
    }
  };

  // Macro KPIs
  const totalCount = pincodes.length;
  const activeCount = pincodes.filter((p) => p.isActive).length;
  const highDensityCount = pincodes.filter((p) => p.density === 'URBAN_HIGH_DENSITY').length;
  const totalFleetCapacity = pincodes.reduce((sum, p) => sum + (p.activeCapacityCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 font-medium text-sm animate-bounce">
          <span>📍</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
              ADM-SCR-04 & ADM-SCR-05
            </span>
            <span className="text-xs text-slate-400 font-medium">Territorial Perimeter Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Pincode Coverage & Boundaries</h1>
          <p className="text-sm text-slate-400">
            Define franchise postal jurisdictions, target SLA transit windows, density multipliers, and exclusive boundaries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
        >
          <span>➕</span>
          <span>Add Territory Pincode</span>
        </button>
      </div>

      {/* Macro Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configured Pincodes</div>
          <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">✓ Across 4 State Hubs</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Jurisdictions</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">100% SLA dispatch enabled</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High-Density Hubs</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{highDensityCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">15-min emergency response</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Online Technicians</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{totalFleetCapacity}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Active field duty roster</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
          >
            <option value="ALL">All States</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Gujarat">Gujarat</option>
          </select>

          <select
            value={densityFilter}
            onChange={(e) => setDensityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Densities</option>
            <option value="URBAN_HIGH_DENSITY">Urban High Density</option>
            <option value="METRO_STANDARD">Metro Standard</option>
            <option value="SUBURBAN">Suburban</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full md:w-72 flex items-center">
          <input
            type="text"
            placeholder="Search by 6-digit pincode, area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 placeholder:text-slate-600"
          />
        </form>
      </div>

      {/* Pincodes Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading pincode coverage matrix...</div>
        ) : pincodes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No pincodes match the filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">PINCODE</th>
                  <th className="py-3.5 px-4">POSTAL AREA & CLUSTER</th>
                  <th className="py-3.5 px-4">DISTRICT / STATE</th>
                  <th className="py-3.5 px-4">DENSITY CLASSIFICATION</th>
                  <th className="py-3.5 px-4">TARGET SLA</th>
                  <th className="py-3.5 px-4">CAPACITY</th>
                  <th className="py-3.5 px-4">RADIUS</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {pincodes.map((pin) => (
                  <tr key={pin.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-black text-white font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {pin.pincode}
                        </span>
                        {pin.isExclusive && (
                          <span className="text-[10px] text-amber-400 font-bold" title="Exclusive Franchise Boundary">
                            ★
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">{pin.areaName}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {pin.district}, {pin.state}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          pin.density === 'URBAN_HIGH_DENSITY'
                            ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
                            : pin.density === 'METRO_STANDARD'
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {pin.density.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-bold font-mono">
                        ⏱️ {pin.targetEtaMinutes}m
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      👷 {pin.activeCapacityCount} Techs
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {pin.perimeterRadiusKm ? `${pin.perimeterRadiusKm} km` : '5.0 km'}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(pin)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                          pin.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {pin.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingPin(pin)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition inline-flex items-center gap-1"
                      >
                        <span>⚙️</span>
                        <span>Settings</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADM-SCR-05: Pincode Boundary & Perimeter Modal */}
      {editingPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ADM-SCR-05 · Perimeter Settings
                </span>
                <h2 className="text-xl font-black text-white mt-1">
                  Postal Sector {editingPin.pincode}
                </h2>
                <p className="text-xs text-slate-400">{editingPin.areaName} ({editingPin.district})</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPin(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePinSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target SLA Arrival Time (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={editingPin.targetEtaMinutes}
                  onChange={(e) =>
                    setEditingPin({ ...editingPin, targetEtaMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Boundary Perimeter Radius (km)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="25"
                  value={editingPin.perimeterRadiusKm || 5.0}
                  onChange={(e) =>
                    setEditingPin({ ...editingPin, perimeterRadiusKm: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Applies 1.25x road tortuosity multiplier in Google Maps distance matrix calculation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Density Classification</label>
                <select
                  value={editingPin.density}
                  onChange={(e) => setEditingPin({ ...editingPin, density: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                >
                  <option value="URBAN_HIGH_DENSITY">Urban High Density (Strict 15m SLA)</option>
                  <option value="METRO_STANDARD">Metro Standard (20m SLA)</option>
                  <option value="SUBURBAN">Suburban Cluster (25m SLA)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="exclusiveCheck"
                  checked={editingPin.isExclusive}
                  onChange={(e) => setEditingPin({ ...editingPin, isExclusive: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <label htmlFor="exclusiveCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Exclusive Territorial Franchise (Blocks overlapping competitor hubs)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPin(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/30"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Pincode Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Add Territory Pincode</h2>
                <p className="text-xs text-slate-400">Map postal boundary to regional partner franchise hub.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePin} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">6-Digit Pincode *</label>
                  <input
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    placeholder="e.g. 400050"
                    value={newPin.pincode}
                    onChange={(e) => setNewPin({ ...newPin, pincode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Postal Area Name *</label>
                  <input
                    required
                    placeholder="e.g. Bandra West Hub"
                    value={newPin.areaName}
                    onChange={(e) => setNewPin({ ...newPin, areaName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">District *</label>
                  <input
                    required
                    placeholder="e.g. Mumbai Suburban"
                    value={newPin.district}
                    onChange={(e) => setNewPin({ ...newPin, district: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">State *</label>
                  <select
                    value={newPin.state}
                    onChange={(e) => setNewPin({ ...newPin, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Gujarat">Gujarat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Target SLA (Mins)</label>
                  <input
                    type="number"
                    value={newPin.targetEtaMinutes}
                    onChange={(e) => setNewPin({ ...newPin, targetEtaMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Perimeter Radius (km)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPin.perimeterRadiusKm}
                    onChange={(e) => setNewPin({ ...newPin, perimeterRadiusKm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/30"
                >
                  Confirm Territory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
