"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Check,
  X,
  Layers,
} from "lucide-react";
import { WCOrderStatus } from "@/types/woocommerce";
import {
  batchUpdateOrderStatusAction,
  batchTrashOrdersAction,
  batchRestoreOrdersAction,
  batchPermanentlyDeleteOrdersAction,
} from "@/app/actions/order-actions";

export type BatchActionType = "status" | "trash" | "restore" | "delete";

export interface BatchProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  orderIds: number[];
  actionType: BatchActionType;
  targetStatus?: WCOrderStatus;
  onCompleted?: () => void;
}

const CHUNK_SIZE = 20;

export function BatchProgressModal({
  isOpen,
  onClose,
  storeId,
  orderIds,
  actionType,
  targetStatus = "completed",
  onCompleted,
}: BatchProgressModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCount = orderIds.length;

  useEffect(() => {
    if (!isOpen || totalCount === 0 || !storeId) {
      return;
    }

    isCancelledRef.current = false;
    setIsProcessing(true);
    setIsDone(false);
    setProcessedCount(0);
    setUpdatedCount(0);
    setFailedCount(0);

    // Split into sequential chunks of 20 items
    const chunks: number[][] = [];
    for (let i = 0; i < totalCount; i += CHUNK_SIZE) {
      chunks.push(orderIds.slice(i, i + CHUNK_SIZE));
    }

    setTotalChunks(chunks.length);
    setCurrentChunkIndex(0);

    let currentProcessed = 0;
    let currentUpdated = 0;
    let currentFailed = 0;

    const executeQueue = async () => {
      for (let i = 0; i < chunks.length; i++) {
        if (isCancelledRef.current) break;

        setCurrentChunkIndex(i + 1);
        const chunk = chunks[i];

        try {
          let res: { success: boolean; count?: number; error?: string } = { success: false };

          switch (actionType) {
            case "status":
              res = await batchUpdateOrderStatusAction(storeId, chunk, targetStatus);
              break;
            case "trash":
              res = await batchTrashOrdersAction(storeId, chunk);
              break;
            case "restore":
              res = await batchRestoreOrdersAction(storeId, chunk, targetStatus);
              break;
            case "delete":
              res = await batchPermanentlyDeleteOrdersAction(storeId, chunk);
              break;
          }

          if (res.success) {
            currentUpdated += res.count ?? chunk.length;
          } else {
            currentFailed += chunk.length;
          }
        } catch {
          currentFailed += chunk.length;
        }

        currentProcessed += chunk.length;
        setProcessedCount(Math.min(currentProcessed, totalCount));
        setUpdatedCount(currentUpdated);
        setFailedCount(currentFailed);

        // Micro-delay between batches to yield thread and ensure smooth UI transitions
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      setIsProcessing(false);
      setIsDone(true);
    };

    executeQueue();

    return () => {
      isCancelledRef.current = true;
    };
  }, [isOpen, storeId, orderIds, actionType, targetStatus, totalCount]);

  if (!isOpen || !mounted) return null;

  const progressPercent = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;
  const remainingCount = Math.max(0, totalCount - processedCount);

  const getActionLabel = () => {
    switch (actionType) {
      case "status":
        return `Updating Status to "${targetStatus.replace("-", " ")}"`;
      case "trash":
        return "Moving Orders to Trash";
      case "restore":
        return `Restoring Orders (${targetStatus})`;
      case "delete":
        return "Permanently Deleting Orders";
      default:
        return "Processing Batch Action";
    }
  };

  const handleFinish = () => {
    onClose();
    if (onCompleted) {
      onCompleted();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-white rounded-[28px] border border-zinc-200/80 shadow-[0_24px_50px_rgba(0,0,0,0.18)] p-6 sm:p-7 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        {/* Header Block */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                isDone
                  ? failedCount > 0
                    ? "bg-amber-50 text-amber-600 border border-amber-200/70"
                    : "bg-emerald-50 text-[#00875A] border border-emerald-200/70"
                  : "bg-emerald-50 text-[#00875A] border border-emerald-200/70"
              }`}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isDone && failedCount === 0 ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Layers className="h-5 w-5" />
              )}
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 leading-tight">
                {isProcessing
                  ? `Processing Bulk Action (${processedCount} of ${totalCount} orders)...`
                  : `Bulk Action Completed (${updatedCount} of ${totalCount} orders)`}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                <span>{getActionLabel()}</span>
                {totalChunks > 1 && (
                  <span className="font-mono text-[11px] text-zinc-400">
                    • Batch {currentChunkIndex}/{totalChunks}
                  </span>
                )}
              </p>
            </div>
          </div>

          {isDone && (
            <button
              type="button"
              onClick={handleFinish}
              className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 rounded-full hover:bg-zinc-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Smooth Animated Progress Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500 font-medium">Queue Progress</span>
            <span className="font-bold text-zinc-900">{progressPercent}%</span>
          </div>

          <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200/50">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                isDone
                  ? failedCount > 0
                    ? "bg-amber-500"
                    : "bg-[#00875A]"
                  : "bg-gradient-to-r from-[#00875A] to-emerald-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric Badges Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Updated */}
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3 flex flex-col gap-1 items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Updated
            </span>
            <span className="text-base font-bold font-mono text-[#00875A]">
              {updatedCount}
            </span>
          </div>

          {/* Failed */}
          <div className="bg-rose-50/70 border border-rose-200/70 rounded-2xl p-3 flex flex-col gap-1 items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Failed
            </span>
            <span className="text-base font-bold font-mono text-rose-600">
              {failedCount}
            </span>
          </div>

          {/* Remaining */}
          <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-3 flex flex-col gap-1 items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Remaining
            </span>
            <span className="text-base font-bold font-mono text-zinc-700">
              {remainingCount}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex justify-end">
          {isProcessing ? (
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-100 text-zinc-400 text-xs font-bold cursor-not-allowed"
            >
              <Loader2 className="h-4 w-4 animate-spin text-[#00875A]" />
              <span>Processing sequential batches...</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#00875A] hover:bg-[#00704A] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
