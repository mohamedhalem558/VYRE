export interface StoreSettingsDTO {
  winterDropMode: boolean;
  holidayTheme: boolean;
  dropTitle: string;
  dropSubtitle: string;
  dropDescription: string;
  dropDate: string;
  countdownEnabled: boolean;
  notifyEmailEnabled: boolean;
  announcementText: string;
  snowIntensity: "light" | "medium" | "heavy";
  updatedAt?: string;
  updatedBy?: string;
}

export type UpdateStoreSettingsDTO = Partial<StoreSettingsDTO>;

export interface DropWaitlistSubscriberDTO {
  id: string;
  email: string;
  createdAt: string;
  source?: string;
}
