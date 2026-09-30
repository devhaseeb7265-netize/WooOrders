"use client";

import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import {
  Radio,
  Search,
  Code,
  Copy,
  Check,
  X,
  Clock,
  RotateCcw,
  RefreshCw,
  Wifi,
  WifiOff,
  Info,
  Send,
  Sparkles,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { WebhookStatus } from "@/types/analytics";
import { useStore } from "@/context/StoreContext";
import { createClient } from "@/lib/supabase/client";
import { simulateWebhookEventAction } from "@/app/actions/store-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebhookLog {
  id: string;
  store_id: string;
  user_id: string;
  topic: string;
  event_id: string | null;
  resource_id: string | null;
  status: WebhookStatus;
  http_code: number | null;
  payload: Record<string, unknown> | null;
  received_at: string;
  // Joined from connected_stores
  storeName?: string;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, code }: { status: WebhookStatus; code: number | null }) {
  switch (status) {
    case "delivered":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#00875A] border border-emerald-200/80 text-xs font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00875A]" />
          {code ?? 200} OK
        </span>
      );
    case "retrying":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-semibold">
          <RotateCcw className="h-3 w-3 animate-spin" />
          {code} Retrying
        </span>
      );
    case "queued":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-semibold">
          <Clock className="h-3 w-3" />
          Queued
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-semibold">
          {code ?? "—"} Failed
        </span>
      );
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TOPICS = ["all", "order.created", "order.updated", "order.deleted", "batch.sync"] as const;

