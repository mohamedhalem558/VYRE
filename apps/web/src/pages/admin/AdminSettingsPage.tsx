import React, { useState, useEffect } from "react";
import { useStoreSettings } from "../../context/StoreSettingsContext.js";
import { storeSettingsService } from "../../services/store-settings.service.js";
import { DropWaitlistSubscriberDTO } from "@vyre/shared";
import { Button } from "../../components/ui/button.js";
import { Badge } from "../../components/ui/badge.js";
import { useToast } from "../../components/ui/toast.js";
import { formatDate } from "../../utils/formatters.js";
import {
  Sparkles,
  Snowflake,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Copy,
  Download,
  Calendar,
  Save,
  RotateCcw,
  Sliders,
  Shield,
  Layers,
} from "lucide-react";

export const AdminSettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    toggleWinterDropMode,
    toggleHolidayTheme,
    isWinterDropMode,
    isHolidayTheme,
    isLoading,
  } = useStoreSettings();

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    dropTitle: settings.dropTitle,
    dropSubtitle: settings.dropSubtitle,
    dropDescription: settings.dropDescription,
    dropDate: settings.dropDate,
    countdownEnabled: settings.countdownEnabled,
    notifyEmailEnabled: settings.notifyEmailEnabled,
    announcementText: settings.announcementText,
    snowIntensity: settings.snowIntensity || "medium",
  });

  const [saving, setSaving] = useState(false);
  const [subscribers, setSubscribers] = useState<DropWaitlistSubscriberDTO[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  useEffect(() => {
    setFormData({
      dropTitle: settings.dropTitle,
      dropSubtitle: settings.dropSubtitle,
      dropDescription: settings.dropDescription,
      dropDate: settings.dropDate,
      countdownEnabled: settings.countdownEnabled,
      notifyEmailEnabled: settings.notifyEmailEnabled,
      announcementText: settings.announcementText,
      snowIntensity: settings.snowIntensity || "medium",
    });
  }, [settings]);

  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const data = await storeSettingsService.getWaitlistSubscribers();
      setSubscribers(data);
    } catch (err) {
      console.warn("Failed to fetch waitlist subscribers:", err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        dropTitle: formData.dropTitle,
        dropSubtitle: formData.dropSubtitle,
        dropDescription: formData.dropDescription,
        dropDate: formData.dropDate,
        countdownEnabled: formData.countdownEnabled,
        notifyEmailEnabled: formData.notifyEmailEnabled,
        announcementText: formData.announcementText,
        snowIntensity: formData.snowIntensity as any,
      });
    } finally {
      setSaving(false);
    }
  };

  const copySubscribersToClipboard = () => {
    if (subscribers.length === 0) {
      toast({
        title: "No Subscribers Yet",
        description: "No emails have been captured on the drop page yet.",
        type: "info",
      });
      return;
    }

    const emailList = subscribers.map((s) => s.email).join("\n");
    navigator.clipboard.writeText(emailList);
    toast({
      title: "Emails Copied",
      description: `${subscribers.length} subscriber email(s) copied to clipboard.`,
      type: "success",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Sliders className="h-8 w-8 text-[#d4af37] animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Loading Storefront Settings...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#d4af37]">
            Store Control & Merchandising
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-heading">
            Storefront Modes / Seasonal Themes
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Toggle public coming soon drop mode and seasonal flair while keeping your admin panel fully accessible.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-sm transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-[#d4af37]" />
            <span>Open Public Storefront</span>
          </a>
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="rounded-sm border border-emerald-900/60 bg-emerald-950/20 p-4 flex items-start gap-3.5 text-xs text-neutral-300">
        <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white uppercase tracking-wider text-[11px]">
            Zero Data Loss Guarantee
          </p>
          <p className="text-neutral-300 leading-relaxed text-[11px]">
            Toggling between regular store and Winter Drop Mode is 100% non-destructive. All existing products, categories, inventory, orders, and customer accounts remain completely intact and untouched in your database.
          </p>
        </div>
      </div>

      {/* Primary Toggles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Toggle 1: Winter Coming Soon / Drop Mode */}
        <div
          className={`rounded-sm border p-6 space-y-5 transition-all ${
            isWinterDropMode
              ? "border-amber-500/50 bg-amber-950/10 shadow-lg shadow-amber-950/20"
              : "border-neutral-800 bg-neutral-950"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-sm flex items-center justify-center ${
                  isWinterDropMode
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                }`}
              >
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Winter Coming Soon / Drop Mode
                </h2>
                <p className="text-[11px] text-neutral-400">Main public storefront state</p>
              </div>
            </div>

            <Badge variant={isWinterDropMode ? "gold" : "outline"}>
              {isWinterDropMode ? "DROP MODE ACTIVE" : "NORMAL STORE LIVE"}
            </Badge>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            When enabled, public visitors visiting the main storefront are shown the full-screen{" "}
            <strong className="text-white">Winter Collection Coming Soon</strong> page with countdown clock and VIP email waitlist. Your admin panel at{" "}
            <code className="text-[#d4af37] bg-neutral-900 px-1 py-0.5 rounded font-mono">/admin</code>{" "}
            remains 100% accessible so you can manage orders and turn it off anytime.
          </p>

          <div className="pt-2 flex items-center justify-between border-t border-neutral-900">
            <div className="text-[11px] font-mono text-neutral-400">
              Current Status:{" "}
              <span className={isWinterDropMode ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                {isWinterDropMode ? "Locked to Coming Soon" : "Store Open to Customers"}
              </span>
            </div>

            <Button
              variant={isWinterDropMode ? "destructive" : "gold"}
              size="sm"
              onClick={() => toggleWinterDropMode()}
              className="font-bold text-xs"
            >
              {isWinterDropMode ? "Turn Off Drop Mode" : "Activate Winter Drop Mode"}
            </Button>
          </div>
        </div>

        {/* Toggle 2: Christmas / Holiday Theme */}
        <div
          className={`rounded-sm border p-6 space-y-5 transition-all ${
            isHolidayTheme
              ? "border-cyan-500/50 bg-cyan-950/10 shadow-lg shadow-cyan-950/20"
              : "border-neutral-800 bg-neutral-950"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-sm flex items-center justify-center ${
                  isHolidayTheme
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                }`}
              >
                <Snowflake className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Christmas / Holiday Theme
                </h2>
                <p className="text-[11px] text-neutral-400">Atmospheric visual flair</p>
              </div>
            </div>

            <Badge variant={isHolidayTheme ? "success" : "outline"}>
              {isHolidayTheme ? "HOLIDAY THEME ON" : "STANDARD THEME"}
            </Badge>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Adds an elegant falling snowfall canvas particle animation across the storefront and Coming Soon page, alongside festive holiday accent ribbons in the announcement bar.
          </p>

          <div className="pt-2 flex items-center justify-between border-t border-neutral-900">
            <div className="text-[11px] font-mono text-neutral-400">
              Visual Flair:{" "}
              <span className={isHolidayTheme ? "text-cyan-400 font-bold" : "text-neutral-400 font-bold"}>
                {isHolidayTheme ? "Festive Snowfall Active" : "Minimalist Standard"}
              </span>
            </div>

            <Button
              variant={isHolidayTheme ? "outline" : "gold"}
              size="sm"
              onClick={() => toggleHolidayTheme()}
              className="font-bold text-xs"
            >
              {isHolidayTheme ? "Disable Holiday Theme" : "Enable Holiday Theme"}
            </Button>
          </div>
        </div>
      </div>

      {/* Configuration Form: Drop Content & Countdown */}
      <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-4 w-4 text-[#d4af37]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Drop Page Content & Countdown Customization
            </h2>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 uppercase">
            Changes reflect instantly on drop page
          </span>
        </div>

        <form onSubmit={handleSaveForm} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="font-mono uppercase tracking-wider text-neutral-400 block font-bold text-[10px]">
                Main Drop Headline
              </label>
              <input
                type="text"
                name="dropTitle"
                value={formData.dropTitle}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xs text-white focus:outline-none focus:border-[#d4af37]"
                placeholder="Winter 2026 Collection"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1.5">
              <label className="font-mono uppercase tracking-wider text-neutral-400 block font-bold text-[10px]">
                Drop Subtitle / Badge
              </label>
              <input
                type="text"
                name="dropSubtitle"
                value={formData.dropSubtitle}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xs text-white focus:outline-none focus:border-[#d4af37]"
                placeholder="DROP SOON • LIMITED RUN • CAIRO, EG"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-mono uppercase tracking-wider text-neutral-400 block font-bold text-[10px]">
              Drop Editorial Teaser Copy
            </label>
            <textarea
              name="dropDescription"
              rows={3}
              value={formData.dropDescription}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xs text-white focus:outline-none focus:border-[#d4af37]"
              placeholder="Editorial description explaining the collection..."
            />
          </div>

          {/* Countdown & Snowfall Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Target Date */}
            <div className="space-y-1.5">
              <label className="font-mono uppercase tracking-wider text-neutral-400 block font-bold text-[10px]">
                Target Drop Date & Time
              </label>
              <input
                type="datetime-local"
                name="dropDate"
                value={
                  formData.dropDate
                    ? new Date(formData.dropDate).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) => {
                  const iso = e.target.value ? new Date(e.target.value).toISOString() : "";
                  setFormData((prev) => ({ ...prev, dropDate: iso }));
                }}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Snow Intensity */}
            <div className="space-y-1.5">
              <label className="font-mono uppercase tracking-wider text-neutral-400 block font-bold text-[10px]">
                Snowfall Intensity
              </label>
              <select
                name="snowIntensity"
                value={formData.snowIntensity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xs text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="light">Light (Subtle Atmosphere)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="heavy">Heavy (Festive Winter Blizzard)</option>
              </select>
            </div>

            {/* Announcement text */}
            <div className="space-y-1.5">
              <label className="font-mono uppercase tracking-wider text-neutral-400 block font-bold text-[10px]">
                Announcement Bar Banner
              </label>
              <input
                type="text"
                name="announcementText"
                value={formData.announcementText}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xs text-white focus:outline-none focus:border-[#d4af37]"
                placeholder="❄️ WINTER DROP IMMINENT • EXCLUSIVE LIMITED RUN"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="countdownEnabled"
                checked={formData.countdownEnabled}
                onChange={handleInputChange}
                className="rounded-xs border-neutral-700 bg-neutral-900 text-[#d4af37] focus:ring-0"
              />
              <span className="text-neutral-300 font-medium">Show Live Countdown Clock</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="notifyEmailEnabled"
                checked={formData.notifyEmailEnabled}
                onChange={handleInputChange}
                className="rounded-xs border-neutral-700 bg-neutral-900 text-[#d4af37] focus:ring-0"
              />
              <span className="text-neutral-300 font-medium">Enable VIP Waitlist Email Capture</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <p className="text-[11px] text-neutral-400 font-mono">
              Last saved: {formatDate(settings.updatedAt || new Date().toISOString())}
            </p>

            <Button
              type="submit"
              variant="gold"
              isLoading={saving}
              leftIcon={<Save className="h-3.5 w-3.5" />}
            >
              Save Configuration
            </Button>
          </div>
        </form>
      </div>

      {/* Captured VIP Waitlist Section */}
      <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-[#d4af37]" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                VIP Drop Waitlist Subscribers ({subscribers.length})
              </h2>
              <p className="text-[11px] text-neutral-400">
                Customers who signed up for private early access on the Coming Soon page
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copySubscribersToClipboard}
              leftIcon={<Copy className="h-3 w-3" />}
              className="text-xs"
            >
              Copy All Emails
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSubscribers}
              isLoading={loadingSubscribers}
              leftIcon={<RotateCcw className="h-3 w-3" />}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>

        {subscribers.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 space-y-1">
            <p>No customers on the waitlist yet.</p>
            <p className="text-[11px] text-neutral-400">
              When Winter Drop Mode is active, email signups from the page will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Joined Date</th>
                  <th className="pb-2 text-right">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 font-mono text-[11px]">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-neutral-900/40">
                    <td className="py-2.5 text-white font-bold">{sub.email}</td>
                    <td className="py-2.5 text-neutral-400">{formatDate(sub.createdAt)}</td>
                    <td className="py-2.5 text-right text-neutral-400">{sub.source || "Drop Page"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
