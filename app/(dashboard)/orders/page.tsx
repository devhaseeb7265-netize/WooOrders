"use client";

import React, { useRef, useState } from "react";
import { Search, Calendar, RefreshCw, ShoppingBag, Plus } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { WCOrder, WCOrderStatus } from "@/types/woocommerce";
import { useStore } from "@/context/StoreContext";
import { OrdersDataTable } from "@/components/orders/OrdersDataTable";
import { OrderDetailsDrawer } from "@/components/orders/OrderDetailsDrawer";
import { ConnectSiteModal } from "@/components/sites/ConnectSiteModal";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { getCurrentUser } from "@/data/userStore";

const STATUS_FILTERS: readonly { id: string; label: string }[] = [
  { id: "all", label: "All Orders" },
  { id: "processing", label: "Processing" },
  { id: "completed", label: "Completed" },
  { id: "on-hold", label: "On Hold" },
  { id: "cancelled", label: "Cancelled" },
  { id: "refunded", label: "Refunded" },
  { id: "trash", label: "Trash" },
];

const DATE_OPTIONS = [
  { value: "all", label: "All Time", icon: Calendar },
  { value: "30d", label: "Last 30 Days", icon: Calendar },
  { value: "7d", label: "Last 7 Days", icon: Calendar },
  { value: "month", label: "This Month", icon: Calendar },
  { value: "today", label: "Today", icon: Calendar },
];

