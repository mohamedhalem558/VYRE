import { apiClient } from "./api.service.js";
import { HealthCheckResponse } from "@vyre/shared";

export interface HealthCheckResult {
  success: boolean;
  message: string;
  timestamp?: string;
  uptime?: number;
  environment?: string;
  database?: "connected" | "disconnected" | "unknown";
  version?: string;
}

export const healthService = {
  getHealth: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.get<{ success: boolean; message: string }>("/health");
    return response.data;
  },

  getDetailedHealth: async (): Promise<HealthCheckResponse> => {
    const response = await apiClient.get<HealthCheckResponse>("/health/detailed");
    return response.data;
  },
};
