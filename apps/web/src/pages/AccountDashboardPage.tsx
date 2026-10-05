import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { orderService } from "../services/order.service.js";
import { OrderDTO } from "@vyre/shared";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { Button } from "../components/ui/button.js";
import { Package, MapPin, ArrowRight, ShieldCheck } from "lucide-react";

export const AccountDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await orderService.getOrders({ limit: 5 });
        setRecentOrders((res.orders || []).slice(0, 2));
      } catch (err) {
        console.error("Failed to load recent orders:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const defaultAddress = user?.addresses.find((a) => a.isDefault) || user?.addresses[0];

  return (
    <div className="space-y-8 text-neutral-900">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xs border border-neutral-200 bg-white p-5 space-y-2 shadow-xs">
          <span className="text-[11px] font-mono text-neutral-500 uppercase">Recent Orders</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-neutral-900 font-mono">{recentOrders.length}</span>
            <Package className="h-5 w-5 text-neutral-700" />
          </div>
          <Link
            to="/account/orders"
            className="text-xs text-black hover:underline font-bold uppercase inline-flex items-center gap-1"
          >
            View History <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-xs border border-neutral-200 bg-white p-5 space-y-2 shadow-xs">
          <span className="text-[11px] font-mono text-neutral-500 uppercase">Saved Addresses</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-neutral-900 font-mono">
              {user?.addresses.length || 0}
            </span>
            <MapPin className="h-5 w-5 text-neutral-700" />
          </div>
          <Link
            to="/account/addresses"
            className="text-xs text-black hover:underline font-bold uppercase inline-flex items-center gap-1"
          >
            Manage Addresses <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-xs border border-neutral-200 bg-white p-5 space-y-2 shadow-xs">
          <span className="text-[11px] font-mono text-neutral-500 uppercase">Membership</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-black font-heading uppercase">Member</span>
            <ShieldCheck className="h-5 w-5 text-black" />
          </div>
          <span className="text-[11px] text-neutral-500 block">Active Account</span>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="rounded-xs border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Recent Orders</h3>
          <Link to="/account/orders" className="text-xs text-neutral-600 font-bold uppercase hover:text-black">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-neutral-500">Loading orders...</div>
        ) : recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500 space-y-3">
            <p>You haven't placed any orders with VYRE. yet.</p>
            <Link to="/shop">
              <Button variant="primary" size="sm">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-900">{order.orderNumber}</span>
                    <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 text-[10px] font-bold px-2 py-0.5 uppercase rounded-xs">
                      {order.orderStatus}
                    </span>
                  </div>
                  <p className="text-neutral-500">
                    Placed on {formatDate(order.createdAt)} • {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="font-bold text-neutral-900 text-sm">
                    {formatCurrency(order.total)}
                  </span>
                  <Link to={`/account/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Default Shipping Address Card */}
      <div className="rounded-xs border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Default Address</h3>
          <Link
            to="/account/addresses"
            className="text-xs text-neutral-600 font-bold uppercase hover:text-black"
          >
            Manage
          </Link>
        </div>

        {defaultAddress ? (
          <div className="text-xs text-neutral-700 space-y-1">
            <p className="font-bold text-neutral-900">{defaultAddress.fullName}</p>
            <p>{defaultAddress.streetAddress}</p>
            <p>
              {defaultAddress.city}, {defaultAddress.governorate}, Egypt
            </p>
            <p className="font-mono text-neutral-500">{defaultAddress.phoneNumber}</p>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">No default shipping address saved.</p>
        )}
      </div>
    </div>
  );
};
