import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { orderService } from "../services/order.service.js";
import { OrderDTO } from "@vyre/shared";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { Button } from "../components/ui/button.js";
import { EmptyState } from "../components/common/EmptyState.js";
import { Package, ArrowRight, Truck } from "lucide-react";

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await orderService.getOrders();
        setOrders(res.orders || []);
      } catch (err) {
        console.error("Failed to load customer orders:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-neutral-500">Loading your orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-10 w-10 text-neutral-400" />}
        title="No Orders Found"
        description="You have not placed any orders yet. Discover our latest collection."
        actionText="Browse Shop"
        actionLink="/shop"
      />
    );
  }

  return (
    <div className="space-y-6 text-neutral-900">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-900">Order History</h2>
        <p className="text-xs text-neutral-500">
          Track and view invoices for all your past purchases.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-xs border border-neutral-200 bg-white p-6 space-y-4 transition-all hover:border-neutral-400 shadow-xs"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-neutral-900 text-sm">{order.orderNumber}</span>
                <span className="bg-neutral-100 text-neutral-900 border border-neutral-200 text-[10px] font-bold px-2 py-0.5 uppercase rounded-xs">
                  {order.orderStatus}
                </span>
              </div>

              <div className="text-neutral-500 font-mono text-[11px]">
                Ordered: {formatDate(order.createdAt)}
              </div>
            </div>

            {/* Items Thumbnails & Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xs border border-neutral-200 bg-neutral-100"
                    title={item.productName}
                  >
                    <img
                      src={
                        item.productImage ||
                        "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop"
                      }
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-black/80 text-white font-mono text-[9px] px-1 font-bold">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="sm:text-right space-y-1 text-xs">
                <div className="text-neutral-500">
                  Shipped to:{" "}
                  <strong className="text-neutral-900">
                    {order.shippingAddress.city}, {order.shippingAddress.governorate}
                  </strong>
                </div>
                <div className="text-sm font-bold text-neutral-900">
                  Total: {formatCurrency(order.total)}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Truck className="h-3.5 w-3.5 text-black" />
                <span>
                  Tracking:{" "}
                  <strong className="text-neutral-900 font-mono">
                    {order.trackingNumber || "Processing"}
                  </strong>
                </span>
              </div>

              <Link to={`/account/orders/${order.id}`}>
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3 w-3" />}>
                  View Details & Invoice
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
