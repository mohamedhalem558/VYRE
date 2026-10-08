import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { Logo } from "../components/brand/Logo.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Lock, Mail, ArrowRight } from "lucide-react";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.trim()) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      setLoading(false);
      return;
    }

    try {
      const loggedUser = await login(email.trim(), password);
      const redirectState = (location.state as { from?: { pathname: string } })?.from?.pathname;
      let targetPath = redirectState;

      if (!targetPath || targetPath === "/login") {
        if (loggedUser.role === "ADMIN") {
          targetPath = "/admin";
        } else if (loggedUser.role === "INVENTORY_MANAGER") {
          targetPath = "/admin/inventory";
        } else if (loggedUser.role === "MARKETING_MANAGER") {
          targetPath = "/admin";
        } else {
          targetPath = "/account";
        }
      }

      navigate(targetPath, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 text-neutral-900">
      <div className="w-full max-w-md space-y-8 rounded-xs border border-neutral-200 bg-white p-8 sm:p-10 shadow-sm">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <Logo size="md" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-neutral-900 font-heading">
            Sign In to VYRE.
          </h1>
          <p className="text-xs text-neutral-500">
            Access your orders, saved addresses, and profile.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4 text-neutral-400" />}
            required
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4 text-neutral-400" />}
              required
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-neutral-600 hover:text-black hover:underline font-medium">
                Forgot Password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full text-xs font-bold uppercase tracking-wider"
            isLoading={loading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </Button>
        </form>

        <div className="pt-4 border-t border-neutral-200 text-center text-xs text-neutral-600">
          <span>Don't have a VYRE. account? </span>
          <Link to="/register" className="font-bold text-black hover:underline">
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
};
