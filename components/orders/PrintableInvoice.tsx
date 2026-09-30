"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Printer, Store as StoreIcon } from "lucide-react";
import { WCOrder } from "@/types/woocommerce";
import { useStore } from "@/context/StoreContext";

export interface PrintableInvoiceProps {
  orders: readonly WCOrder[];
  isOpen: boolean;
  onClose: () => void;
  autoPrint?: boolean;
}

interface InvoiceTemplateProps {
  order: WCOrder;
  storeName: string;
  storeLogo: string | null;
  storeAddress: string;
  storePhone: string;
  storeTerms: string;
  currencySymbol: string;
}

function InvoiceTemplate({
  order,
  storeName,
  storeLogo,
  storeAddress,
  storePhone,
  storeTerms,
  currencySymbol,
}: InvoiceTemplateProps) {
  const customerFirst = order.shipping?.first_name || order.billing?.first_name || "";
  const customerLast = order.shipping?.last_name || order.billing?.last_name || "";
  const customerName = `${customerFirst} ${customerLast}`.trim() || "Valued Customer";

  const custAddr1 = order.shipping?.address_1 || order.billing?.address_1 || "";
  const custAddr2 = order.shipping?.address_2 || order.billing?.address_2 || "";
  const custCity = order.shipping?.city || order.billing?.city || "";
  const custState = order.shipping?.state || order.billing?.state || "";
  const custZip = order.shipping?.postcode || order.billing?.postcode || "";
  const custCountry = order.shipping?.country || order.billing?.country || "";
  const custPhone = order.billing?.phone || order.shipping?.phone || "";

  const formattedDate = order.date_created
    ? new Date(order.date_created).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : new Date().toLocaleDateString("en-US");

  const formatMoney = (amount: string | number | undefined) => {
    const num = typeof amount === "number" ? amount : parseFloat(amount || "0");
    const sym = currencySymbol || "$";
    if (isNaN(num)) return `${sym}0.00`;
    return `${sym}${num.toFixed(2)}`;
  };

  const subtotalNum = (order.line_items || []).reduce(
    (acc, it) => acc + parseFloat(it.total || "0"),
    0
  );
  const discountNum = parseFloat(order.discount_total || "0");
  const taxNum = parseFloat(order.total_tax || "0");
  const totalNum = parseFloat(order.total || "0");
  const isCOD =
    (order.payment_method || "").toLowerCase().includes("cod") ||
    (order.payment_method_title || "").toLowerCase().includes("cash on delivery");
  const paidNum = isCOD ? 0 : totalNum;

  return (
    <div className="flex flex-col justify-between h-full w-full">
      {/* Top Half: Brand Header, Address Grid, Itemized Table */}
      <div>
        {/* Header: Brand, Meta & Stylized INVOICE Banner */}
        <div className="flex items-start justify-between gap-6 pb-4 border-b border-zinc-300">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {storeLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="h-10 w-10 object-contain rounded-lg border border-zinc-200 p-0.5"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-base">
                  <StoreIcon className="h-5 w-5" />
                </div>
              )}
              <h1 className="text-lg font-extrabold text-zinc-900 tracking-tight">
                {storeName}
              </h1>
            </div>

            <div className="text-xs text-zinc-700 flex flex-col gap-0.5 font-medium">
              <p>
                <span className="font-semibold text-zinc-900">Invoice Number:</span> #{order.number || order.id}
              </p>
              <p>
                <span className="font-semibold text-zinc-900">Date:</span> {formattedDate}
              </p>
            </div>
          </div>

          {/* Stylized Brand Banner INVOICE */}
          <div className="flex items-center bg-[#364f6b] text-white px-5 py-2 rounded-md shadow-xs">
            <div className="flex gap-1 border-r border-white/30 pr-2.5 mr-2.5">
              <span className="w-1 h-5 bg-white/90 rounded-full inline-block"></span>
              <span className="w-1 h-5 bg-white/90 rounded-full inline-block"></span>
            </div>
            <span className="tracking-[0.25em] font-black text-lg text-white">
              INVOICE
            </span>
          </div>
        </div>

        {/* Two-Column Address Grid: Bill From / Bill To */}
        <div className="grid grid-cols-2 gap-6 py-4 border-b border-zinc-300 text-xs">
          <div>
            <h3 className="font-bold text-zinc-900 text-xs mb-1">Bill from:</h3>
            <p className="font-semibold text-zinc-800">{storeName}</p>
            <p className="text-zinc-600 whitespace-pre-line leading-relaxed">{storeAddress}</p>
            {storePhone && <p className="text-zinc-600 mt-0.5 font-mono">{storePhone}</p>}
          </div>

          <div>
            <h3 className="font-bold text-zinc-900 text-xs mb-1">Bill to:</h3>
            <p className="font-semibold text-zinc-800">{customerName}</p>
            <div className="text-zinc-600 leading-relaxed">
              {custAddr1 && <p>{custAddr1}</p>}
              {custAddr2 && <p>{custAddr2}</p>}
              {(custCity || custState || custZip) && (
                <p>
                  {[custCity, custState, custZip].filter(Boolean).join(", ")}
                </p>
              )}
              {custCountry && <p>{custCountry}</p>}
            </div>
            {custPhone && <p className="text-zinc-600 mt-0.5 font-mono">{custPhone}</p>}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-4 border-b border-zinc-300">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-zinc-300">
                <th className="pb-2 font-bold text-zinc-900 uppercase tracking-wider text-[11px] w-[45%]">
                  Item
                </th>
                <th className="pb-2 font-bold text-zinc-900 uppercase tracking-wider text-[11px] text-center w-[12%]">
                  Quantity
                </th>
                <th className="pb-2 font-bold text-zinc-900 uppercase tracking-wider text-[11px] text-right w-[15%]">
                  Rate
                </th>
                <th className="pb-2 font-bold text-zinc-900 uppercase tracking-wider text-[11px] text-right w-[13%]">
                  Tax
                </th>
                <th className="pb-2 font-bold text-zinc-900 uppercase tracking-wider text-[11px] text-right w-[15%]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {(order.line_items || []).map((item, iIdx) => {
                const itemPrice = item.price || (item.quantity > 0 ? parseFloat(item.total) / item.quantity : 0);
                const itemTax = parseFloat(item.total_tax || "0");
                const itemTotal = parseFloat(item.total || "0");

                return (
                  <tr key={item.id || iIdx} className="align-top">
                    <td className="py-2 pr-4">
                      <p className="font-bold text-zinc-900 text-xs">{item.name}</p>
                      {item.sku && (
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          SKU: {item.sku}
                        </p>
                      )}
                      {item.meta_data && item.meta_data.length > 0 && (
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {item.meta_data
                            .filter((m) => !m.key.startsWith("_"))
                            .map((m, mIdx) => (
                              <span key={mIdx} className="mr-2">
                                {m.display_key || m.key}: {String(m.display_value || m.value)}
                              </span>
                            ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-center font-bold text-zinc-900 font-mono">
                      {String(item.quantity).padStart(2, "0")}
                    </td>
                    <td className="py-2 text-right font-medium text-zinc-700 font-mono">
                      {formatMoney(itemPrice)}
                    </td>
                    <td className="py-2 text-right font-medium text-zinc-700 font-mono">
                      {formatMoney(itemTax)}
                    </td>
                    <td className="py-2 text-right font-bold text-zinc-900 font-mono">
                      {formatMoney(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Half: Terms on Left, Totals Breakdown on Right & Slate Total Banner */}
      <div className="mt-auto pt-3">
        <div className="grid grid-cols-2 gap-6 pb-3 text-xs">
          <div>
            <h4 className="font-bold text-zinc-900 text-xs mb-1">Terms & Conditions:</h4>
            <p className="text-zinc-600 whitespace-pre-line leading-relaxed text-[10.5px]">
              {storeTerms}
            </p>
            {order.customer_note && (
              <div className="mt-2.5 p-2 bg-zinc-50 rounded-lg border border-zinc-200/80">
                <span className="font-bold text-zinc-800 text-[10.5px] block mb-0.5">
                  Customer Checkout Note:
                </span>
                <p className="text-zinc-600 italic text-[10.5px]">{order.customer_note}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 font-medium">
            <div className="flex items-center justify-between text-zinc-700">
              <span>Subtotal:</span>
              <span className="font-mono">{formatMoney(subtotalNum)}</span>
            </div>

            {discountNum > 0 && (
              <div className="flex items-center justify-between text-zinc-700">
                <span>Discount:</span>
                <span className="font-mono text-emerald-600">-{formatMoney(discountNum)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-zinc-700">
              <span>Tax:</span>
              <span className="font-mono">{formatMoney(taxNum)}</span>
            </div>

            <div className="flex items-center justify-between text-zinc-700">
              <span>Paid:</span>
              <span className="font-mono">{formatMoney(paidNum)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Line & Solid Slate Total Block */}
        <div className="pt-2.5 border-t border-zinc-300 flex justify-end">
          <div className="flex items-center justify-between bg-[#364f6b] text-white px-6 py-2.5 rounded-md min-w-[260px] shadow-sm">
            <span className="font-black text-sm uppercase tracking-wider">Total</span>
            <span className="font-black text-lg font-mono">{formatMoney(totalNum)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrintableInvoice({
  orders,
  isOpen,
  onClose,
  autoPrint = false,
}: PrintableInvoiceProps) {
  const { activeStore, currencySymbol } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure zero duplicates in incoming array
  const uniqueOrders = useMemo(() => {
    return Array.from(
      new Map(
        orders.map((order) => [
          order.id || (order as unknown as { wc_order_id?: number }).wc_order_id,
          order,
        ])
      ).values()
    );
  }, [orders]);

  useEffect(() => {
    if (isOpen && autoPrint && uniqueOrders.length > 0 && mounted) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, uniqueOrders, mounted]);

  if (!isOpen || uniqueOrders.length === 0 || !mounted) return null;

  const storeName = activeStore?.company_name || activeStore?.name || "Ecommerce Store";
  const storeLogo = activeStore?.logo_url || null;
  const storeAddress =
    activeStore?.bill_from_address || "Warehouse & Dispatch Unit\n100 Commerce Boulevard";
  const storePhone = activeStore?.company_phone || "+1 (555) 019-2834";
  const storeTerms =
    activeStore?.invoice_terms ||
    "Thank you for your business. For any return or support inquiries, please contact our support desk.";

  const modalContent = (
    <>
      {/* ── 1. SCREEN PREVIEW MODAL (Visible on screen, completely hidden during print) ── */}
      <div className="screen-preview-modal fixed inset-0 z-[99999] flex flex-col bg-zinc-900/85 backdrop-blur-md overflow-hidden select-none">
        {/* Top Preview Control Bar */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-zinc-900 text-white border-b border-zinc-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Invoice Print Preview</h2>
              <p className="text-xs text-zinc-400">
                Ready to print {uniqueOrders.length} order receipt{uniqueOrders.length > 1 ? "s" : ""} (1 order per page).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00875A] hover:bg-[#00704A] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print {uniqueOrders.length > 1 ? `All (${uniqueOrders.length})` : "Receipt"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Screen Preview Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center gap-8 bg-zinc-950/40">
          {uniqueOrders.map((order, idx) => (
            <div
              key={`screen-order-${order.id || idx}`}
              className="bg-white w-full max-w-4xl p-8 md:p-10 shadow-2xl rounded-2xl border border-zinc-200/80 min-h-[600px] flex flex-col justify-between"
            >
              <InvoiceTemplate
                order={order}
                storeName={storeName}
                storeLogo={storeLogo}
                storeAddress={storeAddress}
                storePhone={storePhone}
                storeTerms={storeTerms}
                currencySymbol={currencySymbol}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. DEDICATED PRINT CONTAINER (Hidden on screen, rendered ONLY during window.print) ── */}
      <div id="print-root" className="print-only-container">
        {uniqueOrders.map((order, idx) => (
          <div key={`print-order-${order.id || idx}`} className="single-invoice-sheet">
            <InvoiceTemplate
              order={order}
              storeName={storeName}
              storeLogo={storeLogo}
              storeAddress={storeAddress}
              storePhone={storePhone}
              storeTerms={storeTerms}
              currencySymbol={currencySymbol}
            />
          </div>
        ))}
      </div>

      {/* ── 3. STRICT CSS PRINT ISOLATION ENGINE ── */}
      <style jsx global>{`
        @media screen {
          .print-only-container {
            display: none !important;
          }
        }

        @page {
          size: A4 portrait;
          margin: 0mm !important; /* Strips out browser timestamp, page title, URL, and page numbering */
        }

        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Completely remove main application UI and preview modal from print layout flow */
          body > *:not(#print-root) {
            display: none !important;
          }

          .screen-preview-modal {
            display: none !important;
          }

          /* Render ONLY the printable container */
          #print-root {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            visibility: visible !important;
          }

          #print-root * {
            visibility: visible !important;
          }

          /* Strict 1-Order-Per-Page rule */
          .single-invoice-sheet {
            box-sizing: border-box !important;
            width: 100% !important;
            min-height: 297mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            padding: 14mm 16mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }

          /* First page avoids leading break, and last page NEVER produces a blank trailing page */
          .single-invoice-sheet:first-child {
            page-break-before: avoid !important;
            break-before: avoid !important;
          }

          .single-invoice-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>
    </>
  );

  return createPortal(modalContent, document.body);
}

export { PrintableInvoice as PrintableInvoiceModal };
