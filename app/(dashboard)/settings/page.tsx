"use client";

import React, { useRef } from "react";
import { SlidersHorizontal, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export default function SettingsPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const revealItems = containerRef.current.querySelectorAll(".settings-reveal");

      gsap.fromTo(
        revealItems,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-8 w-full pb-14">
      {/* Header */}
      <div className="settings-reveal flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Settings & Hub Configuration
            </h1>
            <span className="px-3 py-1 rounded-full bg-[#00875A]/10 text-[#00875A] text-xs font-bold font-mono">
              System Health: Optimal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Storefront connections, webhook endpoints, and system preferences.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs Container */}
      <div className="settings-reveal w-full">
        <SettingsTabs />
      </div>
    </div>
  );
}
