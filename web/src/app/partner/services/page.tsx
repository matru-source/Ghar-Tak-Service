'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ServiceOffering {
  id: string;
  code: string;
  title: string;
  categoryId: string;
  categoryName: string;
  basePriceInr: number;
  gstRatePct: number;
  estimatedDurationMinutes: number;
  isEmergencySosEligible: boolean;
  isPaused?: boolean;
  pricing: {
    baseAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    totalGstAmount: number;
    totalPayableInr: number;
    formatted: string;
  };
}

const CATEGORY_CHIPS = [
  { name: 'All Categories', slug: 'ALL', icon: '⚡' },
  { name: 'Plumber', slug: 'plumber', icon: '🚰' },
  { name: 'Electrician', slug: 'electrician', icon: '💡' },
  { name: 'Carpenter', slug: 'carpenter', icon: '🪚' },
  { name: 'Cleaner', slug: 'cleaner', icon: '🧹' },
  { name: 'Rajmistri', slug: 'rajmistri', icon: '🧱' },
  { name: 'Appliance & AC', slug: 'hot-cool', icon: '❄️' },
  { name: 'Gas Stove', slug: 'gas-stove', icon: '🔥' },
  { name: 'Pest Control', slug: 'pest-control-service', icon: '🐜' },
  { name: 'Packers & Movers', slug: 'packers-movers', icon: '📦' },
];

export default function PartnerServicesPage() {
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Service Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('plumber');
  const [newPrice, setNewPrice] = useState('399');
  const [newDuration, setNewDuration] = useState('45');
  const [newIsSos, setNewIsSos] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services');
      const json = await res.json();
      if (json.success && json.data?.services) {
        setServices(json.data.services);
      }
    } catch (e) {
      console.error('Failed to load services', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleTogglePause = async (service: ServiceOffering) => {
    setActionInProgress(service.id);
    const newPaused = !service.isPaused;
    try {
      const res = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service.id, isPaused: newPaused }),
      });
      const data = await res.json();
      if (data.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, isPaused: newPaused } : s))
        );
        showToast(
          newPaused
            ? `⏸️ "${service.title}" paused in your territory`
            : `▶️ "${service.title}" resumed & live for bookings`
        );
      }
    } catch {
      showToast('❌ Failed to update service status');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteService = async (service: ServiceOffering) => {
    if (!confirm(`Are you sure you want to remove "${service.title}" from your catalog?`)) {
      return;
    }
    setActionInProgress(service.id);
    try {
      const res = await fetch(`/api/services?id=${service.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setServices((prev) => prev.filter((s) => s.id !== service.id));
        showToast(`🗑️ "${service.title}" removed from catalog`);
      }
    } catch {
      showToast('❌ Failed to remove service');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newTitle.trim() || !newPrice) {
      setAddError('Service title and base price are required');
      return;
    }

    try {
      setActionInProgress('create');
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          categorySlug: newCategorySlug,
          basePriceInr: Number(newPrice),
          estimatedDurationMinutes: Number(newDuration),
          isEmergencySosEligible: newIsSos,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✅ "${newTitle}" added to territory service catalog`);
        setShowAddModal(false);
        setNewTitle('');
        setNewPrice('399');
        await loadServices();
      } else {
        setAddError(json.error?.message || 'Failed to add service');
      }
    } catch (err: any) {
      setAddError(err.message || 'Network error');
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' ||
      s.categoryName.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      s.categoryId.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const totalServices = services.length;
  const activeCount = services.filter((s) => !s.isPaused).length;
  const pausedCount = services.filter((s) => s.isPaused).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 tracking-wider uppercase mb-1">
            <span>🛠️ Partner Operations Console</span>
            <span>•</span>
            <span>Territory Service Catalog</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Manage Service Offerings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Add new trade offerings, adjust local pricing, and pause/resume specific services across plumbing, electrical, carpentry, cleaning, and masonry.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <span>➕</span>
          <span>Add New Service</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Services</div>
          <div className="text-3xl font-black text-slate-800 mt-1">{totalServices}</div>
          <div className="text-xs text-slate-500 mt-1">Across 10+ trade categories</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active & Bookable</div>
          <div className="text-3xl font-black text-emerald-700 mt-1">{activeCount}</div>
          <div className="text-xs text-emerald-600 mt-1">Receiving customer dispatches</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Paused in Territory</div>
          <div className="text-3xl font-black text-amber-700 mt-1">{pausedCount}</div>
          <div className="text-xs text-amber-600 mt-1">Hidden from customer instant booking</div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by service title, code (e.g. PLUMB-TANK, FAN-INSTALL), or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800"
          />
          <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_CHIPS.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Service Grid */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="animate-spin text-3xl">⚙️</div>
          <div className="text-sm font-bold text-slate-600">Loading catalog offerings...</div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="text-4xl">🔍</div>
          <div className="text-base font-bold text-slate-800">No Services Found</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No service offerings match the active filter or search query. Click &quot;Add New Service&quot; above to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const isPaused = !!service.isPaused;
            const isBusy = actionInProgress === service.id;

            return (
              <div
                key={service.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                  isPaused
                    ? 'border-amber-200 bg-amber-50/20 opacity-80'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {service.categoryName}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isPaused
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {isPaused ? '⏸️ Paused' : '🟢 Live & Active'}
                    </span>
                  </div>

                  {/* Title & Code */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{service.title}</h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{service.code}</div>
                  </div>

                  {/* Price & Details */}
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Base Labor</div>
                      <div className="text-lg font-black text-slate-900">₹{service.basePriceInr}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Duration</div>
                      <div className="text-xs font-bold text-slate-700">~{service.estimatedDurationMinutes} mins</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">With 18% GST</div>
                      <div className="text-xs font-black text-emerald-700">
                        ₹{(service.basePriceInr * 1.18).toFixed(0)}
                      </div>
                    </div>
                  </div>

                  {service.isEmergencySosEligible && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <span>🚨</span>
                      <span>Eligible for 15-min SOS Dispatch</span>
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    disabled={isBusy}
                    onClick={() => handleTogglePause(service)}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isPaused
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                    }`}
                  >
                    {isBusy ? (
                      <span className="animate-spin text-xs">⏳</span>
                    ) : isPaused ? (
                      <>
                        <span>▶️</span>
                        <span>Resume Service</span>
                      </>
                    ) : (
                      <>
                        <span>⏸️</span>
                        <span>Pause Service</span>
                      </>
                    )}
                  </button>

                  <button
                    disabled={isBusy}
                    onClick={() => handleDeleteService(service)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Remove Service"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Add Territory Service Offering</h2>
                <p className="text-xs text-slate-500">Service will be bookable in your registered pincodes.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water Tank Chemical Wash & Disinfection"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trade Category</label>
                  <select
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="plumber">Plumber</option>
                    <option value="electrician">Electrician</option>
                    <option value="carpenter">Carpenter</option>
                    <option value="cleaner">Cleaner</option>
                    <option value="rajmistri">Rajmistri</option>
                    <option value="hot-cool">Appliance & AC</option>
                    <option value="gas-stove">Gas Stove</option>
                    <option value="pest-control-service">Pest Control</option>
                    <option value="packers-movers">Packers & Movers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Base Labor Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 499"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Est. Duration (Mins)</label>
                  <input
                    type="number"
                    min="10"
                    placeholder="45"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newIsSos}
                      onChange={(e) => setNewIsSos(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Emergency SOS (15-min)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress === 'create'}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {actionInProgress === 'create' ? (
                    <>
                      <span className="animate-spin text-xs">⏳</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Service</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
