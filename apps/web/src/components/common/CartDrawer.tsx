import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.js";
import { Drawer } from "../ui/drawer.js";
import { Button } from "../ui/button.js";
import { formatCurrency } from "../../utils/formatters.js";
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export const CartDrawer: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeItem,
    isFreeShipping,
    freeShippingThreshold,
    amountNeededForFreeShipping,
  } = useCart();

  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    closeCartDrawer();
    navigate("/checkout");
  };

  const handleViewCartClick = () => {
    closeCartDrawer();
    navigate("/cart");
  };

  const progressPercentage = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <Drawer
      isOpen={isCartDrawerOpen}
      onClose={closeCartDrawer}
      title={`Shopping Bag (${itemCount})`}
      position="right"
    >
      <div className="flex h-full flex-col justify-between">
        {/* Free Shipping Progress in Egypt */}
        <div className="border-b border-neutral-200 pb-4 mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            {isFreeShipping ? (
              <span className="flex items-center gap-1.5 font-bold text-neutral-900">
                <Sparkles className="h-3.5 w-3.5 text-black" />
                You unlocked FREE shipping across Egypt!
              </span>
            ) : (
              <span className="text-neutral-600">
                Add <strong className="text-black font-semibold">{formatCurrency(amountNeededForFreeShipping)}</strong> for Free Shipping
              </span>
            )}
            <span className="font-mono text-neutral-500 text-[11px]">{progressPercentage}%</span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 pr-1 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-neutral-900 uppercase">Your Bag is Empty</p>
                <p className="text-xs text-neutral-500 max-w-[240px]">
                  Explore our premium hoodies, sweaters, and outerwear collections.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  closeCartDrawer();
                  navigate("/shop");
                }}
              >
                Shop Now
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 pt-4 first:pt-0">
                {/* Product Thumbnail */}
                <Link
                  to={`/product/${item.product.slug}`}
                  onClick={closeCartDrawer}
                  className="h-24 w-20 shrink-0 overflow-hidden rounded-xs bg-neutral-100 border border-neutral-200"
                >
                  <img
                    src={item.product.primaryImage}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${item.product.slug}`}
                        onClick={closeCartDrawer}
                        className="text-xs font-bold uppercase text-neutral-900 hover:underline transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <span>
                        Size: <strong className="text-neutral-800">{item.selectedSize}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full border border-neutral-300"
                          style={{ backgroundColor: item.selectedColor.hex }}
                        />
                        {item.selectedColor.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-neutral-200 rounded-xs bg-neutral-50 text-xs">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-7 w-7 flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-100"
                      >
                        -
                      </button>
                      <span className="h-7 w-8 flex items-center justify-center font-bold text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-7 w-7 flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-100"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold text-neutral-900">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Bottom Actions */}
        {items.length > 0 && (
          <div className="border-t border-neutral-200 pt-4 space-y-3 bg-white">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold uppercase tracking-wider text-neutral-700">Subtotal</span>
              <span className="text-base font-bold text-neutral-900">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <p className="text-[11px] text-neutral-500">
              Taxes and shipping calculated at checkout. 3 Days Returns & Exchanges.
            </p>

            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleCheckoutClick}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Proceed to Checkout
              </Button>

              <Button variant="outline" className="w-full" onClick={handleViewCartClick}>
                View Bag & Apply Coupon
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-500 pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-neutral-800" />
              <span>Authentic VYRE. Quality Guaranteed</span>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
