import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { inventoryService } from "../../services/inventory.service.js";
import {
  InventoryItemDTO,
  InventoryMetrics,
  InventoryTransactionDTO,
  StockStatus,
  InventoryReason,
} from "@vyre/shared";
import { formatCurrency } from "../../utils/formatters.js";
import { useToast } from "../../components/ui/toast.js";
import { Button } from "../../components/ui/button.js";
import { Modal } from "../../components/ui/modal.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import {
  Boxes,
  AlertTriangle,
  XCircle,
  Package,
  Layers,
  Search,
  History,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  User,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../utils/cn.js";

export const InventoryPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalProducts: 0,
    totalVariants: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalStockUnits: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "ALL">("ALL");

  // Adjust Modal state
  const [adjustingItem, setAdjustingItem] = useState<InventoryItemDTO | null>(null);
  const [adjustMode, setAdjustMode] = useState<"relative" | "absolute">("relative");
  const [changeAmount, setChangeAmount] = useState<number>(10);
  const [newStockAmount, setNewStockAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<InventoryReason>("RESTOCK");
  const [adjustNote, setAdjustNote] = useState("");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // History Modal state
  const [historyItem, setHistoryItem] = useState<InventoryItemDTO | null>(null);
  const [historyList, setHistoryList] = useState<InventoryTransactionDTO[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getInventory({
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });

      setItems(data.items);
      setMetrics(data.metrics);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);
    } catch (err: any) {
      toastError(err?.response?.data?.error || "Failed to load inventory data");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, toastError]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const openAdjustModal = (item: InventoryItemDTO) => {
    setAdjustingItem(item);
    setAdjustMode("relative");
    setChangeAmount(10);
    setNewStockAmount(item.stock);
    setAdjustReason("RESTOCK");
    setAdjustNote("");
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    setIsSubmittingAdjust(true);
    try {
      const payload =
        adjustMode === "relative"
          ? { changedQuantity: changeAmount, reason: adjustReason, note: adjustNote }
          : { newQuantity: newStockAmount, reason: adjustReason, note: adjustNote };

      const res = await inventoryService.adjustStock(adjustingItem.variantId, payload);
      success(`Updated stock for ${adjustingItem.sku} to ${res.variant.stock} units`);
      setAdjustingItem(null);
      fetchInventory();
    } catch (err: any) {
      toastError(err?.response?.data?.error || err.message || "Failed to adjust stock");
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const openHistoryModal = async (item: InventoryItemDTO) => {
    setHistoryItem(item);
    setIsLoadingHistory(true);
    try {
      const history = await inventoryService.getVariantHistory(item.variantId);
      setHistoryList(history);
    } catch (err: any) {
      toastError("Could not retrieve stock history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#d4af37]">
            Logistics & Warehousing
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight font-heading mt-0.5">
            Inventory Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInventory}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>

          <Link to="/admin/products">
            <Button variant="primary" size="sm" leftIcon={<Package className="h-3.5 w-3.5" />}>
              Manage Products
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-sm border border-neutral-800 bg-[#0d0d0f] space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total SKUs</span>
            <Boxes className="h-4 w-4 text-[#d4af37]" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{metrics.totalVariants}</p>
          <p className="text-[10px] text-neutral-500">{metrics.totalProducts} Active Products</p>
        </div>

        <div className="p-4 rounded-sm border border-neutral-800 bg-[#0d0d0f] space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Stock Units</span>
            <Layers className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{metrics.totalStockUnits}</p>
          <p className="text-[10px] text-neutral-500">Warehouse on-hand total</p>
        </div>

        <div
          onClick={() => setStatusFilter("IN_STOCK")}
          className={cn(
            "p-4 rounded-sm border transition-all cursor-pointer space-y-1",
            statusFilter === "IN_STOCK"
              ? "border-emerald-500/80 bg-emerald-950/20"
              : "border-neutral-800 bg-[#0d0d0f] hover:border-neutral-700"
          )}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold">In Stock</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            {metrics.totalVariants - metrics.lowStockCount - metrics.outOfStockCount}
          </p>
          <p className="text-[10px] text-neutral-500">Healthy stock levels</p>
        </div>

        <div
          onClick={() => setStatusFilter("LOW_STOCK")}
          className={cn(
            "p-4 rounded-sm border transition-all cursor-pointer space-y-1",
            statusFilter === "LOW_STOCK"
              ? "border-amber-500/80 bg-amber-950/20"
              : "border-neutral-800 bg-[#0d0d0f] hover:border-neutral-700"
          )}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Low Stock</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">{metrics.lowStockCount}</p>
          <p className="text-[10px] text-amber-500/80 font-semibold">Under 5 units remaining</p>
        </div>

        <div
          onClick={() => setStatusFilter("OUT_OF_STOCK")}
          className={cn(
            "p-4 rounded-sm border transition-all cursor-pointer space-y-1 col-span-2 md:col-span-1",
            statusFilter === "OUT_OF_STOCK"
              ? "border-rose-500/80 bg-rose-950/20"
              : "border-neutral-800 bg-[#0d0d0f] hover:border-neutral-700"
          )}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Out of Stock</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-500 font-mono">{metrics.outOfStockCount}</p>
          <p className="text-[10px] text-rose-400/80 font-semibold">Immediate restock required</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#0d0d0f] p-4 rounded-sm border border-neutral-800">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xs pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-[#d4af37]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {(["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xs text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
                statusFilter === st
                  ? "bg-[#d4af37] text-black"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              )}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inventory Data Table */}
      <div className="border border-neutral-800 rounded-sm overflow-hidden bg-[#0d0d0f]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] uppercase tracking-wider text-neutral-400">
                <th className="py-3.5 px-4 font-bold">Product</th>
                <th className="py-3.5 px-4 font-bold">SKU</th>
                <th className="py-3.5 px-4 font-bold">Color</th>
                <th className="py-3.5 px-4 font-bold">Size</th>
                <th className="py-3.5 px-4 font-bold">Price</th>
                <th className="py-3.5 px-4 font-bold text-center">Stock</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xs" />
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-2 w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><Skeleton className="h-3 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-3 w-16" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-3 w-8" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-3 w-16" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-10 mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-7 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    <Boxes className="h-10 w-10 mx-auto text-neutral-600 mb-2" />
                    <p className="font-semibold text-white">No inventory items matched your filters.</p>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Try adjusting your search terms or clearing the status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.variantId} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="h-10 w-10 rounded-xs object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/product/${item.productSlug}`}
                            target="_blank"
                            className="font-bold text-white hover:text-[#d4af37] transition-colors truncate block"
                          >
                            {item.productName}
                          </Link>
                          <span className="text-[10px] text-neutral-500 uppercase">{item.category}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-neutral-300 font-medium">
                      {item.sku}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-neutral-700 shrink-0"
                          style={{ backgroundColor: item.color.hexCode }}
                        />
                        <span className="text-neutral-300">{item.color.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-xs bg-neutral-800 text-white font-mono text-[11px] font-bold">
                        {item.size.code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-neutral-200">
                      {formatCurrency(item.price)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-black text-sm">
                      <span
                        className={cn(
                          item.stock <= 0
                            ? "text-rose-500"
                            : item.stock <= 5
                            ? "text-amber-400"
                            : "text-emerald-400"
                        )}
                      >
                        {item.stock}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-xs text-[10px] font-bold uppercase tracking-wider border",
                          item.status === "IN_STOCK" &&
                            "bg-emerald-950/40 text-emerald-400 border-emerald-800/60",
                          item.status === "LOW_STOCK" &&
                            "bg-amber-950/40 text-amber-400 border-amber-800/60",
                          item.status === "OUT_OF_STOCK" &&
                            "bg-rose-950/40 text-rose-400 border-rose-800/60"
                        )}
                      >
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openHistoryModal(item)}
                          className="text-neutral-400 hover:text-white"
                          title="View Stock Audit History"
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => openAdjustModal(item)}
                          className="text-[11px] font-bold"
                        >
                          Adjust
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-800 text-xs text-neutral-400">
            <span>
              Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, totalItems)} of {totalItems} items
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="font-mono text-white px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK STOCK ADJUST MODAL */}
      <Modal
        isOpen={!!adjustingItem}
        onClose={() => setAdjustingItem(null)}
        title="Quick Stock Adjustment"
      >
        {adjustingItem && (
          <form onSubmit={handleAdjustSubmit} className="space-y-5">
            {/* Item Summary Card */}
            <div className="p-3 rounded-sm border border-neutral-800 bg-neutral-900/60 flex items-center gap-3">
              <img
                src={adjustingItem.productImage}
                alt=""
                className="h-12 w-12 rounded-xs object-cover bg-neutral-900 border border-neutral-800 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{adjustingItem.productName}</p>
                <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                  <span className="font-mono">{adjustingItem.sku}</span>
                  <span>•</span>
                  <span>{adjustingItem.color.name}</span>
                  <span>•</span>
                  <span className="font-bold text-white">Size {adjustingItem.size.code}</span>
                </div>
              </div>
              <div className="text-right pl-2">
                <span className="text-[10px] text-neutral-500 uppercase block">Current Stock</span>
                <span className="text-lg font-black font-mono text-[#d4af37]">
                  {adjustingItem.stock}
                </span>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Adjustment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustMode("relative")}
                  className={cn(
                    "py-2 px-3 text-xs font-bold rounded-xs border text-center transition-colors",
                    adjustMode === "relative"
                      ? "bg-white text-black border-white"
                      : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
                  )}
                >
                  Add / Deduct (+/-)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode("absolute")}
                  className={cn(
                    "py-2 px-3 text-xs font-bold rounded-xs border text-center transition-colors",
                    adjustMode === "absolute"
                      ? "bg-white text-black border-white"
                      : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
                  )}
                >
                  Set New Total
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            {adjustMode === "relative" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Quantity to Add or Deduct
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-neutral-800 rounded-xs bg-neutral-900 flex-1">
                    <button
                      type="button"
                      onClick={() => setChangeAmount((prev) => prev - 1)}
                      className="h-10 w-10 flex items-center justify-center text-neutral-400 hover:text-white"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={changeAmount}
                      onChange={(e) => setChangeAmount(parseInt(e.target.value) || 0)}
                      className="flex-1 bg-transparent text-center font-mono font-bold text-white text-sm focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setChangeAmount((prev) => prev + 1)}
                      className="h-10 w-10 flex items-center justify-center text-neutral-400 hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    {[5, 10, 25, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setChangeAmount(num)}
                        className="h-10 px-2.5 rounded-xs bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold"
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 pt-1">
                  Resulting Stock:{" "}
                  <strong
                    className={cn(
                      adjustingItem.stock + changeAmount < 0
                        ? "text-rose-400"
                        : "text-emerald-400 font-mono"
                    )}
                  >
                    {adjustingItem.stock + changeAmount} units
                  </strong>
                  {adjustingItem.stock + changeAmount < 0 && (
                    <span className="text-rose-400 block"> (Cannot result in negative inventory)</span>
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Target Total Stock Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStockAmount}
                  onChange={(e) => setNewStockAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xs px-3 py-2 text-white font-mono text-sm focus:outline-hidden focus:border-[#d4af37]"
                />
                <p className="text-[11px] text-neutral-400">
                  Adjustment change:{" "}
                  <strong className="text-white font-mono">
                    {newStockAmount - adjustingItem.stock >= 0 ? "+" : ""}
                    {newStockAmount - adjustingItem.stock} units
                  </strong>
                </p>
              </div>
            )}

            {/* Reason Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Reason for Adjustment <span className="text-rose-400">*</span>
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value as InventoryReason)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white uppercase focus:outline-hidden focus:border-[#d4af37]"
              >
                <option value="RESTOCK">Restock / New Shipment</option>
                <option value="MANUAL_ADJUSTMENT">Manual Warehouse Audit / Count</option>
                <option value="RETURN">Customer Return / Exchange</option>
                <option value="DAMAGED">Damaged / Defective Stock</option>
                <option value="SALE">Manual In-Store Sale</option>
                <option value="CANCELLED_ORDER">Cancelled Order Restock</option>
                <option value="INITIAL_STOCK">Initial Production Run</option>
              </select>
            </div>

            {/* Note Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Audit Note / PO Reference (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Received shipment from Cairo factory #PO-2026-44"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xs p-3 text-xs text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-[#d4af37]"
              />
            </div>

            {/* CTAs */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustingItem(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                size="sm"
                isLoading={isSubmittingAdjust}
                disabled={adjustMode === "relative" && adjustingItem.stock + changeAmount < 0}
              >
                Confirm Adjustment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* STOCK AUDIT HISTORY MODAL */}
      <Modal
        isOpen={!!historyItem}
        onClose={() => setHistoryItem(null)}
        title="Inventory Audit History"
      >
        {historyItem && (
          <div className="space-y-5">
            {/* Variant Banner */}
            <div className="p-3 rounded-sm border border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">{historyItem.productName}</p>
                <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                  SKU: {historyItem.sku} | Size: {historyItem.size.code} | Color: {historyItem.color.name}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-500 uppercase block">Current</span>
                <span className="text-base font-black font-mono text-white">
                  {historyItem.stock} units
                </span>
              </div>
            </div>

            {/* History Timeline */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {isLoadingHistory ? (
                <div className="py-10 text-center text-xs text-neutral-400">
                  <div className="h-6 w-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading audit logs...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-sm">
                  No stock changes logged for this SKU yet.
                </div>
              ) : (
                historyList.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xs border border-neutral-800/80 bg-neutral-950 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                            tx.changedQuantity > 0
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                              : "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                          )}
                        >
                          {tx.changedQuantity > 0 ? `+${tx.changedQuantity}` : tx.changedQuantity} units
                        </span>

                        <span className="text-xs font-semibold text-white uppercase">
                          {tx.reason.replace(/_/g, " ")}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-neutral-500">
                        {new Date(tx.createdAt).toLocaleString("en-EG")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-900 pt-2">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-neutral-500" />
                        <span>{tx.userName || "System"}</span>
                      </div>

                      <div className="font-mono text-[11px]">
                        <span>{tx.previousQuantity}</span>
                        <ArrowRight className="inline h-2.5 w-2.5 mx-1 text-neutral-600" />
                        <strong className="text-white">{tx.newQuantity}</strong>
                      </div>
                    </div>

                    {tx.metadata?.note && (
                      <p className="text-[11px] text-neutral-400 italic bg-neutral-900/60 px-2 py-1 rounded-xs">
                        "{tx.metadata.note}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
