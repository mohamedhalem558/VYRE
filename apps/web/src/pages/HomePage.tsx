import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Product } from "@vyre/shared";
import { productService } from "../services/product.service.js";
import { ProductCard } from "../components/common/ProductCard.js";
import { SectionHeading } from "../components/common/SectionHeading.js";
import { QuickViewModal } from "../components/common/QuickViewModal.js";
import { Button } from "../components/ui/button.js";
import { ProductGridSkeleton } from "../components/ui/skeleton.js";
import { ArrowRight } from "lucide-react";

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [featured, arrivals] = await Promise.all([
          productService.getFeaturedProducts(8),
          productService.getNewArrivals(8),
        ]);

        setFeaturedProducts(featured);
        setNewArrivals(arrivals);
      } catch (err) {
        console.error("Failed to load home products:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative w-full min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden bg-neutral-100">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1800&auto=format&fit=crop"
            alt="VYRE."
            className="h-full w-full object-cover object-center brightness-95"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Hero Overlay Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center text-white space-y-6">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] drop-shadow-sm text-neutral-200">
            Winter 2026 Collection
          </p>

          <div className="space-y-2">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter drop-shadow-md leading-none">
              VYRE.
            </h1>
            <p className="text-sm sm:text-lg md:text-xl font-medium uppercase tracking-[0.2em] drop-shadow-sm text-neutral-100">
              Built For Your Everyday.
            </p>
          </div>

          <div className="pt-4">
            <Link to="/shop">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-black hover:bg-neutral-100 px-8 py-3.5 text-xs font-bold uppercase tracking-widest shadow-xl"
              >
                Shop Collection
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Category Section (ONLY TWO CATEGORIES: Hoodies & Sweaters and Jackets) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            Categories
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
            Curated Silhouettes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Category 1: Hoodies & Sweaters */}
          <Link
            to="/shop/hoodies-sweaters"
            className="group relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[4/5] overflow-hidden rounded-xs bg-neutral-100 block border border-neutral-200"
          >
            <img
              src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop"
              alt="Hoodies & Sweaters"
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex items-end justify-between text-white">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-300">
                  Collection
                </p>
                <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
                  Hoodies & Sweaters
                </h3>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider underline underline-offset-4 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Shop <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>

          {/* Category 2: Jackets */}
          <Link
            to="/shop/jackets"
            className="group relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[4/5] overflow-hidden rounded-xs bg-neutral-100 block border border-neutral-200"
          >
            <img
              src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop"
              alt="Jackets"
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex items-end justify-between text-white">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-300">
                  Collection
                </p>
                <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
                  Jackets
                </h3>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider underline underline-offset-4 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Shop <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. Featured Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <SectionHeading
          title="Featured Pieces"
          subtitle="Engineered for comfort and modern aesthetic with premium Egyptian combed cotton."
          viewAllLink="/shop"
          viewAllText="View All"
        />

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Editorial Highlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xs bg-neutral-900 text-white p-8 sm:p-14 lg:p-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Editorial Release
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight font-heading leading-tight">
                Architectural Simplicity. Made in Cairo.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-md">
                Every piece in the VYRE collection is designed with precision, utilizing heavyweight Egyptian fabrics crafted to last through every season.
              </p>
              <div className="pt-2">
                <Link to="/shop">
                  <Button variant="primary" className="bg-white text-black hover:bg-neutral-200">
                    Explore Drop
                  </Button>
                </Link>
              </div>
            </div>

            <div className="aspect-[4/3] rounded-xs overflow-hidden bg-neutral-800">
              <img
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop"
                alt="VYRE Editorial"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <SectionHeading
          title="New Arrivals"
          subtitle="The latest hoodies, sweaters, and jackets just added to the catalog."
          viewAllLink="/shop?sort=newest"
          viewAllText="View All"
        />

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. Brand Manifesto */}
      <section className="border-t border-b border-neutral-200 bg-neutral-50/50 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            About The Brand
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
            VYRE.
          </h2>
          <p className="text-sm sm:text-base text-neutral-700 leading-relaxed max-w-2xl mx-auto font-normal">
            A contemporary local fashion brand rooted in Cairo, Egypt. We focus exclusively on essential silhouettes, heavyweight Egyptian cotton, and timeless minimalist aesthetics built for your everyday lifestyle.
          </p>
          <div className="pt-2">
            <Link to="/about">
              <Button variant="outline">
                Read Our Story
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
