"use client";

import React from "react";
import { CreditCard, TrendingUp } from "lucide-react";

interface CreditRefundSummaryCardProps {
  title?: string;
  subtitle?: string;
  amount?: string;
  badge?: string;
  hasStores?: boolean;
}

export function CreditRefundSummaryCard({
  title = "Amount of credit",
  subtitle = "Total refund amount with fee",
  amount = "$0.00",
  badge = "0%",
  hasStores = false,
}: CreditRefundSummaryCardProps) {
  return (
    <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)] w-full">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-zinc-100 text-zinc-700">
          <CreditCard className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">{title}</h2>
          <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <span className="text-2xl sm:text-[28px] font-bold text-zinc-900 tracking-tight font-mono">
          {amount}
        </span>
        {hasStores && badge !== "0%" ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00875A] text-white text-xs font-semibold shadow-xs">
            <TrendingUp className="h-3 w-3" />
            <span>{badge}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-400 text-xs font-semibold">
            <span>0%</span>
          </div>
        )}
      </div>
    </div>
  );
}
