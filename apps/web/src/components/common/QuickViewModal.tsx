import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Product, ProductSize, ProductColor } from "@vyre/shared";
import { formatCurrency } from "../../utils/formatters.js";
import { useCart } from "../../context/CartContext.js";
import { useWishlist } from "../../context/WishlistContext.js";
import { Modal } from "../ui/modal.js";
import { Button } from "../ui/button.js";
import { ShoppingBag, Heart, Check, ExternalLink } from "lucide-react";
import { cn } from "../../utils/cn.js";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState<ProductSize>("M");
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Initialize selections when product changes
  React.useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || "M");
      setSelectedColor(product.colors[0] || null);
      setActiveImage(product.primaryImage);
      setQuantity(1);
      setIsAdded(false);
    }
  }, [product]);

  if (!product) return null;

  const isFavorited = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!selectedColor) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" className="p-0 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Product Media Gallery */}
        <div className="relative aspect-[3/4] md:aspect-auto w-full bg-neutral-100 overflow-hidden flex flex-col justify-between p-4 min-h-[350px]">
          <img
            src={activeImage || product.primaryImage}
            alt={product.name}
            className="h-full w-full object-cover object-center absolute inset-0"
          />

          <div className="relative z-10 flex gap-2">
            {product.discountPercentage && product.discountPercentage > 0 && (
              <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-xs">
                -{product.discountPercentage}% OFF
              </span>
            )}
            <span className="bg-white/90 backdrop-blur-sm text-neutral-900 border border-neutral-200 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-xs">
              {product.category}
            </span>
          </div>

          {/* Image Thumbnails */}
          {product.images.length > 1 && (
            <div className="relative z-10 flex gap-2 overflow-x-auto pb-1 mt-auto">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={cn(
                    "h-12 w-12 overflow-hidden rounded-xs border bg-white shrink-0",
                    activeImage === img ? "border-black ring-1 ring-black" : "border-neutral-200 opacity-70"
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Quick Info */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-5 bg-white text-neutral-900">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 mb-1">
                {product.category}
              </p>
              <h2 className="text-lg sm:text-xl font-bold uppercase text-neutral-900 tracking-tight">
                {product.name}
              </h2>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-bold text-neutral-900">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
              {product.description}
            </p>

            {/* Colors */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Color: <span className="text-neutral-900 font-semibold">{selectedColor?.name}</span>
              </label>
              <div className="flex items-center gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      selectedColor?.name === color.name
                        ? "border-black scale-110 ring-2 ring-neutral-300"
                        : "border-neutral-300 opacity-80 hover:opacity-100"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Size: <span className="text-neutral-900 font-semibold">{selectedSize}</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "min-w-9 h-9 px-3 flex items-center justify-center rounded-xs text-xs font-bold uppercase transition-all border",
                      selectedSize === size
                        ? "bg-black text-white border-black"
                        : "bg-white text-neutral-800 border-neutral-200 hover:border-black"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Quantity
              </label>
              <div className="flex items-center border border-neutral-200 rounded-xs w-28 bg-neutral-50">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-black"
                >
                  -
                </button>
                <span className="flex-1 text-center text-xs font-bold text-neutral-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-black"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-3 border-t border-neutral-100">
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleAddToCart}
                leftIcon={
                  isAdded ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />
                }
              >
                {isAdded ? "Added to Bag" : "Add to Shopping Bag"}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleWishlist(product)}
                aria-label="Wishlist"
              >
                <Heart className={cn("h-4 w-4", isFavorited && "fill-rose-500 text-rose-500")} />
              </Button>
            </div>

            <Link
              to={`/product/${product.slug}`}
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-neutral-600 hover:text-black transition-colors py-1"
            >
              <span>View Full Product Details</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
};
