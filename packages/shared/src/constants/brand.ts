import { BrandInfo } from "../types/brand.types.js";

export const BRAND: BrandInfo = {
  name: "VYRE",
  tagline: "Egyptian Premium Streetwear & Modern Clothing",
  origin: "Cairo, Egypt",
  country: "Egypt",
  currency: {
    code: "EGP",
    symbol: "EGP",
    name: "Egyptian Pound",
  },
  supportedLanguages: ["en", "ar"],
  defaultLanguage: "en",
};

export const API_VERSION = "v1";
export const API_PREFIX = `/api/${API_VERSION}`;
