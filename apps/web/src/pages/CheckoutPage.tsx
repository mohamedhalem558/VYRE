import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext.js";
import { useAuth } from "../context/AuthContext.js";
import { orderService } from "../services/order.service.js";
import { EGYPT_GOVERNORATES } from "../services/mockData.js";
import { formatCurrency } from "../utils/formatters.js";
import { Breadcrumb } from "../components/common/Breadcrumb.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Select } from "../components/ui/select.js";
import { PaymentMethod, ShippingRateDTO, CreateOrderDTO, OrderDTO } from "@vyre/shared";
import {
  Banknote,
  Lock,
  ArrowRight,
  Tag,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { cn } from "../utils/cn.js";

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, discount, appliedCoupon, applyCoupon, removeCoupon, refreshCart } =
    useCart();
  const { user } = useAuth();

  // Coupon Input State
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; msg: string } | null>(
    null
  );

  // Form State
  const [fullName, setFullName] = useState(user ? `${user.firstName} ${user.lastName}` : "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [streetAddress, setStreetAddress] = useState(user?.addresses[0]?.streetAddress || "");
  const [buildingNumber, setBuildingNumber] = useState(user?.addresses[0]?.buildingNumber || "");
  const [apartmentNumber, setApartmentNumber] = useState(user?.addresses[0]?.apartmentNumber || "");
  const [city, setCity] = useState(user?.addresses[0]?.city || "Maadi");
  const [governorate, setGovernorate] = useState(user?.addresses[0]?.governorate || "Cairo");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [guestPlacedOrder, setGuestPlacedOrder] = useState<OrderDTO | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRateDTO[]>([]);

  useEffect(() => {
    orderService
      .getShippingRates()
      .then(setShippingRates)
      .catch((err) => console.error("Failed to load shipping rates:", err));
  }, []);

  const currentShippingRate = useMemo(() => {
    if (!shippingRates.length) return null;
    const govLower = governorate.toLowerCase().trim();
    if (govLower.includes("cairo")) {
      return shippingRates.find((r) => r.region.toLowerCase() === "cairo") || shippingRates[0];
    } else if (
      govLower.includes("giza") ||
      govLower.includes("october") ||
      govLower.includes("zayed")
    ) {
      return shippingRates.find((r) => r.region.toLowerCase() === "giza") || shippingRates[0];
    } else {
      return (
        shippingRates.find((r) => r.region.toLowerCase() === "other egypt") ||
        shippingRates[shippingRates.length - 1]
      );
    }
  }, [shippingRates, governorate]);

  const effectiveShippingFee = useMemo(() => {
    if (subtotal >= 3000) return 0;
    return currentShippingRate ? currentShippingRate.fee : 65;
  }, [subtotal, currentShippingRate]);

  const calculatedTotal = Math.max(0, subtotal - discount + effectiveShippingFee);

  if (guestPlacedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Order Placed Successfully
          </p>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
            Thank you, {guestPlacedOrder.customerName}!
          </h1>
          <p className="text-sm text-neutral-600">
            Your order <strong className="text-neutral-900">#{guestPlacedOrder.orderNumber}</strong> has been received and is being prepared.
          </p>
        </div>

        <div className="p-6 rounded-xs border border-neutral-200 bg-neutral-50 text-left space-y-4 text-xs">
          <div className="flex justify-between border-b border-neutral-200 pb-3">
            <span className="font-bold text-neutral-500 uppercase">Payment Method</span>
            <span className="font-semibold text-neutral-900 uppercase">Cash on Delivery</span>
          </div>
          <div className="flex justify-between border-b border-neutral-200 pb-3">
            <span className="font-bold text-neutral-500 uppercase">Total Amount</span>
            <span className="font-bold text-neutral-900 text-sm">
              {formatCurrency(guestPlacedOrder.total)}
            </span>
          </div>
          <div className="flex justify-between border-b border-neutral-200 pb-3">
            <span className="font-bold text-neutral-500 uppercase">Shipping Destination</span>
            <span className="font-medium text-neutral-900 text-right">
              {guestPlacedOrder.shippingAddress?.streetAddress}, {guestPlacedOrder.shippingAddress?.city}, {guestPlacedOrder.shippingAddress?.governorate}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-neutral-500 uppercase">Estimated Delivery</span>
            <span className="font-medium text-neutral-900">
              {guestPlacedOrder.estimatedDelivery || "1-3 Business Days"}
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          A confirmation email has been dispatched to <strong>{guestPlacedOrder.customerEmail}</strong>. Our team will contact you at <strong>{guestPlacedOrder.customerPhone}</strong> prior to shipping.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/shop">
            <Button variant="primary" size="md">
              Continue Shopping
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="md">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold uppercase text-neutral-900 font-heading">Your Bag is Empty</h2>
        <p className="text-xs text-neutral-500">
          Please add items to your shopping bag before proceeding to checkout.
        </p>
        <Link to="/shop">
          <Button variant="primary" size="md">
            Go to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setIsApplyingCoupon(true);
    setCouponFeedback(null);

    const res = await applyCoupon(couponCodeInput);
    setCouponFeedback({
      success: res.success,
      msg: res.message,
    });
    setIsApplyingCoupon(false);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg("Please enter a valid Egyptian mobile number (e.g. 01012345678).");
      return;
    }
    if (!streetAddress.trim()) {
      setErrorMsg("Please provide your street address.");
      return;
    }
    if (!governorate) {
      setErrorMsg("Please select your governorate.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreateOrderDTO = {
        customerName: fullName,
        customerEmail: email || "guest@vyre.store",
        customerPhone: phoneNumber,
        shippingAddress: {
          fullName,
          phoneNumber,
          governorate,
          city,
          streetAddress,
          buildingNumber,
          apartmentNumber,
        },
        paymentMethod,
        couponCode: appliedCoupon?.code,
        notes: orderNotes,
        items: items.map((it) => ({
          productId: it.productId,
          variantId: it.variantId || null,
          quantity: it.quantity,
        })),
      };

      const order = await orderService.createOrder(payload);

      if (order && order.id) {
        await refreshCart();
        if (user) {
          navigate(`/account/orders/${order.id}`);
        } else {
          setGuestPlacedOrder(order);
        }
      } else {
        setErrorMsg("Failed to place your order. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-neutral-900">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Shopping Bag", href: "/cart" },
          { label: "Checkout & Delivery" },
        ]}
      />

      {/* Page Header */}
      <div className="border-b border-neutral-200 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          VYRE. Storefront
        </p>
        <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
          Secure Checkout
        </h1>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xs border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Checkout Form & Order Summary */}
      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left 7 Columns: Checkout Details Form */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step 1: Customer Information */}
          <section className="rounded-xs border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span>1. Customer Information</span>
              <span className="text-[11px] text-neutral-400 font-normal">Contact details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Full Name *
                </label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Omar Hassan"
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Phone Number (Mobile) *
                </label>
                <Input
                  required
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="omar@example.com"
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Shipping Address in Egypt */}
          <section className="rounded-xs border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span>2. Delivery Address (Egypt)</span>
              <Truck className="h-4 w-4 text-neutral-500" />
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Governorate *
                </label>
                <Select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  options={EGYPT_GOVERNORATES.map((gov) => ({
                    value: gov,
                    label: gov,
                  }))}
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  City / District *
                </label>
                <Input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New Cairo / Tagamoa / Maadi"
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Street Address *
                </label>
                <Input
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Street name, landmark, nearby area"
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Building No.
                </label>
                <Input
                  value={buildingNumber}
                  onChange={(e) => setBuildingNumber(e.target.value)}
                  placeholder="Building 14"
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Apt / Floor
                </label>
                <Input
                  value={apartmentNumber}
                  onChange={(e) => setApartmentNumber(e.target.value)}
                  placeholder="Floor 3, Apt 12"
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Special Delivery Instructions
                </label>
                <Input
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Call before arrival / Ring bell"
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs"
                />
              </div>
            </div>
          </section>

          {/* Step 3: Payment Method */}
          <section className="rounded-xs border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span>3. Payment Method</span>
              <Lock className="h-4 w-4 text-neutral-500" />
            </h2>

            <div className="space-y-3">
              {/* Cash on Delivery */}
              <label
                className={cn(
                  "flex items-center justify-between p-4 rounded-xs border cursor-pointer transition-all",
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-black bg-neutral-50"
                    : "border-neutral-200 bg-white hover:border-neutral-400"
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_ON_DELIVERY"
                    checked={paymentMethod === "CASH_ON_DELIVERY"}
                    onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                    className="accent-black h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Pay in cash directly to courier upon receiving your parcel.
                    </span>
                  </div>
                </div>
                <Banknote className="h-5 w-5 text-neutral-700" />
              </label>
            </div>
          </section>
        </div>

        {/* Right 5 Columns: Order Summary & Placement */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xs border border-neutral-200 bg-white p-6 space-y-6 shadow-xs sticky top-28">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-3">
              Order Review ({items.length} {items.length === 1 ? "Item" : "Items"})
            </h3>

            {/* Cart Preview Items */}
            <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto pr-1 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 pt-3 first:pt-0">
                  <img
                    src={item.product.primaryImage}
                    alt={item.product.name}
                    className="h-16 w-12 object-cover rounded-xs bg-neutral-100 border border-neutral-200 shrink-0"
                  />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-neutral-900 uppercase line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="text-neutral-500 text-[11px]">
                      {item.selectedSize} • {item.selectedColor.name} • Qty: {item.quantity}
                    </p>
                    <p className="font-bold text-neutral-900 mt-1">
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code Input */}
            <div className="border-t border-neutral-200 pt-4 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 block">
                Promo Code
              </label>
              <div className="flex gap-2">
                <Input
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. VYRE10"
                  className="bg-neutral-50 border-neutral-300 text-neutral-900 text-xs uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponCodeInput.trim()}
                >
                  {isApplyingCoupon ? "..." : "Apply"}
                </Button>
              </div>

              {couponFeedback && (
                <p
                  className={`text-[11px] ${
                    couponFeedback.success ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"
                  }`}
                >
                  {couponFeedback.msg}
                </p>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-black" />
                    Applied: <strong>{appliedCoupon.code}</strong> (-{appliedCoupon.percentage}%)
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-rose-600 hover:underline text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-neutral-200 pt-4 space-y-2.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-neutral-900 font-bold">{formatCurrency(subtotal)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping ({governorate || "Cairo"})</span>
                <span className="text-neutral-900 font-bold">
                  {effectiveShippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase">FREE</span>
                  ) : (
                    formatCurrency(effectiveShippingFee)
                  )}
                </span>
              </div>

              <div className="border-t border-neutral-200 pt-3 flex items-baseline justify-between">
                <span className="text-sm font-bold uppercase text-neutral-900">Total Order</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-neutral-900">
                    {formatCurrency(calculatedTotal)}
                  </div>
                  <span className="text-[10px] text-neutral-500 uppercase">Cash on Delivery</span>
                </div>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-xs font-bold uppercase"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Confirm & Place Order
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500">
              <ShieldCheck className="h-4 w-4 text-black" />
              <span>3 Days Returns & Exchanges Guarantee</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