export default function WebhooksPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { hasConnectedStores, connectedStores, activeStoreId } = useStore();

  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  const webhookEndpointUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/woocommerce`
    : "https://your-domain.com/api/webhooks/woocommerce";

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(webhookEndpointUrl);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2000);
  };

  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    try {
      const res = await simulateWebhookEventAction(activeStoreId || undefined, "order.created");
      if (res.success) {
        setSimulationSuccess(true);
        setTimeout(() => setSimulationSuccess(false), 2500);
        await fetchLogs();
      }
    } finally {
      setIsSimulating(false);
    }
  };

  // ── Fetch webhook logs from Supabase ────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    if (!hasConnectedStores) {
      setLogs([]);
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from("webhook_logs")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(200);

      if (activeStoreId) {
        query = query.eq("store_id", activeStoreId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Attach store name from local connectedStores list
      const enriched: WebhookLog[] = (data ?? []).map((row) => ({
        ...row,
        storeName:
          connectedStores.find((s) => s.id === row.store_id)?.name ?? "Unknown Store",
      }));
      setLogs(enriched);
    } catch (err) {
      console.error("[WebhooksPage] fetchLogs", err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [hasConnectedStores, activeStoreId, connectedStores]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── Filters ─────────────────────────────────────────────────────────────────

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return logs.filter((log) => {
      const matchTopic = selectedTopic === "all" || log.topic === selectedTopic;
      const matchQuery =
        !q ||
        (log.event_id ?? "").toLowerCase().includes(q) ||
        (log.storeName ?? "").toLowerCase().includes(q) ||
        (log.resource_id ?? "").toLowerCase().includes(q) ||
        log.topic.toLowerCase().includes(q);
      return matchTopic && matchQuery;
    });
  }, [logs, selectedTopic, searchQuery]);

  const copyPayload = () => {
    if (!selectedLog?.payload) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useGSAP(
    () => {
      if (!containerRef.current) return;
      gsap.fromTo(
        containerRef.current.querySelectorAll(".webhook-reveal"),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.06, ease: "power2.out" }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full pb-14">
      {/* Header */}
      <div className="webhook-reveal flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Webhook Monitor
            </h1>
            {hasConnectedStores && logs.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-[#00875A]/10 text-[#00875A] text-xs font-bold font-mono">
                {logs.length} Events
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time WooCommerce webhook delivery log for your connected stores.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {hasConnectedStores && (
            <button
              type="button"
              onClick={handleSimulateWebhook}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#00875A] hover:bg-[#00704A] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {simulationSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Dispatched!</span>
                </>
              ) : (
                <>
                  <Send className={`h-3.5 w-3.5 ${isSimulating ? "animate-pulse" : ""}`} />
                  <span>{isSimulating ? "Simulating..." : "Send Test Ping"}</span>
                </>
              )}
            </button>
          )}

          {hasConnectedStores ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-zinc-200/80 rounded-full shadow-xs text-xs font-semibold text-zinc-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00875A] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00875A]" />
              </span>
              <span className="text-[#00875A]">Listening</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-100 rounded-full text-xs font-semibold text-zinc-500">
              <WifiOff className="h-3.5 w-3.5" />
              <span>No Store Connected</span>
            </div>
          )}

          <button
            type="button"
            onClick={fetchLogs}
            aria-label="Refresh webhook logs"
            className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-zinc-200/80 shadow-xs text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-[#00875A]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Empty — No Store */}
      {!hasConnectedStores && (
        <div className="webhook-reveal flex flex-col items-center justify-center py-28 gap-5 text-center">
          <div className="h-16 w-16 rounded-3xl bg-zinc-100 flex items-center justify-center">
            <Wifi className="h-7 w-7 text-zinc-400" />
          </div>
          <div>
            <p className="text-base font-bold text-zinc-800">No Webhooks Yet</p>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
              Connect a WooCommerce store and configure webhooks to see live event deliveries here.
            </p>
          </div>
        </div>
      )}

      {/* Store connected, but no logs */}
      {hasConnectedStores && !isLoading && logs.length === 0 && (
        <div className="webhook-reveal flex flex-col items-center justify-center py-16 gap-6 max-w-2xl mx-auto text-center">
          <div className="h-16 w-16 rounded-3xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-[#00875A]">
            <Radio className="h-7 w-7 animate-pulse" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-zinc-900">Listener Active & Ready for Events</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              WooCommerce webhooks are <strong>real-time push triggers</strong>. They do not download old orders; instead, WooCommerce automatically posts an event packet here when a customer places an order or updates status.
            </p>
          </div>

          {/* Webhook URL copy box */}
          <div className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Your Store Webhook Endpoint URL</span>
              <span className="text-xs font-mono text-zinc-800 truncate select-all">{webhookEndpointUrl}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyEndpoint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              {copiedWebhookUrl ? <Check className="h-3.5 w-3.5 text-[#00875A]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedWebhookUrl ? "Copied" : "Copy URL"}</span>
            </button>
          </div>

          {/* Test Dispatch Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSimulateWebhook}
              disabled={isSimulating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00875A] text-white text-xs font-bold shadow-md hover:bg-[#00704A] transition-colors cursor-pointer disabled:opacity-50"
            >
              {simulationSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Test Event Generated!</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{isSimulating ? "Simulating..." : "Send Test Webhook Event Now"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Live webhook log table */}
      {hasConnectedStores && logs.length > 0 && (
        <>
          {/* Filters */}
          <div className="webhook-reveal flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 select-none">
              {TOPICS.map((topic) => {
                const isSelected = selectedTopic === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSelectedTopic(topic)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 whitespace-nowrap cursor-pointer outline-none ${
                      isSelected
                        ? "bg-[#00875A] text-white shadow-xs"
                        : "bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/80 shadow-xs"
                    }`}
                  >
                    {topic === "all" ? "All Events" : topic}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search event ID, store, topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200/80 rounded-full text-xs font-medium text-zinc-900 placeholder:text-zinc-400 shadow-xs outline-none focus:border-[#00875A] focus:ring-2 focus:ring-[#00875A]/10 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="webhook-reveal bg-white rounded-[28px] border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider select-none">
                    <th className="py-3.5 px-5 font-medium">Event &amp; Topic</th>
                    <th className="py-3.5 px-5 font-medium">Store</th>
                    <th className="py-3.5 px-5 font-medium">Resource</th>
                    <th className="py-3.5 px-5 font-medium">HTTP Status</th>
                    <th className="py-3.5 px-5 font-medium">Timestamp</th>
                    <th className="py-3.5 px-5 font-medium text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100/80">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-xs text-zinc-400 font-medium">
                        No events match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="group hover:bg-zinc-50/80 transition-colors duration-150 cursor-pointer"
                      >
                        <td className="py-4 px-5">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-xs text-zinc-900 group-hover:text-[#00875A] transition-colors">
                              {log.event_id ?? log.id.slice(0, 12)}
                            </span>
                            <span className="inline-block mt-0.5 text-[10px] font-mono font-semibold text-zinc-500">
                              {log.topic}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-xs font-semibold text-zinc-800">
                          {log.storeName}
                        </td>
                        <td className="py-4 px-5 text-xs font-mono font-medium text-zinc-700">
                          {log.resource_id ?? "—"}
                        </td>
                        <td className="py-4 px-5">
                          <StatusBadge status={log.status} code={log.http_code} />
                        </td>
                        <td className="py-4 px-5 text-xs text-zinc-500 font-mono whitespace-nowrap">
                          {new Date(log.received_at).toLocaleTimeString()}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Code className="h-3 w-3" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Payload Inspector Drawer */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
          onClick={() => setSelectedLog(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-l-[32px] shadow-2xl h-full flex flex-col overflow-hidden relative border-l border-zinc-200/80 animate-in slide-in-from-right duration-300"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-zinc-900 font-mono">
                    {selectedLog.event_id ?? selectedLog.id.slice(0, 16)}
                  </h2>
                  <StatusBadge status={selectedLog.status} code={selectedLog.http_code} />
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Topic: <strong className="text-zinc-700 font-mono">{selectedLog.topic}</strong>
                  {" • "}
                  {selectedLog.storeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                aria-label="Close"
                className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 block font-normal">HTTP Status</span>
                <span className="font-mono font-bold text-zinc-800">{selectedLog.http_code ?? "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-normal">Resource</span>
                <span className="font-mono font-bold text-zinc-800">{selectedLog.resource_id ?? "—"}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  Raw Webhook Payload
                </span>
                {selectedLog.payload && (
                  <button
                    type="button"
                    onClick={copyPayload}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {copied ? (
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
                )}
              </div>

              <pre className="p-4 bg-zinc-950 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed shadow-inner">
                {selectedLog.payload
                  ? JSON.stringify(selectedLog.payload, null, 2)
                  : "No payload recorded."}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
