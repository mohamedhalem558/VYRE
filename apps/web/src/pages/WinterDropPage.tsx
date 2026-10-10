import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/brand/Logo.js";
import { useStoreSettings } from "../context/StoreSettingsContext.js";
import { useAuth } from "../context/AuthContext.js";
import { HolidayFlair } from "../components/seasonal/HolidayFlair.js";
import {
  Clock,
  Sparkles,
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
    const target = new Date(settings.dropDate || "2026-11-20T18:00:00Z").getTime();
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
      setStatusMessage("Thank you! You are confirmed for early access.");
      setSubscribed(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Preview lookbook capsules
  const lookbookTeasers = [
    {
      id: "01",
      title: "480GSM Archival Boxy Hoodie",
      fabric: "100% Egyptian Combed French Terry",
      edition: "Limited to 150 pieces",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
      badge: "Heavyweight Box Cut",
    },
    {
      id: "02",
      title: "Technical Thermal Parka",
      fabric: "Water-Repellent Ripstop & Down Fill",
      edition: "Limited to 80 pieces",
      image: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop",
      badge: "Insulated Shell",
    },
    {
      id: "03",
      title: "Structured Heavy Knit Sweater",
      fabric: "Dual-Ply Egyptian Cotton & Wool",
      edition: "Limited to 120 pieces",
      image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1200&auto=format&fit=crop",
      badge: "Winter Knitwear",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col justify-between selection:bg-[#d4af37] selection:text-black relative overflow-x-hidden">
      {/* Festive Holiday Falling Snow (if holiday theme is active) */}
      <HolidayFlair />

      {/* 1. Admin Quick-Control Floating Bar (Always visible to Admins) */}
      {isAdmin && (
        <div className="sticky top-0 z-50 bg-[#121217]/95 border-b border-[#d4af37]/40 px-4 py-2.5 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#d4af37] animate-ping" />
              <span className="font-mono text-[#d4af37] font-bold uppercase tracking-wider">
                Admin Live Control:
              </span>
              <span className="text-neutral-300">
                Winter Drop Mode is <strong className="text-white">ACTIVE</strong> for public storefront.
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
      <header className="relative z-40 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="md" inverted={true} showTagline={false} />
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-neutral-800 bg-neutral-900/80 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
            <span>Cairo, EG</span>
            <span>•</span>
            <span className="text-[#d4af37] font-bold">Limited Capsule</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isHolidayTheme && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 text-[11px] font-mono text-[#d4af37]">
              <Snowflake className="h-3 w-3 animate-spin" style={{ animationDuration: "12s" }} />
              <span className="hidden sm:inline uppercase tracking-wider font-semibold">Holiday Edition</span>
            </div>
          )}

          {/* Discreet Admin Login Access Button */}
          <Link
            to={isAuthenticated ? "/admin" : "/login"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 hover:border-neutral-700 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-all"
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
      <main className="relative z-30 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 flex-1 flex flex-col items-center justify-center text-center space-y-12">
        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#d4af37]/10 via-cyan-900/10 to-transparent blur-3xl pointer-events-none rounded-full"
          aria-hidden="true"
        />

        {/* Chapter Eyebrow */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4af37]/30 bg-neutral-950/80 text-[11px] font-mono uppercase tracking-widest text-[#d4af37]">
            <Sparkles className="h-3 w-3 text-[#d4af37]" />
            <span>Chapter 02 // Winter 2026 Collection</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight font-heading text-white max-w-4xl leading-[1.05]">
            {settings.dropTitle || "Winter 2026 Collection"}
          </h1>

          <p className="text-sm sm:text-base font-mono tracking-widest text-[#d4af37] uppercase">
            {settings.dropSubtitle || "DROP SOON • LIMITED RUN • CAIRO, EG"}
          </p>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed pt-2">
            {settings.dropDescription ||
              "The winter chapter of VYRE is arriving. Engineered in Cairo for everyday luxury. Subscribe below for private early access and private lookbook preview."}
          </p>
        </div>

        {/* 4. Live Countdown Clock */}
        {settings.countdownEnabled && (
          <div className="w-full max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-3">
              <Clock className="h-3.5 w-3.5 text-[#d4af37]" />
              <span>Official Drop Countdown</span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {[
                { label: "DAYS", value: timeLeft.days },
                { label: "HOURS", value: timeLeft.hours },
                { label: "MINS", value: timeLeft.minutes },
                { label: "SECS", value: timeLeft.seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="p-4 sm:p-5 rounded-sm border border-neutral-800/90 bg-neutral-950/80 backdrop-blur-md flex flex-col items-center justify-center shadow-lg relative overflow-hidden group hover:border-neutral-700 transition-colors"
                >
                  <div className="text-2xl sm:text-4xl font-black font-mono text-white tracking-tight">
                    {String(unit.value).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#d4af37] mt-1 font-semibold">
                    {unit.label}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. VIP Early Access Notification Form */}
        {settings.notifyEmailEnabled && (
          <div className="w-full max-w-md mx-auto pt-2">
            {subscribed ? (
              <div className="p-5 rounded-sm border border-emerald-500/40 bg-emerald-950/20 text-center space-y-2 backdrop-blur-md">
                <CheckCircle2 className="h-7 w-7 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                  You Are On The Private VIP List
                </p>
                <p className="text-xs text-neutral-300">
                  {statusMessage ||
                    "We will email your private early-access access code 1 hour before the public drop."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email for VIP early access..."
                    className="w-full px-4 py-3 bg-neutral-900/90 border border-neutral-800 rounded-sm text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto shrink-0 px-6 py-3 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-wider text-xs rounded-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-heading"
                  >
                    <span>{submitting ? "Joining..." : "Get Notified"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 font-mono text-center">
                  Zero spam. Exclusive early-access password emailed directly to VIP members.
                </p>
              </form>
            )}
          </div>
        )}

        {/* 6. Capsule Teaser Cards */}
        <div className="w-full pt-8 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3 max-w-4xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
              Capsule Preview // 3 Featured Cuts
            </span>
            <span className="text-[11px] font-mono text-[#d4af37] uppercase">
              100% Cairo Crafted
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            {lookbookTeasers.map((item) => (
              <div
                key={item.id}
                className="group rounded-sm border border-neutral-800/80 bg-neutral-950/70 overflow-hidden flex flex-col hover:border-neutral-700 transition-all duration-300"
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-neutral-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/80 backdrop-blur-sm border border-neutral-700 text-[10px] font-mono uppercase tracking-widest text-white rounded-xs">
                    {item.badge}
                  </div>
                  <div className="absolute top-2.5 right-2.5 text-[10px] font-mono text-[#d4af37] bg-black/80 px-2 py-0.5 border border-neutral-800 rounded-xs">
                    {item.id}
                  </div>
                </div>

                <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-mono">{item.fabric}</p>
                  </div>
                  <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>{item.edition}</span>
                    <span className="text-[#d4af37]">Coming Soon</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 7. Editorial Luxury Footer */}
      <footer className="relative z-30 border-t border-neutral-900 bg-neutral-950/90 py-8 px-4 sm:px-6 lg:px-8 mt-12">
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