export default function OrdersHubPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    filteredOrdersForHub,
    orderStatusFilter,
    orderSearchQuery,
    orderDateRange,
    isLoading,
    isSyncing,
    hasConnectedStores,
    activeStoreName,
    setOrderStatusFilter,
    setOrderSearchQuery,
    setOrderDateRange,
    updateOrderStatus,
    batchUpdateOrderStatus,
    deleteOrder,
    trashOrder,
    restoreOrder,
    permanentlyDeleteOrder,
    batchDeleteOrders,
    batchTrashOrders,
    batchRestoreOrders,
    batchPermanentlyDeleteOrders,
    refreshActiveStore,
    addStore,
  } = useStore();

  const [selectedOrder, setSelectedOrder] = useState<WCOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [auditNotice, setAuditNotice] = useState<string | null>(null);

  const triggerAuditNotice = (msg: string) => {
    setAuditNotice(msg);
    setTimeout(() => setAuditNotice((c) => (c === msg ? null : c)), 4000);
  };

  useGSAP(
    () => {
      if (!containerRef.current) return;
      gsap.fromTo(
        containerRef.current.querySelectorAll(".orders-reveal"),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.06, ease: "power2.out" }
      );
    },
    { scope: containerRef }
  );

  const handleSelectOrder = (order: WCOrder) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleUpdateOrderStatus = (orderId: number, newStatus: WCOrderStatus) => {
    const user = getCurrentUser();
    updateOrderStatus(orderId, newStatus);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    triggerAuditNotice(
      `Order #${filteredOrdersForHub.find((o) => o.id === orderId)?.number || orderId} → ${newStatus} (by ${user.username})`
    );
  };

  const handleBatchStatusChange = (orderIds: number[], newStatus: WCOrderStatus) => {
    const user = getCurrentUser();
    batchUpdateOrderStatus(orderIds, newStatus);
    triggerAuditNotice(
      `${orderIds.length} orders → ${newStatus} (by ${user.username})`
    );
  };

  const handleDeleteOrder = (orderId: number) => {
    const user = getCurrentUser();
    const num = filteredOrdersForHub.find((o) => o.id === orderId)?.number || orderId;
    trashOrder(orderId);
    if (selectedOrder?.id === orderId) {
      setIsDrawerOpen(false);
      setSelectedOrder(null);
    }
    triggerAuditNotice(`Order #${num} moved to trash (by ${user.username})`);
  };

  const handleRestoreOrder = (orderId: number) => {
    const user = getCurrentUser();
    const num = filteredOrdersForHub.find((o) => o.id === orderId)?.number || orderId;
    restoreOrder(orderId);
    triggerAuditNotice(`Order #${num} restored (by ${user.username})`);
  };

  const handlePermanentlyDeleteOrder = (orderId: number) => {
    const user = getCurrentUser();
    const num = filteredOrdersForHub.find((o) => o.id === orderId)?.number || orderId;
    permanentlyDeleteOrder(orderId);
    if (selectedOrder?.id === orderId) {
      setIsDrawerOpen(false);
      setSelectedOrder(null);
    }
    triggerAuditNotice(`Order #${num} permanently deleted (by ${user.username})`);
  };

  const handleBatchDelete = (orderIds: number[]) => {
    const user = getCurrentUser();
    batchTrashOrders(orderIds);
    triggerAuditNotice(`${orderIds.length} orders moved to trash (by ${user.username})`);
  };

  const handleRefresh = async () => {
    await refreshActiveStore();
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full pb-14">
      {/* Header Row */}
      <div className="orders-reveal flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Orders Hub
            </h1>
            <span className="px-3 py-1 rounded-full bg-[#00875A]/10 text-[#00875A] text-xs font-bold font-mono">
              {filteredOrdersForHub.length} Orders
            </span>
            {activeStoreName !== "No Store Connected" && (
              <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[11px] font-medium">
                {activeStoreName}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time order stream across your connected WooCommerce stores.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Live Status Indicator */}
          {hasConnectedStores && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-zinc-200/80 rounded-full shadow-xs text-xs font-medium text-zinc-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00875A] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00875A]" />
              </span>
              <span className="font-semibold text-[#00875A]">Live Sync</span>
            </div>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isSyncing}
            aria-label="Refresh Orders"
            className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-zinc-200/80 shadow-xs text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing || isLoading ? "animate-spin text-[#00875A]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="orders-reveal flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 select-none">
          {STATUS_FILTERS.map((filter) => {
            const isSelected = orderStatusFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setOrderStatusFilter(filter.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 whitespace-nowrap cursor-pointer outline-none ${
                  isSelected
                    ? "bg-[#00875A] text-white shadow-xs"
                    : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/80 hover:border-zinc-300 shadow-xs"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Search & Date Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by ID, name, email..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200/80 rounded-full text-xs font-medium text-zinc-900 placeholder:text-zinc-400 shadow-xs outline-none focus:border-[#00875A] focus:ring-2 focus:ring-[#00875A]/10 transition-all"
            />
          </div>

          <ThemedSelect
            value={orderDateRange}
            onChange={setOrderDateRange}
            options={DATE_OPTIONS}
            variant="pill"
            size="sm"
            align="right"
            className="hidden sm:inline-block"
          />
        </div>
      </div>

      {/* Audit Toast */}
      {auditNotice && (
        <div className="orders-reveal flex items-center justify-between p-3.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl text-xs text-[#00875A] font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-[#00875A]" />
            <span>{auditNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAuditNotice(null)}
            className="text-xs text-emerald-700/70 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State — No Store Connected */}
      {!hasConnectedStores && (
        <div className="orders-reveal flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="h-16 w-16 rounded-3xl bg-zinc-100 flex items-center justify-center">
            <ShoppingBag className="h-7 w-7 text-zinc-400" />
          </div>
          <div>
            <p className="text-base font-bold text-zinc-800">No Store Connected</p>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
              Connect a WooCommerce store to start seeing live orders here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00875A] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-[#00704A] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Connect a Store
          </button>
        </div>
      )}

      {/* Orders Table */}
      {hasConnectedStores && (
        <div className="orders-reveal w-full">
          <OrdersDataTable
            data={filteredOrdersForHub}
            onSelectOrder={handleSelectOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onBatchStatusChange={handleBatchStatusChange}
            onDeleteOrder={handleDeleteOrder}
            onBatchDelete={handleBatchDelete}
            onRestoreOrder={handleRestoreOrder}
            onPermanentlyDeleteOrder={handlePermanentlyDeleteOrder}
            searchQuery=""
            statusFilter={orderStatusFilter}
          />
        </div>
      )}

      {/* Order Details Drawer */}
      <OrderDetailsDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusChange={handleUpdateOrderStatus}
      />

      {/* Connect Store Modal */}
      <ConnectSiteModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onStoreAdded={(store) => addStore(store)}
      />
    </div>
  );
}

