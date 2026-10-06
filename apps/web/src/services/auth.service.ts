import { User, Address, AuthResponse, ApiResponse } from "@vyre/shared";
import { apiClient } from "./apiClient.js";

const AUTH_USER_KEY = "vyre_auth_user";
const ACCESS_TOKEN_KEY = "vyre_access_token";
const REFRESH_TOKEN_KEY = "vyre_refresh_token";

export const authService = {
  getCurrentUser: (): User | null => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  /**
   * Fetch authenticated user profile from backend
   */
  fetchMe: async (): Promise<User | null> => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }

    try {
      const res = await apiClient.get<ApiResponse<User>>("/auth/me");
      if (res.data?.success && res.data?.data) {
        const user = res.data.data;
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        return user;
      }
    } catch (error: any) {
      console.warn("[authService] Failed to fetch /auth/me:", error);
      if (error?.response?.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        return null;
      }
    }
    return authService.getCurrentUser();
  },

  login: async (email: string, password: string): Promise<User> => {
    try {
      const res = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", {
        email,
        password,
      });

      if (res.data?.success && res.data?.data) {
        const { user, tokens } = res.data.data;
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        return user;
      }
      throw new Error("Login failed. Unable to authenticate session.");
    } catch (error: any) {
      const detailsMsg = error.response?.data?.details?.map((d: any) => d.message).join(". ");
      const msg = detailsMsg || error.response?.data?.error || "Login failed. Please check your credentials.";
      throw new Error(msg);
    }
  },

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phoneNumber?: string;
  }): Promise<User> => {
    try {
      const res = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        phoneNumber: userData.phoneNumber || undefined,
      });

      if (res.data?.success && res.data?.data) {
        const { user, tokens } = res.data.data;
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        return user;
      }
      throw new Error("Registration failed. Unable to create account.");
    } catch (error: any) {
      const detailsMsg = error.response?.data?.details?.map((d: any) => d.message).join(". ");
      const msg = detailsMsg || error.response?.data?.error || "Registration failed. Please check your input.";
      throw new Error(msg);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  },

  forgotPassword: async (email: string): Promise<{ message: string; devResetToken?: string }> => {
    try {
      const res = await apiClient.post("/auth/forgot-password", { email });
      if (res.data?.success) {
        return res.data.data || { message: res.data.message || "Reset link sent" };
      }
    } catch (error: any) {
      const detailsMsg = error.response?.data?.details?.map((d: any) => d.message).join(". ");
      const msg = detailsMsg || error.response?.data?.error || "Failed to process forgot password request.";
      throw new Error(msg);
    }
    return { message: "If an account exists, a reset link has been dispatched." };
  },

  resetPassword: async (token: string, password: string): Promise<string> => {
    try {
      const res = await apiClient.post("/auth/reset-password", { token, password });
      if (res.data?.success) {
        return res.data.message || "Password reset successfully.";
      }
    } catch (error: any) {
      const detailsMsg = error.response?.data?.details?.map((d: any) => d.message).join(". ");
      const msg = detailsMsg || error.response?.data?.error || "Password reset failed.";
      throw new Error(msg);
    }
    return "Password reset successfully.";
  },

  updateProfile: async (updates: Partial<User>): Promise<User> => {
    const current = authService.getCurrentUser();
    if (!current) throw new Error("Authentication required.");
    const updated = { ...current, ...updates };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    return updated;
  },

  saveAddress: async (address: Omit<Address, "id"> & { id?: string }): Promise<Address> => {
    const current = authService.getCurrentUser();
    if (!current) throw new Error("Authentication required.");
    const newAddressId = address.id || `addr-${Date.now()}`;
    const newAddress: Address = {
      ...address,
      id: newAddressId,
    };

    let updatedAddresses = [...(current.addresses || [])];
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
    }

    const existingIndex = updatedAddresses.findIndex((a) => a.id === newAddress.id);
    if (existingIndex > -1) {
      updatedAddresses[existingIndex] = newAddress;
    } else {
      updatedAddresses.push(newAddress);
    }

    const updatedUser = { ...current, addresses: updatedAddresses };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    return newAddress;
  },

  deleteAddress: async (addressId: string): Promise<void> => {
    const current = authService.getCurrentUser();
    if (!current) throw new Error("Authentication required.");
    const updatedAddresses = (current.addresses || []).filter((a) => a.id !== addressId);
    const updatedUser = { ...current, addresses: updatedAddresses };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
  },
};
