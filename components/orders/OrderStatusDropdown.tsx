"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { WCOrderStatus } from "@/types/woocommerce";
import { Portal } from "@/components/ui/Portal";
import { useDropdownPosition } from "@/hooks/useDropdownPosition";

interface OrderStatusDropdownProps {
  status: WCOrderStatus;
  onChange: (status: WCOrderStatus) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

interface StatusConfig {
  value: WCOrderStatus;
  label: string;
  dotColor: string;
  pillStyles: string;
}

const STATUS_CONFIGS: readonly StatusConfig[] = [
  {
    value: "processing",
    label: "Processing",
    dotColor: "bg-amber-500",
    pillStyles: "bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/70",
  },
  {
    value: "completed",
    label: "Completed",
    dotColor: "bg-[#00875A]",
    pillStyles: "bg-emerald-50 text-[#00875A] border-emerald-200/80 hover:bg-emerald-100/70",
  },
  {
    value: "on-hold",
    label: "On Hold",
    dotColor: "bg-sky-500",
    pillStyles: "bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100/70",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    dotColor: "bg-rose-500",
    pillStyles: "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/70",
  },
  {
    value: "refunded",
    label: "Refunded",
    dotColor: "bg-purple-500",
    pillStyles: "bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100/70",
  },
  {
    value: "pending",
    label: "Pending",
    dotColor: "bg-zinc-400",
    pillStyles: "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200/70",
  },
  {
    value: "failed",
    label: "Failed",
    dotColor: "bg-red-500",
    pillStyles: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/70",
  },
];

export function OrderStatusDropdown({
  status,
  onChange,
  disabled = false,
  size = "sm",
}: OrderStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const pos = useDropdownPosition(triggerRef, "left", isOpen);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const currentConfig =
    STATUS_CONFIGS.find((c) => c.value === status) || STATUS_CONFIGS[0];

  const sizeClasses =
    size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs font-semibold";

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative inline-block select-none"
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`flex items-center gap-1.5 rounded-full border font-semibold capitalize transition-all cursor-pointer outline-none shadow-2xs ${sizeClasses} ${
          currentConfig.pillStyles
        } ${isOpen ? "ring-2 ring-emerald-500/20" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${currentConfig.dotColor}`} />
        <span>{currentConfig.label}</span>
        <ChevronDown
          className={`h-3 w-3 opacity-60 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 opacity-100" : ""
          }`}
        />
      </button>

      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              ...(pos.bottom !== undefined ? { bottom: pos.bottom } : { top: pos.top }),
              ...(pos.left !== undefined ? { left: pos.left } : { right: pos.right }),
              minWidth: 176,
              maxHeight: pos.maxHeight || 340,
              overflowY: "auto",
              zIndex: 99999,
            }}
            className="bg-white rounded-2xl border border-black/[0.08] shadow-[0_16px_36px_rgba(0,0,0,0.12)] p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Set Status
            </div>
            {STATUS_CONFIGS.map((cfg) => {
              const isSelected = cfg.value === status;
              return (
                <button
                  key={cfg.value}
                  type="button"
                  onClick={() => {
                    onChange(cfg.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#00875A]/10 text-[#00875A] font-bold"
                      : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dotColor}`} />
                    <span>{cfg.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[#00875A] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </Portal>
      )}
    </div>
  );
}
