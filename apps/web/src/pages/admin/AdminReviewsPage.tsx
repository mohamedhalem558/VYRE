// apps/web/src/pages/admin/AdminReviewsPage.tsx

import React, { useState, useEffect } from "react";
import { reviewService } from "../../services/review.service.js";
import { ReviewDTO } from "@vyre/shared";
import { formatDate } from "../../utils/formatters.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Badge } from "../../components/ui/badge.js";
import {
  Star,
  Search,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Package,
} from "lucide-react";

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [reviewToDelete, setReviewToDelete] = useState<ReviewDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewService.getAdminReviews({
        page,
        limit: 15,
        search: search.trim() || undefined,
        approved: statusFilter === "APPROVED" ? true : statusFilter === "HIDDEN" ? false : undefined,
        rating: ratingFilter !== "ALL" ? Number(ratingFilter) : undefined,
      });
      setReviews(res.reviews);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page, statusFilter, ratingFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadReviews();
  };

  const handleToggleApproval = async (review: ReviewDTO) => {
    try {
      await reviewService.toggleApproval(review.id);
      loadReviews();
    } catch (err) {
      console.error("Failed to toggle review approval:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);
    try {
      await reviewService.deleteReview(reviewToDelete.id);
      setReviewToDelete(null);
      loadReviews();
    } catch (err) {
      console.error("Failed to delete review:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-white font-heading tracking-wider flex items-center gap-2">
            <Star className="h-6 w-6 text-brand-gold fill-brand-gold" />
            Product Reviews Moderation
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Approve, moderate, or remove verified customer reviews across all drops.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-md">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search author, comment, product..."
            leftIcon={<Search className="h-4 w-4 text-neutral-500" />}
            className="bg-black/50 border-neutral-800 text-xs text-white"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by approval status"
            className="bg-black/60 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-brand-gold"
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">Approved Only</option>
            <option value="HIDDEN">Hidden / Unapproved</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by star rating"
            className="bg-black/60 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-brand-gold"
          >
            <option value="ALL">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <Button variant="ghost" size="sm" onClick={loadReviews} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-neutral-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-400 space-y-2">
            <Star className="h-8 w-8 mx-auto text-neutral-600 mb-2" />
            <p className="font-bold text-white uppercase tracking-wider">No Reviews Found</p>
            <p className="text-[11px]">No customer feedback matching the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-black/40 text-neutral-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Comment</th>
                  <th className="py-3 px-4">Verified</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-neutral-800/30 transition-colors">
                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 max-w-xs">
                        {rev.productImage ? (
                          <img
                            src={rev.productImage}
                            alt=""
                            className="h-9 w-8 object-cover rounded-xs border border-neutral-800 shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-8 bg-neutral-800 rounded-xs flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-neutral-600" />
                          </div>
                        )}
                        <span className="font-bold text-white uppercase truncate line-clamp-1">
                          {rev.productName || "Product"}
                        </span>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="py-3.5 px-4 font-mono text-neutral-300">
                      {rev.authorName}
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center text-brand-gold">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < rev.rating ? "fill-brand-gold" : "text-neutral-700"
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="py-3.5 px-4 text-neutral-300 max-w-sm">
                      <p className="line-clamp-2">{rev.comment}</p>
                    </td>

                    {/* Verified */}
                    <td className="py-3.5 px-4">
                      {rev.verified ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Buyer
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-[10px]">Unverified</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {rev.approved ? (
                        <Badge variant="success" className="text-[9px]">
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px]">
                          Hidden
                        </Badge>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px]">
                      {formatDate(rev.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleApproval(rev)}
                          title={rev.approved ? "Hide from storefront" : "Approve for storefront"}
                          className="p-1 h-7 w-7"
                        >
                          {rev.approved ? (
                            <EyeOff className="h-3.5 w-3.5 text-neutral-400 hover:text-rose-400" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 text-neutral-400 hover:text-emerald-400" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReviewToDelete(rev)}
                          title="Delete review"
                          className="p-1 h-7 w-7 text-neutral-400 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>
              Showing {reviews.length} of {total} reviews
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

      {/* Delete Confirmation Modal */}
      {reviewToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Delete Review?
            </h3>
            <p className="text-xs text-neutral-400">
              Are you sure you want to permanently delete this review by{" "}
              <strong className="text-white">{reviewToDelete.authorName}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
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
