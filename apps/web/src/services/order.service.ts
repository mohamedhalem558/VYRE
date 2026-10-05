import { apiClient } from "./apiClient.js";
import {
  CreateOrderDTO,
  OrderDTO,
  OrderListResponse,
  OrderQueryParams,
  ShippingRateDTO,
  UpdateOrderStatusDTO,
} from "@vyre/shared";

export const orderService = {
  /**
   * Fetch active Egyptian shipping rates from database
   */
  getShippingRates: async (): Promise<ShippingRateDTO[]> => {
    const res = await apiClient.get<{ success: boolean; data: ShippingRateDTO[] }>(
      "/orders/shipping-rates"
    );
    return res.data.data;
  },

  /**
   * Create an order from user's persistent cart via backend database transaction
   */
  createOrder: async (data: CreateOrderDTO): Promise<OrderDTO> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: OrderDTO }>(
      "/orders",
      data
    );
    return res.data.data;
  },

  /**
   * Get orders (customer orders or admin orders depending on authenticated role)
   */
  getOrders: async (params?: OrderQueryParams): Promise<OrderListResponse> => {
    const res = await apiClient.get<{ success: boolean; data: OrderListResponse }>("/orders", {
      params,
    });
    return res.data.data;
  },

  /**
   * Get specific order details by ID
   */
  getOrderById: async (orderId: string): Promise<OrderDTO> => {
    const res = await apiClient.get<{ success: boolean; data: OrderDTO }>(`/orders/${orderId}`);
    return res.data.data;
  },

  /**
   * Admin: Update order status
   */
  updateOrderStatus: async (orderId: string, data: UpdateOrderStatusDTO): Promise<OrderDTO> => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: OrderDTO }>(
      `/orders/${orderId}/status`,
      data
    );
    return res.data.data;
  },
};
