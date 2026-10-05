import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext.js";
import { useCart } from "../context/CartContext.js";
import { useAuth } from "../context/AuthContext.js";
import { Breadcrumb } from "../components/common/Breadcrumb.js";
import { QuickViewModal } from "../components/common/QuickViewModal.js";
import { EmptyState } from "../components/common/EmptyState.js";
import { Button } from "../components/ui/button.js";
import { Skeleton } from "../components/ui/skeleton.js";
import { Product } from "@vyre/shared";
import { formatCurrency } from "../utils/formatters.js";
import { Heart, ShoppingBag, Trash2, AlertCircle, LogIn } from "lucide-react";

export const WishlistPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { wishlist, wishlistCount, isLoading, error, clearWishlist, removeFromWishlist, refreshWishlist } =
    useWishlist();
  const { addToCart } = useCart();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const handleMoveToCart = async (product: Product) => {
    setMovingId(product.id);
    const size = product.sizes[0] || "M";
    const color = product.colors[0] || { name: "Standard", hex: "#000000" };
    const added = await addToCart(product, size, color, 1);
    if (added) {
      await removeFromWishlist(product.id);
    }
    setMovingId(null);
  };

  const handleAddAllToCart = async () => {
    for (const product of wishlist) {
      const size = product.sizes[0] || "M";
      const color = product.colors[0] || { name: "Standard", hex: "#000000" };
      await addToCart(product, size, color, 1);
    }
    await clearWishlist();
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-neutral-900">
        <Breadcrumb items={[{ label: "My Wishlist" }]} />
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-xs border border-neutral-200 bg-neutral-50 p-8 shadow-xs">
          <div className="h-16 w-16 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-black">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold uppercase text-neutral-900 font-heading">
            Sign In to Access Your Wishlist
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md">
            Your saved pieces and favorites are safely stored in your VYRE. account.
          </p>
          <Link to="/login?redirect=/wishlist">
            <Button variant="primary" size="md" leftIcon={<LogIn className="h-4 w-4" />}>
              Sign In to Your Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Breadcrumb items={[{ label: "My Wishlist" }]} />
        <div className="flex justify-between items-end border-b border-neutral-200 pb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-xs" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Breadcrumb items={[{ label: "My Wishlist" }]} />
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-xs border border-rose-200 bg-rose-50 p-8">
          <AlertCircle className="h-10 w-10 text-rose-600" />
          <h3 className="text-xl font-bold uppercase text-rose-900 font-heading">Could Not Load Wishlist</h3>
          <p className="text-xs text-neutral-600 max-w-md">{error}</p>
          <Button variant="outline" size="sm" onClick={() => refreshWishlist()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Breadcrumb items={[{ label: "My Wishlist" }]} />
        <EmptyState
          icon={<Heart className="h-10 w-10 text-neutral-400" />}
          title="Your Wishlist is Empty"
          description="Save your favorite hoodies, sweaters, and jackets to track them here."
          actionText="Discover Collection"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-neutral-900">
      <Breadcrumb items={[{ label: "My Wishlist" }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            VYRE. Saved Items
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
            My Wishlist ({wishlistCount})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearWishlist}
            className="flex items-center gap-2 text-neutral-600 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAddAllToCart}
            leftIcon={<ShoppingBag className="h-3.5 w-3.5" />}
          >
            Move All to Bag
          </Button>
        </div>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {wishlist.map((product) => (
          <div
            key={product.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xs border border-neutral-200 bg-white shadow-xs transition-all duration-300 hover:shadow-md"
          >
            {/* Image Container */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100">
              <Link to={`/product/${product.slug}`} className="block h-full w-full">
                <img
                  src={product.primaryImage}
                  alt={product.name}
                  className="h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105"
                />
              </Link>

              {/* Remove from Wishlist button */}
              <button
                onClick={() => removeFromWishlist(product.id)}
                className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-neutral-600 hover:text-rose-600 transition-colors border border-neutral-200 shadow-xs"
                aria-label="Remove item"
                title="Remove from wishlist"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Content & Actions */}
            <div className="flex flex-1 flex-col justify-between p-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  {product.category}
                </span>
                <Link
                  to={`/product/${product.slug}`}
                  className="block font-bold text-xs sm:text-sm text-neutral-900 tracking-tight hover:underline transition-colors line-clamp-1"
                >
                  {product.name}
                </Link>
                <div className="text-xs font-bold text-neutral-900">
                  {formatCurrency(product.price)}
                </div>
              </div>

              {/* Move to Bag Button */}
              <div className="pt-2 border-t border-neutral-100">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs font-bold uppercase"
                  disabled={movingId === product.id || !product.inStock}
                  onClick={() => handleMoveToCart(product)}
                  leftIcon={<ShoppingBag className="h-3.5 w-3.5" />}
                >
                  {!product.inStock ? "Out of Stock" : movingId === product.id ? "Moving..." : "Move to Bag"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
