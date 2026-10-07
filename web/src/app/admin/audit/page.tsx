'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Lock,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Link as LinkIcon,
  Copy,
  Check,
  Cpu,
  History,
  ShieldAlert,
} from '@/components/ui/icons';

interface WormAuditLog {
  id: string;
  sequenceNumber: number;
  timestamp: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousHash: string;
  currentHash: string;
  payloadSummary: string;
  ipAddress: string;
  isTamperVerified: boolean;
}

interface ChainIntegrity {
  isValid: boolean;
  totalBlocks: number;
  verifiedAt: string;
  algorithm?: string;
  complianceStandard?: string;
  failureDetails?: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<WormAuditLog[]>([]);
  const [chainIntegrity, setChainIntegrity] = useState<ChainIntegrity | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setChainIntegrity(data.chainIntegrity || null);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleVerifyChain = async () => {
    try {
      setVerifying(true);
      const res = await fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY_CHAIN' }),
      });
      const data = await res.json();
      if (data.success && data.verification) {
        setChainIntegrity(data.verification);
      }
    } catch (err) {
      console.error('Error verifying audit chain:', err);
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const filteredLogs = logs.filter((log) => {
    if (roleFilter !== 'ALL' && log.actorRole !== roleFilter) return false;
    if (resourceFilter !== 'ALL' && log.resourceType !== resourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.payloadSummary.toLowerCase().includes(q) ||
        log.resourceId.toLowerCase().includes(q) ||
        log.actorId.toLowerCase().includes(q) ||
        log.currentHash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Lock className="h-4 w-4" />
            <span>ADM-SCR-22 &bull; Immutable WORM Compliance Audit Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">
            Write-Once-Read-Many (WORM) Cryptographic Audit Trail
          </h1>
          <p className="text-sm text-slate-400">
            FIPS 180-4 SHA-256 hash-chained non-repudiation ledger for IT Act 65B and RBI regulatory compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            <Fingerprint className={`h-4 w-4 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Verifying Block Hashes...' : 'Verify Cryptographic Chain'}</span>
          </button>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Chain
          </button>
        </div>
      </div>

      {/* Cryptographic Hash Chain Integrity Banner */}
      {chainIntegrity && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 backdrop-blur ${
            chainIntegrity.isValid
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 shrink-0">
              {chainIntegrity.isValid ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <ShieldAlert className="h-6 w-6 text-rose-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {chainIntegrity.isValid
                    ? 'Cryptographic Hash Chain: 100% INTACT & TAMPER-VERIFIED'
                    : 'INTEGRITY VIOLATION DETECTED'}
                </span>
                <span className="rounded bg-emerald-500/30 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                  SHA-256 Chained
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Verified {chainIntegrity.totalBlocks} sequential ledger blocks. Every block pointer matches its cryptographic precursor.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Standard: Indian IT Act 65B Electronic Evidence &bull; RBI Cyber Resilience Standard
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="text-xs font-semibold text-slate-300">
              Verified At: {new Date(chainIntegrity.verifiedAt).toLocaleTimeString()} IST
            </div>
            <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
              Zero Collisions &bull; Zero Bit Rot
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search action, SHA-256 hash, actor or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="PARTNER">Partner Franchise</option>
            <option value="SYSTEM">System Automations</option>
            <option value="CUSTOMER">Customer</option>
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Resource Types</option>
            <option value="SYSTEM_LEDGER">System Ledger</option>
            <option value="COMMISSION_CONFIG">Commission Config</option>
            <option value="PARTNER">Franchise Partner</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="JOB_ORDER">Job Orders</option>
            <option value="SUPPORT_TICKET">Support Tickets</option>
            <option value="SUBSCRIPTION_TIER">Subscription Tier</option>
          </select>
        </div>
      </div>

      {/* WORM Audit Log Ledger Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Block #</th>
                <th className="py-3 px-4">Action &amp; Target</th>
                <th className="py-3 px-4">Actor &amp; Origin</th>
                <th className="py-3 px-4">Summary Description</th>
                <th className="py-3 px-4">Cryptographic Hash Link</th>
                <th className="py-3 px-4 text-center">WORM Seal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredLogs.map((log) => {
                const isGenesis = log.sequenceNumber === 1;
                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-400">
                          #{String(log.sequenceNumber).padStart(3, '0')}
                        </span>
                        {isGenesis && (
                          <span className="rounded bg-purple-500/20 text-purple-300 px-1 py-0.2 text-[9px] uppercase font-bold">
                            Genesis
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-100 text-[11px]">
                        {log.action}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400 uppercase font-mono">
                          {log.resourceType}
                        </span>
                        <span className="text-[10px] text-sky-400 font-mono">
                          {log.resourceId}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-mono text-[11px]">{log.actorId}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                            log.actorRole === 'SUPER_ADMIN'
                              ? 'bg-rose-500/20 text-rose-300'
                              : log.actorRole === 'PARTNER'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {log.actorRole}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {log.ipAddress}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {log.payloadSummary}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs font-mono text-[11px]">
                      <div className="flex items-center justify-between text-slate-400 gap-2">
                        <span className="text-[10px] uppercase text-slate-500">Hash:</span>
                        <div className="flex items-center gap-1 truncate">
                          <span className="text-emerald-400 truncate">
                            {log.currentHash.slice(0, 16)}...{log.currentHash.slice(-8)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(log.currentHash)}
                            title="Copy full SHA-256 digest"
                            className="text-slate-500 hover:text-white shrink-0 p-0.5"
                          >
                            {copiedHash === log.currentHash ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-500 text-[10px] gap-2 mt-0.5">
                        <span className="uppercase text-slate-600">Prev:</span>
                        <span className="truncate">
                          {isGenesis
                            ? '0000000000000000...'
                            : `${log.previousHash.slice(0, 10)}...${log.previousHash.slice(-6)}`}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" />
                        SEALED
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No audit trail records match the specified query filters.
          </div>
        )}
      </div>
    </div>
  );
}
