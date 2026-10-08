import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Address, UserRole } from "@vyre/shared";
import { authService } from "../services/auth.service.js";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isInventoryManager: boolean;
  isMarketingManager: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phoneNumber?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; devResetToken?: string }>;
  resetPassword: (token: string, pass: string) => Promise<string>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  saveAddress: (address: Omit<Address, "id"> & { id?: string }) => Promise<Address>;
  deleteAddress: (addressId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = authService.getAccessToken();
        const storedUser = authService.getCurrentUser();

        if (storedUser && storedToken) {
          setUser(storedUser);
        } else if (!storedToken) {
          setUser(null);
          localStorage.removeItem("vyre_auth_user");
          setIsLoading(false);
          return;
        }

        // Check with backend /auth/me for live session state & refresh if needed
        const liveUser = await authService.fetchMe();
        if (liveUser) {
          setUser(liveUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn("[AuthProvider] Session verification failed:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // Listen for global auth expiration events
    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener("vyre:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("vyre:auth-expired", handleAuthExpired);
    };
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const loggedIn = await authService.login(email, pass);
    setUser(loggedIn);
    return loggedIn;
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phoneNumber?: string;
    phone?: string;
  }) => {
    const registered = await authService.register(data);
    setUser(registered);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    return authService.forgotPassword(email);
  };

  const resetPassword = async (token: string, pass: string) => {
    return authService.resetPassword(token, pass);
  };

  const updateProfile = async (data: Partial<User>) => {
    const updated = await authService.updateProfile(data);
    setUser(updated);
  };

  const saveAddress = async (address: Omit<Address, "id"> & { id?: string }): Promise<Address> => {
    const saved = await authService.saveAddress(address);
    const updatedUser = authService.getCurrentUser();
    setUser(updatedUser);
    return saved;
  };

  const deleteAddress = async (addressId: string) => {
    await authService.deleteAddress(addressId);
    const updatedUser = authService.getCurrentUser();
    setUser(updatedUser);
  };

  const refreshProfile = async () => {
    const liveUser = await authService.fetchMe();
    if (liveUser) {
      setUser(liveUser);
    }
  };

  const role = user?.role?.toUpperCase();
  const isAdmin = role === "ADMIN";
  const isInventoryManager = role === "INVENTORY_MANAGER" || isAdmin;
  const isMarketingManager = role === "MARKETING_MANAGER" || isAdmin;

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user || !user.role) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    const normalizedUserRole = user.role.toUpperCase();
    return roleList.some((r) => r.toUpperCase() === normalizedUserRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        isInventoryManager,
        isMarketingManager,
        hasRole,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        saveAddress,
        deleteAddress,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
