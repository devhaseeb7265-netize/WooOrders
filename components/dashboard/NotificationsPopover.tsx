"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  Store,
  Radio,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { Portal } from "@/components/ui/Portal";
import { useDropdownPosition } from "@/hooks/useDropdownPosition";

export interface AppNotification {
  id: string;
  type: "order" | "store" | "webhook" | "system";
  title: string;
  description: string;
  timeAgo: string;
  read: boolean;
  link?: string;
}

interface NotificationsPopoverProps {
  align?: "left" | "right";
}

export function NotificationsPopover({ align = "right" }: NotificationsPopoverProps) {
  const { orders, connectedStores } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pos = useDropdownPosition(triggerRef, align, isOpen);

  // Initialize notifications dynamically based on live orders and stores
  const initialNotifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];

    // Order notifications
    if (orders.length > 0) {
      const latestOrder = orders[0];
      const customerName =
        `${latestOrder.billing?.first_name || ""} ${latestOrder.billing?.last_name || ""}`.trim() ||
        "Customer";
      list.push({
        id: `notif-order-${latestOrder.id}`,
        type: "order",
        title: `Order #${latestOrder.number} Synced`,
        description: `${customerName} paid ${latestOrder.currency_symbol || "$"}${latestOrder.total} (${latestOrder.status})`,
        timeAgo: "Just now",
        read: false,
        link: "/orders",
      });

      if (orders.length > 1) {
        const secondOrder = orders[1];
        list.push({
          id: `notif-order-${secondOrder.id}`,
          type: "order",
          title: `Order #${secondOrder.number} Processed`,
          description: `Status: ${secondOrder.status} • Total: ${secondOrder.currency_symbol || "$"}${secondOrder.total}`,
          timeAgo: "2h ago",
          read: false,
          link: "/orders",
        });
      }
    }

    // Store notifications
    if (connectedStores.length > 0) {
      const store = connectedStores[0];
      list.push({
        id: `notif-store-${store.id}`,
        type: "store",
        title: `Store Synchronized`,
        description: `${store.name} connected via WooCommerce REST API v3`,
        timeAgo: "1h ago",
        read: false,
        link: "/sites",
      });
    }

    // Webhook notification
    list.push({
      id: "notif-webhook-listener",
      type: "webhook",
      title: "Webhook Gateway Online",
      description: "WooCommerce event listener is listening for orders",
      timeAgo: "Today",
      read: true,
      link: "/webhooks",
    });

    return list;
  }, [orders, connectedStores]);

  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  // Sync notifications when store/orders change
  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-4 w-4 text-[#00875A]" />;
      case "store":
        return <Store className="h-4 w-4 text-blue-600" />;
      case "webhook":
        return <Radio className="h-4 w-4 text-purple-600" />;
      default:
        return <Sparkles className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="relative select-none">
      {/* Trigger Button with Dynamic Unread Dot */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open Notifications"
        aria-expanded={isOpen}
        className={`relative flex items-center justify-center h-10 w-10 rounded-full bg-white border shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all cursor-pointer outline-none ${
          isOpen
            ? "border-[#00875A] ring-2 ring-[#00875A]/20 shadow-md text-zinc-900"
            : "border-black/[0.04] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
        }`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#00875A] ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* Portal-rendered Popover — escapes all stacking contexts */}
      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos.top,
              ...(pos.right !== undefined ? { right: pos.right } : { left: pos.left }),
              width: 384,
              zIndex: 99999,
            }}
            className="bg-white rounded-[24px] border border-black/[0.08] shadow-[0_20px_48px_rgba(0,0,0,0.14)] p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150"
          >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-zinc-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#00875A] text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#00875A] hover:text-[#00704A] transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto flex flex-col gap-1 p-1">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`group relative flex items-start gap-3 p-2.5 rounded-2xl transition-all ${
                    item.read
                      ? "bg-transparent hover:bg-zinc-50/80"
                      : "bg-emerald-50/40 hover:bg-emerald-50/70"
                  }`}
                >
                  <div className="h-8 w-8 rounded-xl bg-white border border-zinc-200/60 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>

                  <div className="flex-1 flex flex-col min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-zinc-900 truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                        {item.timeAgo}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 line-clamp-2 mt-0.5 leading-snug">
                      {item.description}
                    </p>

                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00875A] mt-1 hover:underline cursor-pointer"
                      >
                        <span>View details</span>
                        <ArrowRight className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>

                  {/* Dismiss Item Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDismiss(item.id, e)}
                    title="Dismiss"
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 transition-opacity absolute top-2 right-2 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-2">
                  <Bell className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-zinc-700">All caught up!</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  No new notifications at this time.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-zinc-50 rounded-b-[20px] border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="text-[10px]">Real-time Store Alerts</span>
            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-semibold text-[#00875A] hover:underline cursor-pointer"
            >
              Go to Orders Hub
            </Link>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
