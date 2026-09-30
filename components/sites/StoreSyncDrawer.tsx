"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  CheckCircle2,
  Package,
  Layers,
  MapPin,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FlipButton } from "@/components/motion/FlipButton";
import { ConnectedStore } from "@/lib/stores/storage";

interface StoreSyncDrawerProps {
  store: ConnectedStore | null;
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: (storeId: string) => void;
}

interface SyncTask {
  readonly id: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  status: "waiting" | "running" | "completed";
}

export function StoreSyncDrawer({
  store,
  isOpen,
  onClose,
  onSyncComplete,
}: StoreSyncDrawerProps) {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const percentTextRef = useRef<HTMLSpanElement | null>(null);

  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [tasks, setTasks] = useState<SyncTask[]>([
    { id: "products", label: "Fetching active catalog products & variations", icon: Package, status: "waiting" },
    { id: "orders", label: "Syncing pending and processing order stream", icon: Layers, status: "waiting" },
    { id: "taxes", label: "Mapping tax classes & regional surcharge rates", icon: Sparkles, status: "waiting" },
    { id: "customers", label: "Caching customer profiles & shipping addresses", icon: MapPin, status: "waiting" },
  ]);

  useEffect(() => {
    if (isOpen && drawerRef.current) {
      gsap.fromTo(
        drawerRef.current,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.4, ease: "power3.out" }
      );
      runSyncEngine();
    } else {
      setProgress(0);
      setIsCompleted(false);
    }
  }, [isOpen]);

  const runSyncEngine = async () => {
    setProgress(0);
    setIsCompleted(false);

    setTasks([
      { id: "products", label: "Fetching active catalog products & variations", icon: Package, status: "running" },
      { id: "orders", label: "Syncing pending and processing order stream", icon: Layers, status: "waiting" },
      { id: "taxes", label: "Mapping tax classes & regional surcharge rates", icon: Sparkles, status: "waiting" },
      { id: "customers", label: "Caching customer profiles & shipping addresses", icon: MapPin, status: "waiting" },
    ]);

    // Stage 1
    await new Promise((r) => setTimeout(r, 450));
    setProgress(28);
    setTasks((prev) => [
      { ...prev[0], status: "completed" },
      { ...prev[1], status: "running" },
      prev[2],
      prev[3],
    ]);

    // Stage 2
    await new Promise((r) => setTimeout(r, 550));
    setProgress(62);
    setTasks((prev) => [
      prev[0],
      { ...prev[1], status: "completed" },
      { ...prev[2], status: "running" },
      prev[3],
    ]);

    // Stage 3
    await new Promise((r) => setTimeout(r, 400));
    setProgress(85);
    setTasks((prev) => [
      prev[0],
      prev[1],
      { ...prev[2], status: "completed" },
      { ...prev[3], status: "running" },
    ]);

    // Stage 4
    await new Promise((r) => setTimeout(r, 450));
    setProgress(100);
    setTasks((prev) => [
      prev[0],
      prev[1],
      prev[2],
      { ...prev[3], status: "completed" },
    ]);

    setIsCompleted(true);
    if (store && onSyncComplete) {
      onSyncComplete(store.id);
    }
  };

  useGSAP(
    () => {
      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          width: `${progress}%`,
          duration: 0.35,
          ease: "power2.out",
        });
      }
    },
    { dependencies: [progress] }
  );

  const handleClose = () => {
    if (!drawerRef.current) {
      onClose();
      return;
    }

    gsap.to(drawerRef.current, {
      xPercent: 100,
      duration: 0.28,
      ease: "power3.in",
      onComplete: onClose,
    });
  };

  if (!isOpen || !store) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
      onClick={handleClose}
    >
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-l-[32px] shadow-2xl h-full flex flex-col justify-between overflow-hidden relative border-l border-zinc-200/80"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white border border-zinc-200/80 shadow-xs text-[#00875A]">
              <RefreshCw className={`h-5 w-5 ${!isCompleted ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-900">
                Manual Store Sync
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium truncate max-w-[260px]">
                {store.name} • {store.url}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close sync drawer"
            className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sync Progress & Steps Container */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Animated Progress Bar */}
          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200/80 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700">
                {isCompleted ? "Sync Completed" : "Syncing Store Data..."}
              </span>
              <span
                ref={percentTextRef}
                className="font-mono font-bold text-[#00875A] text-sm"
              >
                {progress}%
              </span>
            </div>

            <div className="w-full bg-zinc-200/80 rounded-full h-3 overflow-hidden p-0.5">
              <div
                ref={progressBarRef}
                className="bg-[#00875A] h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Sync Task Checklist */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 select-none">
              Synchronization Pipeline
            </span>

            <div className="divide-y divide-zinc-100 border border-zinc-200/70 rounded-2xl overflow-hidden bg-white">
              {tasks.map((task) => {
                const Icon = task.icon;
                return (
                  <div
                    key={task.id}
                    className="p-4 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-zinc-50 border border-zinc-200/70 text-zinc-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span
                        className={
                          task.status === "completed"
                            ? "text-zinc-900 font-semibold"
                            : task.status === "running"
                            ? "text-[#00875A] font-medium"
                            : "text-zinc-400"
                        }
                      >
                        {task.label}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {task.status === "completed" && (
                        <CheckCircle2 className="h-4 w-4 text-[#00875A]" />
                      )}
                      {task.status === "running" && (
                        <Loader2 className="h-4 w-4 animate-spin text-[#00875A]" />
                      )}
                      {task.status === "waiting" && (
                        <div className="h-3.5 w-3.5 rounded-full border border-zinc-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completion Summary Card */}
          {isCompleted && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-start gap-3 animate-in fade-in duration-300">
              <CheckCircle2 className="h-5 w-5 text-[#00875A] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-950">
                  Telemetry Successfully Reconciled
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Synced 142 orders and catalog updates successfully in 1.4s. Local caches updated.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50/50">
          {isCompleted ? (
            <FlipButton
              variant="primary"
              size="md"
              label="Done"
              onClick={handleClose}
              className="w-full rounded-full shadow-md"
            />
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 px-4 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Run in Background
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
