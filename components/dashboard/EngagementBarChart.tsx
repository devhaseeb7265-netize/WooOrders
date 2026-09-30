"use client";

import React, { useRef } from "react";
import { CreditCard, ArrowUpRight, BarChart3 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ChartDataPoint, ChartTimeframe } from "@/context/StoreContext";

const Y_TICKS = ["5k", "4k", "3k", "2k", "1k", "0"];

interface EngagementBarChartProps {
  data?: ChartDataPoint[];
  timeframe?: ChartTimeframe;
  onTimeframeChange?: (mode: ChartTimeframe) => void;
  hasStores?: boolean;
  onConnectStore?: () => void;
}

export function EngagementBarChart({
  data,
  timeframe = "monthly",
  onTimeframeChange,
  hasStores = false,
  onConnectStore,
}: EngagementBarChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  // Default fallback data if not provided
  const activeData: ChartDataPoint[] = data || (timeframe === "monthly"
    ? [
        { label: "JAN", value: 0, heightPercent: 0 },
        { label: "FEB", value: 0, heightPercent: 0 },
        { label: "MAR", value: 0, heightPercent: 0 },
        { label: "APR", value: 0, heightPercent: 0 },
        { label: "MAY", value: 0, heightPercent: 0 },
        { label: "JUN", value: 0, heightPercent: 0 },
      ]
    : [
        { label: "2023", value: 0, heightPercent: 0 },
        { label: "2024", value: 0, heightPercent: 0 },
        { label: "2025", value: 0, heightPercent: 0 },
        { label: "2026", value: 0, heightPercent: 0 },
      ]);

  const allZero = activeData.every((d) => d.value === 0);

  useGSAP(
    () => {
      if (!chartContainerRef.current) return;
      const bars = chartContainerRef.current.querySelectorAll(".chart-bar-pillar");

      gsap.fromTo(
        bars,
        { scaleY: 0, transformOrigin: "bottom center" },
        {
          scaleY: 1,
          duration: 0.7,
          stagger: 0.06,
          ease: "power3.out",
        }
      );
    },
    { scope: chartContainerRef, dependencies: [timeframe, allZero] }
  );

  return (
    <div
      ref={chartContainerRef}
      className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)] w-full"
    >
      {/* Card Header & Segmented Pill Switch */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-zinc-100 text-zinc-700">
            <CreditCard className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Engagement Rate</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Switch */}
          <div className="flex items-center bg-zinc-100/90 rounded-full p-1 border border-zinc-200/50">
            <button
              type="button"
              onClick={() => onTimeframeChange && onTimeframeChange("monthly")}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 outline-none cursor-pointer ${
                timeframe === "monthly"
                  ? "bg-[#00875A] text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => onTimeframeChange && onTimeframeChange("annually")}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 outline-none cursor-pointer ${
                timeframe === "annually"
                  ? "bg-[#00875A] text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Annually
            </button>
          </div>

          <button
            type="button"
            aria-label="View Detailed Engagement"
            className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-50 border border-zinc-200/80 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stylized Bar Chart Grid */}
      <div className="relative w-full h-[290px] flex pt-8 pb-2">
        {/* Y-Axis Ticks */}
        <div className="flex flex-col justify-between text-[11px] font-mono text-zinc-400 pr-4 select-none">
          {Y_TICKS.map((tick) => (
            <span key={tick} className="leading-none">
              {tick}
            </span>
          ))}
        </div>

        {/* Chart Canvas & Grid Lines */}
        <div className="relative flex-1 h-full flex flex-col justify-between">
          {/* Dashed Horizontal Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {Y_TICKS.map((tick, index) => (
              <div
                key={`grid-${tick}-${index}`}
                className="w-full border-b border-dashed border-zinc-100/90 h-0"
              />
            ))}
          </div>

          {/* Empty State Overlay when no stores or zero orders */}
          {(!hasStores || allZero) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-auto bg-white/40 backdrop-blur-2xs rounded-2xl p-4 text-center">
              <div className="h-10 w-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-2 shadow-2xs">
                <BarChart3 className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-zinc-600">
                Connect a store to view order analytics
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 max-w-xs">
                Revenue metrics and sales trends will visualize dynamically once orders are synchronized.
              </p>
              {onConnectStore && (
                <button
                  type="button"
                  onClick={onConnectStore}
                  className="mt-3 px-3.5 py-1.5 rounded-full bg-[#00875A] text-white text-xs font-semibold hover:bg-[#00704A] transition-colors shadow-xs cursor-pointer"
                >
                  + Connect Site
                </button>
              )}
            </div>
          )}

          {/* Pillars Container */}
          <div className="relative z-10 w-full h-full flex items-end justify-around px-2">
            {activeData.map((item, idx) => {
              const effectiveHeight = hasStores && !allZero ? item.heightPercent : 4;

              return (
                <div
                  key={`${item.label}-${idx}`}
                  className="relative flex flex-col items-center h-full justify-end group w-11 sm:w-13"
                >
                  {/* Floating Peak Tooltip */}
                  {item.isPeak && hasStores && !allZero && (
                    <div className="absolute -top-7 flex flex-col items-center pointer-events-none select-none z-20">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#00875A] text-white text-[11px] font-bold tracking-tight shadow-md shadow-emerald-900/20">
                        Peak
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00875A] mt-0.5" />
                    </div>
                  )}

                  {/* Stylized Pillar Bar */}
                  <div
                    className={`chart-bar-pillar w-full rounded-[22px] transition-all duration-300 relative overflow-hidden ${
                      item.isPeak && hasStores && !allZero
                        ? "bg-[#00875A] shadow-[0_8px_20px_rgba(0,135,90,0.3)]"
                        : hasStores && !allZero
                        ? "bg-[#80b9a3]/40 hover:bg-[#80b9a3]/60"
                        : "bg-zinc-200/50"
                    }`}
                    style={{ height: `${effectiveHeight}%` }}
                  >
                    {!item.isPeak && hasStores && !allZero && (
                      <div
                        className="absolute inset-0 opacity-40"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0, 135, 90, 0.4) 4px, rgba(0, 135, 90, 0.4) 8px)",
                        }}
                      />
                    )}
                  </div>

                  {/* X-Axis Month / Year Label */}
                  <span className="text-[11px] font-medium text-zinc-400 mt-3 select-none">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
