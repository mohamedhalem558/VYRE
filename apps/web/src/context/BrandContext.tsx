import React, { createContext, useContext, ReactNode } from "react";
import { BRAND, BrandInfo } from "@vyre/shared";

interface BrandContextType {
  brand: BrandInfo;
}

const BrandContext = createContext<BrandContextType>({
  brand: BRAND,
});

export const BrandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <BrandContext.Provider value={{ brand: BRAND }}>{children}</BrandContext.Provider>;
};

export const useBrand = () => useContext(BrandContext);
