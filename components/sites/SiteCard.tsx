"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  RefreshCw,
  MoreVertical,
  Radio,
  ShoppingBag,
  Trash2,
  Check,
} from "lucide-react";
import { ConnectedStore } from "@/lib/stores/storage";

interface SiteCardProps {
  store: ConnectedStore;
  onSync: (id: string) => void;
  onDisconnect: (id: string) => void;
}

export function SiteCard({ store, onSync, onDisconnect }: SiteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await onSync(store.id);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2500);
    } finally {
      setIsSyncing(false);
    }
  };

  const isDegraded = store.status === "inactive" || store.status === "error";

  return (
    <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)] relative">
      {/* Store Header & Options */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-zinc-100 to-zinc-50 border border-zinc-200/80 text-[#00875A] font-bold text-base shadow-xs">
              <ShoppingBag className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-zinc-900">
                  {store.name}
                </h3>
              </div>
              <a
                href={store.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1 font-mono transition-colors mt-0.5"
              >
                <span className="truncate max-w-[210px]">{store.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Store Actions"
              className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-9 z-40 bg-white border border-zinc-100 rounded-2xl shadow-xl p-1.5 min-w-[150px] flex flex-col gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      handleSyncClick();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Sync Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDisconnect(store.id);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Disconnect
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Version Badges & Connectivity Pill */}
        <div className="flex items-center flex-wrap gap-2 mt-4 pt-3 border-t border-zinc-100">
          {/* Status Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isDegraded
                ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                : "bg-emerald-50 text-[#00875A] border border-emerald-200/60"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {!isDegraded && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00875A] opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isDegraded ? "bg-amber-500" : "bg-[#00875A]"
                }`}
              />
            </span>
            {isDegraded ? "Keys Warning" : "Active Sync"}
          </span>

          <span className="px-2.5 py-1 rounded-full bg-zinc-100/80 text-zinc-600 text-xs font-medium font-mono">
            WC {store.wcVersion}
          </span>

          {store.wpVersion && (
            <span className="px-2.5 py-1 rounded-full bg-zinc-100/80 text-zinc-600 text-xs font-medium font-mono">
              WP {store.wpVersion}
            </span>
          )}

          {store.webhookConfigured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100/80 text-zinc-600 text-[11px] font-medium">
              <Radio className="h-3 w-3 text-[#00875A]" />
              Webhook
            </span>
          )}
        </div>
      </div>

      {/* Metrics & Sync Trigger */}
      <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-zinc-400 block font-normal">Total Synced Orders</span>
          <span className="text-lg font-bold text-zinc-900 font-mono tracking-tight">
            {store.totalOrders.toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">
            Last sync: {store.lastSync}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSyncClick}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {justSynced ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#00875A]" />
              <span className="text-[#00875A]">Synced</span>
            </>
          ) : (
            <>
              <RefreshCw className={`h-3.5 w-3.5 text-zinc-600 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing" : "Sync"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
