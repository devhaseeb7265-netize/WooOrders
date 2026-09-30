"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Calendar, Plus, Home, RefreshCw } from "lucide-react";
import { FlipButton } from "@/components/motion/FlipButton";
import { UserMenuDropdown } from "@/components/profile/UserMenuDropdown";
import { StoreScopeDropdown } from "@/components/stores/StoreScopeDropdown";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { getCurrentUser, subscribeToUserUpdates } from "@/data/userStore";
import { useStore, DateRangeFilter } from "@/context/StoreContext";
import { GlobalSearchModal } from "@/components/dashboard/GlobalSearchModal";
import { NotificationsPopover } from "@/components/dashboard/NotificationsPopover";

interface TopNavigationBarProps {
  userName?: string;
  onConnectSite?: () => void;
}


const DATE_OPTIONS = [
  { value: "today", label: "Today", icon: Calendar },
  { value: "last_7_days", label: "Last 7 Days", icon: Calendar },
  { value: "last_30_days", label: "Last 30 Days", icon: Calendar },
  { value: "this_month", label: "This Month", icon: Calendar },
  { value: "all_time", label: "All Time", icon: Calendar },
];

export function TopNavigationBar({
  userName: initialUserName,
  onConnectSite,
}: TopNavigationBarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState(() => getCurrentUser());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const {
    dateRange,
    setDateRange,
    refreshActiveStore,
    isSyncing,
    hasConnectedStores,
  } = useStore();

  useEffect(() => {
    const unsub = subscribeToUserUpdates((u) => setUser(u));
    return () => unsub();
  }, []);

  // Global Ctrl+K / Cmd+K listener for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const effectiveUserName =
    user.displayName || user.fullName || user.username || initialUserName || "Haseeb";

  return (
    <>
      <header className="relative z-50 flex flex-col gap-6 w-full mb-6">
        {/* Top Application Header */}
        <div className="relative z-50 flex items-center justify-between w-full">
          {/* Brand Home Navigation Link */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer"
            title="Return to Home Dashboard"
          >
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-[#00875A] text-white shadow-sm shadow-emerald-900/10 group-hover:bg-[#00704A] transition-colors">
              <Home className="h-4 w-4 transition-transform group-hover:scale-110" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 group-hover:text-zinc-950 transition-colors">
              WooOrders<span className="text-[#00875A]">.</span>
            </span>
          </Link>

          {/* Quick Utility Triggers */}
          <div className="flex items-center gap-2.5 relative z-50">
            {/* Store Scope Dropdown matching theme */}
            <StoreScopeDropdown onOpenConnectModal={onConnectSite} />

            {/* Live Sync Action Button */}
            {hasConnectedStores && (
              <button
                type="button"
                onClick={() => refreshActiveStore()}
                disabled={isSyncing}
                title="Live Sync Orders with WooCommerce"
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-zinc-200/80 rounded-full shadow-xs text-xs font-semibold text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 transition-all cursor-pointer disabled:opacity-60"
              >
                <span className="relative flex h-2 w-2">
                  {isSyncing ? (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00875A]" />
                  )}
                </span>
                <span className="hidden sm:inline">Live Sync</span>
                <RefreshCw
                  className={`h-3 w-3 text-zinc-400 transition-transform ${
                    isSyncing ? "animate-spin text-[#00875A]" : ""
                  }`}
                />
              </button>
            )}


            {/* Functional Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search Orders & Stores (Ctrl+K)"
              title="Search Orders & Stores (Ctrl+K)"
              className="flex items-center justify-center h-10 w-10 rounded-full bg-white border border-black/[0.04] shadow-[0_2px_6px_rgba(0,0,0,0.02)] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Functional Real-Time Notifications Popover */}
            <NotificationsPopover align="right" />

            {/* User Profile Pill Menu */}
            <UserMenuDropdown align="right" />
          </div>
        </div>

        {/* Welcome & Contextual Action Bar */}
        <div className="relative z-40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-900 font-sans">
              Welcome Back, <span className="font-medium text-zinc-950">{effectiveUserName}</span>
            </h1>
          </div>

          <div className="flex items-center flex-wrap gap-3 relative z-40">
            {/* Functional Date Range Selector */}
            <ThemedSelect
              value={dateRange}
              onChange={(val) => setDateRange(val as DateRangeFilter)}
              options={DATE_OPTIONS}
              variant="pill"
              size="sm"
              align="right"
            />

            {/* Primary Action Button (Fixed single + symbol) */}
            <FlipButton
              variant="primary"
              size="md"
              icon={<Plus className="h-4 w-4 mr-0.5" />}
              label="Connect Site"
              onClick={onConnectSite}
              className="rounded-full !px-5 !py-2.5 text-xs font-medium shadow-[0_4px_16px_rgba(0,135,90,0.22)] cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* Global Command Palette / Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
