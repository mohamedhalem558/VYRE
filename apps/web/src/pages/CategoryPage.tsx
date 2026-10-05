import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Product, Category } from "@vyre/shared";
import { productService } from "../services/product.service.js";
import { categoryService } from "../services/category.service.js";
import { ProductCard } from "../components/common/ProductCard.js";
import { QuickViewModal } from "../components/common/QuickViewModal.js";
import { Breadcrumb } from "../components/common/Breadcrumb.js";
import { ProductGridSkeleton } from "../components/ui/skeleton.js";
import { EmptyState } from "../components/common/EmptyState.js";
import { ShoppingBag } from "lucide-react";

export const CategoryPage: React.FC = () => {
  const params = useParams<{ slug?: string; categorySlug?: string }>();
  const currentSlug = params.categorySlug || params.slug || "";

  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function loadCategoryData() {
      if (!currentSlug) return;
      setLoading(true);
      try {
        const [cat, allCats, prods] = await Promise.all([
          categoryService.getCategoryBySlug(currentSlug),
          categoryService.getCategories(),
          productService.getProducts({ category: currentSlug }),
        ]);

        const ALLOWED_SLUGS = ["hoodies-sweaters", "jackets"];
        setCategory(cat);
        setCategories(
          allCats.filter((c) => c.active !== false && ALLOWED_SLUGS.includes(c.slug))
        );
        setProducts(prods.items);
      } catch (err) {
        console.error("Failed to load category:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryData();
  }, [currentSlug]);

  const displayTitle = category?.name || (currentSlug === "hoodies-sweaters" ? "Hoodies & Sweaters" : currentSlug === "jackets" ? "Jackets" : currentSlug.replace("-", " "));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[{ label: "Shop", href: "/shop" }, { label: displayTitle }]}
      />

      {/* Category Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          VYRE. Collection
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
          {displayTitle}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl">
          {category?.description || "Explore high-grade Egyptian cotton silhouettes engineered with minimalist aesthetics."}
        </p>

        {/* Quick Navigation Between Categories */}
        <div className="flex flex-wrap gap-2 pt-3">
          <Link
            to="/shop"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all border bg-white text-neutral-700 border-neutral-200 hover:border-black"
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop/${cat.slug}`}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all border ${
                currentSlug === cat.slug
                  ? "bg-black text-white border-black"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-black"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8 text-neutral-400" />}
          title="No Products in This Category Yet"
          description="We are currently preparing new seasonal pieces for this collection."
          actionText="Browse All Products"
          actionLink="/shop"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
