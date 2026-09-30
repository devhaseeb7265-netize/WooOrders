"use client";

import React, { useRef, useState, useMemo } from "react";
import { Store, BarChart3, ShoppingBag, RefreshCw } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { DateRangePreset, StoreAnalyticsSummary, RevenueDataPoint, PaymentMethodStat } from "@/types/analytics";
import { AnalyticsOverviewCards } from "@/components/analytics/AnalyticsOverviewCards";
import { SalesBreakdownChart } from "@/components/analytics/SalesBreakdownChart";
import { PaymentMethodDistribution } from "@/components/analytics/PaymentMethodDistribution";
import { useStore } from "@/context/StoreContext";
import { WCOrder } from "@/types/woocommerce";

const DATE_PRESETS: readonly { id: DateRangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "last_7_days", label: "Last 7 Days" },
  { id: "this_month", label: "This Month" },
  { id: "last_30_days", label: "Last 30 Days" },
  { id: "year_to_date", label: "Year to Date" },
];

// ─── Date filtering ───────────────────────────────────────────────────────────

function filterByPreset(orders: readonly WCOrder[], preset: DateRangePreset): WCOrder[] {
  const now = new Date();
  const cutoff = (() => {
    switch (preset) {
      case "today":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "last_7_days":
        return new Date(now.getTime() - 7 * 86400000);
      case "this_month":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case "last_30_days":
        return new Date(now.getTime() - 30 * 86400000);
      case "year_to_date":
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(0);
    }
  })();
  return orders.filter((o) => new Date(o.date_created) >= cutoff);
}

// ─── Compute analytics summary from live orders ────────────────────────────

function buildSummary(
  orders: WCOrder[],
  storeId: string | null,
  storeName: string,
  preset: DateRangePreset
): StoreAnalyticsSummary {
  const filtered = filterByPreset(orders, preset);

  const revenueOrders = filtered.filter(
    (o) => o.status === "completed" || o.status === "processing"
  );
  const totalNetSales = revenueOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
  const totalOrders = filtered.length;
  const averageOrderValue = revenueOrders.length > 0 ? totalNetSales / revenueOrders.length : 0;

  const refundOrders = filtered.filter((o) => o.status === "refunded");
  const refundAmount = refundOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
  const refundRate = totalOrders > 0 ? (refundOrders.length / totalOrders) * 100 : 0;

  // Revenue trend — group by day
  const trendMap: Record<string, { revenue: number; count: number }> = {};
  revenueOrders.forEach((o) => {
    const day = o.date_created.slice(0, 10); // YYYY-MM-DD
    if (!trendMap[day]) trendMap[day] = { revenue: 0, count: 0 };
    trendMap[day].revenue += parseFloat(o.total) || 0;
    trendMap[day].count += 1;
  });
  const revenueTrend: RevenueDataPoint[] = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14) // last 14 days max
    .map(([date, { revenue, count }]) => ({
      date,
      label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue,
      ordersCount: count,
      aov: count > 0 ? revenue / count : 0,
    }));

  // Payment methods — count from payment_method_title
  const pmMap: Record<string, { amount: number; count: number }> = {};
  revenueOrders.forEach((o) => {
    const pm = o.payment_method_title || o.payment_method || "Other";
    if (!pmMap[pm]) pmMap[pm] = { amount: 0, count: 0 };
    pmMap[pm].amount += parseFloat(o.total) || 0;
    pmMap[pm].count += 1;
  });
  const total = totalNetSales || 1;
  const paymentMethods: PaymentMethodStat[] = Object.entries(pmMap).map(([name, { amount, count }]) => ({
    id: name.toLowerCase().replace(/\s+/g, "_"),
    name,
    amount,
    orderCount: count,
    percentage: Math.round((amount / total) * 100),
  }));

  return {
    storeId: storeId ?? "",
    storeName,
    currency: orders[0]?.currency ?? "USD",
    totalNetSales,
    salesGrowth: 0,
    totalOrders,
    ordersGrowth: 0,
    averageOrderValue,
    aovGrowth: 0,
    refundRate: parseFloat(refundRate.toFixed(1)),
    refundRateDelta: 0,
    refundAmount,
    activeWebhooksCount: 0,
    revenueTrend,
    paymentMethods,
    statusBreakdown: [],
  };
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyAnalyticsState() {
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
      <div className="h-16 w-16 rounded-3xl bg-zinc-100 flex items-center justify-center">
        <BarChart3 className="h-7 w-7 text-zinc-400" />
      </div>
      <div>
        <p className="text-base font-bold text-zinc-800">No Analytics Data</p>
        <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
          Connect a WooCommerce store and sync orders to see live performance metrics here.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    activeStoreId,
    activeStoreName,
    orders,
    hasConnectedStores,
    isLoading,
    refreshActiveStore,
  } = useStore();

  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>("last_7_days");

  // Only show orders scoped to the active store
  const scopedOrders = useMemo(
    () =>
      !activeStoreId
        ? []
        : orders.filter((o) => o.store_id === activeStoreId),
    [orders, activeStoreId]
  );

  const analyticsSummary = useMemo(
    () => buildSummary(scopedOrders, activeStoreId, activeStoreName, selectedPreset),
    [scopedOrders, activeStoreId, activeStoreName, selectedPreset]
  );

  const hasData = scopedOrders.length > 0;

  useGSAP(
    () => {
      if (!containerRef.current) return;
      gsap.fromTo(
        containerRef.current.querySelectorAll(".analytics-reveal"),
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: "power2.out" }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-8 w-full pb-14">
      {/* Header */}
      <div className="analytics-reveal flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Store Performance &amp; Insights
            </h1>
            {hasConnectedStores && (
              <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[11px] font-medium">
                {activeStoreName}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Sales performance, conversion metrics, and payment method distribution.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshActiveStore}
          aria-label="Refresh analytics"
          className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-zinc-200/80 shadow-xs text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-[#00875A]" : ""}`} />
        </button>
      </div>

      {/* No store → empty state */}
      {!hasConnectedStores && <EmptyAnalyticsState />}

      {/* Store connected but no orders yet */}
      {hasConnectedStores && !hasData && (
        <div className="flex flex-col items-center justify-center py-20 gap-5 text-center analytics-reveal">
          <div className="h-14 w-14 rounded-3xl bg-zinc-100 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-800">No Orders Yet</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Orders will appear here automatically once your WooCommerce store starts receiving them via webhooks.
            </p>
          </div>
        </div>
      )}

      {/* Live data */}
      {hasConnectedStores && hasData && (
        <>
          {/* Date Preset Filter */}
          <div className="analytics-reveal flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 select-none">
              {DATE_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 whitespace-nowrap cursor-pointer outline-none ${
                      isSelected
                        ? "bg-[#00875A] text-white shadow-xs"
                        : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/80 hover:border-zinc-300 shadow-xs"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-100/80 rounded-full text-[11px] text-zinc-500 font-mono">
              <Store className="h-3 w-3 text-zinc-400" />
              <span>{activeStoreName} · {analyticsSummary.totalOrders} orders</span>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="analytics-reveal w-full">
            <AnalyticsOverviewCards summary={analyticsSummary} />
          </div>

          {/* Charts */}
          <div className="analytics-reveal grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8 flex flex-col">
              <SalesBreakdownChart
                data={analyticsSummary.revenueTrend}
                currency={analyticsSummary.currency}
                storeName={analyticsSummary.storeName}
              />
            </div>
            <div className="lg:col-span-4 flex flex-col">
              <PaymentMethodDistribution
                methods={analyticsSummary.paymentMethods}
                currency={analyticsSummary.currency}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
