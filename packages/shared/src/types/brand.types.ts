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
