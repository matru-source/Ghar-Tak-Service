'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Star,
  Check,
  X,
  FileText,
  Search,
  Filter,
  Zap,
} from '@/components/ui/icons';

interface TechRosterItem {
  id: string;
  name: string;
  badge: string;
  rating: number;
  jobsCompleted: number;
  pincode: string;
  isOnline: boolean;
  kycStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED';
  licenseNumber: string;
  glovesSerial: string;
  notes: string;
}

export default function PartnerAppFleetPage() {
  const router = useRouter();
  const [filterTab, setFilterTab] = useState<'all' | 'online' | 'pending' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<TechRosterItem | null>(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [fleetList, setFleetList] = useState<TechRosterItem[]>([
    {
      id: 'tech_rajesh_01',
      name: 'Rajesh Kumar',
      badge: 'TECH-7821',
      rating: 4.9,
      jobsCompleted: 142,
      pincode: '400001 (Colaba)',
      isOnline: true,
      kycStatus: 'VERIFIED',
      licenseNumber: 'EL-MH-2024-8849',
      glovesSerial: 'SK-1000V-992 (Calibrated)',
      notes: 'Physical safety kit verified. Wireman Grade-A license authentic.',
    },
    {
      id: 'tech_sunil_02',
      name: 'Sunil Verma',
      badge: 'TECH-8042',
      rating: 4.7,
      jobsCompleted: 38,
      pincode: '400005 (Cuffe Parade)',
      isOnline: false,
      kycStatus: 'PENDING_REVIEW',
      licenseNumber: 'EL-MH-2025-1192',
      glovesSerial: 'SK-1000V-104 (Awaiting Lab Stamp)',
      notes: 'Awaiting 1000V insulated gloves calibration certificate stamp inspection.',
    },
    {
      id: 'tech_anil_03',
      name: 'Anil Shinde',
      badge: 'TECH-6619',
      rating: 4.2,
      jobsCompleted: 64,
      pincode: '400001 (Colaba)',
      isOnline: false,
      kycStatus: 'REJECTED',
      licenseNumber: 'EL-MH-2020-0041 (Expired)',
      glovesSerial: 'SK-1000V-089',
      notes: 'Expired Wireman License (validity ended Dec 2024). Re-upload valid renewal.',
    },
    {
      id: 'tech_pradeep_04',
      name: 'Pradeep Jadhav',
      badge: 'TECH-9921',
      rating: 4.9,
      jobsCompleted: 154,
      pincode: '400001 (Colaba)',
      isOnline: true,
      kycStatus: 'VERIFIED',
      licenseNumber: 'EL-MH-2024-9102',
      glovesSerial: 'SK-1000V-512 (Calibrated)',
      notes: 'Grade-A Master Wireman. High-voltage 3-phase certified.',
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredFleet = fleetList.filter((tech) => {
    const matchesSearch =
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'online') return tech.isOnline;
    if (filterTab === 'pending') return tech.kycStatus === 'PENDING_REVIEW';
    if (filterTab === 'flagged') return tech.kycStatus === 'REJECTED';
    return true;
  });

  const handleKycAction = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedTech) return;
    setIsProcessing(true);

    try {
      await fetch(`/api/technicians/${selectedTech.id}/kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes:
            status === 'VERIFIED'
              ? 'Approved by Maharashtra regional operations partner.'
              : 'Safety documentation failed calibration standards.',
        }),
      }).catch(() => {});

      setFleetList((prev) =>
        prev.map((t) => (t.id === selectedTech.id ? { ...t, kycStatus: status } : t))
      );
      showToast(
        status === 'VERIFIED'
          ? `✓ ${selectedTech.name} KYC Approved & Activated!`
          : `⚠️ ${selectedTech.name} KYC Flagged as Rejected`
      );
      setIsKycModalOpen(false);
    } catch {
      setFleetList((prev) =>
        prev.map((t) => (t.id === selectedTech.id ? { ...t, kycStatus: status } : t))
      );
      setIsKycModalOpen(false);
    } finally {
      setIsProcessing(false);
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
              Fleet & Regulatory KYC
            </h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>PTNR-APP-03</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">Maharashtra Technician Pool</span>
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
          {fleetList.length} Techs
        </span>
      </header>

      {/* Main Container */}
      <div className="px-4 pt-3.5 space-y-3">
        {/* Search Input Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, badge, license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-emerald-500 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Tab Filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              filterTab === 'all'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'text-slate-600'
            }`}
          >
            All ({fleetList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('online')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              filterTab === 'online'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Online (2)
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              filterTab === 'pending'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'text-slate-600'
            }`}
          >
            KYC (1)
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('flagged')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              filterTab === 'flagged'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Flagged (1)
          </button>
        </div>

        {/* Technician Roster Cards */}
        <div className="space-y-2.5 pt-1">
          {filteredFleet.map((tech) => (
            <div
              key={tech.id}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 font-black text-xs text-slate-800 flex items-center justify-center border border-slate-200 shrink-0">
                    {tech.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900">{tech.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">#{tech.badge}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          tech.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`}
                      ></span>
                      <span>{tech.isOnline ? 'Online • Ready' : 'Offline'}</span>
                      <span>•</span>
                      <span>{tech.pincode}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase ${
                      tech.kycStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : tech.kycStatus === 'PENDING_REVIEW'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                  >
                    {tech.kycStatus === 'VERIFIED'
                      ? 'KYC Verified'
                      : tech.kycStatus === 'PENDING_REVIEW'
                      ? 'Review Req.'
                      : 'Rejected'}
                  </span>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[11px] font-bold text-slate-700">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{tech.rating}</span>
                    <span className="text-slate-400 font-normal">({tech.jobsCompleted})</span>
                  </div>
                </div>
              </div>

              {/* Regulatory License & Safety Gear row */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Wireman License:</span>
                  <span className="font-mono font-semibold text-slate-800">{tech.licenseNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">1000V Gloves Serial:</span>
                  <span className="font-mono font-semibold text-slate-800">{tech.glovesSerial}</span>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-0.5">{tech.notes}</p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTech(tech);
                  setIsKycModalOpen(true);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Inspect KYC Documents</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* KYC Document Review Modal */}
      {isKycModalOpen && selectedTech && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Regulatory KYC Review</h3>
                <span className="text-[11px] text-slate-500">
                  {selectedTech.name} • #{selectedTech.badge}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsKycModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Document Checklist Items */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Aadhar Card (Masked)</span>
                  <span className="text-[10px] text-slate-500">XXXX-XXXX-4912 • UIDAI Verified</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Verified
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Wireman License A-Grade</span>
                  <span className="text-[10px] text-slate-500">{selectedTech.licenseNumber}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Authentic
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">1000V Gloves Test Seal</span>
                  <span className="text-[10px] text-slate-500">{selectedTech.glovesSerial}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Inspected
                </span>
              </div>
            </div>

            {/* Approve / Reject Controls */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleKycAction('REJECTED')}
                className="py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Reject KYC</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleKycAction('VERIFIED')}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Approve KYC</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
