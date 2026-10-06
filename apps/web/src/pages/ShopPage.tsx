import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Product, ProductSize, Category } from "@vyre/shared";
import { productService } from "../services/product.service.js";
import { categoryService } from "../services/category.service.js";
import { ProductCard } from "../components/common/ProductCard.js";
import { QuickViewModal } from "../components/common/QuickViewModal.js";
import { Breadcrumb } from "../components/common/Breadcrumb.js";
import { EmptyState } from "../components/common/EmptyState.js";
import { ProductGridSkeleton } from "../components/ui/skeleton.js";
import { Drawer } from "../components/ui/drawer.js";
import { Button } from "../components/ui/button.js";
import {
  SlidersHorizontal,
  X,
  Search,
  ChevronDown,
  LayoutGrid,
  Grid3X3,
  RotateCcw,
} from "lucide-react";
import { cn } from "../utils/cn.js";

const ALL_SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL", "XXL"];

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState<"3" | "4">("4");

  // Filters state from URL or default (gracefully handles legacy sort values)
  const selectedCategory = searchParams.get("category") || "";
  const searchQuery = searchParams.get("q") || "";
  const rawSort = searchParams.get("sort");
  const sortBy = rawSort === "newest" ? "newest" : "featured";
  const inStockOnly = searchParams.get("inStock") === "true";
  const selectedSizes = useMemo(
    () =>
      searchParams.get("sizes") ? (searchParams.get("sizes")!.split(",") as ProductSize[]) : [],
    [searchParams]
  );

  // Allowed category slugs for VYRE storefront
  const ALLOWED_CATEGORY_SLUGS = ["hoodies-sweaters", "jackets"];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prodResult, catResult] = await Promise.all([
          productService.getProducts({
            category: selectedCategory || undefined,
            search: searchQuery || undefined,
            sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
            inStockOnly: inStockOnly || undefined,
            sortBy: sortBy as any,
          }),
          categoryService.getCategories(),
        ]);

        setProducts(prodResult.items);
        // Only show Hoodies & Sweaters and Jackets categories
        setCategories(
          catResult.filter(
            (c) => c.active !== false && ALLOWED_CATEGORY_SLUGS.includes(c.slug)
          )
        );
      } catch (err) {
        console.error("Failed to fetch shop products:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedCategory, searchQuery, sortBy, inStockOnly, selectedSizes]);

  // Filter update helper
  const updateFilter = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "" || value === "0") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const toggleSizeFilter = (size: ProductSize) => {
    let nextSizes = [...selectedSizes];
    if (nextSizes.includes(size)) {
      nextSizes = nextSizes.filter((s) => s !== size);
    } else {
      nextSizes.push(size);
    }
    updateFilter("sizes", nextSizes.length > 0 ? nextSizes.join(",") : null);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    selectedSizes.length +
    (inStockOnly ? 1 : 0);

  const FilterContent = (
    <div className="space-y-6 text-xs text-neutral-900">
      {/* Category Filter */}
      <div className="space-y-3 pb-6 border-b border-neutral-200">
        <h4 className="font-bold uppercase tracking-wider text-neutral-900">Categories</h4>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter("category", null)}
            className={cn(
              "w-full flex items-center justify-between py-2 px-2.5 rounded-md transition-colors text-left",
              !selectedCategory
                ? "bg-black text-white font-bold"
                : "text-neutral-600 hover:text-black hover:bg-neutral-100"
            )}
          >
            <span>All Products</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter("category", cat.slug)}
              className={cn(
                "w-full flex items-center justify-between py-2 px-2.5 rounded-md transition-colors text-left",
                selectedCategory === cat.slug
                  ? "bg-black text-white font-bold"
                  : "text-neutral-600 hover:text-black hover:bg-neutral-100"
              )}
            >
              <span>{cat.name}</span>
              <span className={cn("text-[11px] font-mono", selectedCategory === cat.slug ? "text-neutral-300" : "text-neutral-400")}>
                {cat.itemCount}
              </span>
            </button>
          ))}
        </div>
      </div>



      {/* Size Filter */}
      <div className="space-y-3 pb-6 border-b border-neutral-200">
        <h4 className="font-bold uppercase tracking-wider text-neutral-900">Sizes</h4>
        <div className="grid grid-cols-3 gap-2">
          {ALL_SIZES.map((size) => {
            const isSelected = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSizeFilter(size)}
                className={cn(
                  "h-9 flex items-center justify-center rounded-xs font-bold font-mono transition-all border text-xs",
                  isSelected
                    ? "bg-black text-white border-black"
                    : "bg-white text-neutral-700 border-neutral-200 hover:border-black"
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* In Stock Only */}
      <div className="space-y-3 pb-6 border-b border-neutral-200">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => updateFilter("inStock", e.target.checked ? "true" : null)}
            className="h-4 w-4 rounded-xs border-neutral-300 text-black accent-black"
          />
          <span className="font-bold uppercase tracking-wider text-neutral-800 text-xs">
            In-Stock Items Only
          </span>
        </label>
      </div>

      {/* Reset Filters CTA */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="w-full flex items-center justify-center gap-2"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset All Filters ({activeFiltersCount})</span>
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Shop", href: "/shop" },
          ...(selectedCategory
            ? [
                {
                  label:
                    categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory,
                },
              ]
            : []),
        ]}
      />

      {/* Shop Header */}
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          VYRE.
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
          {selectedCategory
            ? categories.find((c) => c.slug === selectedCategory)?.name || "Shop"
            : "Shop"}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl">
          Clean architectural cuts engineered for everyday wear. Browse our premium selection of heavyweight hoodies, sweaters, and outerwear.
        </p>

        {/* Quick Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-3">
          <button
            onClick={() => updateFilter("category", null)}
            className={cn(
              "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all border",
              !selectedCategory
                ? "bg-black text-white border-black"
                : "bg-white text-neutral-700 border-neutral-200 hover:border-black"
            )}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter("category", cat.slug)}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all border",
                selectedCategory === cat.slug
                  ? "bg-black text-white border-black"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-black"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar: Filters Trigger, Sort Dropdown & Grid View */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        {/* Mobile Filter Button */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="lg:hidden flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}</span>
          </Button>

          <span className="text-xs text-neutral-500 font-mono">
            Showing <strong>{products.length}</strong> styles
          </span>
        </div>

        {/* Sort & Grid Controls */}
        <div className="flex items-center gap-4">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="hidden sm:inline text-neutral-500 uppercase font-semibold">
              Sort by:
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => updateFilter("sort", e.target.value)}
                className="appearance-none bg-white border border-neutral-300 rounded-sm py-2 pl-3 pr-8 text-xs text-neutral-900 font-bold uppercase tracking-wider focus:outline-none focus:border-black cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="newest">New Arrivals</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            </div>
          </div>

          {/* Grid Column Layout Switcher (Desktop) */}
          <div className="hidden md:flex items-center gap-1 border-l border-neutral-200 pl-4">
            <button
              onClick={() => setGridColumns("3")}
              className={cn(
                "p-1.5 rounded-xs transition-colors",
                gridColumns === "3"
                  ? "bg-neutral-100 text-black font-bold"
                  : "text-neutral-400 hover:text-black"
              )}
              title="3 Columns"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setGridColumns("4")}
              className={cn(
                "p-1.5 rounded-xs transition-colors",
                gridColumns === "4"
                  ? "bg-neutral-100 text-black font-bold"
                  : "text-neutral-400 hover:text-black"
              )}
              title="4 Columns"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500 uppercase font-semibold">Active Filters:</span>
          {selectedCategory && (
            <button
              onClick={() => updateFilter("category", null)}
              className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-900 border border-neutral-200 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-neutral-200"
            >
              <span>{categories.find((c) => c.slug === selectedCategory)?.name}</span>
              <X className="h-3 w-3" />
            </button>
          )}
          {searchQuery && (
            <button
              onClick={() => updateFilter("q", null)}
              className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-900 border border-neutral-200 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-neutral-200"
            >
              <span>Search: "{searchQuery}"</span>
              <X className="h-3 w-3" />
            </button>
          )}
          {selectedSizes.map((s) => (
            <button
              key={s}
              onClick={() => toggleSizeFilter(s)}
              className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-900 border border-neutral-200 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-neutral-200"
            >
              <span>Size: {s}</span>
              <X className="h-3 w-3" />
            </button>
          ))}
          {inStockOnly && (
            <button
              onClick={() => updateFilter("inStock", null)}
              className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-900 border border-neutral-200 px-2.5 py-1 rounded-full text-xs font-semibold hover:bg-neutral-200"
            >
              <span>In Stock</span>
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs text-neutral-900 hover:underline uppercase font-bold tracking-wider ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Shop Layout: Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="sticky top-28 rounded-xs border border-neutral-200 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-6 border-b border-neutral-200 pb-3">
              Refine Drops
            </h3>
            {FilterContent}
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8 text-neutral-400" />}
              title="No Products Found"
              description="No styles currently match your filter selections."
              actionText="Reset All Filters"
              onAction={clearAllFilters}
            />
          ) : (
            <div
              className={cn(
                "grid grid-cols-2 gap-4 sm:gap-6",
                gridColumns === "3" ? "md:grid-cols-3" : "md:grid-cols-3 xl:grid-cols-4"
              )}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Products"
        position="left"
      >
        <div className="py-2">{FilterContent}</div>
      </Drawer>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};
