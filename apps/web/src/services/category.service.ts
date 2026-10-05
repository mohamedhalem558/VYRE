import { Category } from "@vyre/shared";
import { apiClient } from "./apiClient.js";
import { CATEGORIES } from "./mockData.js";

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await apiClient.get("/categories");
      if (response.data?.success && Array.isArray(response.data?.data)) {
        return response.data.data;
      }
    } catch (error) {
      console.warn("[categoryService] Failed to fetch categories from API:", error);
    }
    return CATEGORIES;
  },

  getCategoryBySlug: async (slug: string): Promise<Category | null> => {
    try {
      const response = await apiClient.get(`/categories/${slug}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      console.warn(`[categoryService] Failed to fetch category '${slug}' from API:`, error);
    }
    return CATEGORIES.find((c) => c.slug === slug) || null;
  },
};
