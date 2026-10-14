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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            <span>ADM-SCR-16 &bull; ADM-SCR-17 &bull; Zex Cyber Security Shield</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Subscription Modules &amp; Protection Plans
          </h1>
          <p className="text-sm text-slate-500">
            Household electrical warranty, 15-min emergency SOS dispatch guarantee &amp; multi-tenant franchise liability coverage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Policies
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Active Policyholders</span>
            <Users className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {telemetry?.activeSubscriptionsCount ?? '...'}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              ({telemetry?.consumerActiveCount || 0} Consumer / {telemetry?.partnerActiveCount || 0} Franchise)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Total policies tracked: {telemetry?.totalSubscriptionsCount || 0}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Risk Pool Reserve</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-600">
              ₹{(telemetry?.totalRiskPoolCoverageInr || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3" />
            100% Backed by General Insurance Underwriting
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Enrolled Premium Revenue</span>
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-600">
              ₹{(telemetry?.totalRevenueInr || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Directly accounted into Central Treasury Escrow
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Active Protection Tiers</span>
            <Award className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-purple-600">
              {telemetry?.activeTiersCount ?? tiers.length} Tiers
            </span>
          </div>
          <div className="mt-2 text-[11px] text-purple-600 font-medium">
            Standardized Pan-India SLA Guarantee
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('TIERS')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'TIERS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Protection Tier Architecture (ADM-SCR-16)</span>
          <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs text-slate-700">
            {tiers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SUBSCRIBERS')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'SUBSCRIBERS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Active Policyholder Registry (ADM-SCR-17)</span>
          <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs text-slate-700">
            {subscriptions.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Protection Tiers (ADM-SCR-16) */}
      {activeTab === 'TIERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
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
                  className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all shadow-xs hover:shadow-md ${
                    isAnnualGold
                      ? 'border-amber-300 bg-amber-50/25 shadow-amber-500/5'
                      : isPartner
                      ? 'border-sky-300 bg-sky-50/25'
                      : isEnterprise
                      ? 'border-purple-300 bg-purple-50/25'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {isAnnualGold && (
                    <div className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950 shadow">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-700 font-mono border border-slate-200">
                        {tier.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          tier.targetAudience === 'CONSUMER'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tier.targetAudience === 'PARTNER_FRANCHISE'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {tier.targetAudience.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900">{tier.name}</h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed min-h-[40px]">
                      {tier.description}
                    </p>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-900">
                          ₹{tier.priceInr.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500">
                          / {tier.durationMonths === 1 ? 'month' : `${tier.durationMonths} months`}
                        </span>
                      </div>
                    </div>

                    {/* Feature Checklist */}
                    <div className="mt-4 space-y-2.5 text-xs text-slate-700 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong className="text-slate-900">
                            ₹{tier.surgeProtectionCoverageInr.toLocaleString('en-IN')}
                          </strong>{' '}
                          Surge Guarantee
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong className="text-slate-900">{tier.freeInspectionsCount}</strong> Free Routine Safety Audits
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          {tier.isPrioritySosDispatch ? (
                            <span className="text-emerald-700 font-medium">15-Min Guaranteed SOS Dispatch</span>
                          ) : (
                            <span className="text-slate-400">Standard Queue</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tier.applianceWarrantyIncluded ? (
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 text-slate-300 text-center font-bold">&times;</span>
                        )}
                        <span className={tier.applianceWarrantyIncluded ? 'text-slate-700' : 'text-slate-400 line-through'}>
                          Zero-Deductible Appliance Cover
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tier.cyberShieldAuditIncluded ? (
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 text-slate-300 text-center font-bold">&times;</span>
                        )}
                        <span className={tier.cyberShieldAuditIncluded ? 'text-slate-700' : 'text-slate-400 line-through'}>
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
                    className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition-colors"
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
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search subscriber, phone, plan or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Policies</option>
                <option value="EXPIRED">Expired</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="ALL">All Account Types</option>
                <option value="CUSTOMER">Consumer</option>
                <option value="PARTNER">Franchise Partner</option>
              </select>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSubscriptions.map((sub) => {
                    const isActive = sub.status === 'ACTIVE';
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{sub.subscriberName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{sub.subscriberPhone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              sub.subscriberType === 'CUSTOMER'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}
                          >
                            {sub.subscriberType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{sub.tierName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {sub.id}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          ₹{sub.pricePaidInr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-emerald-600">
                            ₹{sub.coverageMaxInr.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          <div>From: {new Date(sub.startDate).toLocaleDateString('en-IN')}</div>
                          <div>To: {new Date(sub.expiryDate).toLocaleDateString('en-IN')}</div>
                        </td>
                        <td className="py-3 px-4">
                          {sub.autoRenew ? (
                            <span className="text-emerald-600 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="h-3 w-3" /> Enabled
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Manual</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Calibrate Protection Tier</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedTier.name}</p>
              </div>
              <button
                onClick={() => setSelectedTier(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateTier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subscription Price (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Surge Protection Maximum Coverage Limit (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={editCoverage}
                    onChange={(e) => setEditCoverage(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Backed by Zex Cyber Security underwriting guarantee pool.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedTier(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTier}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-xs"
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
