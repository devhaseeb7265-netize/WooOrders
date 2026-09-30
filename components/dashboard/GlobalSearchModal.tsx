"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ShoppingBag,
  Store,
  Layers,
  ArrowRight,
  TrendingUp,
  Radio,
  SlidersHorizontal,
  Users,
  CornerDownLeft,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { WCOrder } from "@/types/woocommerce";
import { ConnectedStore } from "@/lib/stores/storage";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (order: WCOrder) => void;
}

const NAVIGATION_PAGES = [
  { label: "Dashboard Overview", href: "/", icon: Layers, category: "Navigation" },
  { label: "Orders Hub", href: "/orders", icon: ShoppingBag, category: "Navigation" },
  { label: "Stores & Sites", href: "/sites", icon: Store, category: "Navigation" },
  { label: "Store Analytics", href: "/analytics", icon: TrendingUp, category: "Navigation" },
  { label: "Webhook Monitor", href: "/webhooks", icon: Radio, category: "Navigation" },
  { label: "Hub Settings", href: "/settings", icon: SlidersHorizontal, category: "Navigation" },
  { label: "Team Members", href: "/settings/team", icon: Users, category: "Navigation" },
];

export function GlobalSearchModal({ isOpen, onClose, onSelectOrder }: GlobalSearchModalProps) {
  const router = useRouter();
  const { orders, connectedStores, switchActiveStore, formatCurrency } = useStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const cleanQuery = query.trim().toLowerCase();

  // Filter Orders
  const matchingOrders = useMemo(() => {
    if (!cleanQuery) return [];
    return orders
      .filter((order) => {
        const idStr = String(order.id);
        const numberStr = order.number.toLowerCase();
        const customerName = `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.toLowerCase();
        const email = (order.billing?.email || "").toLowerCase();
        const status = order.status.toLowerCase();
        const total = order.total.toLowerCase();
        const items = order.line_items.map((i) => i.name.toLowerCase()).join(" ");

        return (
          idStr.includes(cleanQuery) ||
          numberStr.includes(cleanQuery) ||
          customerName.includes(cleanQuery) ||
          email.includes(cleanQuery) ||
          status.includes(cleanQuery) ||
          total.includes(cleanQuery) ||
          items.includes(cleanQuery)
        );
      })
      .slice(0, 5);
  }, [orders, cleanQuery]);

  // Filter Stores
  const matchingStores = useMemo(() => {
    if (!cleanQuery) return [];
    return connectedStores
      .filter((store) => {
        const name = store.name.toLowerCase();
        const url = store.url.toLowerCase();
        return name.includes(cleanQuery) || url.includes(cleanQuery);
      })
      .slice(0, 4);
  }, [connectedStores, cleanQuery]);

  // Filter Nav items
  const matchingNav = useMemo(() => {
    if (!cleanQuery) return NAVIGATION_PAGES.slice(0, 5);
    return NAVIGATION_PAGES.filter((item) =>
      item.label.toLowerCase().includes(cleanQuery)
    );
  }, [cleanQuery]);

  const hasResults =
    matchingOrders.length > 0 || matchingStores.length > 0 || matchingNav.length > 0;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-[28px] border border-black/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <Search className="h-5 w-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, customers, stores, or pages..."
            className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base font-medium text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-100 border border-zinc-200 rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Search Results / Content Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 flex flex-col gap-4">
          {/* Real Live Orders Match */}
          {matchingOrders.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="px-3 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Orders ({matchingOrders.length})
              </span>
              {matchingOrders.map((order) => {
                const customerName =
                  `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim() ||
                  "Guest Customer";
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onSelectOrder) {
                        onSelectOrder(order);
                      } else {
                        router.push(`/orders?search=${encodeURIComponent(order.number)}`);
                      }
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/60 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#00875A] flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-zinc-900">
                            #{order.number}
                          </span>
                          <span className="text-xs text-zinc-600 truncate">
                            {customerName}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate">
                          {order.line_items.map((i) => i.name).join(", ") || "Order items"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-bold text-xs text-zinc-900 font-mono">
                        {formatCurrency(order.total, order.currency_symbol)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          order.status === "completed"
                            ? "bg-emerald-50 text-[#00875A]"
                            : order.status === "processing"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {order.status}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Connected Stores Match */}
          {matchingStores.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="px-3 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Stores ({matchingStores.length})
              </span>
              {matchingStores.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => {
                    switchActiveStore(store.id);
                    onClose();
                    router.push("/sites");
                  }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/60 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Store className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-xs text-zinc-900">
                        {store.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono truncate">
                        {store.url}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Navigation Shortcuts */}
          {matchingNav.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="px-3 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                {cleanQuery ? "Pages" : "Quick Actions"}
              </span>
              {matchingNav.map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.href}
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(nav.href);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/60 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-zinc-100 text-zinc-600 group-hover:bg-[#00875A]/10 group-hover:text-[#00875A] flex items-center justify-center transition-colors shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-xs text-zinc-800 group-hover:text-zinc-950">
                        {nav.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-700">
                      <span className="text-[10px] hidden sm:inline">Go to page</span>
                      <CornerDownLeft className="h-3 w-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!hasResults && cleanQuery && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-2">
                <Search className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-zinc-700">
                No matching results found
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                No orders, stores, or pages match &quot;{query}&quot;.
              </p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-5 py-2.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 select-none">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-[10px] font-mono text-zinc-600 mr-1">
                Enter
              </kbd>
              to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-[10px] font-mono text-zinc-600 mr-1">
                Esc
              </kbd>
              to close
            </span>
          </div>
          <span className="text-[10px] font-medium text-[#00875A]">
            WooOrders Search
          </span>
        </div>
      </div>
    </div>
  );
}
