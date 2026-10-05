import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Product } from "@vyre/shared";
import { wishlistService } from "../services/wishlist.service.js";
import { useAuth } from "./AuthContext.js";
import { useToast } from "../components/ui/toast.js";

interface WishlistContextType {
  wishlist: Product[];
  wishlistCount: number;
  isLoading: boolean;
  error: string | null;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { success, info, error: toastError } = useToast();

  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await wishlistService.getWishlist();
      const products = data.items.map((item) => item.product);
      setWishlist(products);
    } catch (err: any) {
      console.error("[WishlistContext] Failed to fetch wishlist:", err);
      setError(err?.response?.data?.error || err.message || "Failed to load wishlist");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      info("Please sign in to save items to your personal wishlist.", "Sign in Required");
      return;
    }

    const exists = isInWishlist(product.id);

    try {
      if (exists) {
        await wishlistService.removeFromWishlist(product.id);
        setWishlist((prev) => prev.filter((item) => item.id !== product.id));
        info(`Removed ${product.name} from wishlist.`);
      } else {
        await wishlistService.addToWishlist(product.id);
        setWishlist((prev) => [product, ...prev]);
        success(`Added ${product.name} to your wishlist.`, "Wishlist Updated");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Could not update wishlist";
      toastError(msg);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!isAuthenticated) return;

    try {
      await wishlistService.removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((item) => item.id !== productId));
      info("Item removed from your wishlist.");
    } catch (err: any) {
      toastError(err?.response?.data?.error || "Failed to remove item");
    }
  };

  const clearWishlist = async () => {
    if (!isAuthenticated) return;

    // Remove each item
    try {
      await Promise.all(wishlist.map((p) => wishlistService.removeFromWishlist(p.id)));
      setWishlist([]);
      info("Wishlist cleared.");
    } catch (err: any) {
      toastError(err?.response?.data?.error || "Failed to clear wishlist");
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isLoading,
        error,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
