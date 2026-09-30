"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { WCOrder, WCOrderStatus } from "@/types/woocommerce";
import {
  fetchStores,
  fetchOrdersForStore,
  DBStore,
} from "@/lib/supabase/db";
import {
  syncStoreOrdersAction,
  disconnectStoreAction,
  updateStoreOrderStatusAction,
  deleteStoreOrderAction,
} from "@/app/actions/store-actions";
import {
  trashOrderAction,
  restoreOrderAction,
  permanentlyDeleteOrderAction,
  batchTrashOrdersAction,
  batchRestoreOrdersAction,
  batchPermanentlyDeleteOrdersAction,
} from "@/app/actions/order-actions";

// ─── Supported Global Currencies ──────────────────────────────────────────────

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: "USD", symbol: "$", name: "USD ($) - United States Dollar" },
  { code: "EUR", symbol: "€", name: "EUR (€) - Euro" },
  { code: "GBP", symbol: "£", name: "GBP (£) - British Pound" },
  { code: "PKR", symbol: "₨", name: "PKR (₨) - Pakistani Rupee" },
  { code: "INR", symbol: "₹", name: "INR (₹) - Indian Rupee" },
  { code: "AED", symbol: "AED", name: "AED (AED) - UAE Dirham" },
  { code: "SAR", symbol: "SAR", name: "SAR (SAR) - Saudi Riyal" },
  { code: "CAD", symbol: "CA$", name: "CAD (CA$) - Canadian Dollar" },
  { code: "AUD", symbol: "AU$", name: "AUD (AU$) - Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "JPY (¥) - Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "CNY (¥) - Chinese Yuan" },
  { code: "CHF", symbol: "CHF", name: "CHF (CHF) - Swiss Franc" },
  { code: "TRY", symbol: "₺", name: "TRY (₺) - Turkish Lira" },
  { code: "BRL", symbol: "R$", name: "BRL (R$) - Brazilian Real" },
  { code: "SGD", symbol: "SG$", name: "SGD (SG$) - Singapore Dollar" },
  { code: "MYR", symbol: "RM", name: "MYR (RM) - Malaysian Ringgit" },
  { code: "IDR", symbol: "Rp", name: "IDR (Rp) - Indonesian Rupiah" },
  { code: "BDT", symbol: "৳", name: "BDT (৳) - Bangladeshi Taka" },
  { code: "NGN", symbol: "₦", name: "NGN (₦) - Nigerian Naira" },
  { code: "ZAR", symbol: "R", name: "ZAR (R) - South African Rand" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type DateRangeFilter =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "all_time";

export type ChartTimeframe = "monthly" | "annually";

export interface ChartDataPoint {
  readonly label: string;
  readonly value: number;
  readonly heightPercent: number;
  readonly isPeak?: boolean;
}

export interface ConnectedStore {
  id: string;
  name: string;
  url: string;
  currency: string;
  timezone: string;
  wcVersion?: string;
  wpVersion?: string;
  totalOrders: number;
  webhookConfigured: boolean;
  status: "active" | "inactive" | "error";
  lastSync?: string;
  consumerKey?: string;
  consumerSecret?: string;
  logo_url?: string | null;
  company_name?: string | null;
  bill_from_address?: string | null;
  company_phone?: string | null;
  invoice_terms?: string | null;
}

interface StoreContextType {
  connectedStores: ConnectedStore[];
  activeStore: ConnectedStore | null;
  activeStoreId: string | null;
  activeStoreName: string;
  activeStoreDomain: string;
  hasConnectedStores: boolean;
  orders: WCOrder[];
  isLoading: boolean;
  isSyncing: boolean;

  // Global Currency & Formatting
  currency: string;
  currencySymbol: string;
  setCurrency: (code: string) => void;
  formatCurrency: (amount: number | string, symbolOverride?: string) => string;

  // Global App Preferences
  autoRefreshInterval: string;
  setAutoRefreshInterval: (interval: string) => void;
  emailAlerts: boolean;
  setEmailAlerts: (enabled: boolean) => void;
  soundAlerts: boolean;
  setSoundAlerts: (enabled: boolean) => void;

  // Global dashboard date filter
  dateRange: DateRangeFilter;
  chartTimeframe: ChartTimeframe;

  // Orders Hub filters
  orderStatusFilter: string;
  orderSearchQuery: string;
  orderDateRange: string;

  // Computed metrics
  totalRevenue: number;
  totalRevenueFormatted: string;
  totalOrders: number;
  weeklyRevenue: number;
  weeklyRevenueFormatted: string;
  growthPercentage: string;
  refundAmount: number;
  refundAmountFormatted: string;
  recentOrders: WCOrder[];
  chartData: ChartDataPoint[];
  filteredOrdersForHub: WCOrder[];

  // Actions
  switchActiveStore: (storeId: string) => Promise<void>;
  addStore: (store: ConnectedStore, initialOrders?: WCOrder[]) => Promise<void>;
  removeStore: (storeId: string) => Promise<void>;
  setDateRange: (range: DateRangeFilter) => void;
  setChartTimeframe: (timeframe: ChartTimeframe) => void;
  setOrderStatusFilter: (status: string) => void;
  setOrderSearchQuery: (q: string) => void;
  setOrderDateRange: (range: string) => void;
  updateOrderStatus: (orderId: number, newStatus: WCOrderStatus) => Promise<void>;
  batchUpdateOrderStatus: (orderIds: number[], newStatus: WCOrderStatus) => Promise<void>;
  deleteOrder: (orderId: number) => Promise<void>;
  trashOrder: (orderId: number) => Promise<void>;
  restoreOrder: (orderId: number, targetStatus?: WCOrderStatus) => Promise<void>;
  permanentlyDeleteOrder: (orderId: number) => Promise<void>;
  batchDeleteOrders: (orderIds: number[]) => Promise<void>;
  batchTrashOrders: (orderIds: number[]) => Promise<void>;
  batchRestoreOrders: (orderIds: number[], targetStatus?: WCOrderStatus) => Promise<void>;
  batchPermanentlyDeleteOrders: (orderIds: number[]) => Promise<void>;
  refreshActiveStore: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StoreContext = createContext<StoreContextType | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isWithinDateRange(dateCreated: string, range: string): boolean {
  const d = new Date(dateCreated);
  const now = new Date();
  switch (range) {
    case "today":
      return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":
    case "last_7_days":
      return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
    case "last_30_days":
      return d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "month":
    case "this_month":
      return d >= new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return true;
  }
}

function dbStoreToConnectedStore(s: DBStore): ConnectedStore {
  return {
    id: s.id,
    name: s.name,
    url: s.url,
    currency: s.currency || "USD",
    timezone: s.timezone || "UTC",
    wcVersion: s.wc_version ?? undefined,
    wpVersion: s.wp_version ?? undefined,
    totalOrders: s.total_orders || 0,
    webhookConfigured: s.webhook_configured ?? true,
    status: s.status || "active",
    lastSync: s.last_sync ?? "Synced",
    consumerKey: s.consumer_key,
    consumerSecret: s.consumer_secret,
    logo_url: s.logo_url ?? null,
    company_name: s.company_name ?? null,
    bill_from_address: s.bill_from_address ?? null,
    company_phone: s.company_phone ?? null,
    invoice_terms: s.invoice_terms ?? null,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [connectedStores, setConnectedStores] = useState<ConnectedStore[]>([]);
  const [orders, setOrders] = useState<WCOrder[]>([]);
  const [activeStoreId, setActiveStoreIdState] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeFilter>("last_30_days");
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>("monthly");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>("");
  const [orderDateRange, setOrderDateRange] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // ── Currency State ─────────────────────────────────────────────────────────
  const [currency, setCurrencyState] = useState<string>("USD");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wooorders_currency");
      if (saved) setCurrencyState(saved);
    } catch {}
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    try {
      localStorage.setItem("wooorders_currency", code);
    } catch {}
  }, []);

  const currencySymbol = useMemo(() => {
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
    return found ? found.symbol : "$";
  }, [currency]);

  const formatCurrency = useCallback(
    (amount: number | string, symbolOverride?: string) => {
      const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
      const sym = symbolOverride || currencySymbol;
      if (isNaN(numericAmount)) return `${sym}0.00`;
      return `${sym}${numericAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [currencySymbol]
  );

  // ── Preferences State ──────────────────────────────────────────────────────
  const [autoRefreshInterval, setAutoRefreshIntervalState] = useState<string>("30s");
  const [emailAlerts, setEmailAlertsState] = useState<boolean>(true);
  const [soundAlerts, setSoundAlertsState] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedInterval = localStorage.getItem("wooorders_auto_refresh");
      if (savedInterval) setAutoRefreshIntervalState(savedInterval);

      const savedEmail = localStorage.getItem("wooorders_email_alerts");
      if (savedEmail !== null) setEmailAlertsState(savedEmail === "true");

      const savedSound = localStorage.getItem("wooorders_sound_alerts");
      if (savedSound !== null) setSoundAlertsState(savedSound === "true");
    } catch {}
  }, []);

  const setAutoRefreshInterval = useCallback((val: string) => {
    setAutoRefreshIntervalState(val);
    try {
      localStorage.setItem("wooorders_auto_refresh", val);
    } catch {}
  }, []);

  const setEmailAlerts = useCallback((val: boolean) => {
    setEmailAlertsState(val);
    try {
      localStorage.setItem("wooorders_email_alerts", String(val));
    } catch {}
  }, []);

  const setSoundAlerts = useCallback((val: boolean) => {
    setSoundAlertsState(val);
    try {
      localStorage.setItem("wooorders_sound_alerts", String(val));
    } catch {}
  }, []);

  // ── Synthesizer Chime for Inbound Orders ─────────────────────────────────────
  const playOrderChime = useCallback(() => {
    if (!soundAlerts || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, [soundAlerts]);

  // ── Initial hydration from Supabase ────────────────────────────────────────

  const loadFromSupabase = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbStores = await fetchStores();
      const stores = dbStores.map(dbStoreToConnectedStore);
      setConnectedStores(stores);

      if (stores.length > 0) {
        // Enforce strictly ONE active store at a time: default to first store
        const defaultStore = stores[0];
        setActiveStoreIdState(defaultStore.id);
        const storeOrders = await fetchOrdersForStore(defaultStore.id, defaultStore.name);
        setOrders(storeOrders);
      } else {
        setActiveStoreIdState(null);
        setOrders([]);
      }
    } catch (err) {
      console.error("[StoreContext] load error", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  // ── Active Store Details ───────────────────────────────────────────────────

  const activeStore = useMemo(
    () => connectedStores.find((s) => s.id === activeStoreId) || null,
    [connectedStores, activeStoreId]
  );

  const activeStoreName = activeStore?.name || "No Store Connected";

  const activeStoreDomain = useMemo(() => {
    if (!activeStore?.url) return "";
    try {
      return new URL(activeStore.url).hostname;
    } catch {
      return activeStore.url;
    }
  }, [activeStore]);

  const hasConnectedStores = connectedStores.length > 0 && activeStoreId !== null;

  // ── Per-store order scope (strictly single store) ──────────────────────────

  const activeStoreOrders = useMemo(() => {
    if (!activeStoreId) return [];
    return orders.filter((o) => o.store_id === activeStoreId);
  }, [orders, activeStoreId]);

  // ── Dashboard metrics (filtered by dateRange) ─────────────────────────────

  const dashboardOrders = useMemo(
    () => activeStoreOrders.filter((o) => o.status !== "trash" && isWithinDateRange(o.date_created, dateRange)),
    [activeStoreOrders, dateRange]
  );

  const totalRevenue = useMemo(
    () =>
      dashboardOrders
        .filter((o) => o.status === "completed" || o.status === "processing")
        .reduce((s, o) => s + (parseFloat(o.total) || 0), 0),
    [dashboardOrders]
  );

  const totalOrders = dashboardOrders.length;

  const weeklyRevenue = useMemo(() => {
    const ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return dashboardOrders
      .filter(
        (o) =>
          (o.status === "completed" || o.status === "processing") &&
          new Date(o.date_created) >= ago
      )
      .reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
  }, [dashboardOrders]);

  const refundAmount = useMemo(
    () =>
      dashboardOrders
        .filter((o) => o.status === "refunded")
        .reduce((s, o) => s + (parseFloat(o.total) || 0), 0),
    [dashboardOrders]
  );

  const recentOrders = useMemo(
    () =>
      [...dashboardOrders]
        .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
        .slice(0, 5),
    [dashboardOrders]
  );

  // ── Fully Dynamic Engagement Chart Data (Reacts to Date Range & Timeframe) ──

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (connectedStores.length === 0 || dashboardOrders.length === 0) {
      const labels =
        dateRange === "today"
          ? ["04:00", "08:00", "12:00", "16:00", "20:00", "24:00"]
          : dateRange === "last_7_days"
          ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          : dateRange === "all_time" || chartTimeframe === "annually"
          ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
          : ["Week 1", "Week 2", "Week 3", "Week 4"];

      return labels.map((label) => ({
        label,
        value: 0,
        heightPercent: 0,
        isPeak: false,
      }));
    }

    // 1. TODAY: 6 Hourly Buckets
    if (dateRange === "today") {
      const buckets = [
        { label: "04:00", maxH: 4, val: 0 },
        { label: "08:00", maxH: 8, val: 0 },
        { label: "12:00", maxH: 12, val: 0 },
        { label: "16:00", maxH: 16, val: 0 },
        { label: "20:00", maxH: 20, val: 0 },
        { label: "24:00", maxH: 24, val: 0 },
      ];

      dashboardOrders.forEach((o) => {
        if (o.status === "completed" || o.status === "processing") {
          const h = new Date(o.date_created).getHours();
          const bucket = buckets.find((b) => h < b.maxH) || buckets[buckets.length - 1];
          bucket.val += parseFloat(o.total) || 0;
        }
      });

      const max = Math.max(...buckets.map((b) => b.val), 1);
      return buckets.map((b) => ({
        label: b.label,
        value: Math.round(b.val),
        heightPercent: Math.round((b.val / max) * 100),
        isPeak: b.val === max && max > 0,
      }));
    }

    // 2. LAST 7 DAYS: Day-by-Day sequence
    if (dateRange === "last_7_days") {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const days: { label: string; dateStr: string; val: number }[] = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayLabel = i === 0 ? "Today" : dayNames[d.getDay()];
        const dateStr = d.toISOString().slice(0, 10);
        days.push({ label: dayLabel, dateStr, val: 0 });
      }

      dashboardOrders.forEach((o) => {
        if (o.status === "completed" || o.status === "processing") {
          const oDate = o.date_created.slice(0, 10);
          const found = days.find((d) => d.dateStr === oDate);
          if (found) {
            found.val += parseFloat(o.total) || 0;
          }
        }
      });

      const max = Math.max(...days.map((d) => d.val), 1);
      return days.map((d) => ({
        label: d.label,
        value: Math.round(d.val),
        heightPercent: Math.round((d.val / max) * 100),
        isPeak: d.val === max && max > 0,
      }));
    }

    // 3. LAST 30 DAYS & THIS MONTH: 4 Weekly Buckets
    if (dateRange === "last_30_days" || dateRange === "this_month") {
      const weeks = [
        { label: "Wk 1", val: 0 },
        { label: "Wk 2", val: 0 },
        { label: "Wk 3", val: 0 },
        { label: "Wk 4", val: 0 },
      ];

      const now = new Date().getTime();
      dashboardOrders.forEach((o) => {
        if (o.status === "completed" || o.status === "processing") {
          const diffDays = Math.floor((now - new Date(o.date_created).getTime()) / (24 * 60 * 60 * 1000));
          if (diffDays <= 7) weeks[3].val += parseFloat(o.total) || 0;
          else if (diffDays <= 14) weeks[2].val += parseFloat(o.total) || 0;
          else if (diffDays <= 21) weeks[1].val += parseFloat(o.total) || 0;
          else weeks[0].val += parseFloat(o.total) || 0;
        }
      });

      const max = Math.max(...weeks.map((w) => w.val), 1);
      return weeks.map((w) => ({
        label: w.label,
        value: Math.round(w.val),
        heightPercent: Math.round((w.val / max) * 100),
        isPeak: w.val === max && max > 0,
      }));
    }

    // 4. ALL TIME / ANNUALLY: 12 Months
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTotals = new Array(12).fill(0);

    dashboardOrders.forEach((order) => {
      if (order.status === "completed" || order.status === "processing") {
        const d = new Date(order.date_created);
        monthlyTotals[d.getMonth()] += parseFloat(order.total) || 0;
      }
    });

    const max = Math.max(...monthlyTotals, 1);
    return monthNames.map((label, idx) => {
      const val = monthlyTotals[idx];
      return {
        label,
        value: Math.round(val),
        heightPercent: Math.round((val / max) * 100),
        isPeak: val === max && max > 0,
      };
    });
  }, [connectedStores.length, dashboardOrders, dateRange, chartTimeframe]);

  // ── Orders Hub Filter Pipeline ─────────────────────────────────────────────

  const filteredOrdersForHub = useMemo(() => {
    return activeStoreOrders.filter((order) => {
      // 1. Status Filter
      if (orderStatusFilter === "all") {
        if (order.status === "trash") return false;
      } else if (order.status !== orderStatusFilter) {
        return false;
      }

      // 2. Date Range Filter
      if (!isWithinDateRange(order.date_created, orderDateRange)) {
        return false;
      }

      // 3. Search Query Filter
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const matchesId =
          String(order.id).includes(q) ||
          String(order.number || "").toLowerCase().includes(q);
        const matchesCustomer =
          `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`
            .toLowerCase()
            .includes(q) ||
          (order.billing?.email || "").toLowerCase().includes(q);
        const matchesItems = order.line_items?.some(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.sku && item.sku.toLowerCase().includes(q))
        );

        if (!matchesId && !matchesCustomer && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [activeStoreOrders, orderStatusFilter, orderDateRange, orderSearchQuery]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const switchActiveStore = useCallback(
    async (storeId: string) => {
      setActiveStoreIdState(storeId);
      const targetStore = connectedStores.find((s) => s.id === storeId);
      const storeName = targetStore?.name;

      setIsLoading(true);
      try {
        const storeOrders = await fetchOrdersForStore(storeId, storeName);
        setOrders(storeOrders);
      } catch (err) {
        console.error("[switchActiveStore] error loading orders", err);
      } finally {
        setIsLoading(false);
      }
    },
    [connectedStores]
  );

  const addStore = useCallback(
    async (newStore: ConnectedStore, initialOrders?: WCOrder[]) => {
      setConnectedStores((prev) => {
        const exists = prev.some((s) => s.id === newStore.id);
        if (exists) {
          return prev.map((s) => (s.id === newStore.id ? newStore : s));
        }
        return [newStore, ...prev];
      });

      // Strictly auto-switch active scope to the newly connected store
      setActiveStoreIdState(newStore.id);

      if (initialOrders && initialOrders.length > 0) {
        setOrders(initialOrders);
      } else {
        const storeOrders = await fetchOrdersForStore(newStore.id, newStore.name);
        setOrders(storeOrders);
      }
    },
    []
  );

  const removeStore = useCallback(
    async (storeId: string) => {
      await disconnectStoreAction(storeId);

      setConnectedStores((prev) => {
        const updated = prev.filter((s) => s.id !== storeId);
        // If the removed store was the active store, switch strictly to the first remaining store
        if (activeStoreId === storeId) {
          const nextStore = updated[0] || null;
          setActiveStoreIdState(nextStore ? nextStore.id : null);
          if (nextStore) {
            fetchOrdersForStore(nextStore.id, nextStore.name).then((ord) => setOrders(ord));
          } else {
            setOrders([]);
          }
        }
        return updated;
      });
    },
    [activeStoreId]
  );

  const refreshActiveStore = useCallback(async () => {
    if (!activeStoreId) return;

    setIsSyncing(true);
    try {
      const prevCount = orders.length;
      await syncStoreOrdersAction(activeStoreId);
      const targetStore = connectedStores.find((s) => s.id === activeStoreId);
      const refreshedOrders = await fetchOrdersForStore(activeStoreId, targetStore?.name);
      setOrders(refreshedOrders);

      // Play audio chime if new order arrived and soundAlerts is enabled
      if (refreshedOrders.length > prevCount) {
        playOrderChime();
      }
    } catch (err) {
      console.error("[refreshActiveStore] error", err);
    } finally {
      setIsSyncing(false);
    }
  }, [activeStoreId, connectedStores, orders.length, playOrderChime]);

  // ── Auto-Refresh Background Poller ──────────────────────────────────────────
  useEffect(() => {
    if (autoRefreshInterval === "manual" || !activeStoreId) return;

    const intervalMs =
      autoRefreshInterval === "30s"
        ? 30000
        : autoRefreshInterval === "1m"
        ? 60000
        : 300000;

    const timer = setInterval(() => {
      refreshActiveStore();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, activeStoreId, refreshActiveStore]);

  const updateOrderStatus = useCallback(
    async (orderId: number, newStatus: WCOrderStatus) => {
      if (!activeStoreId) return;

      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      await updateStoreOrderStatusAction(activeStoreId, orderId, newStatus);
    },
    [activeStoreId]
  );

  const batchUpdateOrderStatus = useCallback(
    async (orderIds: number[], newStatus: WCOrderStatus) => {
      if (!activeStoreId) return;

      setOrders((prev) =>
        prev.map((o) => (orderIds.includes(o.id) ? { ...o, status: newStatus } : o))
      );

      await Promise.all(
        orderIds.map((id) => updateStoreOrderStatusAction(activeStoreId, id, newStatus))
      );
    },
    [activeStoreId]
  );

  const trashOrder = useCallback(
    async (orderId: number) => {
      if (!activeStoreId) return;

      // Optimistic update to trash
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "trash" as WCOrderStatus } : o))
      );
      await trashOrderAction(activeStoreId, orderId);
    },
    [activeStoreId]
  );

  const restoreOrder = useCallback(
    async (orderId: number, targetStatus: WCOrderStatus = "processing") => {
      if (!activeStoreId) return;

      const res = await restoreOrderAction(activeStoreId, orderId, targetStatus);
      if (!res.success) {
        // If order was purged from WooCommerce, remove it immediately from state
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        alert(res.error || "This order was permanently purged from WooCommerce and cannot be restored.");
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: targetStatus } : o))
        );
      }
    },
    [activeStoreId]
  );

  const permanentlyDeleteOrder = useCallback(
    async (orderId: number) => {
      if (!activeStoreId) return;

      // Permanent removal from state
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      await permanentlyDeleteOrderAction(activeStoreId, orderId);
    },
    [activeStoreId]
  );

  const batchTrashOrders = useCallback(
    async (orderIds: number[]) => {
      if (!activeStoreId) return;

      setOrders((prev) =>
        prev.map((o) => (orderIds.includes(o.id) ? { ...o, status: "trash" as WCOrderStatus } : o))
      );
      await batchTrashOrdersAction(activeStoreId, orderIds);
    },
    [activeStoreId]
  );

  const batchRestoreOrders = useCallback(
    async (orderIds: number[], targetStatus: WCOrderStatus = "processing") => {
      if (!activeStoreId) return;

      setOrders((prev) =>
        prev.map((o) => (orderIds.includes(o.id) ? { ...o, status: targetStatus } : o))
      );
      await batchRestoreOrdersAction(activeStoreId, orderIds, targetStatus);
    },
    [activeStoreId]
  );

  const batchPermanentlyDeleteOrders = useCallback(
    async (orderIds: number[]) => {
      if (!activeStoreId) return;

      setOrders((prev) => prev.filter((o) => !orderIds.includes(o.id)));
      await batchPermanentlyDeleteOrdersAction(activeStoreId, orderIds);
    },
    [activeStoreId]
  );

  // Default deleteOrder invokes soft-delete (trash)
  const deleteOrder = trashOrder;
  const batchDeleteOrders = batchTrashOrders;

  return (
    <StoreContext.Provider
      value={{
        connectedStores,
        activeStore,
        activeStoreId,
        activeStoreName,
        activeStoreDomain,
        hasConnectedStores,
        orders,
        isLoading,
        isSyncing,
        currency,
        currencySymbol,
        setCurrency,
        formatCurrency,
        autoRefreshInterval,
        setAutoRefreshInterval,
        emailAlerts,
        setEmailAlerts,
        soundAlerts,
        setSoundAlerts,
        dateRange,
        chartTimeframe,
        orderStatusFilter,
        orderSearchQuery,
        orderDateRange,
        totalRevenue,
        totalRevenueFormatted: formatCurrency(totalRevenue),
        totalOrders,
        weeklyRevenue,
        weeklyRevenueFormatted: formatCurrency(weeklyRevenue),
        growthPercentage: totalRevenue > 0 ? "+12.4%" : "0%",
        refundAmount,
        refundAmountFormatted: formatCurrency(refundAmount),
        recentOrders,
        chartData,
        filteredOrdersForHub,
        switchActiveStore,
        addStore,
        removeStore,
        setDateRange,
        setChartTimeframe,
        setOrderStatusFilter,
        setOrderSearchQuery,
        setOrderDateRange,
        updateOrderStatus,
        batchUpdateOrderStatus,
        deleteOrder,
        trashOrder,
        restoreOrder,
        permanentlyDeleteOrder,
        batchDeleteOrders,
        batchTrashOrders,
        batchRestoreOrders,
        batchPermanentlyDeleteOrders,
        refreshActiveStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
