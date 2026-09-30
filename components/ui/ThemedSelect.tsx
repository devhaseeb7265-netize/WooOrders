"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { useDropdownPosition } from "@/hooks/useDropdownPosition";

export interface ThemedSelectOption {
  value: string;
  label: string;
  dotColor?: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface ThemedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly ThemedSelectOption[] | ThemedSelectOption[];
  placeholder?: string;
  variant?: "pill" | "rounded";
  size?: "xs" | "sm" | "md";
  align?: "left" | "right";
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  triggerClassName?: string;
}

export function ThemedSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  variant = "pill",
  size = "sm",
  align = "left",
  disabled = false,
  className = "",
  ariaLabel,
  triggerClassName = "",
}: ThemedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const pos = useDropdownPosition(triggerRef, align, isOpen);

  // Close on outside click
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

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const sizeClasses = {
    xs: "px-2.5 py-1 text-[11px] h-7",
    sm: "px-3.5 py-1.5 text-xs h-8",
    md: "px-4 py-2 text-xs h-9",
  }[size];

  const radiusClasses = variant === "pill" ? "rounded-full" : "rounded-2xl";

  return (
    <div className={`relative inline-block select-none ${className}`}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between gap-2.5 bg-white border shadow-xs transition-all duration-200 cursor-pointer outline-none ${radiusClasses} ${sizeClasses} ${
          isOpen
            ? "border-[#00875A] ring-2 ring-[#00875A]/20 shadow-md"
            : "border-black/[0.08] hover:border-black/[0.16] hover:shadow-xs"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.dotColor ? (
            <span className={`h-2 w-2 rounded-full shrink-0 ${selectedOption.dotColor}`} />
          ) : selectedOption?.icon ? (
            <selectedOption.icon className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          ) : null}
          <span className="truncate font-semibold text-zinc-800">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-zinc-800" : ""
          }`}
        />
      </button>

      {/* Portal-rendered dropdown — outside all stacking contexts */}
      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              ...(pos.bottom !== undefined
                ? { bottom: pos.bottom }
                : { top: pos.top }),
              ...(pos.right !== undefined
                ? { right: pos.right }
                : { left: pos.left }),
              minWidth: Math.max(pos.minWidth, 180),
              maxHeight: pos.maxHeight || 340,
              overflowY: "auto",
              zIndex: 99999,
            }}
            className="max-w-xs bg-white rounded-[20px] border border-black/[0.08] shadow-[0_16px_36px_rgba(0,0,0,0.14)] p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#00875A]/10 text-[#00875A] font-bold"
                      : "text-zinc-700 hover:text-zinc-900 hover:bg-[#F4F5F7] font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {opt.dotColor ? (
                      <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dotColor}`} />
                    ) : Icon ? (
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isSelected ? "text-[#00875A]" : "text-zinc-400"
                        }`}
                      />
                    ) : null}

                    <div className="flex flex-col truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="text-[10px] text-zinc-400 truncate font-normal">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected ? (
                    <Check className="h-3.5 w-3.5 text-[#00875A] shrink-0 ml-2" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </Portal>
      )}
    </div>
  );
}
