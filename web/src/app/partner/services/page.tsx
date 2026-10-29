'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRealtimeEvents } from '@/lib/use-realtime-events';

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
  description?: string;
  pricing: {
    baseAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    totalGstAmount: number;
    totalPayableInr: number;
    formatted: string;
  };
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  servicesCount?: number;
}

export default function PartnerServicesPage() {
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Service Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newPrice, setNewPrice] = useState('399');
  const [newDuration, setNewDuration] = useState('45');
  const [newIsSos, setNewIsSos] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  // Add Category Modal
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Edit Service Modal
  const [editingService, setEditingService] = useState<ServiceOffering | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editIsSos, setEditIsSos] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/services/categories');
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.categories)) {
        setCategories(json.data.categories);
        if (!newCategoryId && json.data.categories.length > 0) {
          setNewCategoryId(json.data.categories[0].id);
        }
      }
    } catch (e) {
      console.warn('Failed to load categories:', e);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services?includeAll=true');
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

  const handleCatalogRealtimeEvent = useCallback((event: any) => {
    if (
      event.type === 'SERVICE_UPDATED' ||
      event.type === 'SERVICE_CREATED' ||
      event.type === 'CATEGORY_CREATED'
    ) {
      loadServices();
      loadCategories();
    }
  }, []);

  const { status: catalogBusStatus } = useRealtimeEvents({
    role: 'PARTNER',
    onEvent: handleCatalogRealtimeEvent,
  });

  useEffect(() => {
    loadServices();
    loadCategories();
    const interval = setInterval(() => {
      loadServices();
      loadCategories();
    }, 45000);
    return () => clearInterval(interval);
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
            ? `⏸️ "${service.title}" paused (hidden from customer app)`
            : `▶️ "${service.title}" resumed (live across customer & technician platforms)`
        );
      } else {
        showToast(`❌ ${data.error || 'Failed to update service'}`);
      }
    } catch {
      showToast('❌ Network error updating service');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteService = async (service: ServiceOffering) => {
    if (!confirm(`Are you sure you want to deactivate and remove "${service.title}" from the catalog?`)) {
      return;
    }
    setActionInProgress(service.id);
    try {
      const res = await fetch(`/api/services?id=${encodeURIComponent(service.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setServices((prev) => prev.filter((s) => s.id !== service.id));
        showToast(`🗑️ "${service.title}" removed from catalog`);
        loadCategories(); // refresh category counts
      } else {
        showToast(`❌ ${data.error || 'Failed to remove service'}`);
      }
    } catch {
      showToast('❌ Network error removing service');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteCategory = async (cat: ServiceCategory) => {
    if (!confirm(`Are you sure you want to permanently delete category "${cat.name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/services/categories?id=${encodeURIComponent(cat.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        setSelectedCategoryId('ALL');
        showToast(`🗑️ Category "${cat.name}" removed from platform`);
      } else {
        showToast(`❌ ${data.error || 'Failed to remove category'}`);
      }
    } catch {
      showToast('❌ Network error removing category');
    }
  };

  const handleOpenEdit = (service: ServiceOffering) => {
    setEditingService(service);
    setEditTitle(service.title);
    setEditPrice(String(service.basePriceInr));
    setEditDuration(String(service.estimatedDurationMinutes));
    setEditIsSos(!!service.isEmergencySosEligible);
    setEditDescription(service.description || '');

    const matchingCat = categories.find(
      (c) => c.id === service.categoryId || c.name === service.categoryName
    );
    setEditCategoryId(matchingCat?.id || service.categoryId || (categories[0]?.id || ''));
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    if (!editTitle.trim()) {
      setEditError('Title is required');
      return;
    }
    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setEditError('Please enter a valid base price in INR');
      return;
    }

    setIsSubmittingService(true);
    setEditError(null);

    try {
      const res = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingService.id,
          title: editTitle.trim(),
          categoryId: editCategoryId,
          basePriceInr: parsedPrice,
          estimatedDurationMinutes: parseInt(editDuration, 10) || 45,
          isEmergencySosEligible: editIsSos,
          description: editDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const updated = data.data;
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? { ...s, ...updated } : s))
        );
        showToast(`✅ "${editTitle.trim()}" successfully updated across platform`);
        setEditingService(null);
        loadCategories();
      } else {
        setEditError(data.error || 'Failed to update service');
      }
    } catch (err: any) {
      setEditError(err.message || 'Network error saving changes');
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setAddError('Title is required');
      return;
    }
    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setAddError('Please enter a valid base price in INR');
      return;
    }

    setIsSubmittingService(true);
    setAddError(null);

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          categoryId: newCategoryId || categories[0]?.id,
          basePriceInr: parsedPrice,
          estimatedDurationMinutes: parseInt(newDuration, 10) || 45,
          isEmergencySosEligible: newIsSos,
          description: newDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setServices((prev) => [data.data, ...prev]);
        showToast(`🎉 "${newTitle.trim()}" published live to catalog`);
        setShowAddModal(false);
        setNewTitle('');
        setNewPrice('399');
        setNewDuration('45');
        setNewIsSos(false);
        setNewDescription('');
        loadCategories();
      } else {
        setAddError(data.error || 'Failed to create service');
      }
    } catch (err: any) {
      setAddError(err.message || 'Network error');
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setAddCategoryError('Category name is required');
      return;
    }

    setIsSubmittingCategory(true);
    setAddCategoryError(null);

    try {
      const res = await fetch('/api/services/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          slug: newCatSlug.trim() || undefined,
          description: newCatDesc.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const createdCat = data.data;
        setCategories((prev) => [...prev, createdCat]);
        setSelectedCategoryId(createdCat.id);
        setNewCategoryId(createdCat.id);
        showToast(`🎉 Category "${createdCat.name}" created & synced across platform!`);
        setShowAddCategoryModal(false);
        setNewCatName('');
        setNewCatSlug('');
        setNewCatDesc('');
      } else {
        setAddCategoryError(data.error || 'Failed to create category');
      }
    } catch (err: any) {
      setAddCategoryError(err.message || 'Network error creating category');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Filter services by active selected category and search
  const filteredServices = services.filter((s) => {
    if (selectedCategoryId !== 'ALL') {
      const matchCat =
        s.categoryId === selectedCategoryId ||
        categories.find((c) => c.id === selectedCategoryId)?.name === s.categoryName ||
        categories.find((c) => c.id === selectedCategoryId)?.slug === s.categoryId;
      if (!matchCat) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchCode = s.code.toLowerCase().includes(q);
      const matchCat = s.categoryName?.toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchCat) return false;
    }

    return true;
  });

  const totalCount = services.length;
  const activeCount = services.filter((s) => !s.isPaused).length;
  const pausedCount = services.filter((s) => !!s.isPaused).length;

  const activeCategoryObj = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>Partner Operations Console</span>
            <span>&bull;</span>
            <span className="text-[#1B5E20]">Territory Service Catalog</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Manage Service Offerings
            </h1>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${
              catalogBusStatus === 'CONNECTED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${catalogBusStatus === 'CONNECTED' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              {catalogBusStatus === 'CONNECTED' ? 'LIVE CATALOG' : 'CONNECTING...'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Fully dynamic catalog with live category creation, real-time pricing sync, and instant dispatches for Customers and Technicians.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Add Category Button */}
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#1B5E20] border border-emerald-200 rounded-xl text-sm font-bold transition shadow-2xs cursor-pointer"
          >
            <span>📁</span>
            <span>Add New Category</span>
          </button>

          {/* Add Service Button */}
          <button
            onClick={() => {
              if (selectedCategoryId !== 'ALL') {
                setNewCategoryId(selectedCategoryId);
              }
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-sm font-bold transition shadow-xs cursor-pointer"
          >
            <span>➕</span>
            <span>Add New Service</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Services</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-xs text-slate-500 mt-1">Across {categories.length} trade categories</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Active &amp; Bookable</div>
          <div className="text-3xl font-black text-emerald-700 mt-1">{activeCount}</div>
          <div className="text-xs text-emerald-600 mt-1">Receiving customer dispatches</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600">Paused in Territory</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{pausedCount}</div>
          <div className="text-xs text-amber-600 mt-1">Hidden from customer instant booking</div>
        </div>
      </div>

      {/* Search & Dynamic Category Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by service title, code (e.g. SRV-FAN-01), or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800"
          />
          <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
        </div>

        {/* Dynamic Categories Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {/* All Categories Chip */}
          <button
            onClick={() => setSelectedCategoryId('ALL')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryId === 'ALL'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>⚡</span>
            <span>All Categories ({totalCount})</span>
          </button>

          {/* Dynamic Categories from PostgreSQL */}
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const countForCat = services.filter(
              (s) => s.categoryId === cat.id || s.categoryName === cat.name
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{cat.icon || '🛠️'}</span>
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {countForCat}
                </span>
              </button>
            );
          })}

          {/* Fast inline button to add new category */}
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 whitespace-nowrap transition cursor-pointer"
            title="Create a new trade category"
          >
            <span>+</span>
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Tabular Services View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {activeCategoryObj ? (
              <span>
                {activeCategoryObj.icon} {activeCategoryObj.name} ({filteredServices.length} Offerings)
              </span>
            ) : (
              <span>Catalog Directory ({filteredServices.length} Offerings)</span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Live database sync with customer apps, technician roster &amp; dispatch engine
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="animate-spin text-3xl">⚙️</div>
            <div className="text-sm font-bold text-slate-600">Loading catalog offerings...</div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-4xl">🔍</div>
            <div className="text-base font-bold text-slate-800">
              {activeCategoryObj
                ? `No Services in "${activeCategoryObj.name}" Yet`
                : 'No Services Found'}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeCategoryObj
                ? `There are currently no active service offerings configured under ${activeCategoryObj.name}. Click below to create the first service for this category!`
                : 'No service offerings match the active filter or search query.'}
            </p>
            <div className="flex items-center justify-center gap-2.5 mt-2 flex-wrap">
              <button
                onClick={() => {
                  if (selectedCategoryId !== 'ALL') {
                    setNewCategoryId(selectedCategoryId);
                  }
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>➕</span>
                <span>
                  {activeCategoryObj
                    ? `Add First Service in ${activeCategoryObj.name}`
                    : 'Add New Service'}
                </span>
              </button>

              {activeCategoryObj && (
                <button
                  onClick={() => handleDeleteCategory(activeCategoryObj)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <span>🗑️</span>
                  <span>Delete Category &quot;{activeCategoryObj.name}&quot;</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Service Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Base Labor</th>
                  <th className="py-3.5 px-4 text-right">With 18% GST</th>
                  <th className="py-3.5 px-4 text-center">Duration</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredServices.map((service) => {
                  const isPaused = !!service.isPaused;
                  const isBusy = actionInProgress === service.id;
                  const priceWithGst = Math.round(service.basePriceInr * 1.18);

                  return (
                    <tr
                      key={service.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPaused ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Service Details */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 text-base">
                            {service.categoryName?.toLowerCase().includes('electric')
                              ? '💡'
                              : service.categoryName?.toLowerCase().includes('plumb')
                              ? '🚰'
                              : service.categoryName?.toLowerCase().includes('carp')
                              ? '🪚'
                              : '🛠️'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm leading-snug">
                              {service.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {service.code}
                              </span>
                              {service.isEmergencySosEligible && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  <span>🚨</span>
                                  <span>15-min SOS</span>
                                </span>
                              )}
                            </div>
                            {service.description && (
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {service.categoryName || 'General'}
                        </span>
                      </td>

                      {/* Base Labor */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                        ₹{service.basePriceInr.toLocaleString('en-IN')}
                      </td>

                      {/* With 18% GST */}
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                        ₹{priceWithGst.toLocaleString('en-IN')}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        ~{service.estimatedDurationMinutes} mins
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPaused
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                            }`}
                          />
                          {isPaused ? 'Paused' : 'Active & Live'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(service)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            title="Edit Service Details & Price"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>

                          {/* Pause / Resume Button */}
                          <button
                            disabled={isBusy}
                            onClick={() => handleTogglePause(service)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
                              isPaused
                                ? 'bg-emerald-50 text-[#1B5E20] border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            }`}
                            title={isPaused ? 'Resume Service' : 'Pause Service'}
                          >
                            <span>{isPaused ? '▶️' : '⏸️'}</span>
                            <span>{isPaused ? 'Resume' : 'Pause'}</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            disabled={isBusy}
                            onClick={() => handleDeleteService(service)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title="Remove Service"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">📁 Add New Trade Category</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Creates a dynamic category synchronized across Customer and Technician apps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addCategoryError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                ⚠️ {addCategoryError}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Solar &amp; Inverter Solutions, Deep Cleaning"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    if (!newCatSlug) {
                      setNewCatSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '')
                      );
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Slug (Auto-Generated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. solar-and-inverter-solutions"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of services covered under this trade..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="px-5 py-2 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingCategory ? <span>Creating...</span> : <span>📁 Create Category</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">✏️ Edit Service Offering</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Code: <span className="font-mono font-bold text-slate-700">{editingService.code}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                ⚠️ {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Labor Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                    required
                  />
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                    With 18% GST: ₹{(Number(editPrice || 0) * 1.18).toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Category *</label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(true)}
                    className="text-[11px] text-emerald-700 font-bold hover:underline"
                  >
                    + Add New Category
                  </button>
                </div>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon || '🛠️'} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Service coverage details for customer..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">15-min Emergency SOS Eligible</div>
                  <div className="text-[10px] text-slate-500">Allow customers to book as urgent SOS dispatch</div>
                </div>
                <input
                  type="checkbox"
                  checked={editIsSos}
                  onChange={(e) => setEditIsSos(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingService}
                  className="px-5 py-2 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingService ? <span>Saving...</span> : <span>💾 Save Changes</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">➕ Add New Service Offering</h3>
                <p className="text-xs text-slate-500 mt-0.5">Publish a new trade offering to territory catalog</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                ⚠️ {addError}
              </div>
            )}

            <form onSubmit={handleCreateService} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Submersible Water Pump Capacitor Replacement"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Labor Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="399"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                    required
                  />
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                    With 18% GST: ₹{(Number(newPrice || 0) * 1.18).toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    placeholder="45"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Category *</label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(true)}
                    className="text-[11px] text-emerald-700 font-bold hover:underline"
                  >
                    + Add New Category
                  </button>
                </div>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon || '🛠️'} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detailed scope of labor included in this service..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">15-min Emergency SOS Eligible</div>
                  <div className="text-[10px] text-slate-500">Allow customers to trigger priority dispatch</div>
                </div>
                <input
                  type="checkbox"
                  checked={newIsSos}
                  onChange={(e) => setNewIsSos(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingService}
                  className="px-5 py-2 bg-[#1B5E20] hover:bg-[#0D3B0D] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingService ? <span>Publishing...</span> : <span>🚀 Publish Service</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
