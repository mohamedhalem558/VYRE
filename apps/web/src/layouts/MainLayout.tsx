import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Logo } from "../components/brand/Logo.js";
import { useCart } from "../context/CartContext.js";
import { useWishlist } from "../context/WishlistContext.js";
import { useAuth } from "../context/AuthContext.js";
import { AnnouncementBar } from "../components/layout/AnnouncementBar.js";
import { CartDrawer } from "../components/common/CartDrawer.js";
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Search,
  Menu,
  X,
  ChevronDown,
  Instagram,
  ArrowRight,
} from "lucide-react";
import { cn } from "../utils/cn.js";
import { useStoreSettings } from "../context/StoreSettingsContext.js";
import { WinterDropPage } from "../pages/WinterDropPage.js";
import { HolidayFlair } from "../components/seasonal/HolidayFlair.js";

export const MainLayout: React.FC = () => {
  const { itemCount, openCartDrawer } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated } = useAuth();
  const { isWinterDropMode, adminBypassDrop } = useStoreSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [emailNewsletter, setEmailNewsletter] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const categoriesDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsCategoriesDropdownOpen(false);
  }, [location.pathname]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Close categories dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoriesDropdownRef.current &&
        !categoriesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoriesDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailNewsletter.trim()) {
      setNewsletterSubscribed(true);
      setEmailNewsletter("");
      setTimeout(() => setNewsletterSubscribed(false), 4000);
    }
  };

  // If Winter Drop Mode is active and visitor is not bypassing:
  // Allow login/auth routes so admins can sign in anytime
  const isAuthRoute =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/forgot-password") ||
    location.pathname.startsWith("/reset-password");

  if (isWinterDropMode && !adminBypassDrop && !isAuthRoute) {
    return <WinterDropPage />;
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-black selection:text-white relative">
      {/* Festive Falling Snow Flair (active when Holiday Theme is enabled) */}
      <HolidayFlair />

      {/* 1. Top Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Main Luxury Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Mobile Menu Button & Search (Mobile Left) */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-neutral-800 hover:text-black hover:bg-neutral-100 rounded-md transition-colors"
              aria-label="Open mobile menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-neutral-800 hover:text-black hover:bg-neutral-100 rounded-md transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Brand Logo (Left on Desktop, Center on Mobile) */}
          <div className="flex items-center">
            <Link to="/" className="inline-flex items-center group">
              <Logo size="md" showTagline={false} />
            </Link>
          </div>

          {/* Desktop Navigation Links (Center) */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-semibold uppercase tracking-wider text-neutral-700">
            <Link
              to="/"
              className={cn(
                "transition-colors hover:text-black py-2 relative",
                location.pathname === "/" ? "text-black font-bold" : ""
              )}
            >
              Home
              {location.pathname === "/" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
              )}
            </Link>

            <Link
              to="/shop"
              className={cn(
                "transition-colors hover:text-black py-2 relative",
                location.pathname === "/shop" ? "text-black font-bold" : ""
              )}
            >
              Shop
              {location.pathname === "/shop" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
              )}
            </Link>

            {/* Categories Dropdown (ONLY Hoodies & Sweaters and Jackets) */}
            <div
              className="relative"
              ref={categoriesDropdownRef}
              onMouseEnter={() => setIsCategoriesDropdownOpen(true)}
              onMouseLeave={() => setIsCategoriesDropdownOpen(false)}
            >
              <button
                onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                className={cn(
                  "flex items-center gap-1 transition-colors hover:text-black py-2 uppercase tracking-wider",
                  location.pathname.includes("/category/") || location.pathname.includes("/shop/")
                    ? "text-black font-bold"
                    : ""
                )}
                aria-expanded={isCategoriesDropdownOpen}
              >
                <span>Categories</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isCategoriesDropdownOpen ? "rotate-180" : ""
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              {isCategoriesDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-60 pt-2 z-50">
                  <div className="bg-white border border-neutral-200 rounded-lg shadow-xl p-2.5 space-y-1">
                    <Link
                      to="/shop/hoodies-sweaters"
                      className="block px-3.5 py-2.5 text-xs font-semibold text-neutral-800 hover:text-black hover:bg-neutral-50 rounded-md transition-colors"
                    >
                      Hoodies & Sweaters
                    </Link>
                    <Link
                      to="/shop/jackets"
                      className="block px-3.5 py-2.5 text-xs font-semibold text-neutral-800 hover:text-black hover:bg-neutral-50 rounded-md transition-colors"
                    >
                      Jackets
                    </Link>
                    <div className="pt-1 mt-1 border-t border-neutral-100">
                      <Link
                        to="/shop"
                        className="block px-3.5 py-2 text-[11px] font-medium text-neutral-500 hover:text-black transition-colors"
                      >
                        View All Collections →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/about"
              className={cn(
                "transition-colors hover:text-black py-2 relative",
                location.pathname === "/about" ? "text-black font-bold" : ""
              )}
            >
              About
              {location.pathname === "/about" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
              )}
            </Link>

            <Link
              to="/contact"
              className={cn(
                "transition-colors hover:text-black py-2 relative",
                location.pathname === "/contact" ? "text-black font-bold" : ""
              )}
            >
              Contact
              {location.pathname === "/contact" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
              )}
            </Link>
          </nav>

          {/* Right Action Icons (Search, Wishlist, Cart, Account) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Desktop Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-600 bg-neutral-100/80 hover:bg-neutral-200/70 hover:text-black transition-colors border border-neutral-200/60"
              aria-label="Search VYRE"
            >
              <Search className="h-3.5 w-3.5 text-neutral-500" />
              <span className="tracking-tight">Search...</span>
            </button>

            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="relative p-2.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag / Cart Button */}
            <button
              onClick={openCartDrawer}
              className="relative p-2.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Account Icon */}
            <Link
              to={isAuthenticated ? "/account" : "/login"}
              className="p-2.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition-colors hidden sm:inline-flex"
              aria-label="Account"
            >
              <UserIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <Logo size="sm" showTagline={false} />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-md transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                  Navigation
                </p>
                <div className="space-y-1">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-semibold text-neutral-800 hover:text-black"
                  >
                    Home
                  </Link>
                  <Link
                    to="/shop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-semibold text-neutral-800 hover:text-black"
                  >
                    Shop All
                  </Link>
                </div>
              </div>

              {/* Categories (ONLY Hoodies & Sweaters and Jackets) */}
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                  Categories
                </p>
                <div className="space-y-1">
                  <Link
                    to="/shop/hoodies-sweaters"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-semibold text-neutral-800 hover:text-black flex items-center justify-between"
                  >
                    <span>Hoodies & Sweaters</span>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </Link>
                  <Link
                    to="/shop/jackets"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-semibold text-neutral-800 hover:text-black flex items-center justify-between"
                  >
                    <span>Jackets</span>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </Link>
                </div>
              </div>

              {/* Brand Links */}
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                  Brand
                </p>
                <div className="space-y-1">
                  <Link
                    to="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-semibold text-neutral-800 hover:text-black"
                  >
                    About VYRE.
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-semibold text-neutral-800 hover:text-black"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>

              {/* Account / User Section */}
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                  Account
                </p>
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <Link
                      to="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2 text-sm font-semibold text-neutral-800 hover:text-black"
                    >
                      My Dashboard ({user?.name || user?.email})
                    </Link>
                    <Link
                      to="/account/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2 text-sm font-semibold text-neutral-800 hover:text-black"
                    >
                      My Orders
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider bg-black text-white rounded-md"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider border border-neutral-300 text-neutral-800 rounded-md"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500 font-mono">
              <span>VYRE. EST. 2026</span>
              <span>CAIRO, EG</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSearchSubmit} className="p-4 border-b border-neutral-200 flex items-center gap-3">
              <Search className="h-5 w-5 text-neutral-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Hoodies, Jackets, Collections..."
                className="w-full bg-transparent text-sm sm:text-base text-neutral-900 placeholder-neutral-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-black rounded-md hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </form>

            {/* Quick Filter Suggestions */}
            <div className="p-5 bg-neutral-50/50 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/shop/hoodies-sweaters"
                  onClick={() => setIsSearchOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-neutral-200 text-neutral-800 rounded-full hover:border-black hover:text-black transition-colors"
                >
                  Hoodies & Sweaters
                </Link>
                <Link
                  to="/shop/jackets"
                  onClick={() => setIsSearchOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-neutral-200 text-neutral-800 rounded-full hover:border-black hover:text-black transition-colors"
                >
                  Jackets
                </Link>
                <Link
                  to="/shop"
                  onClick={() => setIsSearchOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-neutral-200 text-neutral-800 rounded-full hover:border-black hover:text-black transition-colors"
                >
                  All Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Main Content Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 6. Sliding Cart Drawer */}
      <CartDrawer />

      {/* 7. Minimal Luxury Fashion Footer */}
      <footer className="bg-neutral-950 text-white border-t border-neutral-800 pt-16 pb-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-14 border-b border-neutral-800">
            {/* Column 1: Brand & Bio */}
            <div className="lg:col-span-2 space-y-4">
              <Logo size="lg" inverted={true} showTagline={false} />
              <p className="text-xs text-neutral-400 font-normal leading-relaxed max-w-sm uppercase tracking-wider">
                Built for your everyday. Premium streetwear and contemporary outerwear engineered in Cairo, Egypt.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://www.instagram.com/vyree.shop/?utm_source=ig_web_button_share_sheet"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="h-8 w-8 rounded-full border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.tiktok.com/@vyrrre.eg?is_from_webapp=1&sender_device=pc"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="h-8 w-8 rounded-full border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white transition-colors"
                >
                  <svg
                    className="h-4 w-4 fill-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.48V8.71a8.16 8.16 0 0 0 4.91 1.63v-3.65h-.01z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Shop Categories (ONLY TWO) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-200">
                Shop
              </h3>
              <ul className="space-y-2.5 text-xs text-neutral-400">
                <li>
                  <Link
                    to="/shop/hoodies-sweaters"
                    className="hover:text-white transition-colors"
                  >
                    Hoodies & Sweaters
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shop/jackets"
                    className="hover:text-white transition-colors"
                  >
                    Jackets
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">
                    All Products
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-200">
                Customer Care
              </h3>
              <ul className="space-y-2.5 text-xs text-neutral-400">
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    Brand Story
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    Shipping & Returns
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Account & Newsletter */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-200">
                Newsletter
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Be the first to know about private drops and seasonal releases.
              </p>
              {newsletterSubscribed ? (
                <div className="p-3 bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded-md">
                  Thank you for subscribing to VYRE.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <div className="flex">
                    <input
                      type="email"
                      value={emailNewsletter}
                      onChange={(e) => setEmailNewsletter(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 text-white placeholder-neutral-500 rounded-l-md w-full focus:outline-none focus:border-neutral-500"
                    />
                    <button
                      type="submit"
                      className="bg-white text-black text-xs font-bold uppercase px-3.5 py-2 rounded-r-md hover:bg-neutral-200 transition-colors shrink-0"
                    >
                      Join
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-mono">
            <div>
              &copy; {new Date().getFullYear()} VYRE. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-neutral-300 transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-neutral-300 transition-colors">
                Terms
              </Link>
              <Link to="/contact" className="hover:text-neutral-300 transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
