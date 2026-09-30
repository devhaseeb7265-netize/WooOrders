"use client";

import React, { useRef, useState } from "react";
import { Plus, Store, Sparkles, RefreshCw } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FlipButton } from "@/components/motion/FlipButton";
import { SiteCard } from "@/components/sites/SiteCard";
import { ConnectSiteModal } from "@/components/sites/ConnectSiteModal";
import { useStore, ConnectedStore } from "@/context/StoreContext";
import { syncStoreOrdersAction } from "@/app/actions/store-actions";

export default function SitesManagementPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    connectedStores,
    isLoading,
    addStore,
    removeStore,
    refreshActiveStore,
  } = useStore();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [syncingStoreId, setSyncingStoreId] = useState<string | null>(null);

  useGSAP(
    () => {
      if (!containerRef.current || connectedStores.length === 0) return;
      const cards = containerRef.current.querySelectorAll(".site-card-reveal");

      gsap.fromTo(
        cards,
        { y: 25, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    },
    { scope: containerRef, dependencies: [connectedStores.length] }
  );

  const handleStoreAdded = (newStore: ConnectedStore) => {
    addStore(newStore);
  };

  const handleSyncStore = async (id: string) => {
    setSyncingStoreId(id);
    try {
      await syncStoreOrdersAction(id);
      await refreshActiveStore();
    } catch (err) {
      console.error("[SitesPage] Sync error", err);
    } finally {
      setSyncingStoreId(null);
    }
  };

  const handleDisconnectStore = async (id: string) => {
    await removeStore(id);
  };

  const activeCount = connectedStores.filter((s) => s.status === "active").length;

  return (
    <div ref={containerRef} className="flex flex-col gap-8 w-full pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              Connected Stores
            </h1>
            <span className="px-3 py-1 rounded-full bg-[#00875A]/10 text-[#00875A] text-xs font-bold font-mono">
              {activeCount} Active / {connectedStores.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time WooCommerce instances synchronized with WooOrders Supabase database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <FlipButton
            variant="primary"
            size="md"
            icon={<Plus className="h-4 w-4 mr-0.5" />}
            label="+ Add New Store"
            onClick={() => setIsConnectModalOpen(true)}
            className="rounded-full !px-5 !py-2.5 text-xs font-semibold shadow-[0_4px_16px_rgba(0,135,90,0.22)]"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && connectedStores.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[28px] p-6 border border-zinc-100 shadow-xs animate-pulse h-64 flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-zinc-100" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 bg-zinc-200 rounded" />
                  <div className="h-3 w-48 bg-zinc-100 rounded" />
                </div>
              </div>
              <div className="h-8 bg-zinc-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : connectedStores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
          {connectedStores.map((store) => (
            <div key={store.id} className="site-card-reveal flex flex-col">
              <SiteCard
                store={store}
                onSync={handleSyncStore}
                onDisconnect={handleDisconnectStore}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] p-12 border border-dashed border-zinc-300 flex flex-col items-center justify-center text-center shadow-xs min-h-[380px]">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 text-[#00875A] mb-4">
            <Store className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">No Stores Connected Yet</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Connect your primary WooCommerce storefront to start synchronizing orders, webhooks, and analytics.
          </p>
          <div className="mt-6">
            <FlipButton
              variant="primary"
              size="md"
              icon={<Sparkles className="h-4 w-4 mr-1" />}
              label="Connect First Store"
              onClick={() => setIsConnectModalOpen(true)}
              className="rounded-full shadow-md"
            />
          </div>
        </div>
      )}

      {/* Connect Store Modal */}
      <ConnectSiteModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onStoreAdded={handleStoreAdded}
      />
    </div>
  );
}
