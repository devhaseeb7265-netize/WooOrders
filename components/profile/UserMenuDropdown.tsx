"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Store,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { AppUser, getCurrentUser, logoutUser, subscribeToUserUpdates } from "@/data/userStore";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
import { Portal } from "@/components/ui/Portal";
import { useDropdownPosition } from "@/hooks/useDropdownPosition";

interface UserMenuDropdownProps {
  compact?: boolean;
  align?: "left" | "right";
  dropUp?: boolean;
}

export function UserMenuDropdown({
  compact = false,
  align = "right",
  dropUp = false,
}: UserMenuDropdownProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<AppUser>(() => getCurrentUser());
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // For dropUp we flip the position logic
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, right: 0, minWidth: 220 });
  const rawPos = useDropdownPosition(triggerRef, align, isOpen);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    if (dropUp) {
      // Position above the trigger
      const scrollY = window.scrollY;
      const vw = window.innerWidth;
      const menuHeight = 280; // approx height
      const top = rect.top + scrollY - menuHeight - 8;
      const right = vw - rect.right - window.scrollX;
      const left = rect.left + window.scrollX;
      setDropdownPos({ top, left, right, minWidth: 220 });
    }
  }, [isOpen, dropUp]);

  useEffect(() => {
    const unsubscribe = subscribeToUserUpdates((updatedUser) => {
      setUser(updatedUser);
    });
    return () => unsubscribe();
  }, []);

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

  const handleLogout = () => {
    setIsLoggingOut(true);
    setIsOpen(false);
    setTimeout(() => {
      logoutUser(() => {
        router.push("/login");
      });
    }, 350);
  };

  const displayName = user.displayName || user.fullName || user.username;
  const initials = displayName.substring(0, 2).toUpperCase();

  const positionStyle = dropUp
    ? {
        position: "fixed" as const,
        top: dropdownPos.top,
        ...(align === "right" ? { right: dropdownPos.right } : { left: dropdownPos.left }),
        minWidth: 220,
        zIndex: 99999,
      }
    : {
        position: "fixed" as const,
        top: rawPos.top,
        ...(rawPos.right !== undefined
          ? { right: rawPos.right }
          : { left: rawPos.left }),
        minWidth: Math.max(rawPos.minWidth, 220),
        zIndex: 99999,
      };

  return (
    <>
      <div className="relative select-none">
        {/* Profile Pill Trigger */}
        {compact ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="User profile menu"
            aria-expanded={isOpen}
            className="flex items-center justify-center h-11 w-11 rounded-2xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 transition-all cursor-pointer overflow-hidden shadow-xs"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold font-mono text-zinc-800">
                {initials}
              </span>
            )}
          </button>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200/80 shadow-xs transition-all cursor-pointer outline-none group"
          >
            {/* Avatar Circle */}
            <div className="h-7 w-7 rounded-full bg-[#00875A] text-white flex items-center justify-center text-xs font-bold font-mono overflow-hidden shrink-0">
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

            {/* Name & Role */}
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-zinc-900 leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">
                {user.role}
              </span>
            </div>

            <ChevronDown
              className={`h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-700 transition-transform duration-200 ml-1 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        )}

        {/* Portal-rendered menu — escapes all stacking contexts */}
        {isOpen && (
          <Portal>
            <div
              ref={menuRef}
              style={positionStyle}
              className="bg-white rounded-2xl border border-black/[0.06] shadow-xl p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Profile header */}
              <div className="px-3 py-2 border-b border-zinc-100 flex flex-col">
                <span className="text-xs font-bold text-zinc-900 truncate">
                  {displayName}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono truncate">
                  {user.email}
                </span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#00875A] border border-emerald-200 text-[10px] font-semibold">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-colors text-left cursor-pointer"
              >
                <User className="h-3.5 w-3.5 text-zinc-400" />
                <span>Profile Settings</span>
              </button>

              <Link
                href="/sites"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-colors text-left cursor-pointer"
              >
                <Store className="h-3.5 w-3.5 text-zinc-400" />
                <span>Switch Store Scope</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-colors text-left cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 text-zinc-400" />
                <span>Hub Settings</span>
              </Link>

              <div className="h-px bg-zinc-100 my-1" />

              {/* Sign Out */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-500" />
                <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </Portal>
        )}
      </div>

      {/* Profile Settings Modal */}
      <UserProfileModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUserUpdated={(updated) => setUser(updated)}
      />
    </>
  );
}
