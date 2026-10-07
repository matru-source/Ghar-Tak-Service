'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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

interface SupportStats {
  totalTickets: number;
  openTicketsCount: number;
  inProgressCount: number;
  resolvedCount: number;
  slaComplianceRatePct: number;
}

export default function PartnerSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New Ticket Form State
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_EMERGENCY'>('MEDIUM');
  const [newCategory, setNewCategory] = useState('DISPATCH_DELAY');
  const [newJobTicket, setNewJobTicket] = useState('J-1005');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partner/support');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newDescription) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/partner/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'CREATE_TICKET',
          subject: newSubject,
          description: newDescription,
          priority: newPriority,
          category: newCategory,
          jobTicketNumber: newJobTicket,
          actorId: 'usr_partner_01',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Support Ticket ${data.ticket.ticketNumber} opened successfully (WORM Block #${data.auditLog?.sequenceNumber})`);
        setIsCreateModalOpen(false);
        setNewSubject('');
        setNewDescription('');
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/partner/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'ADD_REPLY',
          ticketId: selectedTicket.id,
          description: replyText,
          actorId: 'usr_partner_01',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Update dispatched to Central Support HQ (WORM Block #${data.auditLog?.sequenceNumber})`);
        setReplyText('');
        setSelectedTicket(data.ticket);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to add reply:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/partner/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'RESOLVE',
          ticketId: selectedTicket.id,
          resolutionNotes: resolveNotes || 'Resolution confirmed by Maharashtra Partner Director Suresh Patil',
          actorId: 'usr_partner_01',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Ticket ${data.ticket.ticketNumber} marked RESOLVED (WORM Block #${data.auditLog?.sequenceNumber})`);
        setResolveNotes('');
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to resolve ticket:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.jobTicketNumber && t.jobTicketNumber.toLowerCase().includes(q))
      );
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

      {/* Breadcrumb & Command Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>Operational Portal</span>
            <span>/</span>
            <span>Operations Governance</span>
            <span>/</span>
            <span className="text-[#1B5E20]">Partner Support Center (PTNR-SCR-15 &amp; 16)</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Partner Operations Helpdesk
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1B5E20] border border-emerald-200 font-bold">
              SLA ACTIVE &bull; 98.4%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Submit escalation tickets, track dispatch resolution workflows, and communicate directly with ElectriCare Central Engineering Operations HQ.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <span>➕</span>
            <span>Open New Support Ticket</span>
          </button>
          <Link
            href="/partner/profile"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>🏦</span>
            <span>Franchise Bank Profile →</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Open Tickets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-500">
            <span>Open Tickets</span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-sm font-bold">
              🚨
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">
              {stats?.openTicketsCount ?? tickets.filter((t) => t.status === 'OPEN').length}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              Immediate SLA Risk
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>Awaiting Support Response</span>
            <span className="text-rose-600 font-bold">&lt; 15 min SLA</span>
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-500">
            <span>In Investigation</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
              🔍
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats?.inProgressCount ?? tickets.filter((t) => t.status === 'IN_INVESTIGATION').length}
            </span>
            <span className="text-xs font-bold text-blue-700">Assigned Tier-2</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>Operational Review</span>
            <span className="font-bold text-slate-700">Central HQ Active</span>
          </div>
        </div>

        {/* Card 3: Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Resolved This Quarter</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B5E20] flex items-center justify-center text-sm font-bold">
              ✓
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats?.resolvedCount ?? tickets.filter((t) => t.status === 'RESOLVED').length}
            </span>
            <span className="text-xs font-bold text-emerald-700">96.8% Satisfied</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>Closed Cases</span>
            <span className="font-bold text-slate-800">FY 2026-27</span>
          </div>
        </div>

        {/* Card 4: SLA Compliance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>SLA Compliance Adherence</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B5E20] flex items-center justify-center text-sm font-bold">
              ⏱️
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.slaComplianceRatePct ?? 98.4}%</span>
            <span className="text-xs font-bold text-emerald-700">Statutory Met</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '98.4%' }}></div>
          </div>
        </div>
      </div>

      {/* Filter and Tab Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#1B5E20] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setStatusFilter('OPEN')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'OPEN'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Action Required ({tickets.filter((t) => t.status === 'OPEN').length})
            </button>
            <button
              onClick={() => setStatusFilter('IN_INVESTIGATION')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'IN_INVESTIGATION'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              In Investigation ({tickets.filter((t) => t.status === 'IN_INVESTIGATION').length})
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'RESOLVED'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Resolved ({tickets.filter((t) => t.status === 'RESOLVED').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL_EMERGENCY">Critical / Emergency</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket ID (e.g. SUP-1024), subject keyword, job reference, or technician..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Support Tickets Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Ticket ID &amp; Created</th>
                <th className="py-3.5 px-4">Subject &amp; Description</th>
                <th className="py-3.5 px-4">Job Ticket</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading Support Desk Tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No support tickets match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold font-mono text-slate-900 text-xs">{t.ticketNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-slate-500 max-w-sm truncate mt-0.5">
                        {t.description}
                      </div>
                    </td>

                    {/* Job Ticket */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1B5E20]">
                      {t.jobTicketNumber || '—'}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      {t.priority === 'CRITICAL_EMERGENCY' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] animate-pulse">
                          CRITICAL
                        </span>
                      ) : t.priority === 'HIGH' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          HIGH
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {t.priority}
                        </span>
                      )}
                    </td>

                    {/* Assigned To */}
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {t.assignedTo || 'National Support'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {t.status === 'OPEN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                          OPEN
                        </span>
                      ) : t.status === 'IN_INVESTIGATION' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          IN INVESTIGATION
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          RESOLVED ✓
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(t)}
                        className="px-2.5 py-1.5 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <span>👁️</span>
                        <span>Inspect &bull; Reply</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Ticket Details & Resolution Modal (PTNR-SCR-16) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Partner Support Case (PTNR-SCR-16)
                </div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                  {selectedTicket.ticketNumber} &bull; {selectedTicket.subject}
                </h2>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  Job Reference: {selectedTicket.jobTicketNumber || 'N/A'} &bull; Assigned: {selectedTicket.assignedTo}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Case Meta 2x2 */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Priority</span>
                <span className="font-bold text-slate-900">{selectedTicket.priority}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
                <span className="font-bold text-[#1B5E20]">{selectedTicket.status}</span>
              </div>
            </div>

            {/* Description Thread */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Communication History &amp; Dispatch Timeline</span>
                <span className="text-[10px] text-slate-400 font-mono">WORM Immutable Log</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                {selectedTicket.description}
              </div>
              {selectedTicket.resolutionNotes && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
                  <span className="font-bold block">Resolution Finalized:</span>
                  <span>{selectedTicket.resolutionNotes}</span>
                </div>
              )}
            </div>

            {/* Reply or Resolve Actions */}
            {selectedTicket.status !== 'RESOLVED' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Add Partner Supervisor Response / Field Clarification
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter dispatch notes, technician coordinates, or escalation updates..."
                    rows={2}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      disabled={actionLoading || !replyText.trim()}
                      onClick={handleAddReply}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      Post Update to Central HQ
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="font-bold text-[#1B5E20] text-xs">Close &amp; Mark Resolved</div>
                  <input
                    type="text"
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    placeholder="Enter final resolution outcome notes..."
                    className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleResolveTicket}
                      className="px-4 py-2 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Finalize Resolution ✓
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Open New Support Ticket (PTNR-SCR-15) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  New Support Escalation (PTNR-SCR-15)
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  Open Support Ticket to Central HQ
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. High-Voltage Feeder Delay Escalation"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="DISPATCH_DELAY">Dispatch Delay</option>
                    <option value="WARRANTY_CLAIM">Warranty Claim</option>
                    <option value="FINANCE_COMMISSION">Finance Commission</option>
                    <option value="SAFETY_INCIDENT">Safety Incident</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="CRITICAL_EMERGENCY">Critical Emergency</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Related Job Order Ticket</label>
                <input
                  type="text"
                  value={newJobTicket}
                  onChange={(e) => setNewJobTicket(e.target.value)}
                  placeholder="e.g. J-1005"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description &amp; Operational Details</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the operational incident or support requirement..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl font-bold transition shadow-sm cursor-pointer"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
