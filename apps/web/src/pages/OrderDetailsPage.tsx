import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { orderService } from "../services/order.service.js";
import { OrderDTO } from "@vyre/shared";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { Button } from "../components/ui/button.js";
import { Breadcrumb } from "../components/common/Breadcrumb.js";
import { CheckCircle, MapPin, Printer } from "lucide-react";

export const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const justPlaced = (location.state as any)?.justPlaced;

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!orderId) return;
      setLoading(true);
      try {
        const found = await orderService.getOrderById(orderId);
        setOrder(found);
      } catch (err) {
        console.error("Failed to load order details:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-neutral-500">Loading order details...</div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold uppercase text-neutral-900">Order Not Found</h2>
        <Link to="/account/orders">
          <Button variant="primary" size="sm">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const steps = [
    { label: "Confirmed", date: formatDate(order.createdAt), done: true },
    { label: "Processing", date: "At Cairo Atelier", done: true },
    {
      label: "Out with Courier",
      date: order.estimatedDelivery || "1-2 days",
      done: order.orderStatus === "SHIPPED" || order.orderStatus === "DELIVERED",
    },
    { label: "Delivered", date: "At Doorstep", done: order.orderStatus === "DELIVERED" },
  ];

  return (
    <div className="space-y-8 text-neutral-900">
      <Breadcrumb
        items={[{ label: "My Orders", href: "/account/orders" }, { label: order.orderNumber }]}
      />

      {justPlaced && (
        <div className="rounded-xs border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <span>Thank you for ordering with VYRE.!</span>
          </div>
          <p className="text-neutral-700">
            Your order <strong>{order.orderNumber}</strong> has been received and is being prepared
            in our Cairo atelier.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-neutral-900 font-mono">
              {order.orderNumber}
            </h1>
            <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase rounded-xs">
              {order.orderStatus}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Placed on {formatDate(order.createdAt)} • Tracking:{" "}
            <strong className="text-neutral-900 font-mono">{order.trackingNumber || "Processing"}</strong>
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          leftIcon={<Printer className="h-3.5 w-3.5" />}
        >
          Print Invoice
        </Button>
      </div>

      {/* Order Progress Tracker */}
      <div className="rounded-xs border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Delivery Timeline</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {steps.map((step, idx) => (
            <div key={idx} className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step.done ? "bg-black text-white" : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {step.done ? "✓" : idx + 1}
                </span>
                <span
                  className={`font-bold uppercase ${step.done ? "text-neutral-900" : "text-neutral-400"}`}
                >
                  {step.label}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 pl-6">{step.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Items Table */}
      <div className="rounded-xs border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-3">
          Garments in this Order
        </h3>

        <div className="divide-y divide-neutral-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <img
                src={
                  item.productImage ||
                  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop"
                }
                alt={item.productName}
                className="h-16 w-14 rounded-xs object-cover border border-neutral-200 bg-neutral-100"
              />
              <div className="flex-1 text-xs space-y-1">
                <Link
                  to={`/product/${item.productSlug}`}
                  className="font-bold text-neutral-900 uppercase hover:underline"
                >
                  {item.productName}
                </Link>
                <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
                  <span>Size: {item.sizeName}</span>
                  <span>•</span>
                  <span>Color: {item.colorName}</span>
                  <span>•</span>
                  <span>Qty: {item.quantity}</span>
                </div>
              </div>
              <span className="text-xs font-bold text-neutral-900">
                {formatCurrency(item.totalPrice)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 2 Columns: Shipping Address & Summary Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shipping & Payment Info */}
        <div className="rounded-xs border border-neutral-200 bg-white p-6 space-y-4 text-xs shadow-xs">
          <h3 className="font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-black" />
            Delivery Destination
          </h3>

          <div className="space-y-1 text-neutral-700">
            <p className="font-bold text-neutral-900">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.streetAddress}</p>
            {order.shippingAddress.buildingNumber && (
              <p>
                Building {order.shippingAddress.buildingNumber}, Apt{" "}
                {order.shippingAddress.apartmentNumber}
              </p>
            )}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.governorate}, Egypt
            </p>
            <p className="font-mono text-neutral-500">Phone: {order.shippingAddress.phoneNumber}</p>
          </div>

          <div className="pt-4 border-t border-neutral-100 space-y-1">
            <span className="text-neutral-500 uppercase font-semibold">Payment Method:</span>
            <p className="font-bold text-neutral-900 uppercase">
              {order.paymentMethod.replace(/_/g, " ")} ({order.paymentStatus})
            </p>
          </div>
        </div>

        {/* Cost Summary Breakdown */}
        <div className="rounded-xs border border-neutral-200 bg-white p-6 space-y-3 text-xs shadow-xs">
          <h3 className="font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-3">
            Financial Summary
          </h3>

          <div className="flex justify-between text-neutral-600">
            <span>Subtotal</span>
            <span className="font-bold text-neutral-900">{formatCurrency(order.subtotal)}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Discount ({order.couponCode || "Coupon"})</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-neutral-600">
            <span>Shipping</span>
            <span className="font-bold text-neutral-900">
              {order.shippingFee === 0 ? "FREE" : formatCurrency(order.shippingFee)}
            </span>
          </div>

          <div className="border-t border-neutral-200 pt-3 flex justify-between items-baseline text-sm font-bold uppercase">
            <span className="text-neutral-900">Total</span>
            <span className="text-xl font-bold text-neutral-900">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
