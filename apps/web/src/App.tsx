import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandProvider } from "./context/BrandContext.js";
import { ToastProvider } from "./components/ui/toast.js";
import { AuthProvider } from "./context/AuthContext.js";
import { WishlistProvider } from "./context/WishlistContext.js";
import { CartProvider } from "./context/CartContext.js";
import { StoreSettingsProvider } from "./context/StoreSettingsContext.js";
import { AppRoutes } from "./routes/index.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrandProvider>
        <ToastProvider>
          <AuthProvider>
            <StoreSettingsProvider>
              <WishlistProvider>
                <CartProvider>
                  <BrowserRouter>
                    <AppRoutes />
                  </BrowserRouter>
                </CartProvider>
              </WishlistProvider>
            </StoreSettingsProvider>
          </AuthProvider>
        </ToastProvider>
      </BrandProvider>
    </QueryClientProvider>
  );
};

export default App;
