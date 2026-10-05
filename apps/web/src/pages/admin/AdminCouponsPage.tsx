// apps/web/src/pages/admin/AdminCouponsPage.tsx

import React, { useState, useEffect } from "react";
import { couponService } from "../../services/coupon.service.js";
import { CouponDTO, CreateCouponPayload } from "@vyre/shared";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Badge } from "../../components/ui/badge.js";
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  Percent,
  Banknote,
} from "lucide-react";

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponDTO | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<CouponDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    value: 10,
    minimumOrderAmount: 0,
    maximumDiscount: 0,
    usageLimit: 0,
    expiryDate: "",
    active: true,
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponService.getCoupons({
        page,
        limit: 15,
        search: search.trim() || undefined,
        type: typeFilter !== "ALL" ? (typeFilter as any) : undefined,
        active: statusFilter === "ACTIVE" ? true : statusFilter === "INACTIVE" ? false : undefined,
      });
      setCoupons(res.coupons);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [page, typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCoupons();
  };

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      description: "",
      type: "PERCENTAGE",
      value: 15,
      minimumOrderAmount: 500,
      maximumDiscount: 500,
      usageLimit: 100,
      expiryDate: "",
      active: true,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: CouponDTO) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      type: coupon.type,
      value: coupon.value,
      minimumOrderAmount: coupon.minimumOrderAmount || 0,
      maximumDiscount: coupon.maximumDiscount || 0,
      usageLimit: coupon.usageLimit || 0,
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split("T")[0] : "",
      active: coupon.active,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const payload: CreateCouponPayload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        value: Number(formData.value),
        minimumOrderAmount: Number(formData.minimumOrderAmount) || undefined,
        maximumDiscount: Number(formData.maximumDiscount) || undefined,
        usageLimit: Number(formData.usageLimit) || undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
        active: formData.active,
      };

      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon.id, payload);
      } else {
        await couponService.createCoupon(payload);
      }

      setIsModalOpen(false);
      loadCoupons();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to save coupon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: CouponDTO) => {
    try {
      await couponService.updateCoupon(coupon.id, { active: !coupon.active });
      loadCoupons();
    } catch (err) {
      console.error("Failed to toggle coupon active status:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!couponToDelete) return;
    setIsSubmitting(true);
    try {
      await couponService.deleteCoupon(couponToDelete.id);
      setCouponToDelete(null);
      loadCoupons();
    } catch (err) {
      console.error("Failed to delete coupon:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-white font-heading tracking-wider flex items-center gap-2">
            <Tag className="h-6 w-6 text-brand-gold" />
            Coupons & Promotions
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Authoritative promotional discounts with minimum orders, caps, and usage limits.
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          className="uppercase tracking-wider font-bold text-xs"
          onClick={handleOpenCreateModal}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Promo Code
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-md">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or description..."
            leftIcon={<Search className="h-4 w-4 text-neutral-500" />}
            className="bg-black/50 border-neutral-800 text-xs text-white"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by coupon type"
            className="bg-black/60 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-brand-gold"
          >
            <option value="ALL">All Types</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED_AMOUNT">Fixed Amount (EGP)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by coupon status"
            className="bg-black/60 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-brand-gold"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          <Button variant="ghost" size="sm" onClick={loadCoupons} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-neutral-400">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-400 space-y-2">
            <Tag className="h-8 w-8 mx-auto text-neutral-600 mb-2" />
            <p className="font-bold text-white uppercase tracking-wider">No Coupons Found</p>
            <p className="text-[11px]">Create your first promotional code to incentivize buyers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-black/40 text-neutral-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min. Spend</th>
                  <th className="py-3 px-4">Max. Discount</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {coupons.map((coupon) => {
                  const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                  const isExhausted = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;

                  return (
                    <tr key={coupon.id} className="hover:bg-neutral-800/30 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 text-brand-gold">
                            {coupon.code}
                          </span>
                        </div>
                        {coupon.description && (
                          <p className="text-[10px] text-neutral-500 font-sans mt-0.5 truncate max-w-xs">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="flex items-center gap-1 font-bold text-white">
                          {coupon.type === "PERCENTAGE" ? (
                            <>
                              <Percent className="h-3 w-3 text-brand-gold" />
                              {coupon.value}% OFF
                            </>
                          ) : (
                            <>
                              <Banknote className="h-3 w-3 text-emerald-400" />
                              {formatCurrency(coupon.value)} OFF
                            </>
                          )}
                        </span>
                      </td>

                      {/* Min Spend */}
                      <td className="py-3.5 px-4 font-mono text-neutral-300">
                        {coupon.minimumOrderAmount
                          ? formatCurrency(coupon.minimumOrderAmount)
                          : "No min"}
                      </td>

                      {/* Max Discount */}
                      <td className="py-3.5 px-4 font-mono text-neutral-300">
                        {coupon.maximumDiscount
                          ? formatCurrency(coupon.maximumDiscount)
                          : "Uncapped"}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4 font-mono text-neutral-300">
                        <span
                          className={
                            isExhausted ? "text-rose-400 font-bold" : "text-neutral-300"
                          }
                        >
                          {coupon.usedCount} / {coupon.usageLimit ?? "∞"}
                        </span>
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                        {coupon.expiryDate ? (
                          <span className={isExpired ? "text-rose-400 font-bold" : ""}>
                            {formatDate(coupon.expiryDate)}
                          </span>
                        ) : (
                          <span className="text-neutral-500">Never</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <Badge variant="destructive" className="text-[9px]">
                            Expired
                          </Badge>
                        ) : isExhausted ? (
                          <Badge variant="destructive" className="text-[9px]">
                            Limit Reached
                          </Badge>
                        ) : coupon.active ? (
                          <Badge variant="success" className="text-[9px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px]">
                            Inactive
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(coupon)}
                            title={coupon.active ? "Deactivate" : "Activate"}
                            className="p-1 h-7 w-7"
                          >
                            {coupon.active ? (
                              <XCircle className="h-3.5 w-3.5 text-neutral-400 hover:text-rose-400" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-neutral-400 hover:text-emerald-400" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(coupon)}
                            title="Edit"
                            className="p-1 h-7 w-7 text-neutral-400 hover:text-white"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCouponToDelete(coupon)}
                            title="Delete"
                            className="p-1 h-7 w-7 text-neutral-400 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>
              Showing {coupons.length} of {total} coupons
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black uppercase text-white font-heading tracking-wider">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create Promotional Coupon"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-2.5 rounded text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
                  Coupon Code *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CAIRO20, VYREVIP"
                  required
                  className="bg-black/50 border-neutral-800 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
                  Description (Optional)
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 20% off for runway drop launch"
                  className="bg-black/50 border-neutral-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
                    Discount Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full bg-black/50 border border-neutral-800 rounded p-2 text-white text-xs"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (EGP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
                    Discount Value * ({formData.type === "PERCENTAGE" ? "%" : "EGP"})
                  </label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: Number(e.target.value) })
                    }
                    min={1}
                    max={formData.type === "PERCENTAGE" ? 100 : 10000}
                    required
                    className="bg-black/50 border-neutral-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
                    Min. Order Amount (EGP)
                  </label>
                  <Input
                    type="number"
                    value={formData.minimumOrderAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumOrderAmount: Number(e.target.value) })
                    }
                    min={0}
                    placeholder="0 = No minimum"
                    className="bg-black/50 border-neutral-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
                    Max. Discount Cap (EGP)
                  </label>
                  <Input
                    type="number"
                    value={formData.maximumDiscount}
                    onChange={(e) =>
                      setFormData({ ...formData, maximumDiscount: Number(e.target.value) })
                    }
                    min={0}
                    placeholder="0 = No cap"
                    className="bg-black/50 border-neutral-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
                    Usage Limit (Count)
                  </label>
                  <Input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLimit: Number(e.target.value) })
                    }
                    min={0}
                    placeholder="0 = Unlimited"
                    className="bg-black/50 border-neutral-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-mono uppercase text-[10px]">
                    Expiry Date
                  </label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="bg-black/50 border-neutral-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="coupon-active-toggle"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded bg-black border-neutral-700 text-brand-gold focus:ring-0"
                />
                <label htmlFor="coupon-active-toggle" className="text-white cursor-pointer select-none">
                  Activate this promo code immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  {editingCoupon ? "Save Changes" : "Create Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {couponToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Delete Coupon?
            </h3>
            <p className="text-xs text-neutral-400">
              Are you sure you want to permanently delete promo code{" "}
              <strong className="text-brand-gold font-mono">{couponToDelete.code}</strong>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCouponToDelete(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={isSubmitting}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
