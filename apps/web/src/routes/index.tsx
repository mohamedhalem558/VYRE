import React from "react";
import { Routes, Route } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout.js";
import { AccountLayout } from "../layouts/AccountLayout.js";
import { AdminLayout } from "../layouts/AdminLayout.js";
import { ProtectedRoute } from "../components/common/ProtectedRoute.js";

// Customer Pages
import { HomePage } from "../pages/HomePage.js";
import { ShopPage } from "../pages/ShopPage.js";
import { CategoryPage } from "../pages/CategoryPage.js";
import { ProductDetailsPage } from "../pages/ProductDetailsPage.js";
import { SearchResultsPage } from "../pages/SearchResultsPage.js";
import { CartPage } from "../pages/CartPage.js";
import { WishlistPage } from "../pages/WishlistPage.js";
import { CheckoutPage } from "../pages/CheckoutPage.js";
import { LoginPage } from "../pages/LoginPage.js";
import { RegisterPage } from "../pages/RegisterPage.js";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage.js";
import { ResetPasswordPage } from "../pages/ResetPasswordPage.js";

// Account Pages
import { AccountDashboardPage } from "../pages/AccountDashboardPage.js";
import { OrdersPage } from "../pages/OrdersPage.js";
import { OrderDetailsPage } from "../pages/OrderDetailsPage.js";
import { AddressesPage } from "../pages/AddressesPage.js";
import { ProfilePage } from "../pages/ProfilePage.js";

// Admin & Staff Pages
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage.js";
import { AdminProductsPage } from "../pages/admin/AdminProductsPage.js";
import { InventoryPage } from "../pages/admin/InventoryPage.js";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage.js";
import { AdminCustomersPage } from "../pages/admin/AdminCustomersPage.js";
import { AdminCouponsPage } from "../pages/admin/AdminCouponsPage.js";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage.js";
import { AdminCategoriesPage } from "../pages/admin/AdminCategoriesPage.js";
import { AdminHeroPage } from "../pages/admin/AdminHeroPage.js";

// Informational Pages
import { AboutPage } from "../pages/AboutPage.js";
import { ContactPage } from "../pages/ContactPage.js";
import { PrivacyPolicyPage } from "../pages/PrivacyPolicyPage.js";
import { TermsPage } from "../pages/TermsPage.js";
import { NotFoundPage } from "../pages/NotFoundPage.js";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Admin Portal Layout (Protected for Staff & Admins) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "INVENTORY_MANAGER", "MARKETING_MANAGER"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MARKETING_MANAGER"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="hero"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MARKETING_MANAGER"]}>
              <AdminHeroPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="products"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "INVENTORY_MANAGER", "MARKETING_MANAGER"]}>
              <AdminProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "INVENTORY_MANAGER"]}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminCustomersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MARKETING_MANAGER"]}>
              <AdminCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="collections"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MARKETING_MANAGER"]}>
              <AdminCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="coupons"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MARKETING_MANAGER"]}>
              <AdminCouponsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Customer Storefront Layout */}
      <Route path="/" element={<MainLayout />}>
        {/* 1. Home */}
        <Route index element={<HomePage />} />

        {/* 2. Shop Catalog & Category Drops */}
        <Route path="shop" element={<ShopPage />} />
        <Route path="shop/:categorySlug" element={<CategoryPage />} />
        <Route path="category/:slug" element={<CategoryPage />} />

        {/* 3. Product Details */}
        <Route path="product/:slug" element={<ProductDetailsPage />} />

        {/* 4. Search Results */}
        <Route path="search" element={<SearchResultsPage />} />

        {/* 5. Shopping Bag */}
        <Route path="cart" element={<CartPage />} />

        {/* 6. Wishlist */}
        <Route path="wishlist" element={<WishlistPage />} />

        {/* 7. Checkout */}
        <Route path="checkout" element={<CheckoutPage />} />

        {/* 8. Authentication */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/* 9. Customer Account Portal (Protected) */}
        <Route
          path="account"
          element={
            <ProtectedRoute>
              <AccountLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AccountDashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* 10. Brand Information & Legal */}
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<PrivacyPolicyPage />} />
        <Route path="terms" element={<TermsPage />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
