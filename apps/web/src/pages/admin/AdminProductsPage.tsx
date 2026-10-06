import React, { useState, useEffect, useRef } from "react";
import { adminService } from "../../services/admin.service.js";
import { Product, Category } from "@vyre/shared";
import { formatCurrency } from "../../utils/formatters.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Badge } from "../../components/ui/badge.js";
import { cn } from "../../utils/cn.js";
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
  Upload,
  Image as ImageIcon,
  Check,
  Palette,
  Ruler,
} from "lucide-react";

interface FormImageItem {
  id: string;
  url: string;
  file?: File;
  isPrimary: boolean;
}

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
    stockPerVariant: 15,
  });

  // Images state
  const [formImages, setFormImages] = useState<FormImageItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Colors & Sizes state
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [showAddCustomColor, setShowAddCustomColor] = useState(false);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#0a0a0a");
  const [isAddingColor, setIsAddingColor] = useState(false);

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
      stockPerVariant: 15,
    });
    setFormImages([]);
    setUrlInput("");
    setShowAddCustomColor(false);
    // Pre-select first 2 colors and standard sizes
    setSelectedColorIds(colors.slice(0, 2).map((c) => c.id));
    setSelectedSizeIds(sizes.map((s) => s.id));
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
      stockPerVariant: 15,
    });

    // Populate images
    let initialImages: FormImageItem[] = [];
    if (p.imageObjects && p.imageObjects.length > 0) {
      initialImages = p.imageObjects.map((img, idx) => ({
        id: img.id || `img-${idx}`,
        url: img.url,
        isPrimary: idx === 0,
      }));
    } else if (p.images && p.images.length > 0) {
      initialImages = p.images.map((url, idx) => ({
        id: `img-${idx}`,
        url,
        isPrimary: idx === 0,
      }));
    } else if (p.primaryImage) {
      initialImages = [{ id: "img-0", url: p.primaryImage, isPrimary: true }];
    }
    setFormImages(initialImages);
    setUrlInput("");
    setShowAddCustomColor(false);

    // Populate selected colors
    let matchedColorIds: string[] = [];
    if (p.variants && p.variants.length > 0) {
      matchedColorIds = p.variants
        .filter((v) => v.active !== false && v.colorId)
        .map((v) => v.colorId);
    }
    if (matchedColorIds.length === 0 && p.colors && p.colors.length > 0) {
      matchedColorIds = p.colors
        .map((pc) => {
          const match = colors.find(
            (c) =>
              c.id === pc.id ||
              c.hexCode?.toLowerCase() === pc.hex?.toLowerCase() ||
              c.name?.toLowerCase() === pc.name?.toLowerCase()
          );
          return match?.id;
        })
        .filter(Boolean) as string[];
    }
    matchedColorIds = Array.from(new Set(matchedColorIds));
    setSelectedColorIds(
      matchedColorIds.length > 0 ? matchedColorIds : colors.slice(0, 2).map((c) => c.id)
    );

    // Populate selected sizes
    let matchedSizeIds: string[] = [];
    if (p.variants && p.variants.length > 0) {
      matchedSizeIds = p.variants
        .filter((v) => v.active !== false && v.sizeId)
        .map((v) => v.sizeId);
    }
    if (matchedSizeIds.length === 0 && p.sizes && p.sizes.length > 0) {
      matchedSizeIds = p.sizes
        .map((code) => sizes.find((s) => s.code === code)?.id)
        .filter(Boolean) as string[];
    }
    matchedSizeIds = Array.from(new Set(matchedSizeIds));
    setSelectedSizeIds(
      matchedSizeIds.length > 0 ? matchedSizeIds : sizes.map((s) => s.id)
    );

    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: FormImageItem[] = Array.from(files).map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      url: URL.createObjectURL(file),
      file,
      isPrimary: formImages.length === 0 && idx === 0,
    }));

    setFormImages((prev) => {
      const combined = [...prev, ...newItems];
      if (!combined.some((img) => img.isPrimary) && combined.length > 0) {
        combined[0].isPrimary = true;
      }
      return combined;
    });

    if (e.target) {
      e.target.value = "";
    }
  };

  const handleSetPrimaryImage = (id: string) => {
    setFormImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleRemoveImage = (id: string) => {
    setFormImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleAddUrlImage = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const newItem: FormImageItem = {
      id: `url-${Date.now()}`,
      url: trimmed,
      isPrimary: formImages.length === 0,
    };
    setFormImages((prev) => {
      const combined = [...prev, newItem];
      if (!combined.some((img) => img.isPrimary) && combined.length > 0) {
        combined[0].isPrimary = true;
      }
      return combined;
    });
    setUrlInput("");
  };

  const toggleColor = (colorId: string) => {
    setSelectedColorIds((prev) =>
      prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
    );
  };

  const toggleSize = (sizeId: string) => {
    setSelectedSizeIds((prev) =>
      prev.includes(sizeId) ? prev.filter((id) => id !== sizeId) : [...prev, sizeId]
    );
  };

  const handleCreateCustomColor = async () => {
    if (!customColorName.trim()) {
      alert("Please enter a color name.");
      return;
    }
    try {
      setIsAddingColor(true);
      const code =
        customColorName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) ||
        `COL${Date.now().toString().slice(-3)}`;
      const created = await adminService.createColor({
        name: customColorName.trim(),
        hexCode: customColorHex,
        code,
      });
      setColors((prev) => (prev.some((c) => c.id === created.id) ? prev : [...prev, created]));
      setSelectedColorIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
      setCustomColorName("");
      setShowAddCustomColor(false);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Failed to create custom color.");
    } finally {
      setIsAddingColor(false);
    }
  };

  const handleDeleteColor = async (e: React.MouseEvent, colorId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this color option?")) return;
    try {
      await adminService.deleteColor(colorId);
      setColors((prev) => prev.filter((c) => c.id !== colorId));
      setSelectedColorIds((prev) => prev.filter((id) => id !== colorId));
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Failed to delete color.");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Comprehensive validations
    if (!formData.name.trim()) {
      setFormError("Style name is required.");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setFormError("A valid selling price greater than 0 EGP is required.");
      return;
    }
    if (!formData.categoryId) {
      setFormError("Please select a product category.");
      return;
    }
    if (!formData.description || formData.description.trim().length < 10) {
      setFormError("Description & specs must be at least 10 characters.");
      return;
    }
    if (formImages.length === 0) {
      setFormError("At least one product image is required. Upload images or enter an image URL.");
      return;
    }
    if (selectedColorIds.length === 0) {
      setFormError("Please select at least one available color for this style.");
      return;
    }
    if (selectedSizeIds.length === 0) {
      setFormError("Please select at least one available size for this style.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload any locally selected File objects
      const filesToUpload = formImages
        .filter((img) => img.file && img.file instanceof File)
        .map((img) => img.file as File);

      let uploadedResults: { url: string; altText?: string; displayOrder: number }[] = [];
      if (filesToUpload.length > 0) {
        uploadedResults = await adminService.uploadImages(filesToUpload);
      }

      let uploadIdx = 0;
      const resolvedImages = formImages.map((img) => {
        if (img.file && img.file instanceof File) {
          const uploaded = uploadedResults[uploadIdx++];
          return {
            url: uploaded?.url || img.url,
            isPrimary: img.isPrimary,
          };
        }
        return {
          url: img.url,
          isPrimary: img.isPrimary,
        };
      });

      // Ensure the primary image is first (displayOrder 0)
      resolvedImages.sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return 0;
      });

      const finalImages = resolvedImages.map((img, idx) => ({
        url: img.url,
        displayOrder: idx,
      }));

      // 2. Generate variants for all selected color and size combinations
      const prefix =
        formData.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase() || "VYR";
      const variantPayload: any[] = [];

      for (const colorId of selectedColorIds) {
        const col = colors.find((c) => c.id === colorId);
        for (const sizeId of selectedSizeIds) {
          const sz = sizes.find((s) => s.id === sizeId);
          variantPayload.push({
            sku: `VYRE-${prefix}-${col?.code || "COL"}-${sz?.code || "SZ"}-${Date.now().toString().slice(-4)}`,
            colorId,
            sizeId,
            stock: Number(formData.stockPerVariant) || 15,
            lowStockThreshold: 5,
            active: true,
          });
        }
      }

      const tagList = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (editingProduct) {
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
          images: finalImages,
          variants: variantPayload,
        });
      } else {
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
          images: finalImages,
          variants: variantPayload,
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

                {/* 1. PRODUCT IMAGERY SECTION */}
                <div className="sm:col-span-2 space-y-2 p-3 bg-neutral-900/50 border border-neutral-800 rounded-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="font-semibold text-neutral-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-[#d4af37]" />
                        Product Imagery *
                      </label>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Upload images from your device or add image URLs. Click "Set Main" to choose the primary storefront image.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-[#d4af37]/60 text-[#d4af37] hover:bg-[#d4af37]/10 text-xs shrink-0 self-start sm:self-auto"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload Images
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Add via URL input for backward compatibility */}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="text-xs font-mono h-8 bg-neutral-950"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddUrlImage}
                      className="h-8 text-xs shrink-0"
                    >
                      Add URL
                    </Button>
                  </div>

                  {/* Image Previews */}
                  {formImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                      {formImages.map((img) => (
                        <div
                          key={img.id}
                          className={cn(
                            "group relative rounded-xs border overflow-hidden bg-neutral-950 flex flex-col",
                            img.isPrimary
                              ? "border-[#d4af37] ring-1 ring-[#d4af37]"
                              : "border-neutral-800 hover:border-neutral-700"
                          )}
                        >
                          <div className="relative aspect-square w-full bg-neutral-900">
                            <img
                              src={img.url}
                              alt="Product thumbnail"
                              className="w-full h-full object-cover"
                            />
                            {img.isPrimary && (
                              <span className="absolute top-1 left-1 bg-[#d4af37] text-neutral-950 text-[9px] font-bold px-1.5 py-0.5 rounded-xs tracking-wider flex items-center gap-1 shadow-sm">
                                <Star className="h-2.5 w-2.5 fill-neutral-950" />
                                MAIN
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(img.id)}
                              className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-900 text-neutral-300 hover:text-white rounded-xs transition-colors"
                              title="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="p-1.5 bg-neutral-900/90 flex items-center justify-between border-t border-neutral-800">
                            {img.isPrimary ? (
                              <span className="text-[10px] text-[#d4af37] font-semibold">
                                Primary Image
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(img.id)}
                                className="text-[10px] text-neutral-400 hover:text-[#d4af37] transition-colors"
                              >
                                Set as Main
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 border border-dashed border-neutral-800 rounded-xs text-center text-xs text-neutral-500">
                      No images selected. Click "Upload Images" or paste an image URL above.
                    </div>
                  )}
                </div>

                {/* 2. PRODUCT COLORS SECTION */}
                <div className="sm:col-span-2 space-y-2 p-3 bg-neutral-900/50 border border-neutral-800 rounded-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="font-semibold text-neutral-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5 text-[#d4af37]" />
                        Available Colors * ({selectedColorIds.length} selected)
                      </label>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Select which colors are manufactured and purchasable for this style.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddCustomColor(!showAddCustomColor)}
                      className="text-[#d4af37] hover:bg-[#d4af37]/10 text-xs shrink-0 self-start sm:self-auto"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {showAddCustomColor ? "Close Custom" : "Add Custom Color"}
                    </Button>
                  </div>

                  {/* Inline Custom Color Creator */}
                  {showAddCustomColor && (
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xs space-y-2">
                      <p className="text-xs font-semibold text-white">Create & Add Custom Atelier Color</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                        <div className="sm:col-span-2">
                          <Input
                            placeholder="Color Name (e.g. Sage Green, Burnt Orange)"
                            value={customColorName}
                            onChange={(e) => setCustomColorName(e.target.value)}
                            className="text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColorHex}
                            onChange={(e) => setCustomColorHex(e.target.value)}
                            className="h-8 w-10 bg-transparent cursor-pointer rounded-xs border border-neutral-700 p-0.5"
                          />
                          <span className="text-xs font-mono text-neutral-300">{customColorHex}</span>
                          <Button
                            type="button"
                            variant="gold"
                            size="sm"
                            onClick={handleCreateCustomColor}
                            isLoading={isAddingColor}
                            className="h-8 text-xs shrink-0 ml-auto"
                          >
                            Save Color
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Color Swatch Selector Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {colors.map((col) => {
                      const isSelected = selectedColorIds.includes(col.id);
                      return (
                        <div key={col.id} className="relative group">
                          <button
                            type="button"
                            onClick={() => toggleColor(col.id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 p-2 rounded-xs border text-xs transition-all text-left pr-6",
                              isSelected
                                ? "border-[#d4af37] bg-neutral-900 text-white ring-1 ring-[#d4af37]/80"
                                : "border-neutral-800/80 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                            )}
                          >
                            <span
                              className="h-4 w-4 rounded-full border border-neutral-600 shrink-0 shadow-xs"
                              style={{ backgroundColor: col.hexCode }}
                            />
                            <span className="truncate flex-1 font-medium">{col.name}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-[#d4af37] shrink-0" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteColor(e, col.id)}
                            title="Delete this color"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. PRODUCT SIZES SECTION */}
                <div className="sm:col-span-2 space-y-2 p-3 bg-neutral-900/50 border border-neutral-800 rounded-xs">
                  <div>
                    <label className="font-semibold text-neutral-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <Ruler className="h-3.5 w-3.5 text-[#d4af37]" />
                      Available Sizes * ({selectedSizeIds.length} selected)
                    </label>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Select which sizes are available for this style. Only selected sizes appear on the storefront.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {sizes.map((sz) => {
                      const isSelected = selectedSizeIds.includes(sz.id);
                      return (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => toggleSize(sz.id)}
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded-xs border transition-all flex items-center gap-1.5",
                            isSelected
                              ? "border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37] ring-1 ring-[#d4af37]/70"
                              : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-[#d4af37]" />}
                          <span>{sz.name}</span>
                          <span className="font-mono text-[10px] opacity-70">({sz.code})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Search Tags (comma separated)"
                    placeholder="sweater, drop, cotton, cairo"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Stock per Size/Color Variant"
                    type="number"
                    value={formData.stockPerVariant}
                    onChange={(e) =>
                      setFormData({ ...formData, stockPerVariant: Number(e.target.value) })
                    }
                  />
                </div>
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
