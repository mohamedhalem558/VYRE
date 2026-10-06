import { z } from "zod";

export const updateHeroSchema = z.object({
  eyebrow: z.string().min(1, "Eyebrow text is required").max(120),
  title: z.string().min(1, "Main title is required").max(120),
  subtitle: z.string().min(1, "Subtitle is required").max(200),
  ctaText: z.string().min(1, "CTA button text is required").max(60),
  ctaLink: z.string().min(1, "CTA button link is required").max(255),
  imageUrl: z.string().min(1, "Hero background image is required"),
  active: z.boolean().default(true),
});

export type UpdateHeroInput = z.infer<typeof updateHeroSchema>;
