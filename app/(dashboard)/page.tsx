"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TopNavigationBar } from "@/components/dashboard/TopNavigationBar";
import { RevenueHighlightCard } from "@/components/dashboard/RevenueHighlightCard";
import { EngagementBarChart } from "@/components/dashboard/EngagementBarChart";
import { OrdersHistoryTable } from "@/components/dashboard/OrdersHistoryTable";
import { WaveMetricsWidget } from "@/components/dashboard/WaveMetricsWidget";
import { CreditRefundSummaryCard } from "@/components/dashboard/CreditRefundSummaryCard";
import { SiteAdminsCard } from "@/components/dashboard/SiteAdminsCard";
import { ConnectSiteModal } from "@/components/sites/ConnectSiteModal";
import { useStore } from "@/context/StoreContext";

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  const {
    totalRevenueFormatted,
    weeklyRevenueFormatted,
    growthPercentage,
    totalOrders,
    refundAmountFormatted,
    recentOrders,
    chartData,
    chartTimeframe,
    setChartTimeframe,
    hasConnectedStores,
    activeStoreName,
    activeStoreDomain,
    addStore,
  } = useStore();

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const cards = containerRef.current.querySelectorAll(".dashboard-card-reveal");

      gsap.from(cards, {
        y: 35,
        opacity: 0,
        scale: 0.97,
        duration: 0.75,
        stagger: 0.07,
        ease: "back.out(1.15)",
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="flex flex-col w-full pb-10">
      {/* Top Navigation & Subheader - Stacking context elevated for dropdown menus */}
      <div className="dashboard-card-reveal relative z-50">
        <TopNavigationBar
          onConnectSite={() => setIsConnectOpen(true)}
        />
      </div>

      <ConnectSiteModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        onStoreAdded={(newStore, initialOrders) => {
          addStore(newStore, initialOrders);
        }}
      />

      {/* Master 3-Column Dashboard Modular Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full relative z-10">
        {/* Left & Center Main Operational Column */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          {/* Top Row: Revenue Highlight & Engagement Bar Chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            <div className="md:col-span-5 flex flex-col dashboard-card-reveal">
              <RevenueHighlightCard
                storeName={activeStoreName}
                storeDomain={activeStoreDomain}
                totalRevenue={totalRevenueFormatted}
                weeklyRevenue={weeklyRevenueFormatted}
                growthPercentage={growthPercentage}
                hasStores={hasConnectedStores}
                accountMask="•••• 909090"
                syncDate="LIVE SYNC"
                onConnectClick={() => setIsConnectOpen(true)}
              />
            </div>

            <div className="md:col-span-7 flex flex-col dashboard-card-reveal">
              <EngagementBarChart
                data={chartData}
                timeframe={chartTimeframe}
                onTimeframeChange={setChartTimeframe}
                hasStores={hasConnectedStores}
                onConnectStore={() => setIsConnectOpen(true)}
              />
            </div>
          </div>

          {/* Bottom Row: Recent Orders History Table */}
          <div className="w-full dashboard-card-reveal">
            <OrdersHistoryTable
              orders={recentOrders}
              onConnectSite={() => setIsConnectOpen(true)}
            />
          </div>
        </div>

        {/* Right Rail: Wave Metrics, Credit Summary, and Site Admins */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
          <div className="dashboard-card-reveal">
            <WaveMetricsWidget
              totalOrdersCount={totalOrders}
              hasStores={hasConnectedStores}
            />
          </div>

          <div className="dashboard-card-reveal">
            <CreditRefundSummaryCard
              title="Amount of credit"
              subtitle="Total refund amount with fee"
              amount={refundAmountFormatted}
              badge={growthPercentage}
              hasStores={hasConnectedStores}
            />
          </div>

          <div className="dashboard-card-reveal">
            <SiteAdminsCard
              title="Mandatory Payments"
              subtitle="Recent payments"
              extraCount={hasConnectedStores ? 2 : 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
