import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Product, ProductSize, ProductColor } from "@vyre/shared";
import { productService } from "../services/product.service.js";
import { useCart } from "../context/CartContext.js";
import { useWishlist } from "../context/WishlistContext.js";
import { formatCurrency } from "../utils/formatters.js";
import { Breadcrumb } from "../components/common/Breadcrumb.js";
import { ProductCard } from "../components/common/ProductCard.js";
import { SizeGuideModal } from "../components/common/SizeGuideModal.js";
import { ReviewCard } from "../components/common/ReviewCard.js";
import { Button } from "../components/ui/button.js";
import { Skeleton } from "../components/ui/skeleton.js";
import {
  Star,
  ShoppingBag,
  Heart,
  Ruler,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  Share2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "../utils/cn.js";

export const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<ProductSize>("M");
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Accordion active tab state
  const [activeTab, setActiveTab] = useState<"details" | "fabric" | "shipping" | "reviews">(
    "details"
  );

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      window.scrollTo({ top: 0, behavior: "smooth" });

      try {
        const prod = await productService.getProductBySlug(slug);
        setProduct(prod);

        if (prod) {
          setSelectedImage(prod.primaryImage);
          setSelectedSize(prod.sizes[0] || "M");
          setSelectedColor(prod.colors[0] || null);
          setQuantity(1);

          const related = await productService.getRelatedProducts(prod.categorySlug, prod.id, 4);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error("Failed to fetch product details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-[3/4] w-full rounded-sm" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h2 className="text-3xl font-bold uppercase text-neutral-900 font-heading">Product Not Found</h2>
        <p className="text-xs text-neutral-500">
          The garment you requested does not exist or is out of stock.
        </p>
        <Link to="/shop">
          <Button variant="primary" size="md">
            Return to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!selectedColor) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (!selectedColor) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    navigate("/checkout");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: "Shop", href: "/shop" },
          { label: product.category, href: `/shop/${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Left Column: Image Gallery with Active Zoom Preview */}
        <div className="space-y-4">
          {/* Main Hero Image */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xs border border-neutral-200 bg-neutral-100 group">
            <img
              src={selectedImage || product.primaryImage}
              alt={product.name}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              {product.discountPercentage && product.discountPercentage > 0 && (
                <span className="bg-black text-white text-[11px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-xs">
                  -{product.discountPercentage}% OFF
                </span>
              )}
              {product.isNewArrival && (
                <span className="bg-white text-neutral-900 border border-neutral-300 text-[11px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-xs">
                  NEW
                </span>
              )}
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-sm text-neutral-700 hover:text-black border border-neutral-200 shadow-xs transition-colors"
              title="Share product link"
            >
              <Share2 className="h-4 w-4" />
            </button>

            {copiedLink && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl animate-in fade-in">
                ✓ Link copied to clipboard
              </div>
            )}
          </div>

          {/* Thumbnail Selector Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-xs border-2 bg-neutral-100 transition-all",
                  selectedImage === img
                    ? "border-black ring-1 ring-black"
                    : "border-neutral-200 opacity-60 hover:opacity-100"
                )}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Product Purchasing Details */}
        <div className="space-y-6 text-neutral-900">
          {/* Header & Title */}
          <div className="space-y-2 border-b border-neutral-200 pb-6">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-bold uppercase tracking-widest text-black">
                {product.category}
              </span>
              <span className="font-mono text-neutral-400">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
              {product.name}
            </h1>

            {product.tagline && (
              <p className="text-xs sm:text-sm font-medium text-neutral-600 uppercase tracking-wider">
                {product.tagline}
              </p>
            )}

            {/* Ratings Summary */}
            <div className="flex items-center gap-2.5 pt-1">
              <div className="flex items-center text-black">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-current text-black" : "text-neutral-200"}`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-neutral-900 font-mono">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-xs text-neutral-500">
                ({product.reviewCount} customer reviews)
              </span>
            </div>

            {/* Price in EGP */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl sm:text-4xl font-bold text-neutral-900">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-lg text-neutral-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
              {product.discountPercentage && (
                <span className="bg-black text-white text-xs font-bold px-2 py-0.5 uppercase tracking-wider rounded-xs">
                  Save {product.discountPercentage}%
                </span>
              )}
            </div>
          </div>

          {/* Color Swatch Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Color: <span className="text-black font-semibold">{selectedColor?.name || product.colors[0]?.name}</span>
              </label>

                <div className="flex flex-wrap items-center gap-2.5">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all",
                        selectedColor?.name === color.name
                          ? "border-black bg-neutral-900 text-white ring-1 ring-black"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-black"
                      )}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-neutral-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector + Size Guide Trigger */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Size: <span className="text-black font-semibold">{selectedSize}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-black hover:underline font-bold uppercase tracking-wider"
                  >
                    <Ruler className="h-3.5 w-3.5" />
                    <span>Size Guide</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "h-11 min-w-[3.2rem] px-4 flex items-center justify-center rounded-xs font-bold uppercase transition-all border text-xs",
                          isSelected
                            ? "bg-black text-white border-black shadow-xs"
                            : "bg-white text-neutral-800 border-neutral-200 hover:border-black"
                        )}
                      >
                        <span>{size}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-3">
              {/* Quantity Counter */}
              <div className="flex items-center border border-neutral-200 rounded-xs bg-neutral-50 h-11 px-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-full flex items-center justify-center text-neutral-600 hover:text-black"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-neutral-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-full flex items-center justify-center text-neutral-600 hover:text-black"
                >
                  +
                </button>
              </div>

              {/* Add to Bag Button */}
              <Button
                variant="primary"
                size="lg"
                className="flex-1 h-11 text-xs"
                onClick={handleAddToCart}
                leftIcon={
                  isAdded ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />
                }
              >
                {isAdded ? "Added to Shopping Bag" : "Add to Shopping Bag"}
              </Button>

              {/* Wishlist Toggle Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={() => toggleWishlist(product)}
                aria-label="Wishlist"
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isFavorited ? "fill-rose-500 text-rose-500" : "text-neutral-700"
                  )}
                />
              </Button>
            </div>

            {/* Direct Buy Now CTA */}
            <Button
              variant="outline"
              size="lg"
              className="w-full h-11 text-xs font-bold uppercase hover:bg-black hover:text-white"
              onClick={handleBuyNow}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Buy Now with Cash on Delivery
            </Button>
          </div>

          {/* Value Points */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-black" />
              <span>Egypt Shipping 24-48 Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-black" />
              <span>3 Days Returns & Exchanges</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-black" />
              <span>Cash on Delivery Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-black" />
              <span>100% Egyptian Combed Cotton</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information Accordion / Tabs */}
      <div className="border-t border-neutral-200 pt-12 space-y-8">
        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
          {[
            { id: "details", label: "Details & Specifications" },
            { id: "fabric", label: "Fabric & Care Instructions" },
            { id: "shipping", label: "Shipping & Returns Policy" },
            { id: "reviews", label: `Verified Reviews (${product.reviewCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition-colors border",
                activeTab === tab.id
                  ? "bg-black text-white border-black font-extrabold"
                  : "text-neutral-600 hover:text-black bg-white border-neutral-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Details */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-neutral-700 leading-relaxed animate-in fade-in">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">
                Design & Silhouette
              </h3>
              <p>{product.description}</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">
                Garment Specifications
              </h3>
              <ul className="space-y-2 list-disc list-inside text-neutral-600">
                {(product.details && product.details.length > 0
                  ? product.details
                  : [
                      "100% Combed Egyptian Long-Staple Cotton",
                      "Pre-shrunk fabric ensures true-to-size fit after washing",
                      "Heavyweight custom knit construction",
                      "Custom engraved VYRE. tonal branding",
                      "Ethically tailored in Cairo, Egypt",
                    ]
                ).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Fabric & Care */}
        {activeTab === "fabric" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-neutral-700 leading-relaxed animate-in fade-in">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">
                100% Egyptian Combed Cotton
              </h3>
              <p>
                Cultivated along the fertile banks of the Nile, long-staple Egyptian cotton produces the finest, most durable fibers. Our yarn is custom spun and combed to eliminate impurities, resulting in a premium hand-feel that softens with every wash without losing structural integrity.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">
                Washing & Garment Care
              </h3>
              <ul className="space-y-2 list-disc list-inside text-neutral-600">
                {(product.fabricCare && product.fabricCare.length > 0
                  ? product.fabricCare
                  : [
                      "Machine wash cold (30°C max) inside out with like colors",
                      "Use mild, eco-friendly detergent",
                      "Do not bleach or dry clean",
                      "Hang dry in shade to preserve color vibrancy and fibers",
                      "Warm iron inside out if needed",
                    ]
                ).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Shipping & Returns */}
        {activeTab === "shipping" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-neutral-700 leading-relaxed animate-in fade-in">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">
                Shipping Rates & Delivery
              </h3>
              <ul className="space-y-2 text-neutral-600">
                <li>
                  • <strong>Cairo & Giza:</strong> 1-2 business days (65 EGP / FREE over 3,000 EGP)
                </li>
                <li>
                  • <strong>Alexandria:</strong> 2-3 business days (75 EGP / FREE over 3,000 EGP)
                </li>
                <li>
                  • <strong>Delta & Canal Governorates:</strong> 2-3 business days
                </li>
                <li>
                  • <strong>Upper Egypt & Red Sea:</strong> 3-4 business days
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">
                3 Days Returns & Exchanges
              </h3>
              <p>
                We offer convenient doorstep exchanges across Egypt. The courier will deliver your new size and collect the previous piece directly at your door.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Reviews */}
        {activeTab === "reviews" && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-xs border border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <span className="text-4xl sm:text-5xl font-bold text-neutral-900 font-mono">
                  {product.rating.toFixed(1)}
                </span>
                <div>
                  <div className="flex items-center text-black mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current text-black" />
                    ))}
                  </div>
                  <span className="text-xs text-neutral-500">
                    Based on {product.reviewCount} customer reviews
                  </span>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev) => <ReviewCard key={rev.id} review={rev} />)
              ) : (
                <div className="col-span-2 text-center py-8 text-neutral-500 text-xs">
                  No reviews yet for this product.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
              Related Pieces
            </h2>
            <Link
              to={`/shop/${product.categorySlug}`}
              className="text-xs text-black font-bold uppercase tracking-wider hover:underline"
            >
              View More in {product.category}
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.categorySlug}
      />
    </div>
  );
};
