import { User, Address, AuthResponse, ApiResponse } from "@vyre/shared";
import { apiClient } from "./apiClient.js";

const AUTH_USER_KEY = "vyre_auth_user";
const ACCESS_TOKEN_KEY = "vyre_access_token";
const REFRESH_TOKEN_KEY = "vyre_refresh_token";

function extractApiError(error: any, fallback: string): string {
  if (!error) return fallback;

  const data = error.response?.data;
  if (data) {
    if (Array.isArray(data.details) && data.details.length > 0) {
      const messages = data.details
        .map((d: any) => (typeof d === "string" ? d : d.message || d.field))
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join(". ");
      }
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
  }

  if (error.message === "Network Error") {
    return "Unable to connect to the server. Please check your internet connection or try again shortly.";
  }

  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return "Server connection timed out. Please try again.";
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}

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
        email: email.trim(),
        password,
      });

      if (res.data?.success && res.data?.data) {
        const { user, tokens } = res.data.data;
        if (tokens?.accessToken) {
          localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        }
        if (tokens?.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        }
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        return user;
      }
      throw new Error("Login failed. Unable to authenticate session.");
    } catch (error: any) {
      throw new Error(extractApiError(error, "Login failed. Please check your credentials."));
    }
  },

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phoneNumber?: string;
    phone?: string;
  }): Promise<User> => {
    try {
      const phoneVal = userData.phoneNumber || userData.phone || undefined;
      const res = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", {
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: userData.email.trim(),
        password: userData.password,
        phoneNumber: phoneVal,
        phone: phoneVal,
      });

      if (res.data?.success && res.data?.data) {
        const { user, tokens } = res.data.data;
        if (tokens?.accessToken) {
          localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        }
        if (tokens?.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        }
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        return user;
      }
      throw new Error("Registration failed. Unable to create account.");
    } catch (error: any) {
      throw new Error(extractApiError(error, "Registration failed. Please check your information."));
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

  forgotPassword: async (
    email: string
  ): Promise<{ message: string; devOtp?: string; devResetToken?: string }> => {
    try {
      const res = await apiClient.post("/auth/forgot-password", { email: email.trim() });
      if (res.data?.success) {
        return res.data.data || { message: res.data.message || "Verification code dispatched" };
      }
      return { message: "A 6-digit verification code has been dispatched to your email." };
    } catch (error: any) {
      throw new Error(
        extractApiError(error, "Failed to process forgot password request. Please try again.")
      );
    }
  },

  resetPassword: async (
    tokenOrOtp: string,
    password: string,
    email?: string
  ): Promise<string> => {
    try {
      const payload: Record<string, any> = {
        otp: tokenOrOtp.trim(),
        token: tokenOrOtp.trim(),
        password,
      };
      if (email && email.trim()) {
        payload.email = email.trim();
      }

      const res = await apiClient.post("/auth/reset-password", payload);
      if (res.data?.success) {
        return res.data.message || "Password reset successfully.";
      }
      return "Password reset successfully.";
    } catch (error: any) {
      throw new Error(
        extractApiError(error, "Failed to reset password. The code may be invalid or expired.")
      );
    }
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
