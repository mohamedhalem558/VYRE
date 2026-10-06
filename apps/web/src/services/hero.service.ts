import { apiClient } from "./apiClient.js";
import { HomepageHeroDTO, UpdateHeroDTO } from "@vyre/shared";

export const DEFAULT_HERO: HomepageHeroDTO = {
  eyebrow: "WINTER 2026 COLLECTION",
  title: "VYRE.",
  subtitle: "BUILT FOR YOUR EVERYDAY.",
  ctaText: "SHOP COLLECTION",
  ctaLink: "/shop",
  imageUrl: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1800&auto=format&fit=crop",
  active: true,
};

export const heroService = {
  getHero: async (): Promise<HomepageHeroDTO> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: HomepageHeroDTO }>("/hero");
      return res.data.data;
    } catch (err) {
      console.warn("Failed to fetch dynamic hero, using default fallback", err);
      return DEFAULT_HERO;
    }
  },

  updateHero: async (data: UpdateHeroDTO): Promise<HomepageHeroDTO> => {
    const res = await apiClient.put<{ success: boolean; message: string; data: HomepageHeroDTO }>(
      "/hero",
      data
    );
    return res.data.data;
  },
};
