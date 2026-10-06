export interface BrandInfo {
  name: string;
  tagline: string;
  origin: string;
  country: string;
  currency: {
    code: string;
    symbol: string;
    name: string;
  };
  supportedLanguages: Array<"en" | "ar">;
  defaultLanguage: "en" | "ar";
}

export interface HomepageHeroDTO {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type UpdateHeroDTO = Partial<Omit<HomepageHeroDTO, "id" | "createdAt" | "updatedAt">>;
