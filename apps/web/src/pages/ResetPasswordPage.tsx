import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "../components/brand/Logo.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Lock, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token.trim()) {
      setError("Reset token is required. Please check your reset link or enter the token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }

    if (!(/[0-9]/.test(password) || /[!@#$%^&*]/.test(password))) {
      setError("Password must contain at least one number or special character.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err: any) {
      setError(
        err.message ||
        err.response?.data?.error ||
        "Failed to reset password. The reset link may have expired or is invalid."
      );
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
            Choose New Password
          </h1>
          <p className="text-xs text-neutral-500">
            Set a new secure password for your VYRE. account.
          </p>
        </div>

        {success ? (
          <div className="p-4 rounded-xs border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <p className="font-bold">Password Reset Successful</p>
            <p className="text-neutral-600">Your password has been updated. Redirecting to Sign In...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!searchParams.get("token") && (
              <Input
                label="Reset Token"
                type="text"
                placeholder="Paste your reset token here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                leftIcon={<KeyRound className="h-4 w-4 text-neutral-400" />}
                required
              />
            )}

            <Input
              label="New Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4 text-neutral-400" />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4 text-neutral-400" />}
              required
            />

            <p className="text-[11px] text-neutral-500">
              Must be at least 8 characters with uppercase, lowercase, and a number or symbol.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-xs font-bold uppercase tracking-wider"
              isLoading={loading}
            >
              Update Password
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/forgot-password"
                className="text-xs text-neutral-500 hover:text-black font-semibold"
              >
                Expired or invalid link? Request a new reset link
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
