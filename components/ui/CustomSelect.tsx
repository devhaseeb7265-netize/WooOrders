"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { useDropdownPosition } from "@/hooks/useDropdownPosition";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly CustomSelectOption[] | CustomSelectOption[];
  placeholder?: string;
  className?: string;
  pill?: boolean;
  size?: "xs" | "sm" | "md";
  align?: "left" | "right";
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  className = "",
  pill = false,
  size = "md",
  align = "left",
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const pos = useDropdownPosition(triggerRef, align, isOpen);

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

  const selectedOption = options.find((opt) => opt.value === value);

  const sizeClasses = {
    xs: "px-2.5 py-1 text-[11px]",
    sm: "px-3 py-1.5 text-xs",
    md: "px-3.5 py-2 text-xs",
  }[size];

  const roundedClasses = pill ? "rounded-full" : "rounded-xl";

  return (
    <div className={`relative select-none ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 bg-white hover:bg-zinc-50 border border-zinc-200/90 shadow-2xs font-semibold text-zinc-800 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#00875A]/20 ${sizeClasses} ${roundedClasses} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-zinc-700" : ""
          }`}
        />
      </button>

      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos.top,
              ...(pos.right !== undefined ? { right: pos.right } : { left: pos.left }),
              minWidth: Math.max(pos.minWidth, 160),
              zIndex: 99999,
            }}
            className="max-w-xs bg-white rounded-2xl border border-black/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.10)] p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
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
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#00875A]/10 text-[#00875A] font-bold"
                      : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100/70 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {Icon && (
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isSelected ? "text-[#00875A]" : "text-zinc-400"
                        }`}
                      />
                    )}
                    <div className="flex flex-col truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="text-[10px] text-zinc-400 truncate">
                          {opt.description}
                        </span>
                      )}
                    </div>
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
