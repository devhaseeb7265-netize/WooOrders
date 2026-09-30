"use client";

import React, { useState } from "react";
import { ArrowLeft, Mail, User, Loader2, AlertCircle } from "lucide-react";
import { FlipButton } from "@/components/motion/FlipButton";
import { findUserByUsername, maskEmail } from "@/data/userStore";

interface ForgotPasswordFormProps {
  onReturnToLogin: () => void;
}

export function ForgotPasswordForm({ onReturnToLogin }: ForgotPasswordFormProps) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = username.trim();
    if (!clean) {
      setErrorMessage("Please enter your username.");
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 450));

    const user = findUserByUsername(clean);

    if (!user) {
      setIsLoading(false);
      setErrorMessage("Username not recognized in system");
      return;
    }

    const masked = maskEmail(user.email);
    setMaskedEmail(masked);
    setIsLoading(false);
  };

  return (
    <div className="w-full flex flex-col justify-center animate-in fade-in duration-300">
      {maskedEmail ? (
        /* Confirmation State */
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-[#00875A] border border-emerald-200/90 flex items-center justify-center">
            <Mail className="h-7 w-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              Reset Link Sent
            </h2>
            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
              A password reset link has been dispatched to the email associated with this username (
              <strong className="text-zinc-900 font-mono font-semibold">{maskedEmail}</strong>).
            </p>
          </div>

          <div className="w-full pt-3">
            <FlipButton
              variant="primary"
              size="md"
              label="Return to Sign in"
              onClick={onReturnToLogin}
              className="w-full !rounded-xl shadow-md !py-3 text-xs font-semibold"
            />
          </div>
        </div>
      ) : (
        /* Username Input Form */
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Reset Password
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Enter your username and we will send a reset link to your email.
            </p>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200/90 rounded-xl text-xs text-rose-800 font-semibold animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Clean Username Input - Strictly NO Placeholder */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="recovery-username"
              className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Username
            </label>
            <input
              id="recovery-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 bg-zinc-50/70 hover:bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-4 focus:ring-[#00875A]/10 transition-all shadow-xs"
            />
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <FlipButton
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : undefined}
              label={isLoading ? "Checking Username..." : "Send Reset Link"}
              className="w-full !rounded-xl shadow-md !py-3 text-xs font-semibold"
            />

            <button
              type="button"
              onClick={onReturnToLogin}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors py-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Sign in</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
