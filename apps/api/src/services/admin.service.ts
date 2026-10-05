import { OrderStatus, UserRole } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import {
  AdminCustomerDTO,
  AdminUserDTO,
  DashboardStatsDTO,
} from "@vyre/shared";

export class AdminService {
  /**
   * Fetch comprehensive real-time dashboard analytics from PostgreSQL
   */
  async getDashboardStats(): Promise<DashboardStatsDTO> {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCustomers,
      totalProducts,
      lowStockVariants,
      outOfStockVariants,
      recentOrdersRaw,
      allValidOrders,
      orderStatusGroup,
      topItemsGroup,
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),
      // Pending orders
      prisma.order.count({ where: { orderStatus: OrderStatus.PENDING } }),
      // Completed (Delivered) orders
      prisma.order.count({ where: { orderStatus: OrderStatus.DELIVERED } }),
      // Total registered customers
      prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      // Total products
      prisma.product.count(),
      // Low stock (stock > 0 and stock <= lowStockThreshold)
      prisma.productVariant.count({
        where: {
          stock: { gt: 0, lte: 5 },
          active: true,
        },
      }),
      // Out of stock
      prisma.productVariant.count({
        where: {
          stock: { lte: 0 },
          active: true,
        },
      }),
      // Recent orders (latest 8)
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      }),
      // Valid orders for revenue calculation & sales trend
      prisma.order.findMany({
        where: {
          orderStatus: { not: OrderStatus.CANCELLED },
        },
        select: {
          total: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      // Orders by status
      prisma.order.groupBy({
        by: ["orderStatus"],
        _count: { id: true },
      }),
      // Top selling products by sum of quantity from OrderItem
      prisma.orderItem.groupBy({
        by: ["productId", "productName", "productSlug", "productImage"],
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 5,
      }),
    ]);

    // Calculate total revenue
    const totalRevenue = allValidOrders.reduce(
      (acc, ord) => acc + Number(ord.total),
      0
    );

    // Build Order Status Counts dictionary
    const orderStatusCounts: Record<string, number> = {};
    orderStatusGroup.forEach((g) => {
      orderStatusCounts[g.orderStatus] = g._count.id;
    });

    // Build Recent Orders DTO
    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      total: Number(o.total),
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      itemCount: o.items.length,
      createdAt: o.createdAt.toISOString(),
    }));

    // Build Top Selling Products DTO
    let topSellingProducts = topItemsGroup.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      productImage: item.productImage,
      totalSold: item._sum.quantity || 0,
      totalRevenue: Number(item._sum.totalPrice || 0),
    }));

    // Fallback if no order items exist yet: pull from products catalog
    if (topSellingProducts.length === 0) {
      const topCatalog = await prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { images: { take: 1 } },
      });
      topSellingProducts = topCatalog.map((p) => ({
        productId: p.id,
        productName: p.name,
        productSlug: p.slug,
        productImage: p.images[0]?.url || null,
        totalSold: 0,
        totalRevenue: 0,
      }));
    }

    // Build 7-day Sales Trend from real orders (or past week dates with real values)
    const salesTrendMap = new Map<string, { revenue: number; orders: number }>();
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      salesTrendMap.set(dateKey, { revenue: 0, orders: 0 });
    }

    allValidOrders.forEach((o) => {
      const dateKey = o.createdAt.toISOString().split("T")[0];
      if (salesTrendMap.has(dateKey)) {
        const entry = salesTrendMap.get(dateKey)!;
        entry.revenue += Number(o.total);
        entry.orders += 1;
      }
    });

    const salesTrend = Array.from(salesTrendMap.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }));

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCustomers,
      totalProducts,
      lowStockCount: lowStockVariants,
      outOfStockCount: outOfStockVariants,
      recentOrders,
      topSellingProducts,
      salesTrend,
      orderStatusCounts,
    };
  }

  /**
   * List customers with order count and total spend
   */
  async getCustomers(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ customers: AdminCustomerDTO[]; total: number; pages: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      role: UserRole.CUSTOMER,
    };

    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      where.OR = [
        { email: { contains: s, mode: "insensitive" } },
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
        { phoneNumber: { contains: s, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          addresses: { where: { isDefault: true }, take: 1 },
          orders: {
            where: { orderStatus: { not: OrderStatus.CANCELLED } },
            select: { total: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const customers: AdminCustomerDTO[] = users.map((u) => {
      const defaultAddr = u.addresses[0];
      const totalOrders = u.orders.length;
      const totalSpent = u.orders.reduce((acc, o) => acc + Number(o.total), 0);

      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phoneNumber: u.phoneNumber,
        active: u.active,
        totalOrders,
        totalSpent: Math.round(totalSpent * 100) / 100,
        city: defaultAddr?.city || null,
        governorate: defaultAddr?.governorate || null,
        createdAt: u.createdAt.toISOString(),
      };
    });

    return {
      customers,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Toggle customer active state
   */
  async toggleCustomerStatus(customerId: string, adminUserId: string): Promise<boolean> {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) throw new Error("Customer not found");

    const newActiveState = !customer.active;

    await prisma.user.update({
      where: { id: customerId },
      data: { active: newActiveState },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: newActiveState ? "CUSTOMER_ACTIVATED" : "CUSTOMER_DEACTIVATED",
        entity: "User",
        entityId: customerId,
        metadata: { previousActive: customer.active, newActive: newActiveState },
      },
    });

    return newActiveState;
  }

  /**
   * Get orders for a specific customer
   */
  async getCustomerOrders(customerId: string) {
    return prisma.order.findMany({
      where: { userId: customerId },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        payment: true,
      },
    });
  }

  /**
   * List staff and users
   */
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
  }): Promise<{ users: AdminUserDTO[]; total: number; pages: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.role) {
      where.role = params.role;
    }

    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      where.OR = [
        { email: { contains: s, mode: "insensitive" } },
        { firstName: { contains: s, mode: "insensitive" } },
        { lastName: { contains: s, mode: "insensitive" } },
      ];
    }

    const [usersRaw, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const users: AdminUserDTO[] = usersRaw.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phoneNumber: u.phoneNumber,
      role: u.role as any,
      active: u.active,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Update user role (enforces safety checks)
   */
  async updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    adminUserId: string
  ): Promise<AdminUserDTO> {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Admin self-protection: prevent administrators from changing their own role
    if (targetUserId === adminUserId) {
      const error: any = new Error("Administrators cannot modify their own role for security and self-protection.");
      error.statusCode = 403;
      throw error;
    }

    // Prevent demoting the last active ADMIN
    if (user.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN, active: true },
      });
      if (adminCount <= 1) {
        const error: any = new Error("Cannot demote the sole active Administrator.");
        error.statusCode = 400;
        throw error;
      }
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "USER_ROLE_CHANGED",
        entity: "User",
        entityId: targetUserId,
        metadata: { previousRole: user.role, newRole },
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phoneNumber: updated.phoneNumber,
      role: updated.role as any,
      active: updated.active,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Toggle user active state
   */
  async toggleUserStatus(targetUserId: string, adminUserId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) throw new Error("User not found");

    if (user.id === adminUserId) {
      const error: any = new Error("You cannot deactivate your own administrative account.");
      error.statusCode = 403;
      throw error;
    }

    const newActiveState = !user.active;

    await prisma.user.update({
      where: { id: targetUserId },
      data: { active: newActiveState },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: newActiveState ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entity: "User",
        entityId: targetUserId,
        metadata: { previousActive: user.active, newActive: newActiveState },
      },
    });

    return newActiveState;
  }
}

export const adminService = new AdminService();
