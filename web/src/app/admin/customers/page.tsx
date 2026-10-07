'use client';

import React, { useState, useEffect } from 'react';

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
  }, [planFilter]);

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
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
              ADM-SCR-09 & ADM-SCR-10
            </span>
            <span className="text-xs text-slate-400 font-medium">Customer CRM & Lifetime Value</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Customer Management & Lifetime Profiles</h1>
          <p className="text-sm text-slate-400">
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
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Accounts</div>
          <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">Across 4 major hubs</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Lifetime Spend</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            ₹{totalSpend.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Direct customer inflows</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Zex Shield Subscriptions</div>
          <div className="text-2xl font-black text-purple-400 mt-1">{activeSubscribers}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Active protection policies</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">VIP Accounts</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{vipCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Priority dispatch enabled</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Subscription Plan Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
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
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
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
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500 placeholder:text-slate-600"
          />
        </form>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading customer profiles...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No customer profiles match your filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-800 text-blue-300 flex items-center justify-center font-bold text-xs">
                          {c.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            <span>{c.fullName}</span>
                            {c.isVip && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{c.phone}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                        📍 {c.defaultAddressLine}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.activeSubscriptionPlan && c.activeSubscriptionPlan !== 'NONE' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-800/50 inline-flex items-center gap-1">
                          <span>🛡️</span>
                          <span>{c.activeSubscriptionPlan.replace(/_/g, ' ')}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Standard</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>₹{c.totalSpendInr.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {c.totalOrdersCount} service bookings
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.disputeCount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                          ⚠️ {c.disputeCount} Logged
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[11px] font-medium">✓ 0 Disputes</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(c.memberSince).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewDossier(c.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition inline-flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  ADM-SCR-10 · Customer Profile Dossier
                </span>
                <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                  <span>{selectedCustomer.fullName}</span>
                  {selectedCustomer.isVip && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                      VIP Account
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  Customer ID: <span className="font-mono text-slate-300">{selectedCustomer.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDossierOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Profile & Subscription Card */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Contact & Coordinates</span>
                <span className="text-white font-bold block mt-0.5">{selectedCustomer.phone}</span>
                <span className="text-slate-400 block">{selectedCustomer.email}</span>
                <span className="text-slate-400 block mt-1">📍 {selectedCustomer.defaultAddressLine}</span>
                <span className="text-blue-400 font-mono text-[11px] block">
                  PIN: {selectedCustomer.defaultPincode} (Colaba Hub)
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Zex Cyber Security Shield</span>
                <div className="mt-1">
                  <span className="px-2.5 py-1 rounded bg-purple-950/70 text-purple-300 border border-purple-800 text-[11px] font-bold inline-flex items-center gap-1">
                    <span>🛡️</span>
                    <span>{selectedCustomer.activeSubscriptionPlan || 'Standard'}</span>
                  </span>
                </div>
                {selectedCustomer.subscriptionExpiryDate && (
                  <div className="text-[11px] text-slate-400 mt-2">
                    Valid until:{' '}
                    <span className="text-slate-200 font-mono">
                      {new Date(selectedCustomer.subscriptionExpiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="text-[11px] text-emerald-400 font-medium mt-1">
                  ✓ Priority 15-Minute SOS Dispatch Eligible
                </div>
              </div>
            </div>

            {/* Work Order Lifecycle History */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Lifetime Service History</span>
                <span className="text-xs text-slate-400 font-normal">
                  {selectedCustomer.jobs?.length || 0} Work Orders
                </span>
              </h3>

              {selectedCustomer.jobs && selectedCustomer.jobs.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedCustomer.jobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{job.jobTicketNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              job.status === 'WORK_COMPLETED' || job.status === 'SETTLED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : job.status === 'ESCALATED_SLA'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {job.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-slate-300 font-medium mt-1">{job.serviceTitle}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {job.technicianName ? `Assigned Tech: ${job.technicianName}` : 'Unassigned'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-white text-sm">₹{job.totalAmountInr}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          OTP: <span className="text-amber-400 font-bold">{job.handoverOtp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  No work orders recorded yet.
                </div>
              )}
            </div>

            {/* Admin Notes */}
            {selectedCustomer.notes && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-500 block text-[11px] font-semibold">Account Manager Notes:</span>
                <p className="text-slate-300 mt-0.5">{selectedCustomer.notes}</p>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDossierOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Add Customer Account</h2>
                <p className="text-xs text-slate-400">Create new consumer profile and service destination address.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name *</label>
                <input
                  required
                  placeholder="e.g. Rahul Kapoor"
                  value={newCust.fullName}
                  onChange={(e) => setNewCust({ ...newCust, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number *</label>
                  <input
                    required
                    placeholder="+919800011223"
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={newCust.email}
                    onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Premises Address *</label>
                <input
                  required
                  placeholder="Flat/House number, Apartment, Landmark"
                  value={newCust.defaultAddressLine}
                  onChange={(e) => setNewCust({ ...newCust, defaultAddressLine: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Default Pincode *</label>
                  <input
                    required
                    maxLength={6}
                    placeholder="400001"
                    value={newCust.defaultPincode}
                    onChange={(e) => setNewCust({ ...newCust, defaultPincode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Protection Plan</label>
                  <select
                    value={newCust.activeSubscriptionPlan}
                    onChange={(e) => setNewCust({ ...newCust, activeSubscriptionPlan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                  >
                    <option value="NONE">None (Standard)</option>
                    <option value="ZEX_SHIELD_1MO">Zex Shield 1-Mo (₹199)</option>
                    <option value="ZEX_SHIELD_PRO_1YR">Zex Shield Pro 1-Yr (₹1,499)</option>
                    <option value="ENTERPRISE_PROTECT">Enterprise Protect (Custom)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
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
