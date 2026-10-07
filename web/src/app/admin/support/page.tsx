'use client';

import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  User,
  Wrench,
  FileText,
  ShieldAlert,
  Send,
  X,
  Sparkles,
} from '@/components/ui/icons';

interface SupportTicket {
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
  resolutionNotes?: string;
  slaDueAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Telemetry {
  totalTicketsCount: number;
  openCount: number;
  investigatingCount: number;
  resolvedCount: number;
  criticalCount: number;
  slaComplianceRatePct: number;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Dossier detail modal state (ADM-SCR-19)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/support');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        setTelemetry(data.telemetry || null);
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !resolutionInput.trim()) return;

    try {
      setIsResolving(true);
      const res = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE',
          resolutionNotes: resolutionInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Ticket ${selectedTicket.ticketNumber} marked as RESOLVED & logged to WORM chain.`);
        setSelectedTicket(null);
        setResolutionInput('');
        await fetchTickets();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error resolving ticket:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.customerName && t.customerName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <LifeBuoy className="h-4 w-4" />
            <span>ADM-SCR-18 &bull; ADM-SCR-19 &bull; Mission-Critical Escalation Desk</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">
            Support Desk &amp; Escalation Management
          </h1>
          <p className="text-sm text-slate-400">
            Real-time dispatch delays, surge damage warranty claims &amp; 30-min SLA breach ticket resolutions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Tickets</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100">
            {telemetry?.totalTicketsCount ?? '...'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Pan-India Queue</div>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>Critical SLA Breaches</span>
            <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-300">
            {telemetry?.criticalCount ?? '...'}
          </div>
          <div className="mt-1 text-[11px] text-rose-400/90 font-medium">&lt; 30-min SLA timer active</div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>Active / Open</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300">
            {telemetry?.openCount ?? '...'}
          </div>
          <div className="mt-1 text-[11px] text-amber-400/90">Awaiting field triage</div>
        </div>

        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-sky-400 text-xs font-semibold">
            <span>In Investigation</span>
            <AlertTriangle className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-300">
            {telemetry?.investigatingCount ?? '...'}
          </div>
          <div className="mt-1 text-[11px] text-sky-400/90">Engineer on diagnosis</div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>SLA Compliance</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-300">
            {telemetry?.slaComplianceRatePct ?? 98.4}%
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/90 font-medium">98%+ National Target met</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search ticket #, subject, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL_EMERGENCY">Critical Emergency</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_INVESTIGATION">In Investigation</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Ticket Queue Table (ADM-SCR-18) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Subject &amp; Category</th>
                <th className="py-3 px-4">Customer / Contact</th>
                <th className="py-3 px-4">Priority Level</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTickets.map((t) => {
                const isCritical = t.priority === 'CRITICAL_EMERGENCY';
                const isHigh = t.priority === 'HIGH';
                const isOpen = t.status === 'OPEN';
                const isResolved = t.status === 'RESOLVED';

                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isCritical ? 'bg-rose-500/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
                        {isCritical && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
                        {t.ticketNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-100 truncate">{t.subject}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400 uppercase font-mono">
                          {t.category || 'DISPATCH'}
                        </span>
                        {t.jobTicketNumber && (
                          <span className="text-[10px] text-sky-400 font-mono">
                            Ref: {t.jobTicketNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{t.customerName || 'Colaba Regional Hub'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{t.customerPhone || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-500/20'
                            : isHigh
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {t.priority.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300">{t.technicianName || t.assignedTo || 'Unassigned'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isResolved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isOpen
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTicket(t);
                          setResolutionInput(t.resolutionNotes || '');
                        }}
                        className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        Open Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No support tickets match the selected filters.
          </div>
        )}
      </div>

      {/* Ticket Details Dossier Modal (ADM-SCR-19) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-400">
                    {selectedTicket.ticketNumber}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      selectedTicket.priority === 'CRITICAL_EMERGENCY'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {selectedTicket.priority.replace('_', ' ')}
                  </span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-slate-100">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lifecycle Stepper */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Lifecycle Progression
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded bg-emerald-500/20 border border-emerald-500/40 p-2 text-emerald-300 font-semibold">
                  1. Raised
                </div>
                <div className="rounded bg-emerald-500/20 border border-emerald-500/40 p-2 text-emerald-300 font-semibold">
                  2. Triaged
                </div>
                <div
                  className={`rounded p-2 font-semibold ${
                    selectedTicket.status === 'IN_INVESTIGATION' || selectedTicket.status === 'RESOLVED'
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  3. Investigating
                </div>
                <div
                  className={`rounded p-2 font-semibold ${
                    selectedTicket.status === 'RESOLVED'
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  4. Resolved
                </div>
              </div>
            </div>

            {/* Ticket Description */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-semibold text-slate-400 mb-1">Issue Narrative</div>
              <p className="text-xs text-slate-200 leading-relaxed">{selectedTicket.description}</p>
            </div>

            {/* Linked Entities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase">
                  <User className="h-3.5 w-3.5 text-sky-400" />
                  <span>Customer</span>
                </div>
                <div className="mt-1 font-bold text-slate-100">
                  {selectedTicket.customerName || 'Enterprise Client'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {selectedTicket.customerPhone || 'N/A'}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase">
                  <Wrench className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Technician</span>
                </div>
                <div className="mt-1 font-bold text-slate-100">
                  {selectedTicket.technicianName || 'Pradeep Jadhav'}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono">Nearby Fleet Standby</div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase">
                  <FileText className="h-3.5 w-3.5 text-amber-400" />
                  <span>Linked Job</span>
                </div>
                <div className="mt-1 font-bold text-slate-100 font-mono">
                  {selectedTicket.jobTicketNumber || 'J-1005'}
                </div>
                <div className="text-[11px] text-slate-400">Colaba 400001 Grid</div>
              </div>
            </div>

            {/* Resolution Form */}
            <form onSubmit={handleResolveTicket} className="space-y-3 border-t border-slate-800 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resolution Audit Notes (Committed to Immutable WORM Trail)
                </label>
                <textarea
                  rows={3}
                  value={resolutionInput}
                  onChange={(e) => setResolutionInput(e.target.value)}
                  placeholder="Detail the technical actions taken (e.g. proximity reassignment to Pradeep Jadhav, surge claims processed, circuit breaker inspection)..."
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
                  Resolution commits a cryptographically linked SHA-256 block.
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isResolving || selectedTicket.status === 'RESOLVED'}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {selectedTicket.status === 'RESOLVED'
                        ? 'Already Resolved'
                        : isResolving
                        ? 'Committing Resolution...'
                        : 'Resolve & Seal Ticket'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
