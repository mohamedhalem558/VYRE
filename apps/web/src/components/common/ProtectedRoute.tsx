import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";
import { UserRole } from "@vyre/shared";
import { ShieldAlert } from "lucide-react";
import { Button } from "../ui/button.js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Verifying VYRE Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-sm border border-neutral-800 bg-neutral-950 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold uppercase tracking-wide text-white">Access Restricted</h2>
        <p className="text-xs text-neutral-400">
          Your account role (<strong className="text-white">{user?.role}</strong>) does not have
          sufficient permissions to access this administrative portal.
        </p>
        <Navigate to="/account" replace />
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          Return to My Account
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
