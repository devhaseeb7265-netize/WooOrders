"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Users, ShieldCheck } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TeamUserManagement } from "@/components/settings/TeamUserManagement";

export default function TeamSettingsPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const revealItems = containerRef.current.querySelectorAll(".team-reveal");

      gsap.fromTo(
        revealItems,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full pb-14">
      {/* Header */}
      <div className="team-reveal flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="flex items-center justify-center h-8 w-8 rounded-full bg-white border border-zinc-200 shadow-xs text-zinc-500 hover:text-zinc-900 transition-colors"
              title="Back to Settings Hub"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Team Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 pl-11">
            Manage your team members and their account roles.
          </p>
        </div>
      </div>

      {/* Main Team Management Component */}
      <div className="team-reveal w-full">
        <TeamUserManagement />
      </div>
    </div>
  );
}
