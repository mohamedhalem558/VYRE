import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { Logo } from "../components/brand/Logo.js";
import { cn } from "../utils/cn.js";
import {
  LayoutDashboard,
  Sparkles,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  Star,
  Tag,
  ShieldCheck,
  BarChart3,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const role = user?.role;
  const isAdmin = role === "ADMIN";
  const isInventoryManager = role === "INVENTORY_MANAGER";
  const isMarketingManager = role === "MARKETING_MANAGER";

  const navigationItems = [
    {
      title: "Core Operations",
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          visible: isAdmin || isMarketingManager,
        },
        {
          label: "Homepage Hero",
          href: "/admin/hero",
          icon: Sparkles,
          visible: isAdmin || isMarketingManager,
        },
        {
          label: "Homepage Collections",
          href: "/admin/categories",
          icon: Layers,
          visible: isAdmin || isMarketingManager || isInventoryManager,
        },
        {
          label: "Products",
          href: "/admin/products",
          icon: Package,
          visible: isAdmin || isInventoryManager || isMarketingManager,
        },
        {
          label: "Inventory",
          href: "/admin/inventory",
          icon: Boxes,
          visible: isAdmin || isInventoryManager,
        },
        {
          label: "Orders",
          href: "/admin/orders",
          icon: ShoppingBag,
          visible: isAdmin,
        },
      ],
    },
    {
      title: "Marketing & Growth",
      items: [
        {
          label: "Coupons",
          href: "/admin/coupons",
          icon: Tag,
          visible: isAdmin || isMarketingManager,
        },
        {
          label: "Reviews",
          href: "/admin/reviews",
          icon: Star,
          visible: isAdmin,
        },
        {
          label: "Customers",
          href: "/admin/customers",
          icon: Users,
          visible: isAdmin,
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          label: "Users & Roles",
          href: "/admin/users",
          icon: ShieldCheck,
          visible: isAdmin,
        },
        {
          label: "Reports",
          href: "/admin/reports",
          icon: BarChart3,
          visible: isAdmin,
        },
        {
          label: "Audit Logs",
          href: "/admin/audit-logs",
          icon: ShieldAlert,
          visible: isAdmin,
        },
        {
          label: "Storefront Modes & Settings",
          href: "/admin/settings",
          icon: Settings,
          visible: isAdmin || isMarketingManager,
        },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col lg:flex-row antialiased">
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-[#0d0d0f] sticky top-0 z-40">
        <Link to="/admin" className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-[10px] font-mono tracking-widest text-[#d4af37] uppercase bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
            Console
          </span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-neutral-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "w-64 shrink-0 border-r border-neutral-800/80 bg-[#0d0d0f] flex flex-col justify-between fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 lg:static",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Header */}
          <div className="p-6 border-b border-neutral-800/80 flex items-center justify-between">
            <Link to="/admin" className="flex flex-col">
              <Logo size="md" />
              <span className="text-[10px] font-mono tracking-widest text-[#d4af37] uppercase mt-1">
                Management Console
              </span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-neutral-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Role Card */}
          <div className="p-4 mx-4 my-4 rounded-sm border border-neutral-800 bg-neutral-900/60">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center font-bold text-xs text-[#d4af37]">
                {user?.firstName?.[0] || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#d4af37]">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Groups */}
          <nav className="flex-1 px-4 space-y-6 pb-6">
            {navigationItems.map((group) => {
              const visibleItems = group.items.filter((item) => item.visible);
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
                    {group.title}
                  </p>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/admin"
                        ? location.pathname === "/admin"
                        : location.pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xs transition-colors",
                          isActive
                            ? "bg-white text-black font-bold shadow-md"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900/80"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={cn("h-4 w-4", isActive ? "text-black" : "text-neutral-400")} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="h-3 w-3 text-black" />}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-neutral-800/80 space-y-2">
            <Link
              to="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 text-xs text-neutral-400 hover:text-white hover:bg-neutral-900/60 rounded-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-[#d4af37]" />
                <span>View Storefront</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">Live</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xs transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
        {/* Top Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-neutral-800/80 bg-[#0d0d0f]/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
              VYRE Platform
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-xs uppercase font-bold text-white tracking-wider">
              {location.pathname.replace("/admin", "").replace("/", "") || "Overview"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xs"
            >
              <span>Storefront</span>
              <ExternalLink className="h-3 w-3 text-[#d4af37]" />
            </Link>

            <div className="h-4 w-px bg-neutral-800" />

            <div className="text-right">
              <p className="text-xs font-bold text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] font-mono text-[#d4af37]">{user?.email}</p>
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
