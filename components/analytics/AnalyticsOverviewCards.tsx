"use client";

import React, { useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  RotateCcw,
  Radio,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { StoreAnalyticsSummary } from "@/types/analytics";

interface AnalyticsOverviewCardsProps {
  summary: StoreAnalyticsSummary;
}

export function AnalyticsOverviewCards({ summary }: AnalyticsOverviewCardsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const salesRef = useRef<HTMLSpanElement | null>(null);
  const ordersRef = useRef<HTMLSpanElement | null>(null);
  const aovRef = useRef<HTMLSpanElement | null>(null);
  const refundRef = useRef<HTMLSpanElement | null>(null);
  const webhooksRef = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      const targets = {
        sales: 0,
        orders: 0,
        aov: 0,
        refund: 0,
        webhooks: 0,
      };

      gsap.to(targets, {
        sales: summary.totalNetSales,
        orders: summary.totalOrders,
        aov: summary.averageOrderValue,
        refund: summary.refundRate,
        webhooks: summary.activeWebhooksCount,
        duration: 0.9,
        ease: "power2.out",
        onUpdate: () => {
          if (salesRef.current) {
            salesRef.current.textContent = `$${targets.sales.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          }
          if (ordersRef.current) {
            ordersRef.current.textContent = Math.round(targets.orders).toLocaleString();
          }
          if (aovRef.current) {
            aovRef.current.textContent = `$${targets.aov.toFixed(2)}`;
          }
          if (refundRef.current) {
            refundRef.current.textContent = `${targets.refund.toFixed(1)}%`;
          }
          if (webhooksRef.current) {
            webhooksRef.current.textContent = Math.round(targets.webhooks).toString();
          }
        },
      });
    },
    {
      scope: containerRef,
      dependencies: [
        summary.totalNetSales,
        summary.totalOrders,
        summary.averageOrderValue,
        summary.refundRate,
        summary.activeWebhooksCount,
      ],
    }
  );

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full"
    >
      {/* Card 1: Total Net Sales */}
      <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-zinc-400">Total Net Sales</span>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00875A]/10 text-[#00875A] text-xs font-bold">
            <TrendingUp className="h-3 w-3" />
            <span>+{summary.salesGrowth}%</span>
          </div>
        </div>

        <div>
          <span
            ref={salesRef}
            className="text-2xl sm:text-[28px] font-bold text-zinc-900 tracking-tight font-mono block"
          >
            ${summary.totalNetSales.toLocaleString()}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Across {summary.storeName}
          </span>
        </div>
      </div>

      {/* Card 2: Orders Volume & AOV */}
      <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-zinc-400">Total Orders</span>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            <ShoppingBag className="h-3 w-3" />
            <span>+{summary.ordersGrowth}%</span>
          </div>
        </div>

        <div>
          <span
            ref={ordersRef}
            className="text-2xl sm:text-[28px] font-bold text-zinc-900 tracking-tight font-mono block"
          >
            {summary.totalOrders}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-1 font-mono">
            <span>AOV:</span>
            <strong ref={aovRef} className="text-zinc-800 font-bold">
              ${summary.averageOrderValue.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* Card 3: Refund Rate */}
      <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-zinc-400">Refund Rate</span>
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              summary.refundRateDelta <= 0
                ? "bg-emerald-50 text-[#00875A]"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {summary.refundRateDelta <= 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            <span>
              {summary.refundRateDelta > 0 ? `+${summary.refundRateDelta}%` : `${summary.refundRateDelta}%`}
            </span>
          </div>
        </div>

        <div>
          <span
            ref={refundRef}
            className="text-2xl sm:text-[28px] font-bold text-zinc-900 tracking-tight font-mono block"
          >
            {summary.refundRate.toFixed(1)}%
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 block font-mono">
            ${summary.refundAmount.toLocaleString()} total refunded
          </span>
        </div>
      </div>

      {/* Card 4: Webhook Synchronizers */}
      <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-zinc-400">Live Webhooks</span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00875A] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00875A]" />
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span
              ref={webhooksRef}
              className="text-2xl sm:text-[28px] font-bold text-zinc-900 tracking-tight font-mono block"
            >
              {summary.activeWebhooksCount}
            </span>
            <span className="text-xs text-zinc-400 font-medium">endpoints</span>
          </div>
          <span className="text-[11px] text-[#00875A] font-semibold mt-1 block">
            Subscribed to 4 Topics
          </span>
        </div>
      </div>
    </div>
  );
}
