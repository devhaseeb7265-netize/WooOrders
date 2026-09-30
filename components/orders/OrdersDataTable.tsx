"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  Download,
  Check,
  Eye,
  Trash2,
  UserCheck,
  ChevronDown,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { WCOrder, WCOrderStatus } from "@/types/woocommerce";
import { OrderStatusDropdown } from "./OrderStatusDropdown";
import { useStore } from "@/context/StoreContext";
import { formatCurrency as formatPriceExact } from "@/lib/utils/formatCurrency";
import { exportOrdersToCSV, exportOrdersToExcel } from "@/lib/export/exportEngine";
import { PrintableInvoice } from "./PrintableInvoice";
import { BatchProgressModal, BatchActionType } from "./BatchProgressModal";

interface OrdersDataTableProps {
  data: readonly WCOrder[];
  onSelectOrder: (order: WCOrder) => void;
  onUpdateOrderStatus: (orderId: number, status: WCOrderStatus) => void;
  onBatchStatusChange: (orderIds: number[], status: WCOrderStatus) => void;
  onDeleteOrder?: (orderId: number) => void;
  onBatchDelete?: (orderIds: number[]) => void;
  onRestoreOrder?: (orderId: number) => void;
  onPermanentlyDeleteOrder?: (orderId: number) => void;
  onBatchRestore?: (orderIds: number[]) => void;
  onBatchPermanentlyDelete?: (orderIds: number[]) => void;
  searchQuery?: string;
  statusFilter?: string;
}

