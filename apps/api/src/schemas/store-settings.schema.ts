import { z } from "zod";

export const updateStoreSettingsSchema = z.object({
  winterDropMode: z.boolean().optional(),
  holidayTheme: z.boolean().optional(),
  dropTitle: z.string().min(1, "Drop title cannot be empty").max(150).optional(),
  dropSubtitle: z.string().max(200).optional(),
  dropDescription: z.string().max(1000).optional(),
  dropDate: z.string().optional(),
  countdownEnabled: z.boolean().optional(),
  notifyEmailEnabled: z.boolean().optional(),
  announcementText: z.string().max(255).optional(),
  snowIntensity: z.enum(["light", "medium", "heavy"]).optional(),
});

export const dropWaitlistSubscribeSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  source: z.string().optional(),
});

export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
export type DropWaitlistSubscribeInput = z.infer<typeof dropWaitlistSubscribeSchema>;
