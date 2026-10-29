'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  User,
  ShieldAlert,
  X,
  Send,
} from '@/components/ui/icons';

interface DisputeTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_EMERGENCY';
  status: 'OPEN' | 'IN_INVESTIGATION' | 'RESOLVED';
  description: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  technicianId?: string;
  technicianName?: string;
  jobId?: string;
  jobTicketNumber?: string;
  assignedTo?: string;
  category?: string;
  customerRating?: number;
  customerFeedback?: string;
  jobTotalAmount?: number;
  jobServiceCategory?: string;
  resolutionNotes?: string;
  compensationAmount?: number;
  slaDueAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Telemetry {
  totalDisputes: number;
  openCount: number;
  investigatingCount: number;
  resolvedCount: number;
  criticalCount: number;
  slaComplianceRatePct: number;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeTicket[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail / Resolution Modal
  const [selectedDispute, setSelectedDispute] = useState<DisputeTicket | null>(null);
  const [assignedManager, setAssignedManager] = useState('Franchise Operations Manager');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [compensationAmount, setCompensationAmount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/disputes');
      const data = await res.json();
      if (data.success) {
        setDisputes(data.disputes || []);
        setTelemetry(data.telemetry || null);
      }
    } catch (err) {
      console.error('Error fetching disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const openResolutionModal = (ticket: DisputeTicket) => {
    setSelectedDispute(ticket);
    setAssignedManager(ticket.assignedTo || 'Franchise Operations Manager');
    setResolutionNotes(ticket.resolutionNotes || '');
    setCompensationAmount(ticket.compensationAmount ? String(ticket.compensationAmount) : '0');
  };

  const handleAssignManager = async () => {
    if (!selectedDispute) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedDispute.id,
          action: 'ASSIGN',
          assignedTo: assignedManager,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: `Dispute successfully assigned to ${assignedManager}` });
        setSelectedDispute({ ...selectedDispute, assignedTo: assignedManager, status: 'IN_INVESTIGATION' });
        fetchDisputes();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to assign manager' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute || !resolutionNotes.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedDispute.id,
          action: 'RESOLVE',
          resolutionNotes: resolutionNotes.trim(),
          compensationAmount: Number(compensationAmount) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: `Dispute ${selectedDispute.ticketNumber} marked as RESOLVED` });
        setSelectedDispute(null);
        fetchDisputes();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to resolve dispute' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.ticketNumber.toLowerCase().includes(q) ||
        d.subject.toLowerCase().includes(q) ||
        (d.customerName && d.customerName.toLowerCase().includes(q)) ||
        (d.customerPhone && d.customerPhone.includes(q)) ||
        (d.technicianName && d.technicianName.toLowerCase().includes(q)) ||
        (d.jobTicketNumber && d.jobTicketNumber.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-2xl">
              ⚖️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Customer Rating Disputes & Escalations</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
                  Urban Company / Uber Pipeline
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Automated Webhook Dispatch: Ratings &lt; 3★ immediately trigger high-priority SLA intervention and Franchise Manager assignment.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDisputes}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`mt-4 p-4 rounded-xl flex items-center justify-between text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Disputes</span>
            <span className="text-slate-500 text-lg">📊</span>
          </div>
          <div className="text-2xl font-black text-white mt-2">{telemetry?.totalDisputes ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">1★ and 2★ escalations</div>
        </div>

        <div className="bg-slate-900/80 border border-rose-900/30 rounded-2xl p-4 bg-gradient-to-br from-rose-950/20 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-400 uppercase tracking-wider">Urgent / Open</span>
            <span className="text-rose-400 text-lg">🚨</span>
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">{telemetry?.openCount ?? 0}</div>
          <div className="text-xs text-rose-400/70 mt-1">Immediate outreach needed</div>
        </div>

        <div className="bg-slate-900/80 border border-amber-900/30 rounded-2xl p-4 bg-gradient-to-br from-amber-950/20 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Under Investigation</span>
            <span className="text-amber-400 text-lg">🔍</span>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{telemetry?.investigatingCount ?? 0}</div>
          <div className="text-xs text-amber-400/70 mt-1">With Franchise Manager</div>
        </div>

        <div className="bg-slate-900/80 border border-emerald-900/30 rounded-2xl p-4 bg-gradient-to-br from-emerald-950/20 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Resolved & Retained</span>
            <span className="text-emerald-400 text-lg">✅</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">{telemetry?.resolvedCount ?? 0}</div>
          <div className="text-xs text-emerald-400/70 mt-1">CAPA documented</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dispute, job #, customer, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'OPEN', 'IN_INVESTIGATION', 'RESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Disputes' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Disputes List */}
      {filteredDisputes.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No Active Customer Rating Disputes</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            All customer service ratings are currently ≥ 3★, or all low-rating disputes have been resolved with CAPA documentation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => {
            const is1Star = dispute.customerRating === 1 || dispute.subject.includes('1-Star');
            return (
              <div
                key={dispute.id}
                className={`bg-slate-900 border rounded-2xl p-5 transition-all hover:border-slate-700 ${
                  dispute.status === 'OPEN'
                    ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/15 via-slate-900 to-slate-900'
                    : dispute.status === 'IN_INVESTIGATION'
                    ? 'border-amber-500/40'
                    : 'border-slate-800 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Star Badge */}
                    <div
                      className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl font-black border shrink-0 ${
                        is1Star
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      <span className="text-2xl">{is1Star ? '1★' : '2★'}</span>
                      <span className="text-[10px] tracking-wider uppercase font-semibold">POOR</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-rose-400">{dispute.ticketNumber}</span>
                        {dispute.jobTicketNumber && (
                          <Link
                            href={`/admin/jobs?search=${encodeURIComponent(dispute.jobTicketNumber)}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-700"
                          >
                            Job #{dispute.jobTicketNumber}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            dispute.status === 'OPEN'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : dispute.status === 'IN_INVESTIGATION'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {dispute.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(dispute.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <h2 className="text-base font-semibold text-white">{dispute.subject}</h2>

                      {/* Customer Review Quote */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 mt-2">
                        <span className="text-rose-400 font-medium">Customer Review: </span>
                        <span className="italic">
                          "{dispute.customerFeedback || dispute.description || 'No written comments provided'}"
                        </span>
                      </div>

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        <div>
                          <span className="text-slate-500">Customer: </span>
                          <span className="text-slate-200 font-medium">
                            {dispute.customerName || 'Customer'}
                          </span>{' '}
                          {dispute.customerPhone && (
                            <a
                              href={`tel:${dispute.customerPhone}`}
                              className="text-emerald-400 hover:underline font-mono"
                            >
                              ({dispute.customerPhone})
                            </a>
                          )}
                        </div>
                        {dispute.technicianName && (
                          <div>
                            <span className="text-slate-500">Technician: </span>
                            <span className="text-slate-200 font-medium">{dispute.technicianName}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500">Assigned To: </span>
                          <span className="text-amber-300 font-semibold">
                            {dispute.assignedTo || 'Franchise Operations Manager'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <button
                      onClick={() => openResolutionModal(dispute)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        dispute.status === 'RESOLVED'
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
                      }`}
                    >
                      {dispute.status === 'RESOLVED' ? 'View Resolution CAPA' : '⚡ Investigate & Resolve'}
                    </button>
                    {dispute.customerPhone && (
                      <a
                        href={`tel:${dispute.customerPhone}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"
                      >
                        📞 Call Customer
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Investigation & Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedDispute(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xl">
                ⚖️
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Dispute Resolution: {selectedDispute.ticketNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Job #{selectedDispute.jobTicketNumber} • Customer: {selectedDispute.customerName}
                </p>
              </div>
            </div>

            {/* Customer Review Summary */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span className="text-slate-400">Rating Feedback</span>
                <span className="text-rose-400 font-bold">
                  {selectedDispute.customerRating || 1}★ Escalation
                </span>
              </div>
              <p className="text-sm text-slate-200 italic">
                "{selectedDispute.customerFeedback || selectedDispute.description}"
              </p>
            </div>

            {/* Franchise Manager Assignment Section */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 mb-5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Assigned Franchise Lead
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={assignedManager}
                  onChange={(e) => setAssignedManager(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Franchise Operations Manager">Franchise Operations Manager</option>
                  <option value="Senior Quality Audit Lead">Senior Quality Audit Lead</option>
                  <option value="Area Territory Lead">Area Territory Lead</option>
                  <option value="Customer Experience VP">Customer Experience VP</option>
                </select>
                <button
                  type="button"
                  onClick={handleAssignManager}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
                >
                  Update Lead
                </button>
              </div>
            </div>

            {/* Resolution Form */}
            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  CAPA & Resolution Summary <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail customer outreach call notes, technician corrective action, root cause analysis, and resolution agreement..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Customer Goodwill Compensation / Wallet Credit (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={compensationAmount}
                  onChange={(e) => setCompensationAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !resolutionNotes.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Recording Resolution...' : 'Mark Dispute Resolved with CAPA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
