"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function LoginPage() {
  const [view, setView] = useState<"login" | "forgot_password">("login");

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 sm:p-6 md:p-10 select-none">
      {/* Central Split-Screen Card */}
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.04] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Branding Panel (Clean Emerald, Simple Meaningful Text Only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#064E3B] via-[#00875A] to-[#042F2E] rounded-[26px] m-3 p-10 flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Name */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              WooOrders
            </span>
          </div>

          {/* Center Text (Simple, Human, No Buzzwords) */}
          <div className="relative z-10 my-auto py-8">
            <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
              All your stores in one place.
            </h1>
            <p className="text-sm text-emerald-100/90 mt-3 leading-relaxed">
              Manage orders, track sales, and update statuses across all your WooCommerce sites from a single dashboard.
            </p>
          </div>

          {/* Bottom Simple Brand */}
          <div className="relative z-10 text-xs text-emerald-200/70">
            WooOrders
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
          {/* Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
            <div className="lg:hidden flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#00875A] text-white flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-zinc-900">WooOrders</span>
            </div>
            <div className="hidden lg:block" />

            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors ml-auto"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Overview</span>
            </Link>
          </div>

          {/* Form */}
          <div className="my-auto py-2 w-full max-w-sm mx-auto">
            {view === "login" ? (
              <LoginForm onForgotPassword={() => setView("forgot_password")} />
            ) : (
              <ForgotPasswordForm onReturnToLogin={() => setView("login")} />
            )}
          </div>

          {/* Simple Clean Footer */}
          <div className="pt-4 border-t border-zinc-100 text-center text-xs text-zinc-400">
            © 2026 WooOrders
          </div>
        </div>
      </div>
    </div>
  );
}
