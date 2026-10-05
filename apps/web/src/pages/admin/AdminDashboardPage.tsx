import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/admin.service.js";
import { DashboardStatsDTO } from "@vyre/shared";
import { formatCurrency, formatDate } from "../../utils/formatters.js";
import { Button } from "../../components/ui/button.js";
import { Badge } from "../../components/ui/badge.js";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Boxes,
} from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="h-8 w-8 text-[#d4af37] animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Compiling Real-Time Store Analytics...
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center border border-neutral-800 rounded-sm bg-neutral-950">
        <p className="text-sm text-neutral-400">Failed to load system dashboard analytics.</p>
        <Button variant="gold" size="sm" onClick={fetchStats} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // Calculate highest revenue in salesTrend for chart scaling
  const maxRevenue = Math.max(...stats.salesTrend.map((d) => d.revenue), 100);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#d4af37]">
            Management Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-heading">
            Executive Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            isLoading={refreshing}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh Data
          </Button>

          <Link to="/admin/orders">
            <Button variant="gold" size="sm" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
              Process Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (8 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-5 space-y-2 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Revenue</span>
            <TrendingUp className="h-4 w-4 text-[#d4af37]" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <span>● Live Egyptian E-Commerce</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-5 space-y-2 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-blue-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {stats.totalOrders}
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">Cumulative customer orders</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-5 space-y-2 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Pending Orders</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {stats.pendingOrders}
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">Requires courier processing</p>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-5 space-y-2 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Delivered</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {stats.completedOrders}
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">Fulfilled at doorstep</p>
          </div>
        </div>

        {/* Total Customers */}
        <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-5 space-y-2 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Active Customers</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {stats.totalCustomers}
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">Registered buyer accounts</p>
          </div>
        </div>

        {/* Total Products */}
        <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-5 space-y-2 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Products Catalog</span>
            <Package className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {stats.totalProducts}
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">Live styles in atelier</p>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-5 space-y-2 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Low Stock SKU</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {stats.lowStockCount}
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">≤ 5 units remaining</p>
          </div>
        </div>

        {/* Out of Stock Products */}
        <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-5 space-y-2 hover:border-neutral-700 transition-colors">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Sold Out SKU</span>
            <Boxes className="h-4 w-4 text-rose-500" />
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
              {stats.outOfStockCount}
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">Requires production restock</p>
          </div>
        </div>
      </div>

      {/* Charts Section: 7-Day Revenue Trend & Order Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Revenue & Volume Area Trend */}
        <div className="lg:col-span-2 rounded-sm border border-neutral-800 bg-neutral-950 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Revenue & Sales Trajectory
              </h2>
              <p className="text-[11px] text-neutral-400">
                Daily settled sales revenue across Egyptian regions (EGP)
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#d4af37] bg-[#d4af37]/10 px-2 py-1 rounded border border-[#d4af37]/20">
              Last 7 Days
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
            {stats.salesTrend.map((day) => {
              const heightPct = Math.max(6, Math.round((day.revenue / maxRevenue) * 100));
              const displayDate = day.date.slice(5); // MM-DD

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 border border-neutral-700 text-white text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap pointer-events-none mb-1 shadow-lg">
                    {formatCurrency(day.revenue)} ({day.orders} ord)
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[42px] bg-neutral-900 rounded-t-xs relative overflow-hidden flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-[#d4af37]/40 to-[#d4af37] rounded-t-xs transition-all duration-500 group-hover:brightness-125"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  {/* Day label */}
                  <span className="text-[10px] font-mono text-neutral-400 group-hover:text-white transition-colors">
                    {displayDate}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-neutral-900 pt-3 text-[11px] text-neutral-400">
            <span>Peak Daily: <strong className="text-white font-mono">{formatCurrency(maxRevenue)}</strong></span>
            <span>Total Orders: <strong className="text-white font-mono">{stats.totalOrders}</strong></span>
          </div>
        </div>

        {/* Right Col: Order Status Breakdown & Distribution */}
        <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-6 space-y-6">
          <div className="border-b border-neutral-900 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Order Pipeline
            </h2>
            <p className="text-[11px] text-neutral-400">Status breakdown across active orders</p>
          </div>

          <div className="space-y-4">
            {Object.entries({
              PENDING: { label: "Pending Verification", color: "bg-amber-400" },
              CONFIRMED: { label: "Confirmed & Locked", color: "bg-[#d4af37]" },
              PROCESSING: { label: "At Cairo Atelier", color: "bg-blue-400" },
              SHIPPED: { label: "Out with Courier", color: "bg-purple-400" },
              DELIVERED: { label: "Delivered to Doorstep", color: "bg-emerald-400" },
              CANCELLED: { label: "Cancelled", color: "bg-rose-500" },
            }).map(([statusKey, info]) => {
              const count = stats.orderStatusCounts[statusKey] || 0;
              const pct = stats.totalOrders > 0 ? Math.round((count / stats.totalOrders) * 100) : 0;

              return (
                <div key={statusKey} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300 font-medium">{info.label}</span>
                    <span className="font-mono text-white font-bold">
                      {count} <span className="text-neutral-500 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${info.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom 2 Columns: Top Selling Products Leaderboard & Recent Orders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Top Selling Garments */}
        <div className="rounded-sm border border-neutral-800 bg-neutral-950 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Best Selling Drops
            </h2>
            <Link to="/admin/products" className="text-[11px] text-[#d4af37] hover:underline uppercase font-bold">
              All Products
            </Link>
          </div>

          <div className="divide-y divide-neutral-900">
            {stats.topSellingProducts.map((p, idx) => (
              <div key={p.productId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="font-mono text-xs font-bold text-neutral-500 w-4">
                  0{idx + 1}
                </span>

                <img
                  src={
                    p.productImage ||
                    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop"
                  }
                  alt={p.productName}
                  className="h-12 w-10 object-cover rounded-xs border border-neutral-800 bg-neutral-900"
                />

                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-bold text-white uppercase truncate">{p.productName}</p>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    {p.totalSold} sold • {formatCurrency(p.totalRevenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Recent Customer Orders */}
        <div className="lg:col-span-2 rounded-sm border border-neutral-800 bg-neutral-950 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Recent Orders
              </h2>
              <p className="text-[11px] text-neutral-400">Direct purchases through storefront</p>
            </div>
            <Link to="/admin/orders">
              <Button variant="outline" size="sm" rightIcon={<ArrowUpRight className="h-3 w-3" />}>
                View All Orders
              </Button>
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-400">No orders received yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    <th className="pb-3">Order</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {stats.recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-white">{ord.orderNumber}</td>
                      <td className="py-3">
                        <p className="font-bold text-white truncate max-w-[140px]">
                          {ord.customerName}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-mono truncate max-w-[140px]">
                          {ord.customerEmail}
                        </p>
                      </td>
                      <td className="py-3 font-mono font-bold text-white">
                        {formatCurrency(ord.total)}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            ord.orderStatus === "DELIVERED"
                              ? "success"
                              : ord.orderStatus === "CONFIRMED"
                              ? "gold"
                              : ord.orderStatus === "PENDING"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {ord.orderStatus}
                        </Badge>
                      </td>
                      <td className="py-3 font-mono text-neutral-400 text-[11px]">
                        {formatDate(ord.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <Link to={`/admin/orders?search=${ord.orderNumber}`}>
                          <Button variant="outline" size="sm" className="h-7 text-[10px]">
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
