import fs from "fs/promises";
import path from "path";
import { StoreSettingsDTO, UpdateStoreSettingsDTO, DropWaitlistSubscriberDTO } from "@vyre/shared";

export const DEFAULT_STORE_SETTINGS: StoreSettingsDTO = {
  winterDropMode: false,
  holidayTheme: false,
  dropTitle: "Winter 2026 Collection",
  dropSubtitle: "LIMITED CAPSULE DROP • CAIRO, EG",
  dropDescription:
    "The winter chapter of VYRE is arriving. Engineered for contemporary street luxury. Subscribe below for private early access and exclusive drop lookbook.",
  dropDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  countdownEnabled: true,
  notifyEmailEnabled: true,
  announcementText: "❄️ WINTER 2026 DROP IMMINENT • EXCLUSIVE LIMITED RUN",
  snowIntensity: "medium",
  updatedAt: new Date().toISOString(),
  updatedBy: "System",
};

export class StoreSettingsService {
  private dataDir: string;
  private settingsFilePath: string;
  private waitlistFilePath: string;
  private cachedSettings: StoreSettingsDTO | null = null;
  private cachedWaitlist: DropWaitlistSubscriberDTO[] | null = null;
  private isInitialized = false;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), "data");
    this.settingsFilePath = path.join(this.dataDir, "store-settings.json");
    this.waitlistFilePath = path.join(this.dataDir, "drop-waitlist.json");
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch {
      // directory might already exist
    }

    // Initialize store settings
    try {
      const content = await fs.readFile(this.settingsFilePath, "utf-8");
      this.cachedSettings = { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(content) };
    } catch {
      this.cachedSettings = { ...DEFAULT_STORE_SETTINGS };
      try {
        await fs.writeFile(
          this.settingsFilePath,
          JSON.stringify(this.cachedSettings, null, 2),
          "utf-8"
        );
      } catch (err) {
        console.warn("[StoreSettingsService] Could not persist default settings to disk:", err);
      }
    }

    // Initialize waitlist subscribers
    try {
      const waitlistContent = await fs.readFile(this.waitlistFilePath, "utf-8");
      this.cachedWaitlist = JSON.parse(waitlistContent);
    } catch {
      this.cachedWaitlist = [];
      try {
        await fs.writeFile(this.waitlistFilePath, JSON.stringify([], null, 2), "utf-8");
      } catch (err) {
        console.warn("[StoreSettingsService] Could not persist initial waitlist to disk:", err);
      }
    }

    this.isInitialized = true;
  }

  async getSettings(): Promise<StoreSettingsDTO> {
    await this.ensureInitialized();
    return { ...(this.cachedSettings || DEFAULT_STORE_SETTINGS) };
  }

  async updateSettings(
    updates: UpdateStoreSettingsDTO,
    updatedByEmail = "Admin"
  ): Promise<StoreSettingsDTO> {
    await this.ensureInitialized();

    const current = this.cachedSettings || DEFAULT_STORE_SETTINGS;
    const updated: StoreSettingsDTO = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedByEmail,
    };

    this.cachedSettings = updated;

    try {
      await fs.writeFile(
        this.settingsFilePath,
        JSON.stringify(updated, null, 2),
        "utf-8"
      );
    } catch (err) {
      console.error("[StoreSettingsService] Failed to write store settings to disk:", err);
    }

    return { ...updated };
  }

  async subscribeToWaitlist(
    email: string,
    source = "Winter Coming Soon Page"
  ): Promise<{ success: boolean; message: string; isNew: boolean }> {
    await this.ensureInitialized();

    const normalizedEmail = email.trim().toLowerCase();
    const waitlist = this.cachedWaitlist || [];

    const existingIndex = waitlist.findIndex((s) => s.email.toLowerCase() === normalizedEmail);

    if (existingIndex >= 0) {
      return {
        success: true,
        message: "You are already on the VIP winter drop list! We will email you once it drops.",
        isNew: false,
      };
    }

    const newSubscriber: DropWaitlistSubscriberDTO = {
      id: "sub_" + Math.random().toString(36).substring(2, 10),
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
      source,
    };

    waitlist.unshift(newSubscriber);
    this.cachedWaitlist = waitlist;

    try {
      await fs.writeFile(this.waitlistFilePath, JSON.stringify(waitlist, null, 2), "utf-8");
    } catch (err) {
      console.error("[StoreSettingsService] Failed to persist waitlist subscriber:", err);
    }

    return {
      success: true,
      message: "You are officially on the VIP drop list. Watch your inbox for private access.",
      isNew: true,
    };
  }

  async getWaitlistSubscribers(): Promise<DropWaitlistSubscriberDTO[]> {
    await this.ensureInitialized();
    return [...(this.cachedWaitlist || [])];
  }
}

export const storeSettingsService = new StoreSettingsService();
