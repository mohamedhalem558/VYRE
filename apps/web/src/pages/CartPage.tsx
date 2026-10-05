import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.js";
import { formatCurrency } from "../utils/formatters.js";
import { Breadcrumb } from "../components/common/Breadcrumb.js";
import { EmptyState } from "../components/common/EmptyState.js";
import { Button } from "../components/ui/button.js";
import { Skeleton } from "../components/ui/skeleton.js";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export const CartPage: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    discount,
    shippingFee,
    total,
    isFreeShipping,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    appliedCoupon,
    isLoading,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    refreshCart,
  } = useCart();

  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplying(true);
    setCouponFeedback(null);

    const res = await applyCoupon(couponCode);
    setCouponFeedback(res);
    setIsApplying(false);
  };

  const progressPercentage = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  if (isLoading && items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Breadcrumb items={[{ label: "Shopping Bag" }]} />
        <div className="flex justify-between items-end border-b border-neutral-200 pb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-5 p-4 border border-neutral-200 rounded-xs bg-white">
                <Skeleton className="h-32 w-24 rounded-xs shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xs" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Breadcrumb items={[{ label: "Shopping Bag" }]} />
        <EmptyState
          icon={<ShoppingBag className="h-10 w-10 text-neutral-400" />}
          title="Your Shopping Bag is Empty"
          description="Explore our latest drops in hoodies, sweaters, and outerwear."
          actionText="Explore Shop"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-neutral-900">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ label: "Shopping Bag" }]} />

      {/* Error alert banner if any */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xs border border-rose-200 bg-rose-50 text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => refreshCart()}
            className="flex items-center gap-1 text-black font-bold hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            VYRE. Shopping Bag
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
            Shopping Bag ({itemCount} {itemCount === 1 ? "Item" : "Items"})
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-neutral-500 hover:text-black underline uppercase tracking-wider"
        >
          Clear Bag
        </button>
      </div>

      {/* Free Shipping Progress Notification */}
      <div className="rounded-xs border border-neutral-200 bg-neutral-50 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          {isFreeShipping ? (
            <span className="flex items-center gap-1.5 font-bold text-neutral-900">
              <Sparkles className="h-4 w-4 text-black" />
              You qualify for FREE Delivery across Egypt!
            </span>
          ) : (
            <span className="text-neutral-700">
              Add{" "}
              <strong className="text-black font-bold">
                {formatCurrency(amountNeededForFreeShipping)}
              </strong>{" "}
              more to unlock Free Shipping
            </span>
          )}
          <span className="font-mono text-neutral-600 font-bold">{progressPercentage}%</span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Cart Grid: Items List + Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 divide-y divide-neutral-200 border border-neutral-200 rounded-xs bg-white p-4 sm:p-6 shadow-xs">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row gap-5 py-5 first:pt-0 last:pb-0"
            >
              {/* Product Thumbnail */}
              <Link
                to={`/product/${item.product.slug}`}
                className="h-32 w-24 sm:h-36 sm:w-28 shrink-0 overflow-hidden rounded-xs bg-neutral-100 border border-neutral-200"
              >
                <img
                  src={item.product.primaryImage}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                />
              </Link>

              {/* Product Info & Adjusters */}
              <div className="flex flex-1 flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      to={`/product/${item.product.slug}`}
                      className="text-sm font-bold uppercase text-neutral-900 hover:underline transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-neutral-600">
                    <span>
                      Size: <strong className="text-neutral-900">{item.selectedSize}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full border border-neutral-300"
                        style={{ backgroundColor: item.selectedColor.hex }}
                      />
                      {item.selectedColor.name}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-500 font-mono">
                    Unit Price: {formatCurrency(item.unitPrice)}
                  </div>
                </div>

                {/* Quantity Controls & Item Total */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                  <div className="flex items-center border border-neutral-200 rounded-xs bg-neutral-50">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8 flex items-center justify-center text-neutral-600 hover:text-black"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="h-8 w-10 flex items-center justify-center font-bold text-neutral-900 text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 flex items-center justify-center text-neutral-600 hover:text-black"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-base font-bold text-neutral-900">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="space-y-6">
          <div className="rounded-xs border border-neutral-200 bg-white p-6 space-y-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-3">
              Order Summary
            </h3>

            {/* Price Calculations */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="text-neutral-900 font-bold">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Coupon ({appliedCoupon.code} -{appliedCoupon.percentage}%)
                  </span>
                  <span className="font-bold">-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-neutral-600">
                <span>Shipping across Egypt</span>
                <span className="text-neutral-900 font-bold">
                  {isFreeShipping ? (
                    <span className="text-emerald-700 font-bold uppercase">FREE</span>
                  ) : (
                    formatCurrency(shippingFee)
                  )}
                </span>
              </div>

              <div className="border-t border-neutral-200 pt-3 flex items-baseline justify-between">
                <span className="text-sm font-bold uppercase text-neutral-900">Estimated Total</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-neutral-900">
                    {formatCurrency(total)}
                  </div>
                  <span className="text-[10px] text-neutral-500 uppercase">Includes VAT</span>
                </div>
              </div>
            </div>

            {/* Promo Code Form */}
            <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2 border-t border-neutral-200">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 block">
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. VYRE10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xs px-3 py-2 text-xs text-neutral-900 uppercase placeholder:text-neutral-400 focus:outline-none focus:border-black"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={isApplying || !couponCode.trim()}
                >
                  {isApplying ? "..." : "Apply"}
                </Button>
              </div>

              {couponFeedback && (
                <p
                  className={`text-[11px] ${
                    couponFeedback.success ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"
                  }`}
                >
                  {couponFeedback.message}
                </p>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-neutral-600 pt-1">
                  <span>Applied: {appliedCoupon.code}</span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-rose-600 hover:underline text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              )}
            </form>

            {/* Checkout Action Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full text-xs font-bold uppercase"
              onClick={() => navigate("/checkout")}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Proceed to Checkout
            </Button>

            <Link
              to="/shop"
              className="block text-center text-xs text-neutral-600 hover:text-black transition-colors"
            >
              or Continue Shopping
            </Link>
          </div>

          {/* Value Propositions */}
          <div className="rounded-xs border border-neutral-200 bg-neutral-50 p-4 space-y-3 text-xs text-neutral-600">
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-black shrink-0" />
              <span>Fast 2-4 day delivery throughout all Egyptian governorates</span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="h-4 w-4 text-black shrink-0" />
              <span>3-day hassle-free size exchanges and returns</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-black shrink-0" />
              <span>Authentic 100% heavy Egyptian cotton quality guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
