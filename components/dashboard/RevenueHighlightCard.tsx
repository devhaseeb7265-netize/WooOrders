"use client";

import React from "react";
import { ArrowUpRight, Wifi, TrendingUp, Store } from "lucide-react";

interface RevenueHighlightCardProps {
  storeName?: string;
  storeDomain?: string;
  totalRevenue?: string;
  weeklyRevenue?: string;
  growthPercentage?: string;
  accountMask?: string;
  syncDate?: string;
  hasStores?: boolean;
  onConnectClick?: () => void;
}

export function RevenueHighlightCard({
  storeName = "No Store Connected",
  storeDomain = "Awaiting Live Sync",
  totalRevenue = "$0.00",
  weeklyRevenue = "$0.00",
  growthPercentage = "0%",
  accountMask = "•••• 000000",
  syncDate = "LIVE SYNC",
  hasStores = false,
  onConnectClick,
}: RevenueHighlightCardProps) {
  return (
    <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)] h-full">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Payment Goal</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Total revenue goal</p>
        </div>
        <button
          type="button"
          onClick={onConnectClick}
          aria-label="View Goal Details"
          className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-50 border border-zinc-200/80 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* Solid Emerald VISA-Inspired Card */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#00875A] text-white p-5 shadow-[0_12px_28px_rgba(0,135,90,0.28)] flex flex-col justify-between min-h-[170px] select-none">
        {/* Subtle Background Glow Texture */}
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-lg font-black tracking-wider italic font-sans">VISA</span>
          <Wifi className="h-5 w-5 rotate-90 text-white/90" />
        </div>

        <div className="relative z-10 my-3">
          <p className="text-[11px] font-medium text-emerald-100/90 tracking-wide uppercase truncate">
            {storeName} • {storeDomain}
          </p>
          <p className="text-2xl sm:text-[26px] font-semibold tracking-tight text-white mt-0.5 font-mono">
            {totalRevenue}
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-emerald-100/80 font-mono">
          <span>{hasStores ? accountMask : "NO SYNC"}</span>
          <span className="text-[11px] tracking-wider uppercase">
            {hasStores ? syncDate : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Weekly Revenue Secondary Metric */}
      <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
        <div>
          <span className="text-xs font-normal text-zinc-400 block">Weekly Revenue</span>
          <span className="text-lg font-semibold text-zinc-900 font-mono tracking-tight">
            {weeklyRevenue}
          </span>
        </div>

        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            hasStores && growthPercentage !== "0%"
              ? "bg-[#00875A]/10 text-[#00875A]"
              : "bg-zinc-100 text-zinc-400"
          }`}
        >
          <TrendingUp className="h-3 w-3" />
          <span>{growthPercentage}</span>
        </div>
      </div>
    </div>
  );
}
