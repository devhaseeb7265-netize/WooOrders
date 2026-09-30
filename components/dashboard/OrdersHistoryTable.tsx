"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag, Store, Calendar, Inbox } from "lucide-react";
import { WCOrder, WCOrderStatus } from "@/types/woocommerce";
import { useStore } from "@/context/StoreContext";

interface OrdersHistoryTableProps {
  orders?: readonly WCOrder[] | WCOrder[];
  onViewAll?: () => void;
  onConnectSite?: () => void;
}

export function OrdersHistoryTable({
  orders = [],
  onViewAll,
  onConnectSite,
}: OrdersHistoryTableProps) {
  const { formatCurrency } = useStore();
  const getStatusBadge = (status: WCOrderStatus) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-[#00875A] border-emerald-200/80";
      case "processing":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "on-hold":
        return "bg-sky-50 text-sky-700 border-sky-200/80";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      case "refunded":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  return (
    <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)] w-full">
      {/* Table Card Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Payment History</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Recent store order transactions</p>
        </div>
        <Link
          href="/orders"
          aria-label="View All Orders"
          className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-50 border border-zinc-200/80 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Orders Table Container */}
      {orders.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center px-4 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
          <div className="h-11 w-11 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3 shadow-2xs">
            <Inbox className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-zinc-700">
            No recent orders detected.
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
            Use &apos;+ Connect Site&apos; to sync your WooCommerce store and live orders will appear here automatically.
          </p>
          {onConnectSite && (
            <button
              type="button"
              onClick={onConnectSite}
              className="mt-4 px-4 py-2 rounded-full bg-[#00875A] text-white text-xs font-semibold hover:bg-[#00704A] transition-colors shadow-xs cursor-pointer"
            >
              + Connect Site
            </button>
          )}
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider select-none">
                <th className="pb-3 pr-4 font-medium">Order & Store</th>
                <th className="pb-3 px-4 font-medium">Customer</th>
                <th className="pb-3 px-4 font-medium">Date & Time</th>
                <th className="pb-3 px-4 font-medium">Status</th>
                <th className="pb-3 pl-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {orders.map((order) => {
                const customerName = `${order.billing.first_name || ""} ${order.billing.last_name || ""}`.trim() || "Guest Customer";
                const dateObj = new Date(order.date_created);

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-zinc-50/70 transition-colors group cursor-pointer"
                  >
                    {/* Order ID & Store */}
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-50 text-[#00875A] border border-emerald-100/60 shrink-0">
                          <ShoppingBag className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-900 font-mono">
                            #{order.number}
                          </span>
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Store className="h-2.5 w-2.5" />
                            <span className="truncate max-w-[130px]">
                              {order.store_name || "WooStore"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 text-xs font-semibold text-zinc-800">
                      {customerName}
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col text-[11px]">
                        <span className="font-medium text-zinc-700">
                          {dateObj.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-zinc-400 font-mono">
                          {dateObj.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status.replace("-", " ")}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 pl-4 text-right">
                      <span className="text-xs font-bold font-mono text-zinc-900">
                        {formatCurrency(parseFloat(order.total || "0"))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
