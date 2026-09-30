"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { AmbientWebGlCanvas } from "@/components/canvas/AmbientWebGlCanvas";
import { FloatingSidebar } from "@/components/layout/FloatingSidebar";
import { TopNavigationBar } from "@/components/layout/TopNavigationBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wooorders_sidebar_expanded");
      if (saved !== null) {
        setIsSidebarExpanded(saved === "true");
      }
    } catch {}

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isExpanded: boolean }>;
      if (customEvent.detail) {
        requestAnimationFrame(() => {
          setIsSidebarExpanded(customEvent.detail.isExpanded);
        });
      }
    };

    window.addEventListener("wooorders_sidebar_toggle", handleToggle);
    return () => {
      window.removeEventListener("wooorders_sidebar_toggle", handleToggle);
    };
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });

    let animationFrameId: number;

    const raf = (time: number) => {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    };

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#F4F5F7] text-zinc-900 antialiased overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Ambient Passive WebGL Canvas */}
      <AmbientWebGlCanvas />

      {/* Floating Vertical Navigation Rail / Drawer */}
      <FloatingSidebar />

      {/* Primary Dashboard Content Canvas with smooth transition for sidebar drawer */}
      <main
        className={`pr-6 py-6 min-h-screen flex flex-col relative z-10 max-w-[1680px] mx-auto w-full transition-[padding] duration-300 ease-out ${
          isSidebarExpanded ? "pl-[272px]" : "pl-[104px]"
        }`}
      >
        {pathname !== "/" && <TopNavigationBar />}
        {children}
      </main>
    </div>
  );
}
