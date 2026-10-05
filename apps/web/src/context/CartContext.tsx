import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import {
  CartItem,
  Product,
  ProductSize,
  ProductColor,
  CouponDiscount,
  CartSummary,
} from "@vyre/shared";
import { cartService } from "../services/cart.service.js";
import { useAuth } from "./AuthContext.js";
import { useToast } from "../components/ui/toast.js";

const GUEST_CART_STORAGE_KEY = "vyre_guest_shopping_cart";
const FREE_SHIPPING_THRESHOLD = 1500; // in EGP
const STANDARD_SHIPPING_FEE = 65; // in EGP

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  appliedCoupon: CouponDiscount | null;
  isLoading: boolean;
  error: string | null;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (
    product: Product,
    size: ProductSize,
    color: ProductColor,
    quantity?: number,
    variantId?: string
  ) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDiscount | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track previous auth status to detect login event for merge
  const prevAuthRef = useRef<boolean>(false);

  // Sync state from server CartSummary
  const applyServerCart = useCallback((cart: CartSummary) => {
    setItems(cart.items || []);
    if (cart.appliedCoupon !== undefined) {
      setAppliedCoupon(cart.appliedCoupon);
    }
  }, []);

  // Helper to load guest cart from localStorage
  const loadGuestCart = (): CartItem[] => {
    try {
      const saved = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // Helper to persist guest cart
  const saveGuestCart = (guestItems: CartItem[]) => {
    try {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(guestItems));
    } catch {
      // ignore
    }
  };

  // Initial load and handling of auth change (including guest merge upon login)
  useEffect(() => {
    async function syncCartWithAuth() {
      setIsLoading(true);
      setError(null);

      try {
        if (isAuthenticated) {
          const guestItems = loadGuestCart();

          if (guestItems.length > 0) {
            // Guest logged in with items in local storage - Merge guest cart!
            try {
              const mergePayload = {
                items: guestItems.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId,
                  size: item.selectedSize,
                  colorName: item.selectedColor?.name,
                  quantity: item.quantity,
                })),
              };

              const mergedCart = await cartService.mergeCart(mergePayload);
              applyServerCart(mergedCart);
              localStorage.removeItem(GUEST_CART_STORAGE_KEY);
              success("Your saved items were merged into your account bag.", "Bag Synced");
            } catch (mergeErr: any) {
              console.error("[CartContext] Failed to merge guest cart:", mergeErr);
              // Fallback to fetching user's remote cart
              const remoteCart = await cartService.getCart();
              applyServerCart(remoteCart);
            }
          } else {
            // No guest items to merge, just fetch user's database cart
            const remoteCart = await cartService.getCart();
            applyServerCart(remoteCart);
          }
        } else {
          // Guest user: load from localStorage
          const localItems = loadGuestCart();
          setItems(localItems);
        }
      } catch (err: any) {
        console.error("[CartContext] Cart load failed:", err);
        setError(err?.response?.data?.error || err.message || "Failed to load cart");
      } finally {
        setIsLoading(false);
        prevAuthRef.current = isAuthenticated;
      }
    }

    syncCartWithAuth();
  }, [isAuthenticated, user?.id, applyServerCart, success]);

  // Persist guest cart locally whenever items change if guest
  useEffect(() => {
    if (!isAuthenticated) {
      saveGuestCart(items);
    }
  }, [items, isAuthenticated]);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);

  const discount = appliedCoupon ? (subtotal * appliedCoupon.percentage) / 100 : 0;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0;
  const shippingFee = items.length === 0 ? 0 : isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const total = Math.max(0, subtotal - discount + shippingFee);
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);

  const refreshCart = async () => {
    if (isAuthenticated) {
      try {
        setIsLoading(true);
        const serverCart = await cartService.getCart();
        applyServerCart(serverCart);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * Add Item to Bag (Real persistent API for auth, localStorage for guest)
   */
  const addToCart = async (
    product: Product,
    size: ProductSize,
    color: ProductColor,
    quantity = 1,
    variantId?: string
  ): Promise<boolean> => {
    setError(null);

    // Business check: product active
    if (!product.active && product.active !== undefined) {
      toastError("This product is currently unavailable.");
      return false;
    }

    // Resolve variant from product variants if not explicitly passed
    const matchedVariant = product.variants?.find((v) => {
      if (variantId && v.id === variantId) return true;
      const sizeMatch =
        v.size?.code?.toLowerCase() === size?.toLowerCase() ||
        v.size?.name?.toLowerCase() === size?.toLowerCase();
      const colorMatch =
        v.color?.name?.toLowerCase() === color?.name?.toLowerCase() ||
        v.color?.code?.toLowerCase() === color?.code?.toLowerCase();
      return sizeMatch && colorMatch;
    });

    const targetVariantId = variantId || matchedVariant?.id;
    const availableStock = matchedVariant?.stock ?? product.stockCount ?? 99;

    if (matchedVariant && matchedVariant.stock <= 0) {
      toastError(`Size ${size} in ${color.name} is out of stock.`);
      return false;
    }

    if (isAuthenticated) {
      try {
        setIsLoading(true);
        const serverCart = await cartService.addItem({
          productId: product.id,
          variantId: targetVariantId,
          size,
          colorName: color.name,
          quantity,
        });
        applyServerCart(serverCart);
        success(`Added ${product.name} (${size}) to your bag.`, "Added to Bag");
        openCartDrawer();
        return true;
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.error || err.message || "Failed to add item to bag";
        setError(errorMsg);
        toastError(errorMsg, "Stock Limit");
        return false;
      } finally {
        setIsLoading(false);
      }
    } else {
      // Guest User: Local persistence with stock verification
      let successAdded = false;
      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) =>
            item.productId === product.id &&
            item.selectedSize === size &&
            item.selectedColor.name === color.name
        );

        if (existingIndex > -1) {
          const currentQty = prevItems[existingIndex].quantity;
          const newQty = currentQty + quantity;

          if (matchedVariant && newQty > matchedVariant.stock) {
            toastError(
              `Cannot add more. You have ${currentQty} in bag and only ${matchedVariant.stock} available.`,
              "Stock Limit"
            );
            return prevItems;
          }

          const updated = [...prevItems];
          const unitPrice = matchedVariant?.price ? Number(matchedVariant.price) : product.price;
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
            totalPrice: newQty * unitPrice,
          };
          successAdded = true;
          return updated;
        } else {
          if (matchedVariant && quantity > matchedVariant.stock) {
            toastError(
              `Requested quantity exceeds available stock (${matchedVariant.stock}).`,
              "Stock Limit"
            );
            return prevItems;
          }

          const unitPrice = matchedVariant?.price ? Number(matchedVariant.price) : product.price;
          const newItem: CartItem = {
            id: `guest-${product.id}-${size}-${color.name}-${Date.now()}`,
            productId: product.id,
            variantId: targetVariantId,
            product,
            variant: matchedVariant,
            selectedSize: size,
            selectedColor: color,
            quantity,
            unitPrice,
            priceSnapshot: unitPrice,
            totalPrice: unitPrice * quantity,
            maxStock: availableStock,
          };
          successAdded = true;
          return [...prevItems, newItem];
        }
      });

      if (successAdded) {
        success(`Added ${product.name} (${size}) to your bag.`, "Added to Bag");
        openCartDrawer();
        return true;
      }
      return false;
    }
  };

  /**
   * Update Quantity
   */
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    if (isAuthenticated) {
      try {
        setIsLoading(true);
        const serverCart = await cartService.updateQuantity(itemId, quantity);
        applyServerCart(serverCart);
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.error || err.message || "Failed to update item quantity";
        toastError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    } else {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            if (item.maxStock && quantity > item.maxStock) {
              toastError(`Max available stock is ${item.maxStock}`);
              return item;
            }
            return {
              ...item,
              quantity,
              totalPrice: item.unitPrice * quantity,
            };
          }
          return item;
        })
      );
    }
  };

  /**
   * Remove Item
   */
  const removeItem = async (itemId: string) => {
    if (isAuthenticated) {
      try {
        setIsLoading(true);
        const serverCart = await cartService.removeItem(itemId);
        applyServerCart(serverCart);
        info("Item removed from your bag.");
      } catch (err: any) {
        toastError(err?.response?.data?.error || "Failed to remove item");
      } finally {
        setIsLoading(false);
      }
    } else {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      info("Item removed from your bag.");
    }
  };

  /**
   * Clear Entire Bag
   */
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        setIsLoading(true);
        const serverCart = await cartService.clearCart();
        applyServerCart(serverCart);
        setAppliedCoupon(null);
        info("Your bag has been emptied.");
      } catch (err: any) {
        toastError(err?.response?.data?.error || "Failed to clear cart");
      } finally {
        setIsLoading(false);
      }
    } else {
      setItems([]);
      setAppliedCoupon(null);
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      info("Your bag has been emptied.");
    }
  };

  /**
   * Apply Coupon Code
   */
  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const coupon = await cartService.validateCoupon(code, subtotal);
    if (coupon) {
      setAppliedCoupon(coupon);
      success(`Promo code ${coupon.code} applied! (${coupon.percentage}% OFF)`, "Discount Applied");
      return {
        success: true,
        message: `Coupon ${coupon.code} applied! (${coupon.percentage}% OFF)`,
      };
    }
    const failMsg = "Invalid or expired promo code";
    toastError(failMsg);
    return { success: false, message: failMsg };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    info("Coupon removed");
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discount,
        shippingFee,
        total,
        isFreeShipping,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        amountNeededForFreeShipping,
        appliedCoupon,
        isLoading,
        error,
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
