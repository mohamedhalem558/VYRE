import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "../components/brand/Logo.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Lock, KeyRound, CheckCircle2, AlertCircle, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const urlToken = searchParams.get("token") || searchParams.get("otp") || searchParams.get("code");
    if (urlToken) {
      setCode(urlToken.trim());
    }
    const urlEmail = searchParams.get("email");
    if (urlEmail) {
      setEmail(urlEmail.trim());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanCode = code.trim();
    if (!cleanCode) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter (A-Z).");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter (a-z).");
      return;
    }

    if (!/[\d\W_]/.test(password)) {
      setError("Password must contain at least one number (0-9) or symbol (!@#$%^&*).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(cleanCode, password, email.trim() || undefined);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2500);
    } catch (err: any) {
      setError(
        err.message ||
        "Failed to update password. The verification code may have expired or is invalid."
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
            Enter the 6-digit code from your email to update your account password.
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-xs border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-sm">Password Updated Successfully!</p>
            <p className="text-neutral-600">
              Your new password is now active. Redirecting you to Sign In...
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="primary" size="sm" className="w-full">
                  Sign In Now
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Registered Email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4 text-neutral-400" />}
              helperText="The email address you requested the reset code for."
            />

            <Input
              label="6-Digit Verification Code (OTP)"
              type="text"
              placeholder="e.g. 583921"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              leftIcon={<KeyRound className="h-4 w-4 text-neutral-400" />}
              helperText="Check your inbox or spam folder for your 6-digit code."
              required
            />

            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4 text-neutral-400" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-neutral-400 hover:text-neutral-700 text-xs"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Input
              label="Confirm New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4 text-neutral-400" />}
              required
            />

            <div className="text-[11px] text-neutral-500 bg-neutral-50 p-2.5 rounded border border-neutral-200 space-y-1">
              <div className="font-semibold text-neutral-700">Password Requirements:</div>
              <ul className="list-disc list-inside text-neutral-600 space-y-0.5">
                <li>Minimum 8 characters</li>
                <li>At least one uppercase letter (A-Z)</li>
                <li>At least one lowercase letter (a-z)</li>
                <li>At least one number or symbol (!@#$%^&*)</li>
              </ul>
            </div>

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
                Did not receive the code? Request a new one
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
