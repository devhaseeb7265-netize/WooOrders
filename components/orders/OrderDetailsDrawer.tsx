"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Package,
  MapPin,
  CreditCard,
  Store,
  Clock,
  Tag,
  Ticket,
  Percent,
  Truck,
  FileText,
  Printer,
  Trash2,
} from "lucide-react";
import gsap from "gsap";
import { WCOrder, WCOrderStatus } from "@/types/woocommerce";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { useStore } from "@/context/StoreContext";
import { PrintableInvoice } from "./PrintableInvoice";

interface OrderDetailsDrawerProps {
  order: WCOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (orderId: number, newStatus: WCOrderStatus) => void;
}

const STATUS_SELECT_OPTIONS = [
  { value: "processing", label: "Processing", dotColor: "bg-amber-500" },
  { value: "completed", label: "Completed", dotColor: "bg-[#00875A]" },
  { value: "on-hold", label: "On Hold", dotColor: "bg-sky-500" },
  { value: "cancelled", label: "Cancelled", dotColor: "bg-rose-500" },
  { value: "refunded", label: "Refunded", dotColor: "bg-purple-500" },
  { value: "pending", label: "Pending", dotColor: "bg-zinc-400" },
  { value: "failed", label: "Failed", dotColor: "bg-red-500" },
];

