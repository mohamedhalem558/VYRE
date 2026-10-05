import { useQuery } from "@tanstack/react-query";
import { healthService } from "../services/health.service.js";

export function useHealthCheck() {
  return useQuery({
    queryKey: ["api-health"],
    queryFn: healthService.getDetailedHealth,
    retry: 2,
    refetchInterval: 30000,
  });
}
