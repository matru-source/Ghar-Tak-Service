'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  ChevronRight,
  Filter,
  Check,
  AlertCircle,
  TrendingUp,
} from '@/components/ui/icons';

interface SubscriptionTier {
  id: string;
  name: string;
  code: string;
  targetAudience: 'CONSUMER' | 'PARTNER_FRANCHISE' | 'ENTERPRISE';
  priceInr: number;
  durationMonths: number;
  surgeProtectionCoverageInr: number;
  freeInspectionsCount: number;
  isPrioritySosDispatch: boolean;
  applianceWarrantyIncluded: boolean;
  cyberShieldAuditIncluded: boolean;
  isActive: boolean;
  description: string;
}

interface SubscriptionRecord {
  id: string;
  tierId: string;
  tierName: string;
  subscriberType: 'CUSTOMER' | 'PARTNER';
  subscriberId: string;
  subscriberName: string;
  subscriberPhone: string;
  pricePaidInr: number;
  startDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  autoRenew: boolean;
  coverageMaxInr: number;
}

interface Telemetry {
  totalSubscriptionsCount: number;
  activeSubscriptionsCount: number;
  consumerActiveCount: number;
  partnerActiveCount: number;
  totalRevenueInr: number;
  totalRiskPoolCoverageInr: number;
  activeTiersCount: number;
}

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'TIERS' | 'SUBSCRIBERS'>('TIERS');
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Edit Tier modal state
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCoverage, setEditCoverage] = useState<number>(0);
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/subscriptions');
      const data = await res.json();
      if (data.success) {
        setTiers(data.tiers || []);
        setSubscriptions(data.subscriptions || []);
        setTelemetry(data.telemetry || null);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;
    try {
      setIsUpdatingTier(true);
      const res = await fetch(`/api/admin/subscriptions/tiers/${selectedTier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceInr: editPrice,
          surgeProtectionCoverageInr: editCoverage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Tier "${selectedTier.name}" calibrated successfully!`);
        setSelectedTier(null);
        await fetchData();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error updating tier:', err);
    } finally {
      setIsUpdatingTier(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && sub.subscriberType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        sub.subscriberName.toLowerCase().includes(q) ||
        sub.subscriberPhone.toLowerCase().includes(q) ||
        sub.tierName.toLowerCase().includes(q) ||
        sub.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Screen Title & Top Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>ADM-SCR-16 &bull; ADM-SCR-17 &bull; Zex Cyber Security Shield</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">
            Subscription Modules &amp; Protection Plans
          </h1>
          <p className="text-sm text-slate-400">
            Household electrical warranty, 15-min emergency SOS dispatch guarantee &amp; multi-tenant franchise liability coverage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Policies
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Policyholders</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">
              {telemetry?.activeSubscriptionsCount ?? '...'}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              ({telemetry?.consumerActiveCount || 0} Consumer / {telemetry?.partnerActiveCount || 0} Franchise)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Total policies tracked: {telemetry?.totalSubscriptionsCount || 0}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Risk Pool Reserve</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-300">
              ₹{(telemetry?.totalRiskPoolCoverageInr || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-500/90 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3" />
            100% Backed by General Insurance Underwriting
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Enrolled Premium Revenue</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-300">
              ₹{(telemetry?.totalRevenueInr || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Directly accounted into Central Treasury Escrow
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Protection Tiers</span>
            <Award className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-purple-300">
              {telemetry?.activeTiersCount ?? tiers.length} Tiers
            </span>
          </div>
          <div className="mt-2 text-[11px] text-purple-400/90 font-medium">
            Standardized Pan-India SLA Guarantee
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('TIERS')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'TIERS'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Protection Tier Architecture (ADM-SCR-16)</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {tiers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SUBSCRIBERS')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'SUBSCRIBERS'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Active Policyholder Registry (ADM-SCR-17)</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {subscriptions.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Protection Tiers (ADM-SCR-16) */}
      {activeTab === 'TIERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Configured surge warranty limits, inspection quotas &amp; automated emergency dispatch benefits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {tiers.map((tier) => {
              const isAnnualGold = tier.code === 'SHIELD-USER-1Y';
              const isPartner = tier.targetAudience === 'PARTNER_FRANCHISE';
              const isEnterprise = tier.targetAudience === 'ENTERPRISE';

              return (
                <div
                  key={tier.id}
                  className={`relative flex flex-col justify-between rounded-xl border p-5 backdrop-blur transition-all ${
                    isAnnualGold
                      ? 'border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-slate-900/80 to-slate-900/90 shadow-lg shadow-amber-500/5'
                      : isPartner
                      ? 'border-sky-500/40 bg-gradient-to-b from-sky-500/10 via-slate-900/80 to-slate-900/90'
                      : isEnterprise
                      ? 'border-purple-500/40 bg-gradient-to-b from-purple-500/10 via-slate-900/80 to-slate-900/90'
                      : 'border-slate-800 bg-slate-900/70'
                  }`}
                >
                  {isAnnualGold && (
                    <div className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950 shadow">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-300 font-mono">
                        {tier.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          tier.targetAudience === 'CONSUMER'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : tier.targetAudience === 'PARTNER_FRANCHISE'
                            ? 'bg-sky-500/10 text-sky-400'
                            : 'bg-purple-500/10 text-purple-400'
                        }`}
                      >
                        {tier.targetAudience.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-100">{tier.name}</h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed min-h-[40px]">
                      {tier.description}
                    </p>

                    <div className="mt-4 border-t border-slate-800/80 pt-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-white">
                          ₹{tier.priceInr.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-400">
                          / {tier.durationMonths === 1 ? 'month' : `${tier.durationMonths} months`}
                        </span>
                      </div>
                    </div>

                    {/* Feature Checklist */}
                    <div className="mt-4 space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong className="text-slate-100">
                            ₹{tier.surgeProtectionCoverageInr.toLocaleString('en-IN')}
                          </strong>{' '}
                          Surge Guarantee
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong className="text-slate-100">{tier.freeInspectionsCount}</strong> Free Routine Safety Audits
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>
                          {tier.isPrioritySosDispatch ? (
                            <span className="text-emerald-300 font-medium">15-Min Guaranteed SOS Dispatch</span>
                          ) : (
                            <span className="text-slate-500">Standard Queue</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tier.applianceWarrantyIncluded ? (
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 text-slate-600 text-center font-bold">&times;</span>
                        )}
                        <span className={tier.applianceWarrantyIncluded ? 'text-slate-300' : 'text-slate-600 line-through'}>
                          Zero-Deductible Appliance Cover
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tier.cyberShieldAuditIncluded ? (
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 text-slate-600 text-center font-bold">&times;</span>
                        )}
                        <span className={tier.cyberShieldAuditIncluded ? 'text-slate-300' : 'text-slate-600 line-through'}>
                          SCADA &amp; Cyber Shield Audit
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTier(tier);
                      setEditPrice(tier.priceInr);
                      setEditCoverage(tier.surgeProtectionCoverageInr);
                    }}
                    className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <span>Calibrate Pricing &amp; Cover</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Subscribers Registry (ADM-SCR-17) */}
      {activeTab === 'SUBSCRIBERS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search subscriber, phone, plan or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="h-3.5 w-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Policies</option>
                <option value="EXPIRED">Expired</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Account Types</option>
                <option value="CUSTOMER">Consumer</option>
                <option value="PARTNER">Franchise Partner</option>
              </select>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Policyholder</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Enrolled Plan</th>
                    <th className="py-3 px-4">Premium Paid</th>
                    <th className="py-3 px-4">Max Coverage Cap</th>
                    <th className="py-3 px-4">Validity Period</th>
                    <th className="py-3 px-4">Auto Renew</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredSubscriptions.map((sub) => {
                    const isActive = sub.status === 'ACTIVE';
                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-100">{sub.subscriberName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{sub.subscriberPhone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              sub.subscriberType === 'CUSTOMER'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            }`}
                          >
                            {sub.subscriberType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{sub.tierName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {sub.id}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-100">
                          ₹{sub.pricePaidInr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-emerald-400">
                            ₹{sub.coverageMaxInr.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          <div>From: {new Date(sub.startDate).toLocaleDateString('en-IN')}</div>
                          <div>To: {new Date(sub.expiryDate).toLocaleDateString('en-IN')}</div>
                        </td>
                        <td className="py-3 px-4">
                          {sub.autoRenew ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="h-3 w-3" /> Enabled
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Manual</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredSubscriptions.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No policyholders found matching current search and filter filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calibration Modal */}
      {selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Calibrate Protection Tier</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedTier.name}</p>
              </div>
              <button
                onClick={() => setSelectedTier(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateTier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subscription Price (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Surge Protection Maximum Coverage Limit (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={editCoverage}
                    onChange={(e) => setEditCoverage(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Backed by Zex Cyber Security underwriting guarantee pool.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTier(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTier}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {isUpdatingTier ? 'Committing Changes...' : 'Save & Calibrate Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
