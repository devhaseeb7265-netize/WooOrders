"use client";

import React, { useState } from "react";
import {
  Store,
  Radio,
  Sliders,
  Users,
  Copy,
  Check,
  RefreshCw,
  Key,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Clock,
  Coins,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Receipt,
} from "lucide-react";
import { FlipButton } from "@/components/motion/FlipButton";
import { TeamUserManagement } from "@/components/settings/TeamUserManagement";
import { StoreInvoiceSettings } from "@/components/settings/StoreInvoiceSettings";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ConnectSiteModal } from "@/components/sites/ConnectSiteModal";
import { useStore, SUPPORTED_CURRENCIES } from "@/context/StoreContext";
import { simulateWebhookEventAction } from "@/app/actions/store-actions";

type SettingsTab = "stores" | "invoicing" | "webhooks" | "preferences" | "team";

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("stores");
  const {
    connectedStores: stores,
    removeStore,
    refreshActiveStore,
    addStore,
    currency,
    setCurrency,
    autoRefreshInterval,
    setAutoRefreshInterval,
    emailAlerts,
    setEmailAlerts,
    soundAlerts,
    setSoundAlerts,
  } = useStore();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Webhooks state
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState("whsec_live_99a8b1c2d3e4f5");
  const [isSendingTestWebhook, setIsSendingTestWebhook] = useState(false);
  const [testWebhookSuccess, setTestWebhookSuccess] = useState(false);

  // Stores testing state
  const [testingStoreId, setTestingStoreId] = useState<string | null>(null);
  const [testedSuccessId, setTestedSuccessId] = useState<string | null>(null);

  // Feedback banner
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const inboundWebhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/woocommerce`
      : "https://app.wooorders.com/api/webhooks/woocommerce";

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(inboundWebhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(webhookSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleGenerateSecret = () => {
    const nextSecret = `whsec_live_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    setWebhookSecret(nextSecret);
    triggerFeedback("New webhook signing secret generated.");
  };

  const handleTestConnection = async (storeId: string) => {
    setTestingStoreId(storeId);
    try {
      await refreshActiveStore();
      setTestedSuccessId(storeId);
      setTimeout(() => setTestedSuccessId(null), 2500);
    } finally {
      setTestingStoreId(null);
    }
  };

  const handleSendTestWebhook = async () => {
    setIsSendingTestWebhook(true);
    try {
      await simulateWebhookEventAction(stores[0]?.id, "order.created");
      setTestWebhookSuccess(true);
      setTimeout(() => setTestWebhookSuccess(false), 3000);
      triggerFeedback("Test webhook delivered successfully! Check the Webhook Monitor.");
    } finally {
      setIsSendingTestWebhook(false);
    }
  };

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-white border border-black/[0.04] p-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.02)] w-fit select-none flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab("stores")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer outline-none ${
            activeTab === "stores"
              ? "bg-[#00875A] text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Store className="h-3.5 w-3.5" />
          <span>Connected Stores ({stores.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invoicing")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer outline-none ${
            activeTab === "invoicing"
              ? "bg-[#00875A] text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Invoice & Branding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("webhooks")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer outline-none ${
            activeTab === "webhooks"
              ? "bg-[#00875A] text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>Webhook Endpoints</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer outline-none ${
            activeTab === "team"
              ? "bg-[#00875A] text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Team Members</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer outline-none ${
            activeTab === "preferences"
              ? "bg-[#00875A] text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>General Preferences</span>
        </button>
      </div>

      {/* Live Feedback Toast */}
      {savedFeedback && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs font-semibold text-[#00875A] animate-in fade-in duration-200 shadow-xs">
          <Check className="h-4 w-4 shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* Tab 1: Connected Stores & API Credential Management */}
      {activeTab === "stores" && (
        <div className="bg-white rounded-[28px] p-7 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Store API Credentials
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage cryptographic keys and test connection health for synced WooCommerce storefronts.
              </p>
            </div>

            <FlipButton
              variant="primary"
              size="sm"
              icon={<Plus className="h-3.5 w-3.5 mr-0.5" />}
              label="+ Add New Store"
              onClick={() => setIsConnectModalOpen(true)}
              className="rounded-full shadow-xs text-xs font-semibold"
            />
          </div>

          {stores.length > 0 ? (
            <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-2xl overflow-hidden">
              {stores.map((s) => (
                <div
                  key={s.id}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white hover:bg-zinc-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-50 text-[#00875A] shrink-0">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-zinc-900">{s.name}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#00875A] border border-emerald-200/80 text-[10px] font-bold uppercase font-mono">
                          {s.status}
                        </span>
                      </div>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1 font-mono mt-0.5 transition-colors"
                      >
                        <span className="truncate max-w-[260px]">{s.url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-3">
                    <div className="hidden sm:flex flex-col text-right text-[11px] text-zinc-400 font-mono">
                      <span>Key: ck_••••••••••••••</span>
                      <span>Secret: cs_••••••••••••••</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTestConnection(s.id)}
                      disabled={testingStoreId === s.id}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {testedSuccessId === s.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#00875A]" />
                          <span className="text-[#00875A]">Active & Synced</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${
                              testingStoreId === s.id ? "animate-spin text-[#00875A]" : ""
                            }`}
                          />
                          <span>{testingStoreId === s.id ? "Testing..." : "Test Status"}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Disconnect ${s.name}? This will remove it from the dashboard.`)) {
                          removeStore(s.id);
                        }
                      }}
                      title="Disconnect Store"
                      className="flex items-center justify-center h-8 w-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 flex flex-col items-center justify-center text-center">
              <Store className="h-10 w-10 text-zinc-300 mb-2" />
              <h3 className="text-sm font-bold text-zinc-800">No Stores Connected Yet</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Connect your first WooCommerce storefront to configure API credentials and live sync.
              </p>
              <div className="mt-4">
                <FlipButton
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-3.5 w-3.5 mr-0.5" />}
                  label="Connect First Store"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="rounded-full shadow-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Store Invoicing & Branding Settings */}
      {activeTab === "invoicing" && <StoreInvoiceSettings />}

      {/* Tab 3: Inbound Webhook Endpoints */}
      {activeTab === "webhooks" && (
        <div className="bg-white rounded-[28px] p-7 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              Inbound Webhook Delivery Configuration
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              WooCommerce sends real-time HTTP POST notifications to this endpoint whenever orders or customers are updated.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Delivery URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                Webhook Delivery URL (Target Endpoint)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inboundWebhookUrl}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-mono text-zinc-800 select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  {copiedUrl ? <Check className="h-3.5 w-3.5 text-[#00875A]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedUrl ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Secret */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                Webhook Secret (HMAC Verification)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookSecret}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-mono text-zinc-800 select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  {copiedSecret ? <Check className="h-3.5 w-3.5 text-[#00875A]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSecret ? "Copied" : "Copy"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateSecret}
                  className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Rotate
                </button>
              </div>
            </div>

            {/* Test Simulation Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendTestWebhook}
                disabled={isSendingTestWebhook}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00875A] text-white text-xs font-bold shadow-md hover:bg-[#00704A] transition-colors cursor-pointer disabled:opacity-50"
              >
                {testWebhookSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Test Event Dispatched!</span>
                  </>
                ) : (
                  <>
                    <Radio className={`h-4 w-4 ${isSendingTestWebhook ? "animate-pulse" : ""}`} />
                    <span>{isSendingTestWebhook ? "Simulating..." : "Send Test Webhook Event"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Subscribed Topics Checklist */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/70 flex flex-col gap-2 mt-2">
              <span className="text-xs font-bold text-zinc-800">Supported Topic Subscriptions</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00875A]" />
                  <code>order.created</code> (Real-time new orders)
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00875A]" />
                  <code>order.updated</code> (Status & line item changes)
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00875A]" />
                  <code>order.deleted</code> (Cancellations & trash)
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00875A]" />
                  <code>customer.created</code> (Customer sync)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Team & Access Management */}
      {activeTab === "team" && <TeamUserManagement />}

      {/* Tab 4: General App Preferences */}
      {activeTab === "preferences" && (
        <div className="bg-white rounded-[28px] p-7 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Application Preferences
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure system display currency, auto-refresh polling intervals, and notification channels.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#00875A] border border-emerald-200/80 text-[11px] font-bold">
              Live Synced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Global Currency Selector */}
            <div className="flex flex-col gap-2 p-5 bg-zinc-50 rounded-2xl border border-zinc-200/70">
              <label className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-[#00875A]" />
                  Primary Currency Formatting
                </span>
                <span className="text-[11px] font-mono text-[#00875A] font-semibold">
                  Active: {currency}
                </span>
              </label>
              <CustomSelect
                value={currency}
                onChange={(newVal) => {
                  setCurrency(newVal);
                  triggerFeedback(`Currency updated to ${newVal}. All dashboard amounts reformatted live.`);
                }}
                options={currencyOptions}
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Updates revenue cards, orders hub table, drawer, and analytics calculations in real-time.
              </p>
            </div>

            {/* Auto-Refresh Frequency */}
            <div className="flex flex-col gap-2 p-5 bg-zinc-50 rounded-2xl border border-zinc-200/70">
              <label className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#00875A]" />
                  Order Auto-Refresh Frequency
                </span>
                <span className="text-[11px] font-mono text-zinc-500 font-semibold">
                  {autoRefreshInterval}
                </span>
              </label>
              <CustomSelect
                value={autoRefreshInterval}
                onChange={(newVal) => {
                  setAutoRefreshInterval(newVal);
                  triggerFeedback(`Auto-refresh interval set to ${newVal}.`);
                }}
                options={[
                  { value: "30s", label: "Every 30 Seconds (Fast)" },
                  { value: "1m", label: "Every 1 Minute" },
                  { value: "5m", label: "Every 5 Minutes" },
                  { value: "manual", label: "Manual Refresh Only" },
                ]}
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Automated background poller syncs latest orders from WooCommerce without manual page refreshes.
              </p>
            </div>

            {/* Notification Toggles */}
            <div className="md:col-span-2 flex flex-col gap-3 p-5 bg-zinc-50 rounded-2xl border border-zinc-200/70">
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-[#00875A]" />
                Alerts & Sound Notifications
              </span>

              <div className="flex items-center justify-between text-xs py-1">
                <div>
                  <p className="font-semibold text-zinc-900">Email Digest for Failed Syncs</p>
                  <p className="text-zinc-400">Receive alerts if any store webhook connection degrades.</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => {
                    setEmailAlerts(e.target.checked);
                    triggerFeedback(e.target.checked ? "Email alerts enabled." : "Email alerts disabled.");
                  }}
                  className="h-4 w-4 rounded border-zinc-300 text-[#00875A] cursor-pointer accent-[#00875A]"
                />
              </div>

              <div className="flex items-center justify-between text-xs border-t border-zinc-200/60 pt-3">
                <div>
                  <p className="font-semibold text-zinc-900">Chime on Inbound Orders</p>
                  <p className="text-zinc-400">Plays a subtle pleasant sound on incoming live order events.</p>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => {
                    setSoundAlerts(e.target.checked);
                    triggerFeedback(e.target.checked ? "Audio order chime enabled." : "Audio order chime disabled.");
                  }}
                  className="h-4 w-4 rounded border-zinc-300 text-[#00875A] cursor-pointer accent-[#00875A]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Connect Store Modal */}
      <ConnectSiteModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onStoreAdded={(store) => addStore(store)}
      />
    </div>
  );
}
