'use client';

import React, { useState, useEffect } from 'react';
import { useAdminLive } from '@/components/admin/admin-live-provider';

interface CustomerRecord {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  defaultAddressLine: string;
  defaultPincode: string;
  defaultLatitude: number;
  defaultLongitude: number;
  activeSubscriptionPlan: string;
  subscriptionExpiryDate?: string;
  totalOrdersCount: number;
  totalSpendInr: number;
  disputeCount: number;
  isVip: boolean;
  memberSince: string;
  notes?: string;
}

export default function AdminCustomersPage() {
  const { refreshKey } = useAdminLive();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New customer form
  const [newCust, setNewCust] = useState({
    fullName: '',
    phone: '',
    email: '',
    defaultAddressLine: '',
    defaultPincode: '400001',
    activeSubscriptionPlan: 'NONE',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (planFilter !== 'ALL') params.append('plan', planFilter);

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCustomers(json.data.customers);
      }
    } catch {
      showToast('Error loading customer directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    const interval = setInterval(fetchCustomers, 20000);
    return () => clearInterval(interval);
  }, [planFilter, refreshKey]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleViewDossier = async (customerId: string) => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedCustomer(json.data);
        setIsDossierOpen(true);
      } else {
        showToast('Failed to load customer dossier');
      }
    } catch {
      showToast('Network error loading dossier');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCust),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Customer '${newCust.fullName}' added successfully`);
        setIsAddModalOpen(false);
        fetchCustomers();
      } else {
        showToast(json.error || 'Failed to add customer');
      }
    } catch {
      showToast('Network error creating customer');
    }
  };

  // Macro KPIs
  const totalCount = customers.length;
  const totalSpend = customers.reduce((sum, c) => sum + (c.totalSpendInr || 0), 0);
  const activeSubscribers = customers.filter(
    (c) => c.activeSubscriptionPlan && c.activeSubscriptionPlan !== 'NONE'
  ).length;
  const vipCount = customers.filter((c) => c.isVip).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-blue-400 font-medium text-sm animate-bounce">
          <span>👥</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              ADM-SCR-09 & ADM-SCR-10
            </span>
            <span className="text-xs text-slate-500 font-medium">Customer CRM & Lifetime Value</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Customer Management & Lifetime Profiles</h1>
          <p className="text-sm text-slate-500">
            Track user booking histories, dispute resolutions, and active Zex Cyber Security Shield subscriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition transform active:scale-95"
        >
          <span>➕</span>
          <span>Add Customer</span>
        </button>
      </div>

      {/* Macro Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Accounts</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Across 4 major hubs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Lifetime Spend</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{totalSpend.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Direct customer inflows</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Zex Shield Subscriptions</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{activeSubscribers}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Active protection policies</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">VIP Accounts</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{vipCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Priority dispatch enabled</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Subscription Plan Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Users' },
            { id: 'ZEX_SHIELD_1MO', label: '1-Mo Shield' },
            { id: 'ZEX_SHIELD_PRO_1YR', label: 'Pro 1-Yr Shield' },
            { id: 'ENTERPRISE_PROTECT', label: 'Enterprise' },
            { id: 'NONE', label: 'Standard (No Plan)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPlanFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                planFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex items-center">
          <input
            type="text"
            placeholder="Search name, phone, address, pincode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:bg-white placeholder:text-slate-400"
          />
        </form>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading customer profiles...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No customer profiles match your filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">CUSTOMER NAME</th>
                  <th className="py-3.5 px-4">CONTACT & CLUSTER</th>
                  <th className="py-3.5 px-4">PROTECTION PLAN</th>
                  <th className="py-3.5 px-4">ORDERS & GMV</th>
                  <th className="py-3.5 px-4">DISPUTES</th>
                  <th className="py-3.5 px-4">MEMBER SINCE</th>
                  <th className="py-3.5 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {c.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{c.fullName}</span>
                            {c.isVip && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black uppercase">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-medium">{c.phone}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                        📍 {c.defaultAddressLine}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.activeSubscriptionPlan && c.activeSubscriptionPlan !== 'NONE' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                          <span>🛡️</span>
                          <span>{c.activeSubscriptionPlan.replace(/_/g, ' ')}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Standard</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>₹{c.totalSpendInr.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        {c.totalOrdersCount} service bookings
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.disputeCount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          ⚠️ {c.disputeCount} Logged
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[11px] font-medium">✓ 0 Disputes</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(c.memberSince).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewDossier(c.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition inline-flex items-center gap-1.5 border border-slate-200"
                      >
                        <span>📂</span>
                        <span>Dossier</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADM-SCR-10: Customer Lifetime Profile & Order History Modal */}
      {isDossierOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  ADM-SCR-10 · Customer Profile Dossier
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  <span>{selectedCustomer.fullName}</span>
                  {selectedCustomer.isVip && (
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      VIP Account
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Customer ID: <span className="font-mono text-slate-700">{selectedCustomer.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDossierOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Profile & Subscription Card */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Contact & Coordinates</span>
                <span className="text-slate-900 font-bold block mt-0.5">{selectedCustomer.phone}</span>
                <span className="text-slate-600 block">{selectedCustomer.email}</span>
                <span className="text-slate-600 block mt-1">📍 {selectedCustomer.defaultAddressLine}</span>
                <span className="text-blue-600 font-mono text-[11px] block font-semibold">
                  PIN: {selectedCustomer.defaultPincode} (Colaba Hub)
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Zex Cyber Security Shield</span>
                <div className="mt-1">
                  <span className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold inline-flex items-center gap-1">
                    <span>🛡️</span>
                    <span>{selectedCustomer.activeSubscriptionPlan || 'Standard'}</span>
                  </span>
                </div>
                {selectedCustomer.subscriptionExpiryDate && (
                  <div className="text-[11px] text-slate-500 mt-2">
                    Valid until:{' '}
                    <span className="text-slate-800 font-mono font-semibold">
                      {new Date(selectedCustomer.subscriptionExpiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  ✓ Priority 15-Minute Dispatch Eligible
                </div>
              </div>
            </div>

            {/* Work Order Lifecycle History */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Lifetime Service History</span>
                <span className="text-xs text-slate-500 font-normal">
                  {selectedCustomer.jobs?.length || 0} Work Orders
                </span>
              </h3>

              {selectedCustomer.jobs && selectedCustomer.jobs.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedCustomer.jobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">{job.jobTicketNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              job.status === 'WORK_COMPLETED' || job.status === 'SETTLED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : job.status === 'ESCALATED_SLA'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {job.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-slate-800 font-medium mt-1">{job.serviceTitle}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {job.technicianName ? `Assigned Tech: ${job.technicianName}` : 'Unassigned'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-sm">₹{job.totalAmountInr}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          OTP: <span className="text-amber-600 font-bold">{job.handoverOtp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  No work orders recorded yet.
                </div>
              )}
            </div>

            {/* Admin Notes */}
            {selectedCustomer.notes && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block text-[11px] font-semibold">Account Manager Notes:</span>
                <p className="text-slate-700 mt-0.5">{selectedCustomer.notes}</p>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsDossierOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition border border-slate-200"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Add Customer Account</h2>
                <p className="text-xs text-slate-500">Create new consumer profile and service destination address.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  required
                  placeholder="e.g. Rahul Kapoor"
                  value={newCust.fullName}
                  onChange={(e) => setNewCust({ ...newCust, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                  <input
                    required
                    placeholder="+919800011223"
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={newCust.email}
                    onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Premises Address *</label>
                <input
                  required
                  placeholder="Flat/House number, Apartment, Landmark"
                  value={newCust.defaultAddressLine}
                  onChange={(e) => setNewCust({ ...newCust, defaultAddressLine: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Default Pincode *</label>
                  <input
                    required
                    maxLength={6}
                    placeholder="400001"
                    value={newCust.defaultPincode}
                    onChange={(e) => setNewCust({ ...newCust, defaultPincode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Protection Plan</label>
                  <select
                    value={newCust.activeSubscriptionPlan}
                    onChange={(e) => setNewCust({ ...newCust, activeSubscriptionPlan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="NONE">None (Standard)</option>
                    <option value="ZEX_SHIELD_1MO">Zex Shield 1-Mo (₹199)</option>
                    <option value="ZEX_SHIELD_PRO_1YR">Zex Shield Pro 1-Yr (₹1,499)</option>
                    <option value="ENTERPRISE_PROTECT">Enterprise Protect (Custom)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/30"
                >
                  Confirm Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
