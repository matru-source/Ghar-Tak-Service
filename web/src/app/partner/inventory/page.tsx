'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Package,
  Layers,
  ArrowLeft,
  Plus,
  Check,
} from '@/components/ui/icons';

interface PartnerInventoryItem {
  id: string;
  partnerId: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  mrpInr: number;
  costPriceInr: number;
  stockQuantity: number;
  gstRatePct: number;
  warrantyMonths: number;
  isActive: boolean;
}

interface InventoryTelemetry {
  totalSkus: number;
  totalUnitsInStock: number;
  totalInventoryValueInr: number;
  lowStockCount: number;
}

export default function PartnerWarehouseInventoryPage() {
  const [inventory, setInventory] = useState<PartnerInventoryItem[]>([]);
  const [telemetry, setTelemetry] = useState<InventoryTelemetry>({
    totalSkus: 0,
    totalUnitsInStock: 0,
    totalInventoryValueInr: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [restockItem, setRestockItem] = useState<PartnerInventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(20);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchInventory = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/partner/inventory?partnerId=ptnr_mah_01');
      if (!res.ok) throw new Error('Failed to load inventory');
      const json = await res.json();
      if (json.success && json.data) {
        setInventory(json.data.inventory || []);
        setTelemetry({
          totalSkus: json.data.totalSkus || 0,
          totalUnitsInStock: json.data.totalUnitsInStock || 0,
          totalInventoryValueInr: json.data.totalInventoryValueInr || 0,
          lowStockCount: json.data.lowStockCount || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching partner inventory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleRestock = () => {
    if (!restockItem) return;
    setInventory((prev) =>
      prev.map((item) =>
        item.id === restockItem.id
          ? { ...item, stockQuantity: item.stockQuantity + restockQty }
          : item
      )
    );
    showToast(`✓ Restocked ${restockQty} units of ${restockItem.name}`);
    setRestockItem(null);
  };

  const filteredItems = inventory.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.sku.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/partner/dispatch"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Franchise Warehouse Inventory & Spares
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                  MAH HUB 01
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Pre-negotiated MRP catalog, automated field usage stock decrements & real-time inventory ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchInventory}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
              <span>Sync Warehouse</span>
            </button>
            <Link
              href="/partner/dispatch"
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <span>🛰️</span>
              <span>Live Fleet Dispatch</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* KPI Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catalog SKUs</div>
            <div className="mt-2 text-2xl font-black text-slate-900">{telemetry.totalSkus}</div>
            <div className="mt-1 text-[11px] text-slate-400">GST-compliant verified items</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Physical Stock</div>
            <div className="mt-2 text-2xl font-black text-emerald-600 flex items-baseline gap-1.5">
              {telemetry.totalUnitsInStock}
              <span className="text-xs font-semibold text-slate-500">Units on Shelf</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Available for field allocation</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stock Valuation</div>
            <div className="mt-2 text-2xl font-black text-blue-600">
              ₹{telemetry.totalInventoryValueInr.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">At franchise wholesale cost</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reorder Alerts</div>
            <div className="mt-2 text-2xl font-black text-amber-600 flex items-baseline gap-1.5">
              {telemetry.lowStockCount}
              <span className="text-xs font-semibold text-amber-700">Low Stock</span>
            </div>
            <div className="mt-1 text-[11px] text-amber-600 font-semibold">Stock quantity ≤ 10 units</div>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'ELECTRICAL', 'PLUMBING', 'CLEANING', 'CARPENTRY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU, component name, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Inventory Stock Grid */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading warehouse inventory...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <Package className="w-8 h-8 text-slate-400" />
            <span className="font-bold text-slate-800 text-sm">No inventory items found</span>
            <span>Try adjusting your category filter or search query.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isLowStock = item.stockQuantity <= 10;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition ${
                    isLowStock ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
                          {item.sku}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                          {item.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                        {item.brand}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 text-xs border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">MRP Cap</span>
                        <span className="font-black text-slate-900">₹{item.mrpInr.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 ml-1">/ {item.unit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">GST Rate</span>
                        <span className="font-extrabold text-slate-800">{item.gstRatePct}% HSN</span>
                        <span className="text-[10px] text-slate-500 ml-1">({item.warrantyMonths}m war.)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Current Stock</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-base font-black ${isLowStock ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {item.stockQuantity}
                        </span>
                        <span className="text-[11px] text-slate-500">{item.unit}s</span>
                        {isLowStock && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Low
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRestockItem(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Restock</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="font-black text-base text-slate-900">Restock Warehouse Inventory</h3>
            <p className="text-xs text-slate-500 mt-1">
              {restockItem.name} (<span className="font-mono text-orange-600 font-bold">{restockItem.sku}</span>)
            </p>

            <div className="my-4 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Units to Add</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full text-sm font-bold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-xs font-bold text-slate-500">{restockItem.unit}s</span>
              </div>
              <p className="text-[11px] text-slate-400">
                New total on shelf: <strong className="text-slate-800">{restockItem.stockQuantity + restockQty}</strong> units
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestock}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Delivery</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
