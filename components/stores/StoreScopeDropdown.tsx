"use client";

import React, { useState, useRef, useEffect } from "react";
import { Store, ChevronDown, Check, Plus } from "lucide-react";
import { ConnectedStore } from "@/context/StoreContext";
import { ConnectSiteModal } from "@/components/sites/ConnectSiteModal";
import { useStore } from "@/context/StoreContext";
import { Portal } from "@/components/ui/Portal";
import { useDropdownPosition } from "@/hooks/useDropdownPosition";

interface StoreScopeDropdownProps {
  onOpenConnectModal?: () => void;
}

export function StoreScopeDropdown({
  onOpenConnectModal,
}: StoreScopeDropdownProps) {
  const context = useStore();
  const stores = context.connectedStores;
  const activeStoreId = context.activeStoreId;

  const [isOpen, setIsOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const pos = useDropdownPosition(triggerRef, "right", isOpen);

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

  const activeStore = stores.find((s) => s.id === activeStoreId);
  const activeLabel =
    stores.length === 0
      ? "No Store Connected"
      : activeStore?.name || "Select Store";

  const handleSelect = (id: string) => {
    context.switchActiveStore(id);
    setIsOpen(false);
  };

  const handleOpenAddSite = () => {
    setIsOpen(false);
    if (onOpenConnectModal) {
      onOpenConnectModal();
    } else {
      setIsConnectModalOpen(true);
    }
  };

  const handleStoreAdded = (newStore: ConnectedStore) => {
    context.addStore(newStore);
  };

  return (
    <>
      <div className="relative select-none">
        {/* Themed Pill Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className={`flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-zinc-50 border rounded-full shadow-xs text-xs font-semibold text-zinc-800 transition-all cursor-pointer outline-none group ${
            isOpen
              ? "border-[#00875A] ring-2 ring-[#00875A]/20 shadow-md"
              : "border-zinc-200/80 hover:border-zinc-300"
          }`}
        >
          <div className="h-5 w-5 rounded-full bg-emerald-50 text-[#00875A] flex items-center justify-center shrink-0">
            <Store className="h-3 w-3" />
          </div>
          <span className="truncate max-w-[140px] sm:max-w-[170px]">
            {activeLabel}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-700 transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180 text-zinc-800" : ""
            }`}
          />
        </button>

        {/* Portal-rendered dropdown */}
        {isOpen && (
          <Portal>
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: pos.top,
                ...(pos.right !== undefined
                  ? { right: pos.right }
                  : { left: pos.left }),
                minWidth: 256,
                zIndex: 99999,
              }}
              className="bg-white rounded-2xl border border-black/[0.08] shadow-[0_16px_36px_rgba(0,0,0,0.14)] p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Individual store list */}
              {stores.length > 0 ? (
                <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
                  {stores.map((store) => {
                    const isSelected = activeStoreId === store.id;
                    return (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => handleSelect(store.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50/80 text-[#00875A] font-semibold"
                            : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50"
                        }`}
                      >
                        <div className="flex flex-col truncate pr-2">
                          <span className="truncate font-semibold text-zinc-900">
                            {store.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono truncate">
                            {store.url.replace(/^https?:\/\//, "")}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-[#00875A] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-2 text-xs text-zinc-400 text-center">
                  No stores connected yet
                </div>
              )}

              <div className="h-px bg-zinc-100 my-1" />

              {/* + Add New Site */}
              <button
                type="button"
                onClick={handleOpenAddSite}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#00875A] hover:bg-emerald-50/80 transition-colors text-left cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#00875A]" />
                <span>+ Add New Site</span>
              </button>
            </div>
          </Portal>
        )}
      </div>

      {/* Standalone Connect Site Modal */}
      <ConnectSiteModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onStoreAdded={handleStoreAdded}
      />
    </>
  );
}
