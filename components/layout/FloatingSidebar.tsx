"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  ShoppingBag,
  BarChart3,
  Radio,
  SlidersHorizontal,
  Home,
  Plus,
  LogOut,
  ChevronRight,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { UserMenuDropdown } from "@/components/profile/UserMenuDropdown";
import { ConnectSiteModal } from "@/components/sites/ConnectSiteModal";
import { getCurrentUser, logoutUser, subscribeToUserUpdates, AppUser } from "@/data/userStore";
import { useStore } from "@/context/StoreContext";

interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const NAVIGATION_ITEMS: readonly NavItem[] = [
  {
    id: "sites",
    label: "Sites Overview",
    href: "/sites",
    icon: Store,
  },
  {
    id: "orders",
    label: "Orders Hub",
    href: "/orders",
    icon: ShoppingBag,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    id: "webhooks",
    label: "Webhook Monitor",
    href: "/webhooks",
    icon: Radio,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: SlidersHorizontal,
  },
];

export function FloatingSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { connectedStores, activeStoreId, switchActiveStore } = useStore();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isStoreListOpen, setIsStoreListOpen] = useState(false);
  const [user, setUser] = useState<AppUser>(() => getCurrentUser());

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wooorders_sidebar_expanded");
      if (saved !== null) {
        setIsExpanded(saved === "true");
      }
    } catch {}

    const unsub = subscribeToUserUpdates((u) => setUser(u));
    return () => unsub();
  }, []);

  const toggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    try {
      localStorage.setItem("wooorders_sidebar_expanded", String(next));
    } catch {}
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("wooorders_sidebar_toggle", { detail: { isExpanded: next } })
      );
    }, 0);
  };

  const handleLogout = () => {
    logoutUser(() => {
      router.push("/login");
    });
  };

  const displayName = user.displayName || user.fullName || user.username;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <>
      <aside
        aria-label="Sidebar Navigation"
        className={`fixed left-5 top-5 bottom-5 bg-white border border-black/[0.04] rounded-[32px] flex flex-col justify-between py-6 shadow-[0_14px_36px_rgba(0,0,0,0.03)] z-40 select-none transition-all duration-300 ease-out ${
          isExpanded ? "w-[240px] px-4" : "w-[72px] px-2 items-center"
        }`}
      >
        {/* Top: Home Icon & Drawer Collapse/Expand Toggle */}
        <div className="flex flex-col gap-3.5 w-full">
          <div
            className={`flex items-center w-full ${
              isExpanded ? "justify-between pl-1 pr-1" : "flex-col items-center justify-center gap-2"
            }`}
          >
            {/* Home Icon Navigation */}
            <Link
              href="/"
              className="group relative flex items-center justify-center h-11 w-11 rounded-2xl bg-[#00875A] text-white hover:bg-[#00704A] transition-all duration-200 shadow-md shadow-emerald-900/10 active:scale-95 shrink-0"
              title="Return to Home Dashboard"
            >
              <Home className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            </Link>

            {/* Brand Title (when expanded) */}
            {isExpanded && (
              <Link href="/" className="flex flex-col truncate pl-2 mr-auto group">
                <span className="text-sm font-bold tracking-tight text-zinc-900 group-hover:text-[#00875A] transition-colors">
                  WooOrders
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Multi-Site Hub
                </span>
              </Link>
            )}

            {/* Drawer Collapse Button (when expanded) */}
            {isExpanded && (
              <button
                type="button"
                onClick={toggleExpand}
                aria-label="Collapse Sidebar"
                title="Collapse Sidebar"
                className="flex items-center justify-center h-8 w-8 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}

            {/* Drawer Expand Toggle (when collapsed - centered cleanly) */}
            {!isExpanded && (
              <div className="relative group flex items-center justify-center w-full">
                <button
                  type="button"
                  onClick={toggleExpand}
                  aria-label="Expand Sidebar"
                  title="Expand Sidebar"
                  className="flex items-center justify-center h-9 w-9 rounded-xl bg-zinc-100/90 hover:bg-emerald-50 text-zinc-600 hover:text-[#00875A] transition-all cursor-pointer shadow-2xs mx-auto"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
                <div
                  role="tooltip"
                  className="absolute left-full ml-3 px-2.5 py-1 text-xs font-semibold text-white bg-zinc-900 rounded-xl shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
                >
                  Expand Sidebar
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-100 w-full" />

          {/* Add Site Quick Action */}
          {isExpanded ? (
            <button
              type="button"
              onClick={() => setIsConnectOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-2xl bg-[#00875A]/10 text-[#00875A] hover:bg-[#00875A] hover:text-white transition-all text-xs font-bold cursor-pointer shadow-xs group"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              <span>+ Add Store</span>
            </button>
          ) : (
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsConnectOpen(true)}
                aria-label="Add Store"
                className="flex items-center justify-center h-10 w-10 rounded-2xl bg-[#00875A]/10 text-[#00875A] hover:bg-[#00875A] hover:text-white transition-all cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" />
              </button>
              <div
                role="tooltip"
                className="absolute left-full ml-3 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded-xl shadow-xl pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50"
              >
                Add Store
              </div>
            </div>
          )}
        </div>

        {/* Navigation Rail / List */}
        <nav className="flex flex-col gap-1.5 w-full my-auto py-2">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === "/sites" && pathname === "/");
            const isSitesItem = item.id === "sites";

            if (isExpanded) {
              return (
                <div key={item.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-150 text-xs font-semibold outline-none flex-1 ${
                        isActive
                          ? "bg-[#00875A]/10 text-[#00875A] font-bold"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>

                    {isSitesItem && connectedStores.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsStoreListOpen((p) => !p)}
                        aria-label="Toggle store list"
                        className="flex items-center justify-center h-7 w-7 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
                      >
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                            isStoreListOpen ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Inline store list flyout (expanded sidebar only) */}
                  {isSitesItem && isStoreListOpen && connectedStores.length > 0 && (
                    <div className="ml-4 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {connectedStores.map((store) => (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => switchActiveStore(store.id)}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-medium cursor-pointer transition-colors ${
                            activeStoreId === store.id
                              ? "bg-emerald-50/80 text-[#00875A] font-semibold"
                              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/70"
                          }`}
                        >
                          <span className="truncate max-w-[140px]">{store.name}</span>
                          {activeStoreId === store.id && <Check className="h-3 w-3 text-[#00875A] shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={item.id} className="relative group flex items-center justify-center">
                <Link
                  href={item.href}
                  className={`relative flex items-center justify-center h-11 w-11 rounded-2xl transition-all duration-200 outline-none ${
                    isActive
                      ? "bg-[#00875A]/10 text-[#00875A] font-semibold"
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100/70"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>

                {/* Tooltip */}
                <div
                  role="tooltip"
                  className="absolute left-full ml-3 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-xl shadow-xl pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50"
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Section: Profile, Store Status, & Logout */}
        <div className="flex flex-col gap-3 w-full pt-2 border-t border-zinc-100">
          {/* User Profile Area */}
          {isExpanded ? (
            <div className="flex items-center justify-between p-1.5 rounded-2xl bg-zinc-50 border border-zinc-200/60">
              <div className="flex items-center gap-2.5 truncate">
                <div className="h-8 w-8 rounded-xl bg-[#00875A] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0 overflow-hidden">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold text-zinc-900 truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-zinc-400 truncate">
                    {user.role}
                  </span>
                </div>
              </div>

              <UserMenuDropdown compact align="left" dropUp />
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <UserMenuDropdown compact align="left" dropUp />
            </div>
          )}

          {/* Explicit Logout Button at Bottom */}
          {isExpanded ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
            >
              <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
              <span>Sign Out</span>
            </button>
          ) : (
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign Out"
                className="flex items-center justify-center h-10 w-10 rounded-2xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <div
                role="tooltip"
                className="absolute left-full ml-3 px-3 py-1.5 text-xs font-semibold text-white bg-rose-950 rounded-xl shadow-xl pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50"
              >
                Sign Out
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Connect Store Modal */}
      <ConnectSiteModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        onStoreAdded={() => {
          setIsConnectOpen(false);
          router.push("/sites");
        }}
      />
    </>
  );
}
