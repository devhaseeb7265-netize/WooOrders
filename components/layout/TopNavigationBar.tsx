"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { UserMenuDropdown } from "@/components/profile/UserMenuDropdown";
import { StoreScopeDropdown } from "@/components/stores/StoreScopeDropdown";
import { useStore } from "@/context/StoreContext";

export function TopNavigationBar() {
  const pathname = usePathname();
  const { refreshActiveStore, isSyncing, hasConnectedStores } = useStore();

  const getPageTitle = () => {
    if (pathname === "/") return "Overview";
    if (pathname.startsWith("/orders")) return "Orders Hub";
    if (pathname.startsWith("/sites")) return "Sites & Stores";
    if (pathname.startsWith("/analytics")) return "Store Analytics";
    if (pathname.startsWith("/webhooks")) return "Webhook Monitor";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Dashboard";
  };

  return (
    <header className="relative z-50 w-full flex items-center justify-between pb-6 mb-2">
      {/* Left: Current Page Label */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          WooOrders
        </span>
        <span className="text-zinc-300">/</span>
        <span className="text-xs font-bold text-zinc-800">
          {getPageTitle()}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Themed Store Quick Switcher strictly scoped */}
        <StoreScopeDropdown />

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
            <span>Live Sync</span>
            <RefreshCw
              className={`h-3 w-3 text-zinc-400 transition-transform ${
                isSyncing ? "animate-spin text-[#00875A]" : ""
              }`}
            />
          </button>
        )}

        {/* User Profile Pill with Dropdown */}
        <UserMenuDropdown align="right" />
      </div>
    </header>
  );
}
