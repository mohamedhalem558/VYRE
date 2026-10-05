import { Product, ProductFilterParams } from "@vyre/shared";
import { apiClient } from "./apiClient.js";
import { PRODUCTS } from "./mockData.js";

export const productService = {
  /**
   * Fetch products with search, category, price, size, color, stock, and sorting filters
   */
  getProducts: async (
    params?: ProductFilterParams
  ): Promise<{ items: Product[]; total: number }> => {
    try {
      const queryParams: Record<string, any> = {};

      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.category) queryParams.category = params.category;
      if (params?.minPrice !== undefined) queryParams.minPrice = params.minPrice;
      if (params?.maxPrice !== undefined && params.maxPrice > 0) queryParams.maxPrice = params.maxPrice;
      if (params?.sizes && params.sizes.length > 0) queryParams.size = params.sizes[0];
      if (params?.colors && params.colors.length > 0) queryParams.color = params.colors[0];
      if (params?.inStockOnly) queryParams.inStock = "true";

      if (params?.sortBy) {
        if (params.sortBy === "price-asc") queryParams.sort = "price_asc";
        else if (params.sortBy === "price-desc") queryParams.sort = "price_desc";
        else if (params.sortBy === "featured") queryParams.sort = "featured";
        else queryParams.sort = "newest";
      }

      const response = await apiClient.get("/products", { params: queryParams });

      if (response.data?.success && response.data?.data) {
        return {
          items: response.data.data.items,
          total: response.data.data.total,
        };
      }
    } catch (error) {
      console.warn("[productService] API request failed, falling back to local dataset:", error);
    }

    // Graceful fallback
    let results = [...PRODUCTS];

    if (params?.category) {
      results = results.filter(
        (p) =>
          p.categorySlug.toLowerCase() === params.category?.toLowerCase() ||
          p.category.toLowerCase() === params.category?.toLowerCase()
      );
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (params?.minPrice !== undefined) {
      results = results.filter((p) => p.price >= (params.minPrice || 0));
    }

    if (params?.maxPrice !== undefined && params.maxPrice > 0) {
      results = results.filter((p) => p.price <= (params.maxPrice || Infinity));
    }

    if (params?.sizes && params.sizes.length > 0) {
      results = results.filter((p) => p.sizes.some((s) => params.sizes?.includes(s)));
    }

    if (params?.inStockOnly) {
      results = results.filter((p) => p.inStock);
    }

    if (params?.sortBy) {
      switch (params.sortBy) {
        case "price-asc":
          results.sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          results.sort((a, b) => b.price - a.price);
          break;
        case "newest":
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        default:
          break;
      }
    }

    return { items: results, total: results.length };
  },

  /**
   * Get product by slug from live API
   */
  getProductBySlug: async (slug: string): Promise<Product | null> => {
    try {
      const response = await apiClient.get(`/products/slug/${slug}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      console.warn(`[productService] Failed to fetch product slug '${slug}' from API:`, error);
    }

    return PRODUCTS.find((p) => p.slug === slug) || null;
  },

  /**
   * Featured products
   */
  getFeaturedProducts: async (limit = 4): Promise<Product[]> => {
    try {
      const response = await apiClient.get("/products", {
        params: { featured: "true", limit },
      });
      if (response.data?.success && response.data?.data?.items) {
        return response.data.data.items;
      }
    } catch (error) {
      console.warn("[productService] Failed to fetch featured products from API:", error);
    }

    return PRODUCTS.filter((p) => p.isFeatured).slice(0, limit);
  },

  /**
   * New Arrivals
   */
  getNewArrivals: async (limit = 4): Promise<Product[]> => {
    try {
      const response = await apiClient.get("/products", {
        params: { newArrival: "true", limit },
      });
      if (response.data?.success && response.data?.data?.items) {
        return response.data.data.items;
      }
    } catch (error) {
      console.warn("[productService] Failed to fetch new arrivals from API:", error);
    }

    return PRODUCTS.filter((p) => p.isNewArrival).slice(0, limit);
  },

  /**
   * Best Sellers
   */
  getBestSellers: async (limit = 4): Promise<Product[]> => {
    try {
      const response = await apiClient.get("/products", {
        params: { bestseller: "true", limit },
      });
      if (response.data?.success && response.data?.data?.items) {
        return response.data.data.items;
      }
    } catch (error) {
      console.warn("[productService] Failed to fetch best sellers from API:", error);
    }

    return PRODUCTS.filter((p) => p.isBestSeller).slice(0, limit);
  },

  /**
   * Related Products
   */
  getRelatedProducts: async (category: string, currentProductId?: string, limit = 4): Promise<Product[]> => {
    try {
      const response = await apiClient.get("/products", {
        params: { category, limit: limit + 1 },
      });
      if (response.data?.success && response.data?.data?.items) {
        return response.data.data.items
          .filter((p: Product) => p.id !== currentProductId)
          .slice(0, limit);
      }
    } catch (error) {
      console.warn("[productService] Failed to fetch related products from API:", error);
    }

    return PRODUCTS.filter(
      (p) =>
        (p.categorySlug === category || p.category === category) &&
        p.id !== currentProductId
    ).slice(0, limit);
  },
};
