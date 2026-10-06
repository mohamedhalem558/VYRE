import React, { useState, useEffect, useRef } from "react";
import { heroService, DEFAULT_HERO } from "../../services/hero.service.js";
import { adminService } from "../../services/admin.service.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Badge } from "../../components/ui/badge.js";
import { cn } from "../../utils/cn.js";
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  Save,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

export const AdminHeroPage: React.FC = () => {
  const [formData, setFormData] = useState({
    eyebrow: DEFAULT_HERO.eyebrow,
    title: DEFAULT_HERO.title,
    subtitle: DEFAULT_HERO.subtitle,
    ctaText: DEFAULT_HERO.ctaText,
    ctaLink: DEFAULT_HERO.ctaLink,
    imageUrl: DEFAULT_HERO.imageUrl,
    active: DEFAULT_HERO.active,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showLivePreview, setShowLivePreview] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadHero();
  }, []);

  const loadHero = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const data = await heroService.getHero();
      setFormData({
        eyebrow: data.eyebrow || DEFAULT_HERO.eyebrow,
        title: data.title || DEFAULT_HERO.title,
        subtitle: data.subtitle || DEFAULT_HERO.subtitle,
        ctaText: data.ctaText || DEFAULT_HERO.ctaText,
        ctaLink: data.ctaLink || DEFAULT_HERO.ctaLink,
        imageUrl: data.imageUrl || DEFAULT_HERO.imageUrl,
        active: data.active !== undefined ? data.active : true,
      });
    } catch (err: any) {
      console.error("Failed to load hero configuration:", err);
      setErrorMessage("Failed to load hero configuration from server. Showing defaults.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setErrorMessage("");
      const uploadedImages = await adminService.uploadImages([files[0]]);
      if (uploadedImages && uploadedImages.length > 0 && uploadedImages[0].url) {
        handleInputChange("imageUrl", uploadedImages[0].url);
        setSuccessMessage("Image uploaded successfully.");
      }
    } catch (err: any) {
      console.error("Hero image upload failed:", err);
      setErrorMessage(
        err?.response?.data?.message || err.message || "Failed to upload hero image. Please try again."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleResetToDefaults = () => {
    setFormData({
      eyebrow: DEFAULT_HERO.eyebrow,
      title: DEFAULT_HERO.title,
      subtitle: DEFAULT_HERO.subtitle,
      ctaText: DEFAULT_HERO.ctaText,
      ctaLink: DEFAULT_HERO.ctaLink,
      imageUrl: DEFAULT_HERO.imageUrl,
      active: DEFAULT_HERO.active,
    });
    setSuccessMessage("Reset to default configuration (Click 'Save Changes' to persist).");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.title.trim()) {
      setErrorMessage("Main title is required.");
      return;
    }
    if (!formData.eyebrow.trim()) {
      setErrorMessage("Eyebrow text is required.");
      return;
    }
    if (!formData.subtitle.trim()) {
      setErrorMessage("Subtitle is required.");
      return;
    }
    if (!formData.ctaText.trim()) {
      setErrorMessage("CTA button text is required.");
      return;
    }
    if (!formData.ctaLink.trim()) {
      setErrorMessage("CTA button link is required.");
      return;
    }
    if (!formData.imageUrl.trim()) {
      setErrorMessage("Hero background image URL is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      await heroService.updateHero(formData);
      setSuccessMessage("Homepage Hero configuration saved successfully!");
    } catch (err: any) {
      console.error("Failed to save hero configuration:", err);
      setErrorMessage(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err.message ||
          "Failed to save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-8 w-8 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin" />
        <p className="text-xs uppercase font-mono tracking-widest text-neutral-400">
          Loading Hero Settings...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-heading">
              Homepage Hero
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5",
                formData.active
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-950/20"
                  : "border-neutral-700 text-neutral-400 bg-neutral-900"
              )}
            >
              {formData.active ? "Hero Active" : "Hero Disabled"}
            </Badge>
          </div>
          <p className="text-xs text-neutral-400">
            Manage the hero banner image, headline typography, and call-to-action button on the VYRE homepage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs"
          >
            {showLivePreview ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
            {showLivePreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <span>Live Storefront</span>
            <ExternalLink className="h-3 w-3 text-[#d4af37]" />
          </a>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xs bg-rose-950/40 border border-rose-800/60 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-rose-200">Error</p>
            <p className="text-xs text-rose-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xs bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-3">
          <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-emerald-200">Success</p>
            <p className="text-xs text-emerald-300">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Live Visual Storefront Preview */}
      {showLivePreview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#d4af37]" />
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                Live Storefront Preview
              </span>
            </div>
            {!formData.active && (
              <span className="text-[11px] font-mono text-amber-400">
                (Hero is currently disabled: this section will be hidden on storefront)
              </span>
            )}
          </div>

          <div className="relative w-full rounded-sm overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900 min-h-[360px] sm:min-h-[420px] flex items-center justify-center">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              {formData.imageUrl ? (
                <img
                  src={formData.imageUrl}
                  alt={formData.title || "VYRE."}
                  className="h-full w-full object-cover object-center brightness-95"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_HERO.imageUrl;
                  }}
                />
              ) : (
                <div className="h-full w-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Content overlay */}
            <div className="relative z-10 max-w-2xl mx-auto px-4 text-center text-white space-y-4 py-8">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em] drop-shadow-sm text-neutral-200">
                {formData.eyebrow || "WINTER 2026 COLLECTION"}
              </p>
              <div className="space-y-1">
                <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter drop-shadow-md leading-none">
                  {formData.title || "VYRE."}
                </h2>
                <p className="text-xs sm:text-base font-medium uppercase tracking-[0.2em] drop-shadow-sm text-neutral-100">
                  {formData.subtitle || "BUILT FOR YOUR EVERYDAY."}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  className="bg-white text-black hover:bg-neutral-100 px-6 py-2.5 text-xs font-bold uppercase tracking-widest shadow-xl rounded-none pointer-events-none"
                >
                  {formData.ctaText || "SHOP COLLECTION"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-[#0d0d0f] border border-neutral-800 rounded-sm p-6 sm:p-8 space-y-8">
          <div className="border-b border-neutral-800 pb-4">
            <h2 className="text-base font-bold uppercase tracking-wide text-white">
              Hero Configuration
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Update image assets, copy, and action buttons for the homepage banner.
            </p>
          </div>

          {/* 1. Hero Background Image Section */}
          <div className="space-y-4">
            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-300">
              Hero Background Image <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Image Preview Box */}
              <div className="relative aspect-video rounded-xs border border-neutral-800 bg-neutral-900 overflow-hidden group">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="Hero Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_HERO.imageUrl;
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-4 text-center">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <span className="text-[11px]">No image selected</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin" />
                    <span className="text-[10px] font-mono text-[#d4af37] uppercase">Uploading...</span>
                  </div>
                )}
              </div>

              {/* Upload & URL Controls */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 text-xs gap-2"
                  >
                    <Upload className="h-4 w-4 text-[#d4af37]" />
                    {uploading ? "Uploading..." : "Upload New Image"}
                  </Button>

                  <span className="text-xs text-neutral-500 font-mono">or paste direct image URL below</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Direct Image URL
                  </label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="https://..."
                    className="bg-neutral-900/80 border-neutral-800 text-neutral-200 text-xs font-mono"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Recommended dimensions: 1920x1080 or 2560x1440 (JPG, PNG, WebP) for crisp high-density displays.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-800">
            {/* 2. Eyebrow Text */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-widest text-neutral-300">
                Eyebrow Text <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.eyebrow}
                onChange={(e) => handleInputChange("eyebrow", e.target.value)}
                placeholder="e.g. WINTER 2026 COLLECTION"
                className="bg-neutral-900/80 border-neutral-800 text-white text-xs uppercase"
              />
              <p className="text-[11px] text-neutral-500">
                Small uppercase caption above the main headline.
              </p>
            </div>

            {/* 3. Main Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-widest text-neutral-300">
                Main Title <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g. VYRE."
                className="bg-neutral-900/80 border-neutral-800 text-white text-xs uppercase font-bold"
              />
              <p className="text-[11px] text-neutral-500">
                Main large brand/collection headline.
              </p>
            </div>

            {/* 4. Subtitle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-widest text-neutral-300">
                Subtitle <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.subtitle}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                placeholder="e.g. BUILT FOR YOUR EVERYDAY."
                className="bg-neutral-900/80 border-neutral-800 text-white text-xs uppercase"
              />
              <p className="text-[11px] text-neutral-500">
                Supporting tagline rendered below the title.
              </p>
            </div>

            {/* 5. Button Text */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-widest text-neutral-300">
                Button Text (CTA) <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.ctaText}
                onChange={(e) => handleInputChange("ctaText", e.target.value)}
                placeholder="e.g. SHOP COLLECTION"
                className="bg-neutral-900/80 border-neutral-800 text-white text-xs uppercase"
              />
              <p className="text-[11px] text-neutral-500">
                Action text displayed inside the primary button.
              </p>
            </div>

            {/* 6. Button URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-widest text-neutral-300">
                Button URL / Link <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.ctaLink}
                onChange={(e) => handleInputChange("ctaLink", e.target.value)}
                placeholder="e.g. /shop or /category/jackets"
                className="bg-neutral-900/80 border-neutral-800 text-white text-xs font-mono"
              />
              <p className="text-[11px] text-neutral-500">
                Destination link when users click the CTA button.
              </p>
            </div>

            {/* 7. Active / Enabled Toggle */}
            <div className="space-y-2 flex flex-col justify-center">
              <label className="block text-xs font-mono uppercase tracking-widest text-neutral-300">
                Display Status
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => handleInputChange("active", e.target.checked)}
                  className="h-4 w-4 rounded-xs border-neutral-700 bg-neutral-900 text-[#d4af37] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Hero Section Enabled
                </span>
              </label>
              <p className="text-[11px] text-neutral-500">
                When unchecked, the hero section will be hidden on the storefront.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToDefaults}
              className="w-full sm:w-auto border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={saving || uploading}
                className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase tracking-widest px-8 shadow-lg gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
