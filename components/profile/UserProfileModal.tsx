"use client";

import React, { useState, useRef } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Shield,
  Copy,
  Check,
  Camera,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { FlipButton } from "@/components/motion/FlipButton";
import { AppUser, updateUserProfile } from "@/data/userStore";

interface UserProfileModalProps {
  user: AppUser;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (updated: AppUser) => void;
}

export function UserProfileModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}: UserProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<"general" | "security">("general");

  // General profile state - Strictly NO placeholders
  const [displayName, setDisplayName] = useState(user.displayName || user.fullName || user.username);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user.avatarUrl);
  const [copiedUsername, setCopiedUsername] = useState(false);

  // Security / Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Status feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(user.username);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Image file must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate password inputs if attempting to change
    if (newPassword) {
      if (!currentPassword) {
        setErrorMessage("Please enter your current password to set a new one.");
        return;
      }
      if (newPassword.length < 4) {
        setErrorMessage("New password must be at least 4 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("New password and confirmation do not match.");
        return;
      }
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const result = updateUserProfile(user.id, {
      displayName: displayName.trim(),
      email: email.trim(),
      avatarUrl,
      currentPassword: currentPassword.trim() || undefined,
      newPassword: newPassword.trim() || undefined,
    });

    setIsSaving(false);

    if (!result.success || !result.user) {
      setErrorMessage(result.error || "Failed to update profile.");
      return;
    }

    setSuccessMessage("Profile updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    if (onUserUpdated) {
      onUserUpdated(result.user);
    }

    setTimeout(() => {
      setSuccessMessage(null);
    }, 2500);
  };

  const initials = (displayName || user.username).substring(0, 2).toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-[28px] p-6 sm:p-8 max-w-lg w-full border border-black/[0.04] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
              Profile Settings
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage your personal display details and login credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile settings"
            className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100/80 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => {
              setActiveTab("general");
              setErrorMessage(null);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "general"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            General Details
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("security");
              setErrorMessage(null);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "security"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Password & Security
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#00875A] font-semibold animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00875A]" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {activeTab === "general" ? (
            /* TAB 1: GENERAL DETAILS */
            <div className="flex flex-col gap-4">
              {/* Avatar Uploader Section */}
              <div className="flex items-center gap-4 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/70">
                <div className="relative group shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-16 w-16 rounded-2xl object-cover border border-zinc-200 shadow-xs"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-[#00875A] text-white font-bold text-lg flex items-center justify-center font-mono shadow-xs">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer shadow-xs"
                    >
                      <Camera className="h-3.5 w-3.5 text-[#00875A]" />
                      <span>Upload Picture</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    PNG, JPG, or GIF up to 2MB.
                  </span>
                </div>
              </div>

              {/* Display Name - Strictly NO Placeholder */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="profile-display-name"
                  className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5"
                >
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  Display Name
                </label>
                <input
                  id="profile-display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-4 focus:ring-[#00875A]/10 transition-all"
                />
              </div>

              {/* Username (Readonly) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Username
                </label>
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-100/70 border border-zinc-200/80 rounded-xl text-xs font-mono text-zinc-700">
                  <span>@{user.username}</span>
                  <button
                    type="button"
                    onClick={handleCopyUsername}
                    className="flex items-center gap-1 text-[11px] font-sans font-semibold text-zinc-500 hover:text-zinc-900 cursor-pointer"
                  >
                    {copiedUsername ? (
                      <>
                        <Check className="h-3 w-3 text-[#00875A]" />
                        <span className="text-[#00875A]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Email Address - Strictly NO Placeholder */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="profile-email"
                  className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-zinc-400" />
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-4 focus:ring-[#00875A]/10 transition-all"
                />
              </div>

              {/* Assigned Role (Readonly) */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 text-xs">
                <div className="flex items-center gap-2 text-zinc-600">
                  <Shield className="h-4 w-4 text-[#00875A]" />
                  <span className="font-medium">Assigned Role:</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00875A] border border-emerald-200 font-semibold text-xs">
                  {user.role}
                </span>
              </div>
            </div>
          ) : (
            /* TAB 2: PASSWORD & SECURITY */
            <div className="flex flex-col gap-4">
              {/* Current Password - Strictly NO Placeholder */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="current-password"
                  className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-4 focus:ring-[#00875A]/10 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password - Strictly NO Placeholder */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="new-password"
                  className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-4 focus:ring-[#00875A]/10 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password - Strictly NO Placeholder */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="confirm-password"
                  className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-4 focus:ring-[#00875A]/10 transition-all"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <FlipButton
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
              label={isSaving ? "Saving..." : "Save Changes"}
              className="rounded-xl shadow-md px-5 text-xs font-semibold"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
