"use client";

import React from "react";
import { ArrowUpRight, ArrowUp, ArrowDown } from "lucide-react";

interface WaveMetricsWidgetProps {
  totalBalance?: string;
  totalOrdersCount?: number;
  hasStores?: boolean;
  onSend?: () => void;
  onReceive?: () => void;
}

export function WaveMetricsWidget({
  totalBalance = "$0.00",
  totalOrdersCount = 0,
  hasStores = false,
  onSend,
  onReceive,
}: WaveMetricsWidgetProps) {
  const displayValue = hasStores && totalOrdersCount > 0 ? `${totalOrdersCount} orders` : "0 orders";

  return (
    <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)] w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Payment Goal</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Total live orders volume</p>
        </div>
        <button
          type="button"
          aria-label="Goal Analytics"
          className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-50 border border-zinc-200/80 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* Metric Value */}
      <div className="mt-4 text-center">
        <span className="text-xs text-zinc-400 font-medium block">Total Balance</span>
        <span className="text-3xl sm:text-[32px] font-bold text-zinc-900 tracking-tight font-mono mt-0.5 block">
          {displayValue}
        </span>
      </div>

      {/* Smooth Wave Chart Graphic */}
      <div className="relative w-full h-24 my-2">
        <svg
          viewBox="0 0 320 90"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00875A" stopOpacity={hasStores && totalOrdersCount > 0 ? 0.25 : 0.05} />
              <stop offset="100%" stopColor="#00875A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Line */}
          <line
            x1="0"
            y1="45"
            x2="320"
            y2="45"
            stroke="#e2e8f0"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {hasStores && totalOrdersCount > 0 ? (
            <>
              {/* Area Fill */}
              <path
                d="M 0,55 C 25,65 45,30 65,40 C 85,50 100,15 125,20 C 150,25 170,55 195,50 C 220,45 240,15 265,22 C 290,29 305,45 320,40 L 320,90 L 0,90 Z"
                fill="url(#waveGradient)"
              />

              {/* Stroke Line */}
              <path
                d="M 0,55 C 25,65 45,30 65,40 C 85,50 100,15 125,20 C 150,25 170,55 195,50 C 220,45 240,15 265,22 C 290,29 305,45 320,40"
                fill="none"
                stroke="#00875A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Pulsing Highlight Coordinate Dot */}
              <circle cx="265" cy="22" r="4.5" fill="#00875A" className="animate-pulse" />
              <circle cx="265" cy="22" r="8" fill="#00875A" opacity="0.2" />
            </>
          ) : (
            <>
              {/* Flat Baseline Curve when no store or zero orders */}
              <line
                x1="0"
                y1="65"
                x2="320"
                y2="65"
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="2 2"
              />
            </>
          )}
        </svg>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <button
          type="button"
          onClick={onSend}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowUp className="h-3.5 w-3.5 text-zinc-500" />
          <span>Send</span>
        </button>

        <button
          type="button"
          onClick={onReceive}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-[#00875A]/10 hover:bg-[#00875A]/20 text-[#00875A] text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowDown className="h-3.5 w-3.5 text-[#00875A]" />
          <span>Receive</span>
        </button>
      </div>
    </div>
  );
}
