export type UserRole =
  | "CUSTOMER"
  | "ADMIN"
  | "INVENTORY_MANAGER"
  | "MARKETING_MANAGER"
  | "customer"
  | "admin";

export interface Address {
  id: string;
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  buildingNumber?: string;
  apartmentNumber?: string;
  city: string;
  governorate: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  active?: boolean;
  addresses: Address[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  token?: string; // Legacy convenience accessor
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  phone?: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
}
