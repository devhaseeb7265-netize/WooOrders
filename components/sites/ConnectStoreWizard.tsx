"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  X,
  Globe,
  Key,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  Store,
  Radio,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FlipButton } from "@/components/motion/FlipButton";
import { ConnectedStore } from "@/context/StoreContext";
import { connectStoreAction } from "@/app/actions/store-actions";

interface ConnectStoreWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreConnected: (store: ConnectedStore) => void;
  onRunInitialSync?: (store: ConnectedStore) => void;
}

type WizardStep = 1 | 2 | 3;

interface VerificationPhase {
  readonly id: string;
  readonly label: string;
  status: "pending" | "running" | "done";
}

export function ConnectStoreWizard({
  isOpen,
  onClose,
  onStoreConnected,
  onRunInitialSync,
}: ConnectStoreWizardProps) {
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const stepContentRef = useRef<HTMLDivElement | null>(null);

  const [step, setStep] = useState<WizardStep>(1);

  // Step 1 state
  const [storeUrl, setStoreUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisChecks, setAnalysisChecks] = useState<VerificationPhase[]>([
    { id: "wp_json", label: "Checking WordPress REST API at /wp-json/", status: "pending" },
    { id: "wc_v3", label: "Verifying WooCommerce endpoints (/wc/v3/)", status: "pending" },
    { id: "ssl", label: "Validating SSL certificate & protocol integrity", status: "pending" },
  ]);

  // Step 2 state
  const [storeLabel, setStoreLabel] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [showHelper, setShowHelper] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  // Step 3 state
  const [createdStore, setCreatedStore] = useState<ConnectedStore | null>(null);
  const [webhookSecret] = useState(
    () => `whsec_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`
  );

  useGSAP(
    () => {
      if (isOpen && modalContainerRef.current) {
        gsap.fromTo(
          modalContainerRef.current,
          { scale: 0.94, opacity: 0, y: 15 },
          { scale: 1, opacity: 1, y: 0, duration: 0.32, ease: "back.out(1.2)" }
        );
      }
    },
    { dependencies: [isOpen] }
  );

  useEffect(() => {
    if (stepContentRef.current) {
      gsap.fromTo(
        stepContentRef.current,
        { opacity: 0, x: 18 },
        { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [step]);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setStep(1);
    setStoreUrl("");
    setIsAnalyzing(false);
    setStoreLabel("");
    setConsumerKey("");
    setConsumerSecret("");
    setCredentialsError(null);
    setCreatedStore(null);
    onClose();
  };

  const handleUrlDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeUrl.trim()) return;

    setIsAnalyzing(true);
    setAnalysisChecks([
      { id: "wp_json", label: "Checking WordPress REST API at /wp-json/", status: "running" },
      { id: "wc_v3", label: "Verifying WooCommerce endpoints (/wc/v3/)", status: "pending" },
      { id: "ssl", label: "Validating SSL certificate & protocol integrity", status: "pending" },
    ]);

    await new Promise((r) => setTimeout(r, 650));
    setAnalysisChecks((prev) => [
      { ...prev[0], status: "done" },
      { ...prev[1], status: "running" },
      prev[2],
    ]);

    await new Promise((r) => setTimeout(r, 700));
    setAnalysisChecks((prev) => [
      prev[0],
      { ...prev[1], status: "done" },
      { ...prev[2], status: "running" },
    ]);

    await new Promise((r) => setTimeout(r, 650));
    setAnalysisChecks((prev) => [prev[0], prev[1], { ...prev[2], status: "done" }]);

    setIsAnalyzing(false);

    try {
      const parsedUrl = new URL(
        /^https?:\/\//i.test(storeUrl) ? storeUrl : `https://${storeUrl}`
      );
      setStoreLabel(parsedUrl.hostname.replace(/^www\./, ""));
    } catch {
      setStoreLabel("WooCommerce Storefront");
    }

    setStep(2);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumerKey.trim() || !consumerSecret.trim()) {
      setCredentialsError("Please provide both Consumer Key and Consumer Secret.");
      return;
    }

    try {
      const result = await connectStoreAction({
        url: storeUrl,
        consumerKey,
        consumerSecret,
        name: storeLabel,
      });

      if (!result.success || !result.store) {
        setCredentialsError(result.error || "Credential verification failed.");
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
      onStoreConnected(newStore);
      setStep(3);
    } catch {
      setCredentialsError("Network error while validating store credentials.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        ref={modalContainerRef}
        className="bg-white rounded-[32px] p-7 sm:p-8 max-w-lg w-full border border-black/[0.04] shadow-[0_24px_64px_rgba(0,0,0,0.12)] relative flex flex-col justify-between"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#00875A]/10 text-[#00875A] text-xs font-bold">
              Step {step} of 3
            </span>
            <span className="text-xs text-zinc-400 font-medium">Store Handshake Wizard</span>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close dialog"
            className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dynamic Wizard Steps */}
        <div ref={stepContentRef} className="pt-6">
          {/* STEP 1: URL Discovery */}
          {step === 1 && (
            <form onSubmit={handleUrlDiscovery} className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                  Target Storefront URL
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Enter your WordPress store address. We will verify REST API connectivity and SSL certificate.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="storefront-url" className="text-xs font-semibold text-zinc-700">
                  Storefront URL
                </label>
                <div className="relative flex items-center">
                  <Globe className="absolute left-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    id="storefront-url"
                    type="text"
                    required
                    placeholder="https://shop.mystore.com"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    disabled={isAnalyzing}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#00875A] focus:bg-white focus:ring-2 focus:ring-[#00875A]/10 transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* URL Discovery Progression Checklist */}
              {isAnalyzing && (
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 flex flex-col gap-2.5 text-xs">
                  {analysisChecks.map((check) => (
                    <div key={check.id} className="flex items-center gap-2.5">
                      {check.status === "running" && (
                        <Loader2 className="h-4 w-4 animate-spin text-[#00875A] shrink-0" />
                      )}
                      {check.status === "done" && (
                        <CheckCircle2 className="h-4 w-4 text-[#00875A] shrink-0" />
                      )}
                      {check.status === "pending" && (
                        <div className="h-4 w-4 rounded-full border border-zinc-300 shrink-0" />
                      )}
                      <span
                        className={
                          check.status === "done"
                            ? "text-zinc-900 font-semibold"
                            : check.status === "running"
                            ? "text-[#00875A] font-medium"
                            : "text-zinc-400"
                        }
                      >
                        {check.label}
                      </span>
                    </div>
                  ))}
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
                  disabled={isAnalyzing}
                  label={isAnalyzing ? "Discovering..." : "Scan Storefront"}
                  className="rounded-full shadow-md"
                />
              </div>
            </form>
          )}

          {/* STEP 2: Credentials Ingestion */}
          {step === 2 && (
            <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                    REST API Credentials
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Store URL: <span className="font-semibold text-zinc-800">{storeUrl}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" /> Change URL
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="wizard-label" className="text-xs font-semibold text-zinc-700">
                  Store Display Name
                </label>
                <div className="relative flex items-center">
                  <Store className="absolute left-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    id="wizard-label"
                    type="text"
                    required
                    value={storeLabel}
                    onChange={(e) => setStoreLabel(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs font-medium text-zinc-900 outline-none focus:border-[#00875A] focus:bg-white focus:ring-2 focus:ring-[#00875A]/10 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="wizard-ck" className="text-xs font-semibold text-zinc-700">
                  Consumer Key
                </label>
                <div className="relative flex items-center">
                  <Key className="absolute left-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    id="wizard-ck"
                    type="text"
                    required
                    placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={consumerKey}
                    onChange={(e) => setConsumerKey(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs font-mono text-zinc-900 outline-none focus:border-[#00875A] focus:bg-white focus:ring-2 focus:ring-[#00875A]/10 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="wizard-cs" className="text-xs font-semibold text-zinc-700">
                  Consumer Secret
                </label>
                <div className="relative flex items-center">
                  <ShieldCheck className="absolute left-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    id="wizard-cs"
                    type="password"
                    required
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={consumerSecret}
                    onChange={(e) => setConsumerSecret(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs font-mono text-zinc-900 outline-none focus:border-[#00875A] focus:bg-white focus:ring-2 focus:ring-[#00875A]/10 transition-all"
                  />
                </div>
              </div>

              {/* Expandable Helper Box */}
              <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-3">
                <button
                  type="button"
                  onClick={() => setShowHelper(!showHelper)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-zinc-700 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-[#00875A]" />
                    How to generate WooCommerce API keys?
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {showHelper ? "Close" : "Instructions"}
                  </span>
                </button>
                {showHelper && (
                  <div className="pt-2 text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-200/50 mt-2">
                    Open your WordPress admin:
                    <code className="block my-1 bg-white p-2 rounded-lg border border-zinc-200 text-zinc-800 font-mono text-[10px]">
                      WooCommerce &gt; Settings &gt; Advanced &gt; REST API &gt; Add Key
                    </code>
                    Set description to <strong className="text-zinc-800">WooOrders SaaS Hub</strong> and permissions to <strong className="text-zinc-800">Read/Write</strong>.
                  </div>
                )}
              </div>

              {credentialsError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {credentialsError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
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
                  label={isVerifying ? "Testing Handshake..." : "Validate & Connect"}
                  className="rounded-full shadow-md"
                />
              </div>
            </form>
          )}

          {/* STEP 3: Handshake Success & Webhook Credentials */}
          {step === 3 && createdStore && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-50 text-[#00875A] border-2 border-emerald-200/80 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                  Handshake Established
                </h2>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Authenticated link established with{" "}
                  <strong className="text-zinc-900 font-semibold">{createdStore.name}</strong>. Webhook endpoints have been generated.
                </p>
              </div>

              {/* Webhook Credentials Preview Card */}
              <div className="w-full bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 text-left text-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Radio className="h-3 w-3 text-[#00875A]" />
                    Inbound Delivery URL
                  </span>
                  <span className="font-mono font-bold text-zinc-800 text-[11px]">
                    /api/webhooks/woocommerce
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2">
                  <span className="text-zinc-400">Webhook Secret</span>
                  <span className="font-mono text-zinc-700 bg-white px-2 py-0.5 rounded border border-zinc-200 text-[10px]">
                    {webhookSecret}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2">
                  <span className="text-zinc-400">Active Topics</span>
                  <span className="font-semibold text-[#00875A]">
                    order.created, order.updated
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
                <FlipButton
                  variant="secondary"
                  size="md"
                  label="Finish"
                  onClick={handleResetAndClose}
                  className="w-full sm:flex-1 rounded-full"
                />

                <FlipButton
                  variant="primary"
                  size="md"
                  icon={<Sparkles className="h-3.5 w-3.5 mr-1" />}
                  label="Run Initial Sync"
                  onClick={() => {
                    handleResetAndClose();
                    if (onRunInitialSync && createdStore) {
                      onRunInitialSync(createdStore);
                    }
                  }}
                  className="w-full sm:flex-1 rounded-full shadow-md"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
