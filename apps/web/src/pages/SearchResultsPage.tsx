import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Product } from "@vyre/shared";
import { productService } from "../services/product.service.js";
import { ProductCard } from "../components/common/ProductCard.js";
import { QuickViewModal } from "../components/common/QuickViewModal.js";
import { Breadcrumb } from "../components/common/Breadcrumb.js";
import { EmptyState } from "../components/common/EmptyState.js";
import { ProductGridSkeleton } from "../components/ui/skeleton.js";
import { Search, X } from "lucide-react";

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    setSearchInput(query);

    async function executeSearch() {
      setLoading(true);
      try {
        const result = await productService.getProducts({ search: query });
        setProducts(result.items);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }

    executeSearch();
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-neutral-900">
      <Breadcrumb
        items={[{ label: "Shop", href: "/shop" }, { label: `Search: "${query || "All"}"` }]}
      />

      {/* Search Input Bar */}
      <div className="max-w-2xl mx-auto space-y-4">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search hoodies, sweaters, jackets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xs border border-neutral-300 bg-white py-3.5 pl-12 pr-12 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearchParams({});
              }}
              className="absolute right-4 text-neutral-400 hover:text-black p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="flex items-center justify-center flex-wrap gap-2 text-xs text-neutral-500">
          <span>Categories:</span>
          {["Hoodies & Sweaters", "Jackets", "Heavyweight", "Black"].map(
            (term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setSearchInput(term);
                  setSearchParams({ q: term });
                }}
                className="px-2.5 py-1 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:text-black transition-colors"
              >
                {term}
              </button>
            )
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold uppercase text-neutral-900 font-heading">
            {query ? `Search Results for "${query}"` : "All Products"}
          </h1>
          <p className="text-xs text-neutral-500">
            Found <strong className="text-neutral-900">{products.length}</strong> styles
          </p>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8 text-neutral-400" />}
          title={`No Products Found for "${query}"`}
          description="Check the spelling or explore our Hoodies & Sweaters and Jackets collections."
          actionText="Explore All Collections"
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
