"use client";

import React, { useRef, useState } from "react";
import {
  X,
  Globe,
  Key,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  Store,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ConnectedStore } from "@/context/StoreContext";
import { WCOrder } from "@/types/woocommerce";
import { FlipButton } from "@/components/motion/FlipButton";
import { connectStoreAction } from "@/app/actions/store-actions";

interface ConnectSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreAdded: (store: ConnectedStore, orders?: WCOrder[]) => void;
}

type ModalStep = "discovery" | "credentials" | "success";

export function ConnectSiteModal({
  isOpen,
  onClose,
  onStoreAdded,
}: ConnectSiteModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState<ModalStep>("discovery");

  // Step 1 state
  const [storeUrl, setStoreUrl] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [detectedSiteName, setDetectedSiteName] = useState<string>("");

  // Step 2 state
  const [storeLabel, setStoreLabel] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [showHelper, setShowHelper] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Success state
  const [createdStore, setCreatedStore] = useState<ConnectedStore | null>(null);

  useGSAP(
    () => {
      if (isOpen && modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { scale: 0.93, opacity: 0, y: 15 },
          { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.2)" }
        );
      }
    },
    { dependencies: [isOpen, step] }
  );

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setStep("discovery");
    setStoreUrl("");
    setDetectError(null);
    setStoreLabel("");
    setConsumerKey("");
    setConsumerSecret("");
    setVerifyError(null);
    setCreatedStore(null);
    onClose();
  };

  const handleDiscoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeUrl.trim()) {
      setDetectError("Please provide a valid store URL.");
      return;
    }

    setIsDetecting(true);
    setDetectError(null);

    try {
      const res = await fetch("/api/stores/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: storeUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.isWordPress) {
        setDetectError(data.error || "WordPress REST API not detected on this URL.");
        return;
      }

      setDetectedSiteName(data.siteName || "");
      setStoreLabel(data.siteName || "");
      setStep("credentials");
    } catch {
      setDetectError("Failed to connect to store discovery engine.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumerKey.trim() || !consumerSecret.trim()) {
      setVerifyError("Consumer Key and Consumer Secret are required.");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const result = await connectStoreAction({
        url: storeUrl,
        consumerKey,
        consumerSecret,
        name: storeLabel,
      });

      if (!result.success || !result.store) {
        setVerifyError(result.error || "Credential verification failed.");
        return;
      }

      const newStore: ConnectedStore = {
        id: result.store.id,
        name: result.store.name,
        url: result.store.url,
        currency: "USD",
        timezone: "UTC",
        totalOrders: result.ordersCount || 0,
        webhookConfigured: true,
        status: "active",
        lastSync: "Just now",
        consumerKey,
        consumerSecret,
      };

      setCreatedStore(newStore);
      onStoreAdded(newStore);
      setStep("success");
    } catch {
      setVerifyError("Network error while validating store credentials.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-[32px] p-7 sm:p-8 max-w-lg w-full border border-black/[0.04] shadow-[0_24px_64px_rgba(0,0,0,0.12)] relative flex flex-col justify-between"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#00875A]/10 text-[#00875A] text-xs font-semibold">
              {step === "discovery" && "Step 1 of 2"}
              {step === "credentials" && "Step 2 of 2"}
              {step === "success" && "Connected"}
            </span>
            <span className="text-xs text-zinc-400 font-medium">WooCommerce Handshake</span>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close dialog"
            className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step 1: URL Discovery */}
        {step === "discovery" && (
          <form onSubmit={handleDiscoverySubmit} className="flex flex-col gap-5 pt-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                Connect New Store
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Enter your WooCommerce site URL. We will automatically discover the REST API endpoint.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="store-url" className="text-xs font-semibold text-zinc-700">
                Store URL
              </label>
              <div className="relative flex items-center">
                <Globe className="absolute left-3.5 h-4 w-4 text-zinc-400" />
                <input
                  id="store-url"
                  type="url"
                  required
                  placeholder="https://my-store.com"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#00875A] focus:bg-white focus:ring-2 focus:ring-[#00875A]/10 transition-all"
                />
              </div>
            </div>

            {detectError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{detectError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-full cursor-pointer"
              >
                Cancel
              </button>
              <FlipButton
                type="submit"
                variant="primary"
                size="md"
                disabled={isDetecting}
                icon={isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                label={isDetecting ? "Detecting Store..." : "Continue to API Keys"}
                className="rounded-full shadow-md"
              />
            </div>
          </form>
        )}

        {/* Step 2: Credentials Ingestion */}
        {step === "credentials" && (
          <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                  API Credentials
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Connected to: <span className="font-semibold text-zinc-800">{detectedSiteName || storeUrl}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("discovery")}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3" /> Change URL
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="store-label" className="text-xs font-semibold text-zinc-700">
                Store Label (Display Name)
              </label>
              <div className="relative flex items-center">
                <Store className="absolute left-3.5 h-4 w-4 text-zinc-400" />
                <input
                  id="store-label"
                  type="text"
                  placeholder="e.g. US Flagship Store"
                  value={storeLabel}
                  onChange={(e) => setStoreLabel(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#00875A] focus:bg-white focus:ring-2 focus:ring-[#00875A]/10 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="consumer-key" className="text-xs font-semibold text-zinc-700">
                Consumer Key
              </label>
              <div className="relative flex items-center">
                <Key className="absolute left-3.5 h-4 w-4 text-zinc-400" />
                <input
                  id="consumer-key"
                  type="text"
                  required
                  placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={consumerKey}
                  onChange={(e) => setConsumerKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs font-mono text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#00875A] focus:bg-white focus:ring-2 focus:ring-[#00875A]/10 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="consumer-secret" className="text-xs font-semibold text-zinc-700">
                Consumer Secret
              </label>
              <div className="relative flex items-center">
                <ShieldCheck className="absolute left-3.5 h-4 w-4 text-zinc-400" />
                <input
                  id="consumer-secret"
                  type="password"
                  required
                  placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={consumerSecret}
                  onChange={(e) => setConsumerSecret(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs font-mono text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#00875A] focus:bg-white focus:ring-2 focus:ring-[#00875A]/10 transition-all"
                />
              </div>
            </div>

            {/* Helper Callout */}
            <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-3">
              <button
                type="button"
                onClick={() => setShowHelper(!showHelper)}
                className="flex items-center justify-between w-full text-xs font-semibold text-zinc-700 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-[#00875A]" />
                  Where do I find my REST API keys?
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {showHelper ? "Hide" : "Show Guide"}
                </span>
              </button>
              {showHelper && (
                <div className="pt-2 text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-200/50 mt-2">
                  Navigate to your WordPress dashboard:
                  <code className="block my-1 bg-white p-2 rounded-lg border border-zinc-200 text-zinc-800 font-mono text-[10px]">
                    WooCommerce &gt; Settings &gt; Advanced &gt; REST API &gt; Add Key
                  </code>
                  Set permissions to <strong className="text-zinc-800">Read/Write</strong> and paste the generated keys above.
                </div>
              )}
            </div>

            {verifyError && (
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{verifyError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("discovery")}
                className="px-4 py-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-full cursor-pointer"
              >
                Back
              </button>
              <FlipButton
                type="submit"
                variant="primary"
                size="md"
                disabled={isVerifying}
                icon={isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                label={isVerifying ? "Verifying Keys..." : "Verify & Handshake"}
                className="rounded-full shadow-md"
              />
            </div>
          </form>
        )}

        {/* Step 3: Success Confirmation */}
        {step === "success" && createdStore && (
          <div className="flex flex-col items-center text-center gap-4 pt-6 pb-2">
            <div className="h-14 w-14 rounded-full bg-emerald-50 text-[#00875A] border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                Store Connected Successfully
              </h2>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                WooOrders established an authenticated handshake with{" "}
                <span className="font-semibold text-zinc-800">{createdStore.name}</span>.
              </p>
            </div>

            <div className="w-full bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 flex flex-col gap-2 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Store Domain</span>
                <span className="font-semibold text-zinc-800 font-mono text-[11px] truncate max-w-[200px]">
                  {createdStore.url}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">WooCommerce Version</span>
                <span className="font-semibold text-zinc-800">{createdStore.wcVersion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Currency / Timezone</span>
                <span className="font-semibold text-zinc-800">
                  {createdStore.currency} ({createdStore.timezone})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Real-Time Webhook</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#00875A]">
                  <span className="h-2 w-2 rounded-full bg-[#00875A]" />
                  Active Ingestion
                </span>
              </div>
            </div>

            <div className="w-full pt-2">
              <FlipButton
                variant="primary"
                size="md"
                label="Go to Stores Overview"
                onClick={handleResetAndClose}
                className="w-full rounded-full shadow-md"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
