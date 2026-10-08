import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/brand/Logo.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

export const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setDevToken(res.devResetToken || null);
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to process password reset. Please verify your email and try again."
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
            Reset Password
          </h1>
          <p className="text-xs text-neutral-500">
            Enter the email address associated with your VYRE. account.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-xs border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm">6-Digit Verification Code Sent</p>
              <p className="text-neutral-600">
                We have dispatched a 6-digit verification code to <strong>{email}</strong>. It is valid for 15 minutes.
              </p>
            </div>

            {devToken && (
              <div className="p-4 rounded-xs border border-neutral-200 bg-neutral-50 text-xs space-y-2 text-left">
                <div className="flex items-center gap-2 text-neutral-900 font-bold">
                  <KeyRound className="h-4 w-4" />
                  <span>Development Verification Code (OTP)</span>
                </div>
                <p className="text-neutral-900 font-mono text-base font-bold tracking-widest bg-white p-2.5 rounded border border-neutral-200 text-center">
                  {devToken}
                </p>
                <Link to={`/reset-password?token=${devToken}&email=${encodeURIComponent(email)}`}>
                  <Button variant="primary" size="sm" className="w-full mt-2">
                    Proceed with Code ({devToken})
                  </Button>
                </Link>
              </div>
            )}

            <Link to={`/reset-password?email=${encodeURIComponent(email)}`}>
              <Button variant="primary" size="lg" className="w-full text-xs font-bold uppercase tracking-wider mb-2">
                Enter 6-Digit Code & Choose Password
              </Button>
            </Link>

            <Link to="/login">
              <Button variant="outline" size="sm" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4 text-neutral-400" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-xs font-bold uppercase tracking-wider"
              isLoading={loading}
            >
              Send Reset Instructions
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
