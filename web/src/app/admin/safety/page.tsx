'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Check,
  X,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Lock,
} from '@/components/ui/icons';

interface SafetyInspectionItem {
  id: string;
  jobTicketNumber: string;
  serviceTitle: string;
  customerName: string;
  customerAddressText: string;
  pincode: string;
  technicianId?: string;
  technicianName?: string;
  status: string;
  beforePhotoUrl: string;
  safetyGlovesConfirmed: boolean;
  safetyMcbSwitchConfirmed: boolean;
  isHighVoltage: boolean;
  category: string;
  safetyAuditStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  safetyAuditedAt?: string | null;
  safetyAuditorId?: string | null;
  safetyAuditNotes?: string | null;
  submittedAt: string;
}

interface InspectionTelemetry {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  highVoltageCount: number;
  complianceRatePct: number;
}

export default function AdminSafetyQueuePage() {
  const [items, setItems] = useState<SafetyInspectionItem[]>([]);
  const [telemetry, setTelemetry] = useState<InspectionTelemetry>({
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    highVoltageCount: 0,
    complianceRatePct: 100,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [voltageFilter, setVoltageFilter] = useState<'ALL' | 'HIGH_VOLTAGE' | 'STANDARD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected photo for modal zoom
  const [inspectingPhoto, setInspectingPhoto] = useState<SafetyInspectionItem | null>(null);

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<SafetyInspectionItem | null>(null);
  const [rejectReason, setRejectReason] = useState('MISSING_1000V_GLOVES');
  const [rejectNotes, setRejectNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchQueue = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (voltageFilter !== 'ALL') params.set('voltageLevel', voltageFilter);

      const res = await fetch(`/api/admin/safety/queue?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load safety queue');
      const data = await res.json();
      if (data.success && data.data) {
        setItems(data.data.items || []);
        if (data.data.telemetry) {
          setTelemetry(data.data.telemetry);
        }
      }
    } catch (err) {
      console.error('Error fetching safety queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [statusFilter, voltageFilter]);

  const handleReviewAction = async (
    jobId: string,
    decision: 'APPROVE' | 'REJECT',
    notes?: string,
    reasons?: string[]
  ) => {
    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/admin/safety/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          decision,
          reviewerNotes: notes || (decision === 'APPROVE' ? 'Approved by Admin Quality Lead' : 'Rejected by Quality Audit'),
          failureReasons: reasons || (decision === 'REJECT' ? [rejectReason] : undefined),
          auditorId: 'admin_qa_lead',
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(
          decision === 'APPROVE'
            ? '✓ Safety evidence approved. WORM audit record committed.'
            : '⚠️ Safety evidence rejected. Cryptographic alert logged.'
        );
        setRejectingItem(null);
        setRejectNotes('');
        await fetchQueue();
      } else {
        alert(json.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Network error while recording audit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.jobTicketNumber.toLowerCase().includes(q) ||
      item.serviceTitle.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      (item.technicianName && item.technicianName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Safety Inspection Queue</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
              URBAN COMPANY QUALITY AUDIT
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Real-time quality review desk for pre-work safety photographs, 1000V insulated gear & MCB lockout verification
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchQueue}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
            <span>Refresh Queue</span>
          </button>
          <Link
            href="/admin/audit"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>WORM Tamper Logs</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Audited */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Submissions</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{telemetry.totalCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Pre-work photo records</div>
        </div>

        {/* Card 2: Pending Audit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</div>
          <div className="mt-2 text-2xl font-black text-amber-600 flex items-baseline gap-2">
            {telemetry.pendingCount}
            <span className="text-xs font-semibold text-amber-600">Action Required</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Real-time gatekeeper queue</div>
        </div>

        {/* Card 3: High Voltage Priority */}
        <div className="bg-white border border-red-200 bg-red-50/30 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-red-600" />
            <span>High-Voltage Critical</span>
          </div>
          <div className="mt-2 text-2xl font-black text-red-600 flex items-baseline gap-2">
            {telemetry.highVoltageCount}
            <span className="text-xs font-bold text-red-700">415V / 3-Phase</span>
          </div>
          <div className="mt-1 text-[11px] text-red-600/80">Mandatory gloves + lockout</div>
        </div>

        {/* Card 4: Approved */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved Evidence</div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{telemetry.approvedCount}</div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">Cleared to execute</div>
        </div>

        {/* Card 5: Quality Compliance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quality Compliance</div>
          <div className="mt-2 text-2xl font-black text-blue-600">{telemetry.complianceRatePct}%</div>
          <div className="mt-1 text-[11px] text-slate-400">Zero tolerance for bypass</div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Status' : tab}
              </button>
            ))}
          </div>

          {/* Voltage Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              onClick={() => setVoltageFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                voltageFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Voltages
            </button>
            <button
              onClick={() => setVoltageFilter('HIGH_VOLTAGE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                voltageFilter === 'HIGH_VOLTAGE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-600 hover:text-red-700'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>High Voltage</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search job ticket, service, tech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Main Queue Cards / Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading safety inspection queue...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <span className="font-bold text-slate-800 text-sm">All Clear! No pending safety reviews.</span>
          <span>All pre-work photographs and gear checklists are fully audited.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isPending = item.safetyAuditStatus === 'PENDING';
            const isApproved = item.safetyAuditStatus === 'APPROVED';
            const isRejected = item.safetyAuditStatus === 'REJECTED';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col shadow-xs hover:shadow-md ${
                  item.isHighVoltage
                    ? 'border-red-200 ring-1 ring-red-100'
                    : 'border-slate-200'
                }`}
              >
                {/* Photo Thumbnail with Badge Overlays */}
                <div className="relative h-48 bg-slate-950 overflow-hidden group cursor-pointer" onClick={() => setInspectingPhoto(item)}>
                  <img
                    src={item.beforePhotoUrl}
                    alt={item.serviceTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    {item.isHighVoltage && (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] tracking-wide flex items-center gap-1 shadow-md animate-pulse">
                        <Zap className="w-3 h-3" />
                        <span>HIGH VOLTAGE 415V</span>
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white font-mono text-[10px] font-bold">
                      #{item.jobTicketNumber}
                    </span>
                  </div>

                  {/* Status Overlay Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm ${
                        isPending
                          ? 'bg-amber-500 text-white'
                          : isApproved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {item.safetyAuditStatus}
                    </span>
                  </div>

                  {/* Bottom Image Details */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px]">
                    <span className="truncate max-w-[200px] font-medium">{item.customerAddressText}</span>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect Photo</span>
                    </button>
                  </div>
                </div>

                {/* Card Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{item.serviceTitle}</h3>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Customer: <strong className="text-slate-800">{item.customerName}</strong></p>
                    <p className="text-xs text-slate-500">Technician: <strong className="text-slate-800">{item.technicianName || 'Certified Partner'}</strong></p>
                  </div>

                  {/* Gear Certification Checkpoints */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-slate-700">
                      <span className={item.safetyGlovesConfirmed ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                        {item.safetyGlovesConfirmed ? '✓' : '○'}
                      </span>
                      <span>1000V Gloves</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-700">
                      <span className={item.safetyMcbSwitchConfirmed ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                        {item.safetyMcbSwitchConfirmed ? '✓' : '○'}
                      </span>
                      <span>MCB Lockout</span>
                    </div>
                  </div>

                  {/* Review Audit Notes if present */}
                  {item.safetyAuditNotes && (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
                      "{item.safetyAuditNotes}"
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmittingReview || isApproved}
                      onClick={() => handleReviewAction(item.id, 'APPROVE')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isApproved ? 'Approved' : 'Approve'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmittingReview || isRejected}
                      onClick={() => setRejectingItem(item)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        isRejected
                          ? 'bg-red-50 text-red-700 border border-red-200 cursor-default'
                          : 'bg-white hover:bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Zoom Inspection Modal */}
      {inspectingPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Evidence Inspection: #{inspectingPhoto.jobTicketNumber}</h3>
                <p className="text-xs text-slate-400">{inspectingPhoto.serviceTitle}</p>
              </div>
              <button
                onClick={() => setInspectingPhoto(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={inspectingPhoto.beforePhotoUrl}
                alt="Enlarged safety inspection evidence"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="p-4 bg-slate-900 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Technician: </span>
                <span className="font-semibold text-slate-200">{inspectingPhoto.technicianName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleReviewAction(inspectingPhoto.id, 'APPROVE');
                    setInspectingPhoto(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Evidence</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectingItem(inspectingPhoto);
                    setInspectingPhoto(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 font-bold text-white flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Evidence Modal with Reason */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-slate-900">Reject Safety Evidence</h3>
              </div>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600">
                Work Order <strong className="text-slate-900">#{rejectingItem.jobTicketNumber}</strong> will be flagged.
                A tamper-proof cryptographic audit event (SHA-256) will be permanently logged.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Violation Category</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value="MISSING_1000V_GLOVES">Missing 1000V Class 0 Insulated Gloves</option>
                  <option value="LIVE_CIRCUIT_NOT_ZEROED">Live-Dead-Live Multimeter Check Not Shown</option>
                  <option value="MCB_LOCKOUT_UNVERIFIED">Distribution Box Breaker Lockout Not Affixed</option>
                  <option value="BLURRY_OR_STOCK_PHOTO">Unclear / Blurry / Unverifiable Photo</option>
                  <option value="NON_COMPLIANT_PPE">Non-Compliant Footwear / Protective Gear</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Auditor Notes</label>
                <textarea
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Describe violation or instruction for technician to retake..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={() => handleReviewAction(rejectingItem.id, 'REJECT', rejectNotes, [rejectReason])}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1.5 shadow-sm"
              >
                {isSubmittingReview ? (
                  <span>Recording WORM Log...</span>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
