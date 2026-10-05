import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { Breadcrumb } from "../components/common/Breadcrumb.js";
import { User, Package, MapPin, Heart, LogOut, Shield } from "lucide-react";
import { cn } from "../utils/cn.js";

export const AccountLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/account", icon: Shield, end: true },
    { label: "My Orders", href: "/account/orders", icon: Package },
    { label: "Addresses", href: "/account/addresses", icon: MapPin },
    { label: "Profile & Security", href: "/account/profile", icon: User },
    { label: "My Wishlist", href: "/wishlist", icon: Heart },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-neutral-900">
      {/* Breadcrumbs */}
      <Breadcrumb items={[{ label: "My Account", href: "/account" }]} />

      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            Customer Account
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
            Welcome, {user?.firstName || "Customer"}
          </h1>
          <p className="text-xs text-neutral-500">{user?.email || "Logged in to VYRE."}</p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xs border border-neutral-300 bg-white text-xs font-bold uppercase tracking-wider text-neutral-700 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors self-start sm:self-auto"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Account Sidebar + Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <aside className="md:col-span-1">
          <nav className="flex flex-col space-y-1 rounded-xs border border-neutral-200 bg-neutral-50 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-xs text-xs font-bold uppercase tracking-wider transition-colors",
                      isActive
                        ? "bg-black text-white font-bold shadow-xs"
                        : "text-neutral-600 hover:bg-white hover:text-black"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Content Outlet */}
        <div className="md:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
