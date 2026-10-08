import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { Logo } from "../components/brand/Logo.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Lock, Mail, Phone, ArrowRight } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("Please agree to the Terms of Service & Privacy Policy.");
      return;
    }

    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }

    if (!lastName.trim()) {
      setError("Please enter your last name.");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please provide a valid email address.");
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

    setLoading(true);

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim() || undefined,
      });
      navigate("/account");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please check your information.");
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
            Create VYRE. Account
          </h1>
          <p className="text-xs text-neutral-500">
            Join the community to track orders and save your wishlist.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4 text-neutral-400" />}
            required
          />

          <Input
            label="Mobile Number (Egypt)"
            type="tel"
            placeholder="010XXXXXXXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            leftIcon={<Phone className="h-4 w-4 text-neutral-400" />}
            helperText="Used for doorstep delivery coordination."
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4 text-neutral-400" />}
            helperText="Must be at least 8 characters with uppercase, lowercase, and a number or symbol."
            required
          />

          <label className="flex items-start gap-2 text-xs text-neutral-600 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 rounded border-neutral-300 text-black accent-black"
            />
            <span>
              I agree to VYRE.'s{" "}
              <Link to="/terms" className="text-black font-semibold hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-black font-semibold hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full text-xs font-bold uppercase tracking-wider"
            isLoading={loading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Create Account
          </Button>
        </form>

        <div className="pt-4 border-t border-neutral-200 text-center text-xs text-neutral-600">
          <span>Already have an account? </span>
          <Link to="/login" className="font-bold text-black hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
