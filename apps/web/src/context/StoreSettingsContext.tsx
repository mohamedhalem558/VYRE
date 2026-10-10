import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { StoreSettingsDTO, UpdateStoreSettingsDTO } from "@vyre/shared";
import {
  storeSettingsService,
  DEFAULT_STORE_SETTINGS,
} from "../services/store-settings.service.js";
import { useToast } from "../components/ui/toast.js";

interface StoreSettingsContextType {
  settings: StoreSettingsDTO;
  isLoading: boolean;
  isWinterDropMode: boolean;
  isHolidayTheme: boolean;
  updateSettings: (updates: UpdateStoreSettingsDTO) => Promise<boolean>;
  toggleWinterDropMode: () => Promise<boolean>;
  toggleHolidayTheme: () => Promise<boolean>;
  subscribeWaitlist: (email: string) => Promise<{ success: boolean; message: string }>;
  refreshSettings: () => Promise<void>;
  adminBypassDrop: boolean;
  setAdminBypassDrop: (bypass: boolean) => void;
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: DEFAULT_STORE_SETTINGS,
  isLoading: true,
  isWinterDropMode: false,
  isHolidayTheme: false,
  updateSettings: async () => false,
  toggleWinterDropMode: async () => false,
  toggleHolidayTheme: async () => false,
  subscribeWaitlist: async () => ({ success: false, message: "" }),
  refreshSettings: async () => {},
  adminBypassDrop: false,
  setAdminBypassDrop: () => {},
});

export const StoreSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettingsDTO>(DEFAULT_STORE_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminBypassDrop, setAdminBypassDrop] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      const data = await storeSettingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load store settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: UpdateStoreSettingsDTO): Promise<boolean> => {
    try {
      // Optimistic update
      setSettings((prev) => ({ ...prev, ...updates }));
      const saved = await storeSettingsService.updateSettings(updates);
      setSettings(saved);
      toast({
        title: "Store Settings Updated",
        message: "Seasonal mode and theme changes are now active.",
        description: "Seasonal mode and theme changes are now active.",
        type: "success",
      });
      return true;
    } catch (err) {
      console.error("Failed to update store settings:", err);
      toast({
        title: "Update Failed",
        message: "Could not save settings to server. Please try again.",
        description: "Could not save settings to server. Please try again.",
        type: "error",
      });
      return false;
    }
  };

  const toggleWinterDropMode = async (): Promise<boolean> => {
    const nextState = !settings.winterDropMode;
    const ok = await updateSettings({ winterDropMode: nextState });
    if (ok) {
      toast({
        title: nextState ? "Winter Drop Mode Enabled" : "Winter Drop Mode Disabled",
        message: nextState
          ? "Storefront is now displaying the Winter Coming Soon page. Admin remains fully accessible."
          : "Normal storefront restored. All products and collections are now visible to shoppers.",
        description: nextState
          ? "Storefront is now displaying the Winter Coming Soon page. Admin remains fully accessible."
          : "Normal storefront restored. All products and collections are now visible to shoppers.",
        type: nextState ? "warning" : "success",
      });
    }
    return ok;
  };

  const toggleHolidayTheme = async (): Promise<boolean> => {
    const nextState = !settings.holidayTheme;
    const ok = await updateSettings({ holidayTheme: nextState });
    if (ok) {
      toast({
        title: nextState ? "Holiday Theme Activated" : "Holiday Theme Deactivated",
        message: nextState
          ? "Winter snowfall flair and seasonal holiday accents are now visible."
          : "Returned to standard minimalist store styling.",
        description: nextState
          ? "Winter snowfall flair and seasonal holiday accents are now visible."
          : "Returned to standard minimalist store styling.",
        type: "success",
      });
    }
    return ok;
  };

  const subscribeWaitlist = async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await storeSettingsService.subscribeWaitlist(email);
    return res;
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        isLoading,
        isWinterDropMode: settings.winterDropMode,
        isHolidayTheme: settings.holidayTheme,
        updateSettings,
        toggleWinterDropMode,
        toggleHolidayTheme,
        subscribeWaitlist,
        refreshSettings: fetchSettings,
        adminBypassDrop,
        setAdminBypassDrop,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => useContext(StoreSettingsContext);
