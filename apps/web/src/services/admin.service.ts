import { apiClient } from "./apiClient.js";
import {
  AdminCustomerDTO,
  AdminUserDTO,
  DashboardStatsDTO,
  Product,
  Category,
} from "@vyre/shared";

export interface CreateProductPayload {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  brand?: string;
  active?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  tags?: string[];
  images?: { url: string; altText?: string; displayOrder?: number }[];
  variants?: {
    sku: string;
    colorId: string;
    sizeId: string;
    stock: number;
    lowStockThreshold?: number;
    price?: number;
    compareAtPrice?: number;
    active?: boolean;
  }[];
}

export const adminService = {
  /**
   * Fetch real database analytics for dashboard
   */
  getDashboardStats: async (): Promise<DashboardStatsDTO> => {
    const res = await apiClient.get<{ success: boolean; data: DashboardStatsDTO }>(
      "/admin/stats"
    );
    return res.data.data;
  },

  /**
   * Customers Management
   */
  getCustomers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { customers: AdminCustomerDTO[]; total: number; pages: number };
    }>("/admin/customers", { params });
    return res.data.data;
  },

  toggleCustomerStatus: async (customerId: string): Promise<boolean> => {
    const res = await apiClient.patch<{
      success: boolean;
      message: string;
      data: { active: boolean };
    }>(`/admin/customers/${customerId}/toggle`);
    return res.data.data.active;
  },

  getCustomerOrders: async (customerId: string) => {
    const res = await apiClient.get<{ success: boolean; data: any[] }>(
      `/admin/customers/${customerId}/orders`
    );
    return res.data.data;
  },

  /**
   * User & Role Management
   */
  getUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { users: AdminUserDTO[]; total: number; pages: number };
    }>("/admin/users", { params });
    return res.data.data;
  },

  updateUserRole: async (userId: string, role: string): Promise<AdminUserDTO> => {
    const res = await apiClient.patch<{
      success: boolean;
      message: string;
      data: AdminUserDTO;
    }>(`/admin/users/${userId}/role`, { role });
    return res.data.data;
  },

  toggleUserStatus: async (userId: string): Promise<boolean> => {
    const res = await apiClient.patch<{
      success: boolean;
      message: string;
      data: { active: boolean };
    }>(`/admin/users/${userId}/toggle`);
    return res.data.data.active;
  },

  /**
   * Product Catalog Management
   */
  getProducts: async (params?: any) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { items: Product[]; total: number; page: number; totalPages: number };
    }>("/products", { params });
    return res.data.data;
  },

  createProduct: async (payload: CreateProductPayload): Promise<Product> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Product }>(
      "/products",
      payload
    );
    return res.data.data;
  },

  updateProduct: async (id: string, payload: Partial<CreateProductPayload>): Promise<Product> => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: Product }>(
      `/products/${id}`,
      payload
    );
    return res.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  /**
   * Taxonomies & Metadata
   */
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<{ success: boolean; data: Category[] }>("/categories");
    return res.data.data;
  },

  getSizes: async (): Promise<{ id: string; name: string; code: string; displayOrder: number }[]> => {
    const res = await apiClient.get<{
      success: boolean;
      data: { id: string; name: string; code: string; displayOrder: number }[];
    }>("/taxonomies/sizes");
    return res.data.data;
  },

  getColors: async (): Promise<{ id: string; name: string; code: string; hexCode: string }[]> => {
    const res = await apiClient.get<{
      success: boolean;
      data: { id: string; name: string; code: string; hexCode: string }[];
    }>("/taxonomies/colors");
    return res.data.data;
  },
};
