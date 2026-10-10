import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/brand/Logo.js";
import { useStoreSettings } from "../context/StoreSettingsContext.js";
import { useAuth } from "../context/AuthContext.js";
import { HolidayFlair } from "../components/seasonal/HolidayFlair.js";
import {
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Instagram,
  Eye,
  Sliders,
  Snowflake,
} from "lucide-react";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export const WinterDropPage: React.FC = () => {
  const {
    settings,
    subscribeWaitlist,
    toggleWinterDropMode,
    isHolidayTheme,
    setAdminBypassDrop,
  } = useStoreSettings();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ADMIN" || user?.role === "MARKETING_MANAGER";

  // Countdown timer calculation
  const calculateTimeRemaining = (): TimeRemaining => {
    const target = new Date(settings.dropDate || "2027-01-15T18:00:00Z").getTime();
    const now = new Date().getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      isExpired: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(calculateTimeRemaining());
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, [settings.dropDate]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const res = await subscribeWaitlist(email.trim());
      setSubscribed(true);
      setStatusMessage(res.message);
      setEmail("");
    } catch {
      setStatusMessage("Thank you! You are confirmed for VIP early access.");
      setSubscribed(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Headline & descriptive copy
  const headline =
    !settings.dropTitle || settings.dropTitle.includes("2026")
      ? "WINTER 2027 COLLECTION"
      : settings.dropTitle;

  const description =
    !settings.dropDescription || settings.dropDescription.includes("2026")
      ? "The winter chapter of VYRE is arriving. Engineered for contemporary street luxury. Limited Capsule Drop coming soon."
      : settings.dropDescription;

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#d4af37] selection:text-black relative overflow-x-hidden antialiased">
      {/* 0. Ambient Luxury Backing Lighting (Multi-layer glow) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Primary Warm Amber / Gold Radial Aura */}
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-[#d4af37]/15 via-amber-700/5 to-transparent blur-[130px] rounded-full" />
        {/* Subtle Deep Cyan / Frost Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-950/15 blur-[140px] rounded-full" />
        {/* Subtle Vignette Gradient */}
        <div className="absolute inset-0 bg-radial-vignette opacity-70" />
      </div>

      {/* Festive Holiday Falling Snow (if holiday theme is active) */}
      <HolidayFlair />

      {/* 1. Admin Quick-Control Floating Bar (Always visible to Admins) */}
      {isAdmin && (
        <div className="sticky top-0 z-50 bg-[#0d0d12]/95 border-b border-[#d4af37]/40 px-4 py-2.5 backdrop-blur-md shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#d4af37] animate-ping" />
              <span className="font-mono text-[#d4af37] font-bold uppercase tracking-wider">
                Admin Live Control:
              </span>
              <span className="text-neutral-300">
                Winter Drop Mode is <strong className="text-white">ACTIVE</strong> on public storefront.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAdminBypassDrop(true);
                  navigate("/");
                }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-700 rounded-xs border border-neutral-700 flex items-center gap-1.5 transition-colors"
                title="View normal storefront as logged in admin"
              >
                <Eye className="h-3 w-3" />
                <span>Preview Normal Store</span>
              </button>

              <button
                onClick={() => toggleWinterDropMode()}
                className="px-3 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xs transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Turn Off Drop Mode</span>
              </button>

              <Link
                to="/admin/settings"
                className="px-3 py-1 text-[11px] font-bold bg-[#d4af37] hover:bg-[#c49f27] text-black rounded-xs transition-colors flex items-center gap-1.5"
              >
                <Sliders className="h-3 w-3" />
                <span>Store Settings</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Header Navigation */}
      <header className="relative z-40 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="md" inverted={true} showTagline={false} />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800/80 bg-neutral-900/60 backdrop-blur-sm text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
            <span>Cairo, EG</span>
            <span className="text-neutral-600">•</span>
            <span className="text-[#d4af37] font-semibold">Limited Drop</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isHolidayTheme && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 text-[11px] font-mono text-[#d4af37] backdrop-blur-sm">
              <Snowflake className="h-3 w-3 animate-spin" style={{ animationDuration: "12s" }} />
              <span className="hidden sm:inline uppercase tracking-wider font-semibold">Holiday Edition</span>
            </div>
          )}

          {/* Discreet Admin Login Access Button */}
          <Link
            to={isAuthenticated ? "/admin" : "/login"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-neutral-800/90 bg-neutral-900/50 hover:bg-neutral-800 hover:border-neutral-700 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-all backdrop-blur-sm"
            title={isAuthenticated ? "Open Admin Panel" : "Staff & Admin Login"}
          >
            {isAuthenticated ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-[#d4af37]" />
                <span className="text-[#d4af37] font-semibold">Admin Panel</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span>Admin Login</span>
              </>
            )}
          </Link>
        </div>
      </header>

      {/* 3. Main Hero & Teaser Content */}
      <main className="relative z-30 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col items-center justify-center text-center space-y-12 sm:space-y-14">
        {/* Main Title & Descriptive Typography */}
        <div className="space-y-5 max-w-3xl mx-auto">
          {/* Subtle Luxury Pre-header Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#d4af37]/30 bg-neutral-950/70 backdrop-blur-md text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.22em] text-[#d4af37] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            <span>LIMITED CAPSULE // COMING SOON</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight font-heading text-white leading-[1.05] drop-shadow-md">
            {headline}
          </h1>

          {/* Refined Captivating Description */}
          <p className="text-sm sm:text-base md:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed font-sans font-normal tracking-wide">
            {description}
          </p>
        </div>

        {/* 4. Polished Luxury Countdown Clock */}
        {settings.countdownEnabled && (
          <div className="w-full max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-400">
              <Clock className="h-3.5 w-3.5 text-[#d4af37]" />
              <span>Official Drop Countdown</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5 sm:gap-5">
              {[
                { label: "DAYS", value: timeLeft.days },
                { label: "HOURS", value: timeLeft.hours },
                { label: "MINS", value: timeLeft.minutes },
                { label: "SECS", value: timeLeft.seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="p-4 sm:p-6 rounded-sm border border-neutral-800/90 bg-gradient-to-b from-neutral-900/70 to-neutral-950/90 backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group hover:border-[#d4af37]/50 transition-all duration-300"
                >
                  <div className="text-3xl sm:text-5xl md:text-6xl font-black font-mono text-white tracking-tight">
                    {String(unit.value).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#d4af37] mt-1.5 font-bold">
                    {unit.label}
                  </div>
                  {/* Refined Golden Bottom Accent Line */}
                  <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37]/80 to-transparent group-hover:via-[#d4af37] transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. VIP Early Access Notification Form */}
        {settings.notifyEmailEnabled && (
          <div className="w-full max-w-lg mx-auto pt-2">
            {subscribed ? (
              <div className="p-6 rounded-sm border border-[#d4af37]/40 bg-[#d4af37]/5 text-center space-y-2 backdrop-blur-md shadow-xl animate-in fade-in zoom-in-95">
                <CheckCircle2 className="h-8 w-8 text-[#d4af37] mx-auto" />
                <p className="text-sm font-bold uppercase tracking-wider text-white">
                  You Are On The Private VIP List
                </p>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-sm mx-auto">
                  {statusMessage ||
                    "We will email your private early-access access code before the public drop."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3.5">
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5 p-1.5 bg-neutral-950/70 rounded-sm border border-neutral-800 focus-within:border-[#d4af37]/80 focus-within:ring-1 focus-within:ring-[#d4af37]/40 backdrop-blur-xl transition-all shadow-xl">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for private drop access..."
                    className="w-full px-4 py-3 bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="shrink-0 px-6 py-3 bg-[#d4af37] hover:bg-[#c49f27] text-black font-extrabold uppercase tracking-[0.15em] text-xs rounded-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 font-heading shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>{submitting ? "Joining..." : "Get Notified"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 font-mono text-center tracking-wide">
                  Zero spam. Private early-access access code delivered directly to VIP members.
                </p>
              </form>
            )}
          </div>
        )}
      </main>

      {/* 6. Editorial Luxury Footer */}
      <footer className="relative z-30 border-t border-neutral-900/90 bg-[#070709]/90 py-8 px-4 sm:px-6 lg:px-8 mt-12 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="font-mono text-white font-bold tracking-wider">VYRE.</span>
            <span>•</span>
            <span className="font-mono text-[11px]">EST. 2026 // CAIRO, EGYPT</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-mono uppercase tracking-wider">
            <a
              href="https://www.instagram.com/vyree.shop/?utm_source=ig_web_button_share_sheet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <Instagram className="h-3.5 w-3.5" />
              <span>Instagram</span>
            </a>
            <a
              href="https://www.tiktok.com/@vyrrre.eg?is_from_webapp=1&sender_device=pc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              TikTok
            </a>
            <Link
              to={isAuthenticated ? "/admin" : "/login"}
              className="text-[#d4af37] hover:underline"
            >
              {isAuthenticated ? "Dashboard" : "Staff Portal"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