function formatMetaKey(key: string): string {
  return key
    .replace(/^pa_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function OrderDetailsDrawer({
  order,
  isOpen,
  onClose,
  onStatusChange,
}: OrderDetailsDrawerProps) {
  const { trashOrder, currency, currencySymbol: storeCurrencySymbol } = useStore();
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const [copiedType, setCopiedType] = useState<"billing" | "shipping" | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && drawerRef.current) {
      gsap.fromTo(
        drawerRef.current,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.36, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!drawerRef.current) {
      onClose();
      return;
    }

    gsap.to(drawerRef.current, {
      xPercent: 100,
      duration: 0.25,
      ease: "power3.in",
      onComplete: onClose,
    });
  };

  const copyAddress = (type: "billing" | "shipping") => {
    if (!order) return;
    const addr = type === "billing" ? order.billing : order.shipping;
    const text = [
      `${addr.first_name} ${addr.last_name}`.trim(),
      addr.company,
      addr.address_1,
      addr.address_2,
      `${addr.city}, ${addr.state} ${addr.postcode}`.trim(),
      addr.country,
      addr.phone,
      addr.email,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Only render user-facing custom checkout fields; filter out all internal keys starting with '_'
  const customStoreMeta = useMemo(() => {
    if (!order || !order.meta_data) return [];
    return order.meta_data.filter((m) => {
      if (!m.key || m.key.startsWith("_")) return false;
      const strVal = typeof m.value === "string" ? m.value.trim() : String(m.value || "").trim();
      return strVal.length > 0;
    });
  }, [order]);

  if (!isOpen || !order) return null;

  const getStatusStyles = (status: WCOrderStatus) => {
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
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  const currencySymbol = storeCurrencySymbol || order.currency_symbol || "$";
  const displayCurrency = currency || order.currency || "USD";
  let subtotalCalc = "0.00";
  if (order.line_items && order.line_items.length > 0) {
    const itemsSum = order.line_items.reduce(
      (acc, it) => acc + (parseFloat(it.total) || 0),
      0
    );
    if (itemsSum > 0) {
      subtotalCalc = itemsSum.toFixed(2);
    } else {
      const cleanTotal = parseFloat(order.total) || 0;
      const shipping = parseFloat(order.shipping_total || "0") || 0;
      const tax = parseFloat(order.total_tax || "0") || 0;
      const discount = parseFloat(order.discount_total || "0") || 0;
      subtotalCalc = Math.max(0, cleanTotal - shipping - tax + discount).toFixed(2);
    }
  } else {
    const cleanTotal = parseFloat(order.total) || 0;
    const shipping = parseFloat(order.shipping_total || "0") || 0;
    const tax = parseFloat(order.total_tax || "0") || 0;
    const discount = parseFloat(order.discount_total || "0") || 0;
    subtotalCalc = Math.max(0, cleanTotal - shipping - tax + discount).toFixed(2);
  }

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end select-none"
      onClick={(e) => {
        if (e.target === backdropRef.current) handleClose();
      }}
    >
      <div
        ref={drawerRef}
        data-lenis-prevent="true"
        className="w-full max-w-2xl bg-white rounded-l-[32px] shadow-2xl h-full flex flex-col overflow-hidden relative border-l border-zinc-200/80"
      >
        {/* Header: Order Number, Status Pill, Store Name, and Date */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-3 truncate mr-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white border border-zinc-200/80 shadow-xs text-zinc-800 shrink-0">
              <Package className="h-5 w-5 text-[#00875A]" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 font-mono">
                  #{order.number}
                </h2>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold capitalize border ${getStatusStyles(
                    order.status
                  )}`}
                >
                  {order.status.replace("-", " ")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 truncate">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{new Date(order.date_created).toLocaleString()}</span>
                {order.store_name && (
                  <>
                    <span>•</span>
                    <Store className="h-3 w-3 shrink-0" />
                    <span className="truncate">{order.store_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close details"
            className="flex items-center justify-center h-9 w-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div
          ref={scrollAreaRef}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          className="flex-1 overflow-y-auto overscroll-contain p-6 flex flex-col gap-6"
        >
          {/* Block 1: Customer Information & Shipping Address cards */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 select-none">
              Customer & Shipping
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Billing Address Card */}
              <div className="bg-zinc-50/80 rounded-2xl p-4 border border-zinc-200/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
                      Billing Address
                    </span>
                    <button
                      type="button"
                      onClick={() => copyAddress("billing")}
                      aria-label="Copy Billing Address"
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedType === "billing" ? (
                        <>
                          <Check className="h-3 w-3 text-[#00875A]" />
                          <span className="text-[#00875A] font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">
                    {order.billing.first_name} {order.billing.last_name}
                  </p>
                  {order.billing.company && (
                    <p className="text-xs text-zinc-500">{order.billing.company}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-1">
                    {order.billing.address_1}
                    {order.billing.address_2 && `, ${order.billing.address_2}`}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {order.billing.city}, {order.billing.state} {order.billing.postcode},{" "}
                    {order.billing.country}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-200/50 text-[11px] text-zinc-500 font-mono flex flex-col gap-0.5">
                  {order.billing.email && <span>{order.billing.email}</span>}
                  {order.billing.phone && <span>{order.billing.phone}</span>}
                </div>
              </div>

              {/* Shipping Address Card */}
              <div className="bg-zinc-50/80 rounded-2xl p-4 border border-zinc-200/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                      Shipping Address
                    </span>
                    <button
                      type="button"
                      onClick={() => copyAddress("shipping")}
                      aria-label="Copy Shipping Address"
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedType === "shipping" ? (
                        <>
                          <Check className="h-3 w-3 text-[#00875A]" />
                          <span className="text-[#00875A] font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">
                    {order.shipping.first_name} {order.shipping.last_name}
                  </p>
                  {order.shipping.company && (
                    <p className="text-xs text-zinc-500">{order.shipping.company}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-1">
                    {order.shipping.address_1}
                    {order.shipping.address_2 && `, ${order.shipping.address_2}`}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {order.shipping.city}, {order.shipping.state} {order.shipping.postcode},{" "}
                    {order.shipping.country}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-200/50 text-[11px] text-zinc-500">
                  {order.shipping_lines && order.shipping_lines[0] ? (
                    <span className="block truncate">
                      Method:{" "}
                      <strong className="text-zinc-800 font-sans">
                        {order.shipping_lines[0].method_title}
                      </strong>
                    </span>
                  ) : (
                    <span className="text-zinc-400">Standard Shipping</span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Note (rendered only if present) */}
            {order.customer_note && order.customer_note.trim().length > 0 && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
                <FileText className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-amber-900">Customer Note: </strong>
                  <span>{order.customer_note}</span>
                </div>
              </div>
            )}
          </section>

          {/* Block 2: Ordered Items breakdown */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 select-none">
              Ordered Items ({order.line_items.length})
            </h3>
            <div className="divide-y divide-zinc-100 border border-zinc-200/70 rounded-2xl overflow-hidden bg-white shadow-2xs">
              {order.line_items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col gap-2.5 hover:bg-zinc-50/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 leading-snug">
                        {item.name}
                      </h4>
                      {item.sku && (
                        <span className="text-[11px] text-zinc-400 font-mono">
                          SKU: {item.sku}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-zinc-900 font-mono">
                        {currencySymbol}
                        {parseFloat(item.total).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-400 block font-mono">
                        Qty: {item.quantity} × {currencySymbol}
                        {item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Variation / Attributes Badges */}
                  {item.meta_data && item.meta_data.length > 0 && (
                    <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                      {item.meta_data.map((meta, idx) => (
                        <span
                          key={`${item.id}-meta-${idx}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100/90 text-zinc-700 text-[10px] font-medium border border-zinc-200/60"
                        >
                          <Tag className="h-2.5 w-2.5 text-zinc-400" />
                          <span>{meta.display_key || formatMetaKey(meta.key)}:</span>
                          <strong className="text-zinc-900 font-semibold">
                            {String(meta.display_value || meta.value)}
                          </strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* User-facing custom checkout fields (Omitted completely if none exist) */}
          {customStoreMeta.length > 0 && (
            <section className="flex flex-col gap-2 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 select-none">
                Custom Checkout Details
              </h3>
              <div className="border border-zinc-200/70 rounded-2xl overflow-hidden bg-white divide-y divide-zinc-100 shadow-2xs">
                {customStoreMeta.map((meta, i) => (
                  <div
                    key={`custom-meta-${i}`}
                    className="flex items-center justify-between text-xs py-2.5 px-4 bg-white hover:bg-zinc-50/50 transition-colors"
                  >
                    <span className="font-medium text-zinc-600 text-xs truncate max-w-[220px]">
                      {meta.display_key || formatMetaKey(meta.key)}
                    </span>
                    <span className="font-mono text-zinc-900 font-semibold text-xs truncate max-w-[280px]">
                      {typeof meta.value === "object"
                        ? JSON.stringify(meta.value)
                        : String(meta.display_value || meta.value)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Block 3: Payment & Tax Summary */}
          <section className="flex flex-col gap-2 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 select-none">
              Payment & Tax Summary
            </h3>
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/70 flex flex-col gap-2.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-mono font-medium">
                  {currencySymbol}
                  {subtotalCalc}
                </span>
              </div>

              {/* Discounts & Active Coupons */}
              {parseFloat(order.discount_total || "0") > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <div className="flex items-center gap-1.5">
                    <span>Discounts</span>
                    {order.coupon_lines && order.coupon_lines.length > 0 && (
                      <div className="flex items-center gap-1">
                        {order.coupon_lines.map((coupon) => (
                          <span
                            key={coupon.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-[#00875A] text-[10px] font-bold font-mono border border-emerald-300/60"
                          >
                            <Ticket className="h-2.5 w-2.5" />
                            {coupon.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-mono font-semibold">
                    -{currencySymbol}
                    {parseFloat(order.discount_total).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Shipping Line */}
              <div className="flex items-center justify-between text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3 w-3 text-zinc-400" />
                  <span>
                    Shipping (
                    {order.shipping_lines[0]?.method_title || "Standard Delivery"})
                  </span>
                </span>
                <span className="font-mono font-medium">
                  {currencySymbol}
                  {parseFloat(order.shipping_total || "0").toFixed(2)}
                </span>
              </div>

              {/* Fee Lines (if any exist) */}
              {order.fee_lines &&
                order.fee_lines.map((fee) => (
                  <div
                    key={fee.id}
                    className="flex items-center justify-between text-zinc-600"
                  >
                    <span>{fee.name}</span>
                    <span className="font-mono font-medium">
                      {currencySymbol}
                      {parseFloat(fee.total).toFixed(2)}
                    </span>
                  </div>
                ))}

              {/* Taxes Breakdown */}
              {order.tax_lines &&
                order.tax_lines.map((tax) => (
                  <div
                    key={tax.id}
                    className="flex items-center justify-between text-zinc-500 text-[11px]"
                  >
                    <span className="flex items-center gap-1">
                      <Percent className="h-2.5 w-2.5 text-zinc-400" />
                      <span>{tax.label}</span>
                    </span>
                    <span className="font-mono font-medium">
                      {currencySymbol}
                      {parseFloat(tax.tax_total).toFixed(2)}
                    </span>
                  </div>
                ))}

              {/* Grand Total */}
              <div className="pt-2.5 mt-1 border-t border-zinc-200 flex items-center justify-between text-sm font-bold text-zinc-900">
                <span>Total Amount</span>
                <span className="font-mono text-base text-[#00875A] font-bold">
                  {currencySymbol}
                  {parseFloat(order.total).toFixed(2)} {displayCurrency}
                </span>
              </div>

              {order.payment_method_title && (
                <div className="mt-1 pt-2 border-t border-zinc-200/50 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Method: {order.payment_method_title}</span>
                  {order.transaction_id && <span>Ref: {order.transaction_id}</span>}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer Actions: Clean action buttons (Print Receipt, Move to Trash, Update Status) */}
        <div className="p-4 px-6 border-t border-zinc-200/80 bg-zinc-50/90 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Move order #${order.number} to trash?`)) {
                trashOrder(order.id);
                handleClose();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Move to Trash</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200/80 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-[#00875A]" />
              <span>Print Receipt</span>
            </button>

            {onStatusChange && (
              <ThemedSelect
                value={order.status}
                onChange={(newStatus) =>
                  onStatusChange(order.id, newStatus as WCOrderStatus)
                }
                options={STATUS_SELECT_OPTIONS}
                variant="pill"
                size="sm"
                align="right"
                ariaLabel="Update order status"
              />
            )}
          </div>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {order && (
        <PrintableInvoice
          orders={[order]}
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          autoPrint={true}
        />
      )}
    </div>
  );
}
