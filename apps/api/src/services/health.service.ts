import { checkDatabaseConnection } from "../config/prisma.js";
import { HealthCheckResponse } from "@vyre/shared";

export class HealthService {
  public static getBasicHealth(): { success: boolean; message: string } {
    return {
      success: true,
      message: "VYRE API is running",
    };
  }

  public static async getDetailedHealth(): Promise<HealthCheckResponse> {
    const isDbConnected = await checkDatabaseConnection();

    return {
      success: true,
      message: "VYRE API is running",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: isDbConnected ? "connected" : "disconnected",
      version: "1.0.0",
    };
  }
}
