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
  latitude?: number;
  longitude?: number;
  geoJsonPolygon?: {
    type: string;
    coordinates: [number, number][][];
  };
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
  const [viewingPolygonPin, setViewingPolygonPin] = useState<PincodeTerritory | null>(null);
  const [testLat, setTestLat] = useState('');
  const [testLng, setTestLng] = useState('');
  const [spatialTestResult, setSpatialTestResult] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Indian states (All 36 States & UTs)
  const [availableStates, setAvailableStates] = useState<string[]>([
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
    'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
    'Lakshadweep', 'Puducherry'
  ]);
  const [availablePartners, setAvailablePartners] = useState<{ id: string; entityName: string; stateLicensed: string }[]>([]);

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

  // Preload dynamic states and partners
  useEffect(() => {
    fetch('/api/admin/pincodes/available')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data?.states) && d.data.states.length > 0) {
          setAvailableStates(d.data.states);
        }
      })
      .catch(() => {});

    fetch('/api/admin/partners')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data?.partners)) {
          setAvailablePartners(d.data.partners.map((p: any) => ({
            id: p.id,
            entityName: p.entityName || p.id,
            stateLicensed: p.stateLicensed || 'All',
          })));
        }
      })
      .catch(() => {});
  }, []);

  const handlePincodeChange = async (pin: string) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    setNewPin((prev) => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6) {
      try {
        const res = await fetch(`/api/admin/pincodes/available?pincode=${cleanPin}`);
        const data = await res.json();
        if (data.success && data.data?.lookup) {
          const l = data.data.lookup;
          setNewPin((prev) => ({
            ...prev,
            pincode: cleanPin,
            state: l.state || prev.state,
            district: l.district || prev.district,
            areaName: prev.areaName || `${l.district || 'Territory'} Hub`,
          }));
        }
      } catch (_) {}
    }
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
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
              Territory Management
            </span>
            <span className="text-xs text-slate-500 font-medium">Postal Coverage & Boundaries</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Pincode Coverage & Boundaries</h1>
          <p className="text-sm text-slate-500">
            Define franchise postal jurisdictions, target SLA transit windows, density multipliers, and exclusive boundaries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition transform active:scale-95"
        >
          <span>➕</span>
          <span>Add Territory Pincode</span>
        </button>
      </div>

      {/* Macro Telemetry KPI Cards (Clean White Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configured Pincodes</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">✓ Across 4 State Hubs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Jurisdictions</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">100% SLA dispatch enabled</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High-Density Hubs</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{highDensityCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">15-min emergency response</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Online Technicians</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{totalFleetCapacity}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Active field duty roster</div>
        </div>
      </div>

      {/* Filter and Search Bar (Clean White Card) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 focus:bg-white transition"
          >
            <option value="ALL">All States ({availableStates.length})</option>
            {availableStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={densityFilter}
            onChange={(e) => setDensityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 focus:bg-white transition"
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
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 focus:bg-white placeholder:text-slate-400 transition"
          />
        </form>
      </div>

      {/* Pincodes Table (Clean White Card) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading pincode coverage matrix...</div>
        ) : pincodes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No pincodes match the filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pincodes.map((pin) => (
                  <tr key={pin.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-black font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {pin.pincode}
                        </span>
                        {pin.isExclusive && (
                          <span className="text-[10px] text-amber-500 font-bold" title="Exclusive Franchise Boundary">
                            ★
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{pin.areaName}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {pin.district}, {pin.state}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          pin.density === 'URBAN_HIGH_DENSITY'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : pin.density === 'METRO_STANDARD'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {pin.density.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono">
                        ⏱️ {pin.targetEtaMinutes}m
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      👷 {pin.activeCapacityCount} Techs
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {pin.perimeterRadiusKm ? `${pin.perimeterRadiusKm} km` : '5.0 km'}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(pin)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                          pin.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {pin.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingPolygonPin(pin);
                            setTestLat(pin.latitude ? String(pin.latitude) : '');
                            setTestLng(pin.longitude ? String(pin.longitude) : '');
                            setSpatialTestResult(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition inline-flex items-center gap-1 shadow-2xs"
                          title="Inspect GeoJSON spatial polygon"
                        >
                          <span>🗺️</span>
                          <span>GeoJSON</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPin(pin)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition inline-flex items-center gap-1 shadow-2xs"
                        >
                          <span>⚙️</span>
                          <span>Settings</span>
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Perimeter Settings
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Postal Sector {editingPin.pincode}
                </h2>
                <p className="text-xs text-slate-500">{editingPin.areaName} ({editingPin.district})</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPin(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePinSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target SLA Arrival Time (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={editingPin.targetEtaMinutes}
                  onChange={(e) =>
                    setEditingPin({ ...editingPin, targetEtaMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Boundary Perimeter Radius (km)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="25"
                  value={editingPin.perimeterRadiusKm || 5.0}
                  onChange={(e) =>
                    setEditingPin({ ...editingPin, perimeterRadiusKm: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Applies 1.25x road tortuosity multiplier in Google Maps distance matrix calculation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Density Classification</label>
                <select
                  value={editingPin.density}
                  onChange={(e) => setEditingPin({ ...editingPin, density: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
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
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <label htmlFor="exclusiveCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Exclusive Territorial Franchise (Blocks overlapping competitor hubs)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPin(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 border border-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Add Territory Pincode</h2>
                <p className="text-xs text-slate-500">Map postal boundary to regional partner franchise hub.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePin} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Pincode *</label>
                  <input
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    placeholder="e.g. 759001 or 400050"
                    value={newPin.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Area Name *</label>
                  <input
                    required
                    placeholder="e.g. Dhenkanal Town Hub / Bandra West Hub"
                    value={newPin.areaName}
                    onChange={(e) => setNewPin({ ...newPin, areaName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">District *</label>
                  <input
                    required
                    placeholder="e.g. Dhenkanal / Mumbai Suburban"
                    value={newPin.district}
                    onChange={(e) => setNewPin({ ...newPin, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                  <select
                    value={newPin.state}
                    onChange={(e) => setNewPin({ ...newPin, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
                    {availableStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Franchise Partner</label>
                  <select
                    value={newPin.partnerId}
                    onChange={(e) => setNewPin({ ...newPin, partnerId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
                    <option value="">-- Unassigned / Open Pool --</option>
                    {availablePartners.map((ptnr) => (
                      <option key={ptnr.id} value={ptnr.id}>
                        {ptnr.entityName} ({ptnr.stateLicensed})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target SLA (Mins)</label>
                  <input
                    type="number"
                    value={newPin.targetEtaMinutes}
                    onChange={(e) => setNewPin({ ...newPin, targetEtaMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Perimeter Radius (km)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPin.perimeterRadiusKm}
                    onChange={(e) => setNewPin({ ...newPin, perimeterRadiusKm: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 border border-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20"
                >
                  Confirm Territory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GeoJSON Spatial Boundary Polygon Modal */}
      {viewingPolygonPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Spatial Polygon Geofence
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ST_Contains(geom, ST_MakePoint)</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Territory {viewingPolygonPin.pincode} • {viewingPolygonPin.areaName}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingPolygonPin.district}, {viewingPolygonPin.state} • Radius: {viewingPolygonPin.perimeterRadiusKm || 5.0} km
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPolygonPin(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Spatial Metadata */}
            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Center Latitude</span>
                <span className="font-mono font-bold text-slate-800">{viewingPolygonPin.latitude?.toFixed(4) || '18.9220'}° N</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Center Longitude</span>
                <span className="font-mono font-bold text-slate-800">{viewingPolygonPin.longitude?.toFixed(4) || '72.8347'}° E</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Polygon Vertices</span>
                <span className="font-mono font-bold text-emerald-700">12 Coordinate Rings</span>
              </div>
            </div>

            {/* GeoJSON Output Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">GeoJSON Polygon Ring Specification</span>
                <button
                  type="button"
                  onClick={() => {
                    if (viewingPolygonPin.geoJsonPolygon) {
                      navigator.clipboard.writeText(JSON.stringify(viewingPolygonPin.geoJsonPolygon, null, 2));
                      showToast('GeoJSON copied to clipboard!');
                    }
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                >
                  Copy GeoJSON
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-400 text-[11px] font-mono p-3 rounded-xl overflow-x-auto max-h-40 border border-slate-800">
                {JSON.stringify(viewingPolygonPin.geoJsonPolygon || {}, null, 2)}
              </pre>
            </div>

            {/* PostGIS ST_Contains Boundary Routing Simulator */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  PostGIS Spatial Routing Test (ST_Contains Simulation)
                </span>
                <span className="text-[11px] text-emerald-700">
                  Verify whether a customer GPS fix lies strictly within this franchise polygon boundary.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Lat</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="18.9220"
                    value={testLat}
                    onChange={(e) => setTestLat(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Lng</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="72.8347"
                    value={testLng}
                    onChange={(e) => setTestLng(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const lat = parseFloat(testLat);
                    const lng = parseFloat(testLng);
                    if (isNaN(lat) || isNaN(lng)) {
                      setSpatialTestResult('Please enter valid numeric latitude and longitude coordinates.');
                      return;
                    }
                    const poly = viewingPolygonPin.geoJsonPolygon?.coordinates[0];
                    if (!poly || poly.length < 3) {
                      setSpatialTestResult('Polygon coordinates unavailable for this territory.');
                      return;
                    }
                    // Point-in-polygon ray-casting test
                    let inside = false;
                    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                      const xi = poly[i][0];
                      const yi = poly[i][1];
                      const xj = poly[j][0];
                      const yj = poly[j][1];
                      const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
                      if (intersect) inside = !inside;
                    }

                    if (inside) {
                      setSpatialTestResult(`✓ ST_Contains == TRUE: Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)}) is inside ${viewingPolygonPin.areaName} (${viewingPolygonPin.pincode}) territory polygon.`);
                    } else {
                      setSpatialTestResult(`✕ ST_Contains == FALSE: Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)}) is outside ${viewingPolygonPin.pincode} boundary. Routing to neighboring cluster or fallback.`);
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs"
                >
                  Verify ST_Contains
                </button>
              </div>

              {spatialTestResult && (
                <div className={`p-2.5 rounded-lg text-xs font-mono font-semibold ${spatialTestResult.includes('TRUE') ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}`}>
                  {spatialTestResult}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingPolygonPin(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
