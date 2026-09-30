"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, Loader2, User, Eye, EyeOff, Sparkles } from "lucide-react";
import { FlipButton } from "@/components/motion/FlipButton";
import { authenticateUser } from "@/lib/auth";

interface LoginFormProps {
  onForgotPassword: () => void;
}

export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const router = useRouter();

  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 450));

    const result = await authenticateUser(loginInput, password);

    if (!result.success) {
      setErrorMessage(result.error || "Authentication failed.");
      setIsLoading(false);
      return;
    }

    router.push("/");
  };

  const handleFillDemoAdmin = () => {
    setLoginInput("Haseeb");
    setPassword("1234");
    setErrorMessage(null);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Sign In
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Welcome back! Please enter your details.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3 bg-rose-50 border border-rose-200/90 rounded-xl text-xs text-rose-800 font-semibold animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Demo Admin Quick Helper */}
      <div className="p-2.5 bg-zinc-50 border border-zinc-200/70 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-600">
          <Sparkles className="h-3.5 w-3.5 text-[#00875A]" />
          <span className="text-[11px] text-zinc-500">Demo Admin:</span>
          <span className="font-mono font-bold text-zinc-800 text-xs">Haseeb / 1234</span>
        </div>
        <button
          type="button"
          onClick={handleFillDemoAdmin}
          className="text-[11px] font-bold text-[#00875A] hover:text-[#00704A] hover:underline cursor-pointer"
        >
          Auto-fill
        </button>
      </div>

      {/* LOGIN Field - Strictly NO Placeholder */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-input"
          className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5"
        >
          <User className="h-3.5 w-3.5 text-zinc-400" />
          Username or Email
        </label>
        <input
          id="login-input"
          type="text"
          required
          value={loginInput}
          onChange={(e) => setLoginInput(e.target.value)}
          disabled={isLoading}
          className="w-full px-3.5 py-2.5 bg-zinc-50/70 hover:bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-4 focus:ring-[#00875A]/10 transition-all shadow-xs"
        />
      </div>

      {/* PASSWORD Field - Strictly NO Placeholder */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password-input"
          className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5"
        >
          <Lock className="h-3.5 w-3.5 text-zinc-400" />
          Password
        </label>
        <div className="relative">
          <input
            id="password-input"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full px-3.5 py-2.5 bg-zinc-50/70 hover:bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm font-medium text-zinc-900 outline-none focus:bg-white focus:border-[#00875A] focus:ring-4 focus:ring-[#00875A]/10 transition-all shadow-xs pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-xs pt-0.5">
        <label className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded-md border-zinc-300 text-[#00875A] focus:ring-[#00875A] cursor-pointer accent-[#00875A]"
          />
          <span className="font-medium">Remember me</span>
        </label>

        <button
          type="button"
          onClick={onForgotPassword}
          className="font-semibold text-[#00875A] hover:text-[#00704A] hover:underline transition-colors cursor-pointer"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <FlipButton
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading}
          rightIcon={
            isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin ml-1" />
            ) : (
              <ArrowRight className="h-4 w-4 ml-1" />
            )
          }
          label={isLoading ? "Signing in..." : "Sign In"}
          className="w-full !rounded-xl shadow-md !py-3 text-xs sm:text-sm font-semibold"
        />
      </div>
    </form>
  );
}
