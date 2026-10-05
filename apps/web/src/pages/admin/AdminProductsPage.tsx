import React, { useState, useEffect } from "react";
import { adminService } from "../../services/admin.service.js";
import { Product, Category } from "@vyre/shared";
import { formatCurrency } from "../../utils/formatters.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Badge } from "../../components/ui/badge.js";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  Flame,
  Sparkles,
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<{ id: string; name: string; code: string }[]>([]);
  const [colors, setColors] = useState<{ id: string; name: string; code: string; hexCode: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Product Form State
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    shortDescription: string;
    price: number;
    compareAtPrice: number;
    categoryId: string;
    featured: boolean;
    bestseller: boolean;
    newArrival: boolean;
    tags: string;
    images: string;
    stockPerVariant: number;
  }>({
    name: "",
    description: "",
    shortDescription: "",
    price: 950,
    compareAtPrice: 1200,
    categoryId: "",
    featured: false,
    bestseller: false,
    newArrival: true,
    tags: "streetwear, oversized, egyptian-cotton",
    images: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
    stockPerVariant: 15,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, cats, szs, cols] = await Promise.all([
        adminService.getProducts({
          page,
          limit: 12,
          search: search || undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        }),
        adminService.getCategories(),
        adminService.getSizes(),
        adminService.getColors(),
      ]);

      setProducts(prodRes.items || []);
      setTotalPages(prodRes.totalPages || 1);
      setCategories(cats);
      setSizes(szs);
      setColors(cols);
      if (cats.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (err) {
      console.error("Failed to load products management data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      shortDescription: "",
      price: 950,
      compareAtPrice: 1200,
      categoryId: categories[0]?.id || "",
      featured: false,
      bestseller: false,
      newArrival: true,
      tags: "streetwear, oversized, egyptian-cotton",
      images: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
      stockPerVariant: 15,
    });
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription || "",
      price: p.price,
      compareAtPrice: p.compareAtPrice || 0,
      categoryId: p.categoryId || "",
      featured: p.isFeatured || false,
      bestseller: p.isBestSeller || false,
      newArrival: p.isNewArrival || false,
      tags: (p.tags || []).join(", "),
      images: (p.images || [p.primaryImage]).join("\n"),
      stockPerVariant: 15,
    });
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const imageUrls = formData.images
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((url, idx) => ({ url, displayOrder: idx }));

      const tagList = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (editingProduct) {
        // Edit existing product
        await adminService.updateProduct(editingProduct.id, {
          name: formData.name,
          description: formData.description,
          shortDescription: formData.shortDescription,
          price: Number(formData.price),
          compareAtPrice: Number(formData.compareAtPrice) || undefined,
          categoryId: formData.categoryId,
          featured: formData.featured,
          bestseller: formData.bestseller,
          newArrival: formData.newArrival,
          tags: tagList,
          images: imageUrls,
        });
      } else {
        // Generate initial SKU variants for each standard color and size
        const prefix = formData.name.substring(0, 3).toUpperCase();
        const initialVariants: any[] = [];

        // Build default variants across 2 colors and standard sizes
        const primaryColors = colors.slice(0, 2);
        const primarySizes = sizes.slice(0, 4);

        for (const col of primaryColors) {
          for (const sz of primarySizes) {
            initialVariants.push({
              sku: `VYRE-${prefix}-${col.code}-${sz.code}-${Date.now().toString().slice(-4)}`,
              colorId: col.id,
              sizeId: sz.id,
              stock: Number(formData.stockPerVariant) || 10,
              lowStockThreshold: 5,
              active: true,
            });
          }
        }

        await adminService.createProduct({
          name: formData.name,
          description: formData.description,
          shortDescription: formData.shortDescription,
          price: Number(formData.price),
          compareAtPrice: Number(formData.compareAtPrice) || undefined,
          categoryId: formData.categoryId,
          featured: formData.featured,
          bestseller: formData.bestseller,
          newArrival: formData.newArrival,
          tags: tagList,
          images: imageUrls,
          variants: initialVariants,
        });
      }

      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || err.message || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      await adminService.updateProduct(p.id, { active: !p.active });
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, active: !item.active } : item))
      );
    } catch (err) {
      console.error("Failed to toggle product status:", err);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsSubmitting(true);
      await adminService.deleteProduct(productToDelete.id);
      setProductToDelete(null);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to delete product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#d4af37]">
            Catalog Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-heading">
            Product Management
          </h1>
        </div>

        <Button
          variant="gold"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create New Style
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950 p-4 border border-neutral-800 rounded-sm">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Input
            placeholder="Search by title, SKU, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-neutral-500" />}
          />
        </form>

        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-neutral-400" />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-neutral-900 border border-neutral-800 rounded-xs text-xs text-white px-3 py-2 focus:border-[#d4af37] outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className="border border-neutral-800 rounded-sm bg-neutral-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Style</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Marketing Flags</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No products matching your search criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                    {/* Style / Image / Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.primaryImage}
                          alt={p.name}
                          className="h-12 w-10 object-cover rounded-xs border border-neutral-800 bg-neutral-900 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white uppercase truncate max-w-[200px]">
                            {p.name}
                          </p>
                          <span className="text-[10px] font-mono text-neutral-400">{p.sku}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 font-mono text-neutral-300">{p.category}</td>

                    {/* Price & Compare */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-white block">
                        {formatCurrency(p.price)}
                      </span>
                      {p.compareAtPrice && (
                        <span className="font-mono text-[10px] text-neutral-500 line-through block">
                          {formatCurrency(p.compareAtPrice)}
                        </span>
                      )}
                    </td>

                    {/* Total Stock */}
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono font-bold ${
                          p.stockCount <= 5 ? "text-amber-400" : "text-white"
                        }`}
                      >
                        {p.stockCount} units
                      </span>
                    </td>

                    {/* Flags */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.isFeatured && (
                          <Badge variant="gold" className="text-[9px] gap-1 px-1.5 py-0.5">
                            <Star className="h-2.5 w-2.5" /> Featured
                          </Badge>
                        )}
                        {p.isBestSeller && (
                          <Badge variant="destructive" className="text-[9px] gap-1 px-1.5 py-0.5">
                            <Flame className="h-2.5 w-2.5" /> Bestseller
                          </Badge>
                        )}
                        {p.isNewArrival && (
                          <Badge variant="secondary" className="text-[9px] gap-1 px-1.5 py-0.5">
                            <Sparkles className="h-2.5 w-2.5" /> New
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                          p.active
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/80"
                            : "bg-neutral-900 text-neutral-500 border border-neutral-800"
                        }`}
                        title="Click to toggle active state"
                      >
                        {p.active ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> ACTIVE
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> INACTIVE
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                          className="h-7 w-7 p-0"
                          title="Edit Product"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-neutral-300" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProductToDelete(p)}
                          className="h-7 w-7 p-0 hover:text-rose-400 hover:bg-rose-950/20"
                          title="Delete Product"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-neutral-400 hover:text-rose-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-900 text-xs text-neutral-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {editingProduct ? `Edit Style: ${editingProduct.name}` : "Create New VYRE Style"}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-xs border border-rose-900 bg-rose-950/40 text-rose-300 text-xs">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Style Name *"
                    placeholder="e.g. Signature Heavyweight Boxy Hoodie"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Selling Price (EGP) *"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />

                <Input
                  label="Compare At / Original Price (EGP)"
                  type="number"
                  value={formData.compareAtPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, compareAtPrice: Number(e.target.value) })
                  }
                />

                <div className="sm:col-span-2 space-y-1 text-xs">
                  <label className="font-semibold text-neutral-300 uppercase">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xs text-xs text-white p-2.5 outline-none focus:border-[#d4af37]"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1 text-xs">
                  <label className="font-semibold text-neutral-300 uppercase">
                    Description & Atelier Specs *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Crafted in Cairo atelier from 450 GSM French Terry..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xs text-xs text-white p-2.5 outline-none focus:border-[#d4af37]"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Short Catchphrase / Subtitle"
                    placeholder="450 GSM Luxury Heavyweight Silhouette"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1 text-xs">
                  <label className="font-semibold text-neutral-300 uppercase">
                    Image URLs (One per line)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xs text-xs text-white p-2.5 outline-none focus:border-[#d4af37] font-mono text-[11px]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Search Tags (comma separated)"
                    placeholder="sweater, drop, cotton, cairo"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>

                {!editingProduct && (
                  <div className="sm:col-span-2">
                    <Input
                      label="Initial Stock per Size/Color Variant"
                      type="number"
                      value={formData.stockPerVariant}
                      onChange={(e) =>
                        setFormData({ ...formData, stockPerVariant: Number(e.target.value) })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Marketing Toggles */}
              <div className="pt-3 border-t border-neutral-800 grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded bg-neutral-900 border-neutral-700 text-[#d4af37] focus:ring-0"
                  />
                  <span>Featured Drop</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.bestseller}
                    onChange={(e) => setFormData({ ...formData, bestseller: e.target.checked })}
                    className="rounded bg-neutral-900 border-neutral-700 text-[#d4af37] focus:ring-0"
                  />
                  <span>Bestseller</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.newArrival}
                    onChange={(e) => setFormData({ ...formData, newArrival: e.target.checked })}
                    className="rounded bg-neutral-900 border-neutral-700 text-[#d4af37] focus:ring-0"
                  />
                  <span>New Arrival</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gold" size="sm" isLoading={isSubmitting}>
                  {editingProduct ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Delete Product
              </h3>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-white">"{productToDelete.name}"</strong>? All associated
              variants and gallery images will be removed from the system.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductToDelete(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteProduct}
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
