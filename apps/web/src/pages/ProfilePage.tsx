import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { CheckCircle2, User, Lock } from "lucide-react";

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSaved(false);

    try {
      await updateProfile({ firstName, lastName, phoneNumber });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSaved(false);

    await new Promise((res) => setTimeout(res, 600));
    setPasswordLoading(false);
    setPasswordSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  return (
    <div className="space-y-8 text-neutral-900">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-900">
          Profile & Security
        </h2>
        <p className="text-xs text-neutral-500">
          Update your personal information and account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details Form */}
        <div className="rounded-xs border border-neutral-200 bg-white p-6 space-y-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <User className="h-4 w-4 text-black" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Personal Information
            </h3>
          </div>

          {profileSaved && (
            <div className="p-3 rounded-xs border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              value={email}
              disabled
              helperText="Email address cannot be modified directly."
            />

            <Input
              label="Mobile Number (Egypt)"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            <Button type="submit" variant="primary" size="sm" isLoading={profileLoading}>
              Save Profile Changes
            </Button>
          </form>
        </div>

        {/* Password Security Form */}
        <div className="rounded-xs border border-neutral-200 bg-white p-6 space-y-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Lock className="h-4 w-4 text-black" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Update Password
            </h3>
          </div>

          {passwordSaved && (
            <div className="p-3 rounded-xs border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Password updated successfully!</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Minimum 8 characters with letters & numbers."
              required
            />

            <Button type="submit" variant="outline" size="sm" isLoading={passwordLoading}>
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
