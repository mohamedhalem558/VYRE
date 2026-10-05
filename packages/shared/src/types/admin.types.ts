export interface DashboardStatsDTO {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    total: number;
    orderStatus: string;
    paymentStatus: string;
    itemCount: number;
    createdAt: string;
  }[];
  topSellingProducts: {
    productId: string;
    productName: string;
    productSlug: string;
    productImage?: string | null;
    totalSold: number;
    totalRevenue: number;
  }[];
  salesTrend: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  orderStatusCounts: Record<string, number>;
}

export interface AdminCustomerDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  active: boolean;
  totalOrders: number;
  totalSpent: number;
  city?: string | null;
  governorate?: string | null;
  createdAt: string;
}

export interface AdminUserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  role: "ADMIN" | "INVENTORY_MANAGER" | "MARKETING_MANAGER" | "CUSTOMER";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
