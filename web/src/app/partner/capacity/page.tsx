'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-logo';

interface PincodeData {
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
  assignedTechsCount: number;
  onlineTechsCount: number;
  activeJobsCount: number;
  maxCapacity: number;
  utilizationPct: number;
  capacityStatus: 'NORMAL' | 'LIMITED' | 'SURGE_GAP';
  slaReadinessScore: number;
}

interface CapacitySummary {
  totalPincodes: number;
  totalAssignedTechs: number;
  totalOnlineTechs: number;
  totalActiveJobs: number;
  coverageGapsCount: number;
  avgEtaMinutes: number;
}

export default function PartnerCapacityPage() {
  const [pincodes, setPincodes] = useState<PincodeData[]>([]);
  const [summary, setSummary] = useState<CapacitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected pincode for deep dive (PTNR-SCR-10) — default Colaba 400001
  const [selectedPin, setSelectedPin] = useState<PincodeData | null>(null);

  // Editable parameters for selected pincode
  const [editRadius, setEditRadius] = useState<number>(5.5);
  const [editEta, setEditEta] = useState<number>(15);
  const [editCapacity, setEditCapacity] = useState<number>(8);
  const [editExclusive, setEditExclusive] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchCapacityData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partner/capacity?partnerId=ptnr_mah_01');
      const data = await res.json();
      if (data.success) {
        setPincodes(data.pincodes || []);
        setSummary(data.summary || null);

        // Select Colaba 400001 by default if none selected
        if (!selectedPin && data.pincodes && data.pincodes.length > 0) {
          const colaba = data.pincodes.find((p: PincodeData) => p.pincode === '400001') || data.pincodes[0];
          setSelectedPin(colaba);
          setEditRadius(colaba.perimeterRadiusKm || 5.5);
          setEditEta(colaba.targetEtaMinutes || 15);
          setEditCapacity(colaba.activeCapacityCount || 8);
          setEditExclusive(colaba.isExclusive ?? true);
        }
      }
    } catch (err) {
      console.error('Failed to load capacity heatmap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapacityData();
  }, []);

  const handleSelectPincode = (pin: PincodeData) => {
    setSelectedPin(pin);
    setEditRadius(pin.perimeterRadiusKm || 5.5);
    setEditEta(pin.targetEtaMinutes || 15);
    setEditCapacity(pin.activeCapacityCount || 8);
    setEditExclusive(pin.isExclusive ?? true);
  };

  const handleSaveCapacitySettings = async () => {
    if (!selectedPin) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/partner/capacity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pincode: selectedPin.pincode,
          perimeterRadiusKm: editRadius,
          targetEtaMinutes: editEta,
          activeCapacityCount: editCapacity,
          isExclusive: editExclusive,
          actorId: 'usr_partner_01',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `Pincode ${selectedPin.pincode} updated: Radius=${editRadius}km, ETA=${editEta}m, Cap=${editCapacity} (WORM Block #${data.auditLog?.sequenceNumber})`
        );
        // Update local selected pin
        setSelectedPin((prev) =>
          prev
            ? {
                ...prev,
                perimeterRadiusKm: editRadius,
                targetEtaMinutes: editEta,
                activeCapacityCount: editCapacity,
                isExclusive: editExclusive,
              }
            : null
        );
        // Refresh directory
        fetchCapacityData();
      }
    } catch (err) {
      console.error('Failed to update pincode capacity:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered list
  const filteredPincodes = pincodes.filter((pin) => {
    if (cityFilter === 'Mumbai' && !pin.district.toLowerCase().includes('mumbai') && !pin.areaName.toLowerCase().includes('mumbai')) return false;
    if (cityFilter === 'Pune' && !pin.district.toLowerCase().includes('pune') && !pin.areaName.toLowerCase().includes('pune')) return false;

    if (statusFilter === 'Active' && pin.capacityStatus !== 'NORMAL') return false;
    if (statusFilter === 'Limited' && pin.capacityStatus !== 'LIMITED') return false;
    if (statusFilter === 'Gap' && pin.capacityStatus !== 'SURGE_GAP') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return pin.pincode.includes(q) || pin.areaName.toLowerCase().includes(q) || pin.district.toLowerCase().includes(q);
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

      {/* Breadcrumb & Operational Command Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>Maharashtra Ops</span>
            <span>/</span>
            <span>Territory Governance</span>
            <span>/</span>
            <span className="text-[#1B5E20]">Capacity Heatmap (PTNR-SCR-09 &amp; 10)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Pincode Coverage Density &amp; Fleet Capacity Heatmap
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1B5E20] border border-emerald-200 font-bold">
              Hub MH-01
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time zone density monitoring, active dispatch capacities, 30-minute SLA radius tuning, and hyperlocal cluster command for Colaba 400001.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchCapacityData}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>🔄</span>
            <span>Refresh Heatmap</span>
          </button>
          <button
            onClick={() => showToast('Zone audit compiled and exported to CSV')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <Link
            href="/partner/fleet"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <span>👷</span>
            <span>Technician Fleet Roster →</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Assigned Perimeter */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Assigned Perimeter</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B5E20] flex items-center justify-center text-sm font-bold">
              📍
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{summary?.totalPincodes ?? pincodes.length} Pincodes</div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              6 Mumbai Metro &bull; 1 Pune Division
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        {/* Card 2: Field Personnel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Field Personnel Active</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
              👷
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">
              {summary?.totalOnlineTechs ?? 2} / {summary?.totalAssignedTechs ?? 4} Online
            </div>
            <p className="text-xs text-emerald-700 flex items-center gap-1.5 font-bold mt-1">
              <BrandMark size="xs" variant="default" badge={false} className="shrink-0" />
              <span>75% on-duty operational readiness</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Card 3: Active Work Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Active Work Orders</span>
            <BrandMark size="xs" badgeBg="bg-blue-50 border border-blue-200 shadow-2xs" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{summary?.totalActiveJobs ?? 4} Active Jobs</div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              2 In-Transit &bull; 2 In-Progress
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Card 4: Operational Risk & SLA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-500">
            <span>Average 30-min SLA ETA</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
              ⏱️
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{summary?.avgEtaMinutes ?? 18} Mins</div>
            <p className="text-xs text-emerald-700 flex items-center gap-1 font-bold mt-1">
              <span>✓</span>
              <span>All zones within 30-min statutory window</span>
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '92%' }}></div>
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pincode (e.g. 400001), area, or district..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* City Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <span className="text-slate-400 font-normal">City:</span>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Cities ({pincodes.length})</option>
              <option value="Mumbai">Mumbai Metro</option>
              <option value="Pune">Pune Division</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <span className="text-slate-400 font-normal">Capacity:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Capacities</option>
              <option value="Active">Normal Capacity</option>
              <option value="Limited">Limited Capacity</option>
              <option value="Gap">Surge Gap</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-bold px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[#1B5E20]">
            Active Cluster: {selectedPin?.pincode || '400001'}
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: 60% Pincode Directory (PTNR-SCR-09) + 40% Hyperlocal Cluster Deep Dive (PTNR-SCR-10) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Pincode Coverage Directory & Utilization Heatmap (7/12) */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Coverage Directory &amp; Utilization (PTNR-SCR-09)
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                {filteredPincodes.length} Zones
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Click row to inspect cluster</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Pincode &amp; Ward</th>
                  <th className="py-3 px-4">Density</th>
                  <th className="py-3 px-4">Capacity Load</th>
                  <th className="py-3 px-4 text-center">Target ETA</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPincodes.map((pin) => {
                  const isSelected = selectedPin?.pincode === pin.pincode;
                  return (
                    <tr
                      key={pin.id}
                      onClick={() => handleSelectPincode(pin)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-50/70 border-l-4 border-[#1B5E20]'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Pincode & Ward */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                            {pin.pincode}
                          </span>
                          <span>{pin.areaName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {pin.district} &bull; {pin.isExclusive ? 'Exclusive Franchise' : 'Shared Grid'}
                        </div>
                      </td>

                      {/* Density */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                          {pin.density.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Capacity Load Bar */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 w-32">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-700">{pin.onlineTechsCount} Online</span>
                            <span className="text-slate-400">Max {pin.activeCapacityCount}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pin.onlineTechsCount === 0
                                  ? 'bg-slate-300'
                                  : pin.utilizationPct > 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-600'
                              }`}
                              style={{ width: `${pin.utilizationPct || 20}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Target ETA */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B5E20] font-bold text-[11px]">
                          ⏱️ {pin.targetEtaMinutes}m
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPincode(pin);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            isSelected
                              ? 'bg-[#1B5E20] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Hyperlocal Cluster Command Detail (PTNR-SCR-10) (5/12) */}
        {selectedPin && (
          <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-6">
            {/* Cluster Header */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Hyperlocal Cluster Command (PTNR-SCR-10)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1B5E20] font-bold">
                  Active Coverage &bull; Normal Load
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Pincode {selectedPin.pincode} — {selectedPin.areaName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Primary rapid-deployment territory under Maharashtra Tier-1 Operations Hub
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg SLA Response</span>
                <span className="text-base font-black text-slate-900">{selectedPin.targetEtaMinutes} mins</span>
                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">✓ 30-min guaranteed</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Stationed Techs</span>
                <span className="text-base font-black text-slate-900">{selectedPin.onlineTechsCount} Online</span>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  {selectedPin.assignedTechsCount} registered in zone
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Perimeter Radius</span>
                <span className="text-base font-black text-slate-900">{selectedPin.perimeterRadiusKm ?? 5.5} km</span>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Boundary buffer</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Shift Slots</span>
                <span className="text-base font-black text-slate-900">{selectedPin.activeCapacityCount} Techs</span>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Simultaneous quota</span>
              </div>
            </div>

            {/* Stationed Personnel List in this Cluster */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Assigned Personnel in {selectedPin.pincode}</span>
                <span className="text-[10px] text-slate-400">Live Stationing</span>
              </div>

              <div className="space-y-2">
                {selectedPin.pincode === '400001' ? (
                  <>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                          RK
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Rajesh Kumar (TECH-7821)</div>
                          <div className="text-[10px] text-slate-500">4.9 ★ &bull; High-Voltage Verified</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B5E20] font-bold text-[10px]">
                        Online Shift 🟢
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                          PJ
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Pradeep Jadhav (TECH-9104)</div>
                          <div className="text-[10px] text-slate-500">4.88 ★ &bull; Standby Reserve</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B5E20] font-bold text-[10px]">
                        Online Shift 🟢
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-400 text-white font-bold flex items-center justify-center text-[10px]">
                          AS
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Anil Shinde (TECH-6619)</div>
                          <div className="text-[10px] text-slate-500">4.2 ★ &bull; Offline</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px]">
                        Off-duty ⚪
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    Technicians are assigned dynamically to this territory based on proximity routing.
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Perimeter & Capacity Configuration Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Configure Territory Perimeter &amp; Buffers</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                  WORM Audited
                </span>
              </div>

              {/* Slider 1: Perimeter Radius */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Boundary Radius:</span>
                  <span className="font-black text-[#1B5E20] font-mono">{editRadius.toFixed(1)} km</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="0.5"
                  value={editRadius}
                  onChange={(e) => setEditRadius(parseFloat(e.target.value))}
                  className="w-full accent-[#1B5E20] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>2 km (Ultra Hyperlocal)</span>
                  <span>15 km (Regional Wide)</span>
                </div>
              </div>

              {/* Slider 2: Target SLA Dispatch ETA */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Target SLA Dispatch ETA:</span>
                  <span className="font-black text-[#1B5E20] font-mono">{editEta} mins</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  step="1"
                  value={editEta}
                  onChange={(e) => setEditEta(parseInt(e.target.value))}
                  className="w-full accent-[#1B5E20] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>10 mins (Emergency)</span>
                  <span>45 mins (Extended)</span>
                </div>
              </div>

              {/* Slider 3: Active Capacity Quota */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Active Capacity Quota:</span>
                  <span className="font-black text-[#1B5E20] font-mono">{editCapacity} Slots</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="25"
                  step="1"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(parseInt(e.target.value))}
                  className="w-full accent-[#1B5E20] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>4 Units</span>
                  <span>25 Units</span>
                </div>
              </div>

              {/* Exclusivity Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Franchise Territory Exclusivity</div>
                  <div className="text-[10px] text-slate-500">Lock out secondary multi-tenant dispatches</div>
                </div>
                <input
                  type="checkbox"
                  checked={editExclusive}
                  onChange={(e) => setEditExclusive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1B5E20] focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Save Settings Button */}
              <button
                type="button"
                disabled={savingSettings}
                onClick={handleSaveCapacitySettings}
                className="w-full py-2.5 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>
                  {savingSettings
                    ? 'Writing to Immutable WORM Log...'
                    : `Save Capacity & Radius for ${selectedPin.pincode}`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
