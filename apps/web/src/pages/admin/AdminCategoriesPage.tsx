import React, { useState, useEffect, useRef } from "react";
import { Category } from "@vyre/shared";
import { adminService } from "../../services/admin.service.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Badge } from "../../components/ui/badge.js";
import { cn } from "../../utils/cn.js";
import {
  Layers,
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  ExternalLink,
  Plus,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  ArrowRight,
} from "lucide-react";

interface CollectionEditState {
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  active: boolean;
  isDirty?: boolean;
  isSaving?: boolean;
  isUploading?: boolean;
  error?: string;
  successMessage?: string;
}

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editStates, setEditStates] = useState<Record<string, CollectionEditState>>({});
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    displayOrder: 1,
    active: true,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isUploadingNew, setIsUploadingNew] = useState(false);

  // Hidden file inputs mapped by category ID
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const newFileInputRef = useRef<HTMLInputElement | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setGlobalError("");
      const data = await adminService.getCategories();
      const sorted = [...data].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setCategories(sorted);

      const initialStates: Record<string, CollectionEditState> = {};
      sorted.forEach((cat) => {
        initialStates[cat.id] = {
          name: cat.name,
          slug: cat.slug,
          description: cat.description || "",
          image: cat.image || "",
          displayOrder: cat.displayOrder || 0,
          active: cat.active !== false,
          isDirty: false,
          isSaving: false,
          isUploading: false,
        };
      });
      setEditStates(initialStates);
    } catch (err: any) {
      console.error("Failed to load categories:", err);
      setGlobalError(err?.response?.data?.error || err?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleFieldChange = (
    id: string,
    field: keyof CollectionEditState,
    value: any
  ) => {
    setEditStates((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          [field]: value,
          isDirty: true,
          error: undefined,
          successMessage: undefined,
        },
      };
    });
  };

  const handleImageFileUpload = async (id: string, file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setEditStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          error: "Invalid file type. Please upload a JPEG, PNG, WebP, AVIF, or GIF image.",
        },
      }));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setEditStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          error: "File size exceeds 10MB limit. Please upload an optimized image.",
        },
      }));
      return;
    }

    try {
      setEditStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], isUploading: true, error: undefined },
      }));

      const uploadedImages = await adminService.uploadImages([file]);
      if (uploadedImages && uploadedImages.length > 0) {
        const uploadedUrl = uploadedImages[0].url;
        setEditStates((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            image: uploadedUrl,
            isDirty: true,
            isUploading: false,
            successMessage: "Image uploaded! Click 'Save Changes' to apply.",
          },
        }));
      }
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setEditStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          isUploading: false,
          error: err?.response?.data?.error || err?.message || "Failed to upload image.",
        },
      }));
    }
  };

  const handleSaveCategory = async (id: string) => {
    const state = editStates[id];
    if (!state) return;

    try {
      setEditStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], isSaving: true, error: undefined, successMessage: undefined },
      }));

      const updated = await adminService.updateCategory(id, {
        name: state.name,
        slug: state.slug || undefined,
        description: state.description,
        image: state.image,
        displayOrder: Number(state.displayOrder) || 0,
        active: state.active,
      });

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );

      setEditStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          isSaving: false,
          isDirty: false,
          successMessage: "Collection updated successfully!",
        },
      }));

      setTimeout(() => {
        setEditStates((prev) => {
          if (!prev[id]) return prev;
          return { ...prev, [id]: { ...prev[id], successMessage: undefined } };
        });
      }, 4000);
    } catch (err: any) {
      console.error("Save failed:", err);
      setEditStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          isSaving: false,
          error: err?.response?.data?.error || err?.message || "Failed to save collection changes.",
        },
      }));
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollection.name.trim()) {
      setCreateError("Collection name is required.");
      return;
    }

    try {
      setIsCreating(true);
      setCreateError("");

      const created = await adminService.createCategory({
        name: newCollection.name.trim(),
        slug: newCollection.slug.trim() || undefined,
        description: newCollection.description.trim() || undefined,
        image: newCollection.image.trim() || undefined,
        displayOrder: Number(newCollection.displayOrder) || 0,
        active: newCollection.active,
      });

      setCategories((prev) => [...prev, created]);
      setEditStates((prev) => ({
        ...prev,
        [created.id]: {
          name: created.name,
          slug: created.slug,
          description: created.description || "",
          image: created.image || "",
          displayOrder: created.displayOrder || 0,
          active: created.active !== false,
          isDirty: false,
          isSaving: false,
          isUploading: false,
        },
      }));

      setIsCreateModalOpen(false);
      setNewCollection({
        name: "",
        slug: "",
        description: "",
        image: "",
        displayOrder: 1,
        active: true,
      });
      setGlobalSuccess("New collection created successfully!");
      setTimeout(() => setGlobalSuccess(""), 4000);
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || err?.message || "Failed to create collection.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleNewImageFileUpload = async (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setCreateError("Invalid file type. Please upload a JPEG, PNG, WebP, AVIF, or GIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCreateError("File size exceeds 10MB limit.");
      return;
    }

    try {
      setIsUploadingNew(true);
      setCreateError("");
      const uploaded = await adminService.uploadImages([file]);
      if (uploaded && uploaded.length > 0) {
        setNewCollection((prev) => ({ ...prev, image: uploaded[0].url }));
      }
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || "Failed to upload image.");
    } finally {
      setIsUploadingNew(false);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xs bg-[#d4af37]/10 text-[#d4af37]">
              <Layers className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white font-heading">
              Homepage Collections & Curated Silhouettes
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Manage cover imagery, titles, display order, and storefront visibility for the large "Curated Silhouettes" cards on the VYRE homepage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            isLoading={loading}
            className="border-neutral-700 text-neutral-300 hover:text-white text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Collection
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {globalError && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xs text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{globalError}</span>
        </div>
      )}

      {globalSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-xs text-xs flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{globalSuccess}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-neutral-900/50 border border-neutral-800 rounded-xs p-6 space-y-4 animate-pulse"
            >
              <div className="h-6 bg-neutral-800 rounded-xs w-1/3" />
              <div className="aspect-[16/10] bg-neutral-800 rounded-xs" />
              <div className="h-10 bg-neutral-800 rounded-xs" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-neutral-800 rounded-xs bg-neutral-900/20 space-y-3">
          <Layers className="h-10 w-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            No Collections Found
          </h3>
          <p className="text-xs text-neutral-400">
            Create a homepage collection card to display on the storefront.
          </p>
        </div>
      ) : (
        /* Collections Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {categories.map((cat) => {
            const state = editStates[cat.id] || {
              name: cat.name,
              slug: cat.slug,
              description: cat.description || "",
              image: cat.image || "",
              displayOrder: cat.displayOrder || 0,
              active: cat.active !== false,
              isDirty: false,
              isSaving: false,
              isUploading: false,
            };

            const previewImage =
              state.image ||
              "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop";

            return (
              <div
                key={cat.id}
                className={cn(
                  "bg-neutral-900/60 border rounded-xs p-6 space-y-6 transition-all",
                  state.isDirty ? "border-[#d4af37]/70 ring-1 ring-[#d4af37]/30" : "border-neutral-800"
                )}
              >
                {/* Card Header & Status */}
                <div className="flex items-start justify-between gap-4 border-b border-neutral-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white font-heading">
                        {state.name || cat.name}
                      </h2>
                      <Badge
                        variant={state.active ? "success" : "secondary"}
                        className="text-[10px] font-mono uppercase"
                      >
                        {state.active ? "Visible on Homepage" : "Hidden"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="font-mono text-neutral-500">Slug: /shop/{state.slug}</span>
                      <span>•</span>
                      <span>Order #{state.displayOrder}</span>
                    </div>
                  </div>

                  <a
                    href={`/shop/${state.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 font-medium shrink-0 pt-1"
                  >
                    View Storefront <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Homepage Visual Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-[#d4af37]" />
                      Homepage Live Silhouette Preview
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Matches 16:10 / 4:5 Aspect Ratio
                    </span>
                  </div>

                  <div className="relative aspect-[16/10] overflow-hidden rounded-xs bg-neutral-950 border border-neutral-800 group">
                    <img
                      src={previewImage}
                      alt={state.name}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    
                    {/* Storefront Overlay Text Replica */}
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-end justify-between text-white">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                          Collection
                        </p>
                        <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight">
                          {state.name}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider underline underline-offset-4 inline-flex items-center gap-1">
                        Shop <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>

                    {/* Uploading Overlay */}
                    {state.isUploading && (
                      <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center space-y-2 z-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
                        <p className="text-xs font-mono uppercase tracking-widest text-white">
                          Uploading & Processing Image...
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Management Actions */}
                <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="font-semibold text-neutral-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-[#d4af37]" />
                        Collection Imagery
                      </label>
                      <p className="text-[11px] text-neutral-400">
                        Upload high-resolution editorial imagery (JPEG, PNG, WebP, max 10MB).
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="gold"
                        size="sm"
                        onClick={() => fileInputRefs.current[cat.id]?.click()}
                        isLoading={state.isUploading}
                        className="text-xs shrink-0"
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Upload New Image
                      </Button>

                      {state.image && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFieldChange(cat.id, "image", "")}
                          className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Clear
                        </Button>
                      )}

                      <input
                        type="file"
                        ref={(el) => (fileInputRefs.current[cat.id] = el)}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageFileUpload(cat.id, file);
                          }
                          e.target.value = "";
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Direct Image URL input */}
                  <div>
                    <label className="text-[11px] text-neutral-400 uppercase font-mono block mb-1">
                      Image Source URL / Storage Path
                    </label>
                    <Input
                      placeholder="https://images.unsplash.com/... or /uploads/products/..."
                      value={state.image}
                      onChange={(e) => handleFieldChange(cat.id, "image", e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Metadata & Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Input
                      label="Collection Title"
                      value={state.name}
                      onChange={(e) => handleFieldChange(cat.id, "name", e.target.value)}
                      className="text-xs font-bold uppercase"
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label="Display Order"
                      type="number"
                      min={0}
                      value={state.displayOrder}
                      onChange={(e) => handleFieldChange(cat.id, "displayOrder", Number(e.target.value))}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="text-[11px] text-neutral-400 uppercase font-mono mb-1.5">
                      Homepage Visibility
                    </label>
                    <button
                      type="button"
                      onClick={() => handleFieldChange(cat.id, "active", !state.active)}
                      className={cn(
                        "h-10 px-3 rounded-xs border text-xs font-bold uppercase flex items-center justify-between transition-colors",
                        state.active
                          ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400"
                      )}
                    >
                      <span>{state.active ? "Active on Home" : "Disabled / Hidden"}</span>
                      {state.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Feedback Alerts */}
                {state.error && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{state.error}</span>
                  </div>
                )}

                {state.successMessage && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xs flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{state.successMessage}</span>
                  </div>
                )}

                {/* Save Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {state.isDirty ? "⚠️ Unsaved changes" : "All changes saved in database"}
                  </span>

                  <Button
                    type="button"
                    variant="gold"
                    size="sm"
                    onClick={() => handleSaveCategory(cat.id)}
                    isLoading={state.isSaving}
                    disabled={!state.isDirty && !state.isSaving}
                    className="text-xs"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save Changes
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create New Collection Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xs max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-xs bg-[#d4af37]/10 text-[#d4af37]">
                  <Plus className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold uppercase tracking-tight text-white">
                  Add Homepage Collection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xs">
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <Input
                label="Collection Title *"
                placeholder="e.g. Tactical Layers"
                value={newCollection.name}
                onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                required
                className="text-xs font-bold uppercase"
              />

              <Input
                label="Custom URL Slug (Optional)"
                placeholder="tactical-layers"
                value={newCollection.slug}
                onChange={(e) => setNewCollection({ ...newCollection, slug: e.target.value })}
                className="text-xs font-mono"
              />

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Cover Image URL or Upload
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://images.unsplash.com/..."
                    value={newCollection.image}
                    onChange={(e) => setNewCollection({ ...newCollection, image: e.target.value })}
                    className="text-xs font-mono flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => newFileInputRef.current?.click()}
                    isLoading={isUploadingNew}
                    className="border-neutral-700 text-neutral-300 text-xs shrink-0"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Upload
                  </Button>
                  <input
                    type="file"
                    ref={newFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleNewImageFileUpload(file);
                      e.target.value = "";
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {newCollection.image && (
                <div className="relative aspect-[16/10] overflow-hidden rounded-xs bg-neutral-950 border border-neutral-800">
                  <img
                    src={newCollection.image}
                    alt="Preview"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Display Order"
                  type="number"
                  min={0}
                  value={newCollection.displayOrder}
                  onChange={(e) =>
                    setNewCollection({ ...newCollection, displayOrder: Number(e.target.value) })
                  }
                  className="text-xs font-mono"
                />

                <div className="flex flex-col justify-end">
                  <label className="text-[11px] text-neutral-400 uppercase font-mono mb-1.5">
                    Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewCollection({ ...newCollection, active: !newCollection.active })
                    }
                    className={cn(
                      "h-10 px-3 rounded-xs border text-xs font-bold uppercase flex items-center justify-between",
                      newCollection.active
                        ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400"
                    )}
                  >
                    <span>{newCollection.active ? "Active" : "Disabled"}</span>
                    {newCollection.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gold" size="sm" isLoading={isCreating} className="text-xs">
                  Create Collection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
