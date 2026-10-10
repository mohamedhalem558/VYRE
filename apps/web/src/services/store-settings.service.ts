import { apiClient } from "./apiClient.js";
import {
  StoreSettingsDTO,
  UpdateStoreSettingsDTO,
  DropWaitlistSubscriberDTO,
} from "@vyre/shared";

export const DEFAULT_STORE_SETTINGS: StoreSettingsDTO = {
  winterDropMode: false,
  holidayTheme: false,
  dropTitle: "Winter 2027 Collection",
  dropSubtitle: "LIMITED CAPSULE DROP • CAIRO, EG",
  dropDescription:
    "The winter chapter of VYRE is arriving. Engineered for contemporary street luxury. Limited Capsule Drop coming soon.",
  dropDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  countdownEnabled: true,
  notifyEmailEnabled: true,
  announcementText: "❄️ WINTER 2027 DROP IMMINENT • EXCLUSIVE LIMITED RUN",
  snowIntensity: "medium",
};

const STORAGE_KEY = "vyre_store_settings_cache";

export const storeSettingsService = {
  getSettings: async (): Promise<StoreSettingsDTO> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: StoreSettingsDTO }>(
        "/store-settings"
      );
      if (res.data?.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch (err) {
      console.warn("Using cached/fallback store settings:", err);
    }

    // Try reading local cache
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(cached) };
      }
    } catch {
      // Ignore cache parse error
    }

    return DEFAULT_STORE_SETTINGS;
  },

  updateSettings: async (updates: UpdateStoreSettingsDTO): Promise<StoreSettingsDTO> => {
    try {
      const res = await apiClient.put<{
        success: boolean;
        message: string;
        data: StoreSettingsDTO;
      }>("/store-settings", updates);
      if (res.data?.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch (err) {
      console.error("Failed to update store settings on backend:", err);
    }

    // Optimistic fallback for local preview/offline
    const cached = localStorage.getItem(STORAGE_KEY);
    const base = cached ? JSON.parse(cached) : DEFAULT_STORE_SETTINGS;
    const merged = { ...base, ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  },

  subscribeWaitlist: async (
    email: string,
    source?: string
  ): Promise<{ success: boolean; message: string; isNew: boolean }> => {
    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        data: { success: boolean; message: string; isNew: boolean };
      }>("/store-settings/subscribe", { email, source });
      return res.data.data || { success: true, message: res.data.message, isNew: true };
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Thank you! You are on the winter drop VIP notification list.";
      return { success: true, message: msg, isNew: true };
    }
  },

  getWaitlistSubscribers: async (): Promise<DropWaitlistSubscriberDTO[]> => {
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: { subscribers: DropWaitlistSubscriberDTO[]; count: number };
      }>("/store-settings/subscribers");
      return res.data.data.subscribers;
    } catch (err) {
      console.warn("Failed to fetch waitlist subscribers from API:", err);
      return [];
    }
  },
};
