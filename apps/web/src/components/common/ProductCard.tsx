import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Product, ProductColor, ProductSize } from "@vyre/shared";
import { formatCurrency } from "../../utils/formatters.js";
import { useCart } from "../../context/CartContext.js";
import { useWishlist } from "../../context/WishlistContext.js";
import { Heart, Eye, ShoppingBag } from "lucide-react";
import { cn } from "../../utils/cn.js";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView, className }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedColor, setSelectedColor] = useState<ProductColor | undefined>(
    product.colors && product.colors.length > 0 ? product.colors[0] : undefined
  );
  const [selectedSize] = useState<ProductSize>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : "M"
  );
  const [isHovered, setIsHovered] = useState(false);

  const isFavorited = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const colorToAdd = selectedColor || product.colors?.[0] || { name: "Obsidian Black", hex: "#0a0a0a" };
    const sizeToAdd = selectedSize || product.sizes?.[0] || "M";
    addToCart(product, sizeToAdd, colorToAdd, 1);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col bg-white border border-neutral-200/80 rounded-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-neutral-300",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100">
        <Link to={`/product/${product.slug}`} className="block h-full w-full">
          <img
            src={
              isHovered && product.secondaryImage ? product.secondaryImage : product.primaryImage
            }
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1 z-10">
          {product.discountPercentage && product.discountPercentage > 0 && (
            <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-xs">
              -{product.discountPercentage}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-neutral-100 text-neutral-900 border border-neutral-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-xs">
              NEW
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={cn(
            "absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-neutral-200/60 transition-all duration-200 hover:bg-white hover:scale-110",
            isFavorited ? "text-rose-600" : "text-neutral-700 hover:text-black"
          )}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
        </button>

        {/* Quick Action Overlay (Slide-up on hover) */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex p-2.5 gap-2 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200/60">
          <button
            onClick={handleQuickAdd}
            className="flex-1 flex items-center justify-center gap-1.5 bg-black text-white py-2 px-3 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-neutral-800 rounded-xs"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Quick Add</span>
          </button>
          {onQuickView && (
            <button
              onClick={handleQuickViewClick}
              className="flex items-center justify-center bg-neutral-100 text-neutral-800 p-2 border border-neutral-200 hover:bg-neutral-200 transition-colors rounded-xs"
              aria-label="Quick preview"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="flex flex-1 flex-col p-3.5 justify-between space-y-2">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            {product.category}
          </p>

          <Link
            to={`/product/${product.slug}`}
            className="block font-bold text-xs sm:text-sm text-neutral-900 tracking-tight hover:underline line-clamp-1"
          >
            {product.name}
          </Link>
        </div>

        {/* Colors & Price */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
          {/* Color Swatches */}
          <div className="flex items-center gap-1.5 min-h-[16px]">
            {product.colors && product.colors.length > 0 ? (
              product.colors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(color);
                  }}
                  className={cn(
                    "h-3 w-3 rounded-full border transition-all",
                    selectedColor?.name === color.name
                      ? "border-black scale-125 ring-1 ring-black"
                      : "border-neutral-300 opacity-80 hover:opacity-100"
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={color.name}
                />
              ))
            ) : null}
          </div>

          {/* Pricing in EGP */}
          <div className="text-right">
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[10px] text-neutral-400 line-through mr-1.5">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
            <span className="text-xs sm:text-sm font-bold text-neutral-900">
              {formatCurrency(product.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