export function OrdersDataTable({
  data,
  onSelectOrder,
  onUpdateOrderStatus,
  onBatchStatusChange,
  onDeleteOrder,
  onBatchDelete,
  onRestoreOrder,
  onPermanentlyDeleteOrder,
  onBatchRestore,
  onBatchPermanentlyDelete,
  searchQuery = "",
  statusFilter = "all",
}: OrdersDataTableProps) {
  const {
    formatCurrency,
    currency,
    activeStoreId,
    refreshActiveStore,
    trashOrder,
    restoreOrder,
    permanentlyDeleteOrder,
    batchTrashOrders,
    batchRestoreOrders,
    batchPermanentlyDeleteOrders,
  } = useStore();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isBatchStatusOpen, setIsBatchStatusOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [ordersToPrint, setOrdersToPrint] = useState<readonly WCOrder[]>([]);

  const [batchModalState, setBatchModalState] = useState<{
    isOpen: boolean;
    orderIds: number[];
    actionType: BatchActionType;
    targetStatus?: WCOrderStatus;
  }>({
    isOpen: false,
    orderIds: [],
    actionType: "status",
    targetStatus: "completed",
  });

  // Filtered dataset matching search query and status filter
  const filteredData = useMemo(() => {
    let result = [...data];

    if (statusFilter && statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((order) => {
        const idMatch = order.number.toLowerCase().includes(q);
        const nameMatch = `${order.billing.first_name} ${order.billing.last_name}`
          .toLowerCase()
          .includes(q);
        const emailMatch = order.billing.email?.toLowerCase().includes(q) ?? false;
        const storeMatch = order.store_name?.toLowerCase().includes(q) ?? false;
        return idMatch || nameMatch || emailMatch || storeMatch;
      });
    }

    return result;
  }, [data, statusFilter, searchQuery]);

  const columns = useMemo<ColumnDef<WCOrder>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all rows"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 rounded-md border-zinc-300 text-[#00875A] focus:ring-[#00875A] cursor-pointer accent-[#00875A]"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select order ${row.original.number}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded-md border-zinc-300 text-[#00875A] focus:ring-[#00875A] cursor-pointer accent-[#00875A]"
          />
        ),
      },
      {
        accessorKey: "number",
        header: "Order ID",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs text-zinc-900 group-hover:text-[#00875A] transition-colors">
            #{row.original.number}
          </span>
        ),
      },
      {
        accessorKey: "date_created",
        header: "Date",
        cell: ({ row }) => {
          const date = new Date(row.original.date_created);
          return (
            <div className="flex flex-col text-xs">
              <span className="text-zinc-800 font-medium">
                {date.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        },
      },
      {
        id: "customer",
        header: "Customer",
        cell: ({ row }) => (
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-zinc-900">
              {row.original.billing.first_name} {row.original.billing.last_name}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[190px]">
              {row.original.billing.email}
            </span>
          </div>
        ),
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => {
          const count = row.original.line_items.reduce(
            (acc, item) => acc + item.quantity,
            0
          );
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-medium font-mono">
              {count} {count === 1 ? "item" : "items"}
            </span>
          );
        },
      },
      {
        accessorKey: "total",
        header: "Total Amount",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-xs text-zinc-900">
              {formatPriceExact(row.original.total, currency || row.original.currency)}
            </span>
            <span className="text-[10px] text-zinc-400 uppercase font-mono">
              {currency || row.original.currency}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const lastModifiedBy = row.original.last_modified_by;

          return (
            <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-1 items-start">
              <OrderStatusDropdown
                status={status}
                onChange={(newStatus) =>
                  onUpdateOrderStatus(row.original.id, newStatus)
                }
              />

              {lastModifiedBy && (
                <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                  <UserCheck className="h-2.5 w-2.5 text-[#00875A]" />
                  <span>Updated by <strong className="text-zinc-700 font-semibold">{lastModifiedBy}</strong></span>
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isTrash = row.original.status === "trash";

          return (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onSelectOrder(row.original)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200/80 text-xs font-medium transition-colors cursor-pointer"
              >
                <Eye className="h-3 w-3" />
                <span>Details</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOrdersToPrint([row.original]);
                  setIsPrintModalOpen(true);
                }}
                title="Print Invoice Receipt"
                className="p-1.5 rounded-full text-zinc-400 hover:text-[#00875A] hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
              </button>

              {isTrash ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (onRestoreOrder) onRestoreOrder(row.original.id);
                      else restoreOrder(row.original.id);
                    }}
                    title="Restore order"
                    aria-label={`Restore order ${row.original.number}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#00875A] border border-emerald-200/80 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Permanently delete order #${row.original.number}? This cannot be undone.`)) {
                        if (onPermanentlyDeleteOrder) onPermanentlyDeleteOrder(row.original.id);
                        else permanentlyDeleteOrder(row.original.id);
                      }
                    }}
                    title="Delete permanently"
                    aria-label={`Delete permanently order ${row.original.number}`}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteOrder) onDeleteOrder(row.original.id);
                    else trashOrder(row.original.id);
                  }}
                  title="Move to trash"
                  aria-label={`Move order ${row.original.number} to trash`}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [
      onSelectOrder,
      onUpdateOrderStatus,
      onDeleteOrder,
      onRestoreOrder,
      onPermanentlyDeleteOrder,
      restoreOrder,
      permanentlyDeleteOrder,
      trashOrder,
    ]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 100,
      },
    },
  });

  const selectedCount = Object.keys(rowSelection).length;

  const selectQuickCount = (count: number) => {
    const targetCount = Math.min(count, filteredData.length);
    const newSelection: RowSelectionState = {};
    for (let i = 0; i < targetCount; i++) {
      newSelection[i] = true;
    }
    setRowSelection(newSelection);
  };

  const selectAllFilteredOrders = () => {
    const newSelection: RowSelectionState = {};
    filteredData.forEach((_, idx) => {
      newSelection[idx] = true;
    });
    setRowSelection(newSelection);
  };

  const clearSelection = () => {
    setRowSelection({});
  };

  const handleBatchStatusApply = (status: WCOrderStatus) => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedIds = selectedIndices
      .map((idx) => filteredData[idx]?.id)
      .filter((id): id is number => typeof id === "number");

    if (selectedIds.length > 0) {
      // 1. Instant Optimistic UI Update (0ms delay across all 1500 rows)
      onBatchStatusChange(selectedIds, status);

      // 2. Open High-Speed Background Progress Sync
      setBatchModalState({
        isOpen: true,
        orderIds: selectedIds,
        actionType: "status",
        targetStatus: status,
      });
      setIsBatchStatusOpen(false);
    }
  };

  const handleBatchTrashClick = () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedIds = selectedIndices
      .map((idx) => filteredData[idx]?.id)
      .filter((id): id is number => typeof id === "number");

    if (selectedIds.length > 0) {
      // Instant Optimistic Update
      if (onBatchDelete) onBatchDelete(selectedIds);
      else batchTrashOrders(selectedIds);

      setBatchModalState({
        isOpen: true,
        orderIds: selectedIds,
        actionType: "trash",
      });
    }
  };

  const handleBatchRestoreClick = () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedIds = selectedIndices
      .map((idx) => filteredData[idx]?.id)
      .filter((id): id is number => typeof id === "number");

    if (selectedIds.length > 0) {
      // Instant Optimistic Update
      if (onBatchRestore) onBatchRestore(selectedIds);
      else batchRestoreOrders(selectedIds);

      setBatchModalState({
        isOpen: true,
        orderIds: selectedIds,
        actionType: "restore",
        targetStatus: "processing",
      });
    }
  };

  const handleBatchPermanentDeleteClick = () => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    const selectedIds = selectedIndices
      .map((idx) => filteredData[idx]?.id)
      .filter((id): id is number => typeof id === "number");

    if (
      selectedIds.length > 0 &&
      window.confirm(`Permanently delete ${selectedIds.length.toLocaleString()} orders? This cannot be undone.`)
    ) {
      // Instant Optimistic Update
      if (onBatchPermanentlyDelete) onBatchPermanentlyDelete(selectedIds);
      else batchPermanentlyDeleteOrders(selectedIds);

      setBatchModalState({
        isOpen: true,
        orderIds: selectedIds,
        actionType: "delete",
      });
    }
  };

  const getSelectedOrders = (): readonly WCOrder[] => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    return selectedIndices
      .map((idx) => filteredData[idx])
      .filter((o): o is WCOrder => Boolean(o));
  };

  const handleExportExcel = () => {
    const orders = getSelectedOrders();
    if (orders.length === 0) return;
    exportOrdersToExcel(orders, "courier_orders");
    setIsExportDropdownOpen(false);
  };

  const handleExportCSV = () => {
    const orders = getSelectedOrders();
    if (orders.length === 0) return;
    exportOrdersToCSV(orders, "courier_orders");
    setIsExportDropdownOpen(false);
  };

  const handlePrintInvoices = () => {
    const orders = getSelectedOrders();
    if (orders.length === 0) return;
    setOrdersToPrint(orders);
    setIsPrintModalOpen(true);
    setIsExportDropdownOpen(false);
  };

  return (
    <div className="bg-white rounded-[28px] border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden w-full">
      {/* Batch Actions Bar (Reveals when rows are checked) */}
      {selectedCount > 0 && (
        <div className="relative z-30 bg-[#00875A] text-white px-6 py-3 flex items-center justify-between transition-all duration-300 animate-in fade-in select-none">
          <div className="flex items-center gap-3">
            <span className="h-6 px-2.5 rounded-full bg-white/20 text-white text-xs font-bold font-mono flex items-center justify-center">
              {selectedCount}
            </span>
            <span className="text-xs font-semibold tracking-wide">
              {selectedCount === 1 ? "order selected" : "orders selected"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {statusFilter === "trash" ? (
              <>
                <button
                  type="button"
                  onClick={handleBatchRestoreClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#00875A] text-xs font-bold hover:bg-emerald-50 transition-colors cursor-pointer shadow-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restore Selected</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchPermanentDeleteClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Permanently</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleBatchStatusApply("completed")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#00875A] text-xs font-bold hover:bg-emerald-50 transition-colors cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark Completed</span>
                </button>

                <div className="relative select-none">
                  <button
                    type="button"
                    onClick={() => setIsBatchStatusOpen(!isBatchStatusOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Change Status</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-white/70 transition-transform ${
                        isBatchStatusOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>

                  {isBatchStatusOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-[90]"
                        onClick={() => setIsBatchStatusOpen(false)}
                      />
                      <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-2xl border border-black/[0.08] shadow-[0_16px_36px_rgba(0,0,0,0.18)] p-1.5 z-[100] flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Apply to Selected
                        </div>
                        {[
                          { value: "processing", label: "Processing", color: "bg-amber-500" },
                          { value: "completed", label: "Completed", color: "bg-[#00875A]" },
                          { value: "on-hold", label: "On Hold", color: "bg-sky-500" },
                          { value: "cancelled", label: "Cancelled", color: "bg-rose-500" },
                          { value: "refunded", label: "Refunded", color: "bg-purple-500" },
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              handleBatchStatusApply(item.value as WCOrderStatus);
                              setIsBatchStatusOpen(false);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-left cursor-pointer"
                          >
                            <span className={`h-2 w-2 rounded-full ${item.color}`} />
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleBatchTrashClick}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Move to Trash</span>
                </button>
              </>
            )}

            {/* Courier Export & Invoice Printing Dropdown */}
            <div className="relative select-none">
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export & Print</span>
                <ChevronDown
                  className={`h-3 w-3 text-white/70 transition-transform ${
                    isExportDropdownOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

              {isExportDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[90]"
                    onClick={() => setIsExportDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-black/[0.08] shadow-[0_16px_36px_rgba(0,0,0,0.18)] p-2 z-[100] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Courier Export & Invoicing
                    </div>

                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">Export for Courier (.xlsx)</p>
                        <p className="text-[10px] text-zinc-400 font-normal">Excel spreadsheet with COD & address</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">Export for Courier (.csv)</p>
                        <p className="text-[10px] text-zinc-400 font-normal">Universal CSV logistics manifest</p>
                      </div>
                    </button>

                    <div className="border-t border-zinc-100 my-0.5" />

                    <button
                      type="button"
                      onClick={handlePrintInvoices}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-50 text-purple-700 shrink-0">
                        <Printer className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">Print Invoices / Receipts</p>
                        <p className="text-[10px] text-zinc-400 font-normal">Printable receipt with store branding</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setRowSelection({})}
              className="text-xs text-white/80 hover:text-white underline ml-2 cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Quick Multi-Volume Selection Bar */}
      <div className="px-6 py-2.5 bg-zinc-50/70 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
        <div className="flex flex-wrap items-center gap-1.5 text-zinc-500 font-medium">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
            Quick Select:
          </span>
          <button
            type="button"
            onClick={() => selectQuickCount(100)}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200/80 text-zinc-700 font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
          >
            100 Orders
          </button>
          <button
            type="button"
            onClick={() => selectQuickCount(500)}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200/80 text-zinc-700 font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
          >
            500 Orders
          </button>
          <button
            type="button"
            onClick={() => selectQuickCount(1000)}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200/80 text-zinc-700 font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
          >
            1,000 Orders
          </button>
          <button
            type="button"
            onClick={() => selectQuickCount(1500)}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200/80 text-zinc-700 font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
          >
            1,500 Orders
          </button>
          <button
            type="button"
            onClick={selectAllFilteredOrders}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-[#00875A] font-bold text-[11px] transition-colors cursor-pointer"
          >
            All ({filteredData.length.toLocaleString()})
          </button>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-rose-600 text-[11px] font-semibold transition-colors cursor-pointer ml-1"
            >
              Deselect All
            </button>
          )}
        </div>

        <div className="text-[11px] text-zinc-500 font-mono">
          {selectedCount > 0 ? (
            <span>
              <strong className="text-zinc-900 font-bold">{selectedCount.toLocaleString()}</strong> of{" "}
              {filteredData.length.toLocaleString()} selected
            </span>
          ) : (
            <span>Total {filteredData.length.toLocaleString()} orders</span>
          )}
        </div>
      </div>

      {/* Gmail-Style Global Selection Banner when all visible page rows are selected */}
      {table.getIsAllPageRowsSelected() &&
        filteredData.length > table.getRowModel().rows.length &&
        selectedCount < filteredData.length && (
          <div className="bg-emerald-50 border-b border-emerald-200/90 px-6 py-2 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in select-none">
            <span>
              All <strong>{table.getRowModel().rows.length}</strong> orders on this page are selected.
            </span>
            <button
              type="button"
              onClick={selectAllFilteredOrders}
              className="font-bold underline text-[#00875A] hover:text-[#00704A] cursor-pointer"
            >
              Select all {filteredData.length.toLocaleString()} orders matching this filter
            </button>
          </div>
        )}

      {/* TanStack Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider select-none"
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-3.5 px-5 font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-zinc-100/80">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onSelectOrder(row.original)}
                  className={`group transition-colors duration-150 cursor-pointer ${
                    row.getIsSelected()
                      ? "bg-[#00875A]/5 hover:bg-[#00875A]/8"
                      : "hover:bg-zinc-50/80"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-4 px-5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-zinc-400 text-xs">
                  No orders match the current search or status filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Per-Page Controls */}
      <div className="p-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs select-none">
        <div className="flex flex-wrap items-center gap-2 text-zinc-500">
          <span>Rows per page:</span>
          <div className="flex flex-wrap items-center gap-1 bg-zinc-100 p-0.5 rounded-xl border border-zinc-200/80">
            {[100, 500, 1000, 1500].map((pageSize) => (
              <button
                key={pageSize}
                type="button"
                onClick={() => table.setPageSize(pageSize)}
                className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                  table.getState().pagination.pageSize === pageSize
                    ? "bg-white text-zinc-900 shadow-2xs font-bold"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {pageSize}
              </button>
            ))}
          </div>
          <span className="text-zinc-400 ml-1">
            Total {filteredData.length.toLocaleString()} records
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-mono mr-1">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(1, table.getPageCount())}
          </span>

          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 disabled:pointer-events-none text-zinc-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 disabled:pointer-events-none text-zinc-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Printable Order Invoices Modal / Print View */}
      <PrintableInvoice
        orders={ordersToPrint}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        autoPrint={true}
      />

      {/* Chunked Batch Operations Progress Modal */}
      <BatchProgressModal
        isOpen={batchModalState.isOpen}
        onClose={() => setBatchModalState((prev) => ({ ...prev, isOpen: false }))}
        storeId={activeStoreId || ""}
        orderIds={batchModalState.orderIds}
        actionType={batchModalState.actionType}
        targetStatus={batchModalState.targetStatus}
        onCompleted={() => {
          setRowSelection({});
          refreshActiveStore();
        }}
      />
    </div>
  );
}
