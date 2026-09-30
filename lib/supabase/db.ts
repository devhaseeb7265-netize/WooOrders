import { createClient } from "@/lib/supabase/client";
import { WCOrder, WCOrderStatus } from "@/types/woocommerce";

const supabase = createClient();

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface DBStore {
  id: string;
  name: string;
  url: string;
  consumer_key: string;
  consumer_secret: string;
  status: "active" | "inactive" | "error";
  created_at: string;
  updated_at: string;
  currency?: string;
  timezone?: string;
  wc_version?: string | null;
  wp_version?: string | null;
  total_orders?: number;
  webhook_configured?: boolean;
  last_sync?: string | null;
  logo_url?: string | null;
  company_name?: string | null;
  bill_from_address?: string | null;
  company_phone?: string | null;
  invoice_terms?: string | null;
}

export interface DBStoreOrder {
  id: string;
  store_id: string;
  wc_order_id: number;
  status: string;
  currency: string;
  total: number | string;
  customer_name: string | null;
  customer_email: string | null;
  billing: unknown;
  shipping: unknown;
  line_items: unknown;
  meta_data: unknown;
  raw_payload: unknown;
  date_created: string;
  created_at: string;
}

// ─── Stores Data Access ───────────────────────────────────────────────────────

export async function fetchStores(): Promise<DBStore[]> {
  try {
    const { data, error } = await supabase
      .from("connected_stores")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[fetchStores]", error.message);
      return [];
    }
    return (data as DBStore[]) ?? [];
  } catch (err) {
    console.error("[fetchStores] exception", err);
    return [];
  }
}

export async function insertStore(
  store: {
    name: string;
    url: string;
    consumer_key: string;
    consumer_secret: string;
    status?: "active" | "inactive" | "error";
  }
): Promise<DBStore | null> {
  try {
    const { data: existing } = await supabase
      .from("connected_stores")
      .select("*")
      .eq("url", store.url)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("connected_stores")
        .update({
          name: store.name,
          consumer_key: store.consumer_key,
          consumer_secret: store.consumer_secret,
          status: store.status || "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("[insertStore:update]", error.message);
        return null;
      }
      return data as DBStore;
    } else {
      const { data, error } = await supabase
        .from("connected_stores")
        .insert({
          name: store.name,
          url: store.url,
          consumer_key: store.consumer_key,
          consumer_secret: store.consumer_secret,
          status: store.status || "active",
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("[insertStore:insert]", error.message);
        return null;
      }
      return data as DBStore;
    }
  } catch (err) {
    console.error("[insertStore] exception", err);
    return null;
  }
}

export async function deleteStore(storeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("connected_stores")
      .delete()
      .eq("id", storeId);

    if (error) {
      console.error("[deleteStore]", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[deleteStore] exception", err);
    return false;
  }
}

// ─── Orders Data Access ───────────────────────────────────────────────────────

export async function fetchOrdersForStore(
  storeId: string,
  storeName?: string
): Promise<WCOrder[]> {
  if (!storeId || storeId === "all") return [];
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
  if (!isUUID) return [];

  try {
    const { data, error } = await supabase
      .from("store_orders")
      .select("*")
      .eq("store_id", storeId)
      .order("date_created", { ascending: false });

    if (error) {
      console.error("[fetchOrdersForStore]", error.message);
      return [];
    }

    return ((data as DBStoreOrder[]) ?? []).map((row) =>
      dbRowToWCOrder(row, storeName)
    );
  } catch (err) {
    console.error("[fetchOrdersForStore] exception", err);
    return [];
  }
}

export async function upsertStoreOrders(
  storeId: string,
  wcOrders: WCOrder[]
): Promise<boolean> {
  if (!storeId || !wcOrders.length) return false;

  const mapped = wcOrders.map((order) => {
    const cleanTotal = Number(order.total);
    return {
      store_id: storeId,
      wc_order_id: order.id,
      status: order.status,
      currency: order.currency || "USD",
      total: !isNaN(cleanTotal) ? cleanTotal.toFixed(2) : "0.00",
      customer_name: `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim(),
      customer_email: order.billing?.email || "",
      billing: order.billing || {},
      shipping: order.shipping || {},
      line_items: order.line_items || [],
      meta_data: order.meta_data || [],
      raw_payload: order,
      date_created: order.date_created_gmt || order.date_created || new Date().toISOString(),
    };
  });

  try {
    const { error } = await supabase
      .from("store_orders")
      .upsert(mapped, { onConflict: "store_id,wc_order_id" });

    if (error) {
      console.error("[upsertStoreOrders]", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[upsertStoreOrders] exception", err);
    return false;
  }
}

export async function updateOrderStatusInDB(
  storeId: string,
  orderId: number,
  status: WCOrderStatus
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("store_orders")
      .update({ status })
      .match({ store_id: storeId, wc_order_id: orderId });

    if (error) {
      console.error("[updateOrderStatusInDB]", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[updateOrderStatusInDB] exception", err);
    return false;
  }
}

export async function deleteOrderFromDB(
  storeId: string,
  orderId: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("store_orders")
      .delete()
      .match({ store_id: storeId, wc_order_id: orderId });

    if (error) {
      console.error("[deleteOrderFromDB]", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[deleteOrderFromDB] exception", err);
    return false;
  }
}

// ─── Transformer: DB Row to WCOrder ──────────────────────────────────────────

export function dbRowToWCOrder(
  row: DBStoreOrder,
  storeName?: string
): WCOrder {
  const raw = (row.raw_payload as Partial<WCOrder>) || {};

  return {
    ...raw,
    id: Number(row.wc_order_id),
    number: String(raw.number || row.wc_order_id),
    status: (row.status as WCOrderStatus) || "processing",
    currency: row.currency || raw.currency || "USD",
    currency_symbol:
      raw.currency_symbol ||
      (row.currency === "EUR" ? "€" : row.currency === "GBP" ? "£" : "$"),
    date_created: row.date_created,
    date_created_gmt: raw.date_created_gmt || row.date_created,
    date_modified: raw.date_modified || row.date_created,
    discount_total: raw.discount_total || "0.00",
    shipping_total: raw.shipping_total || "0.00",
    total: !isNaN(Number(row.total))
      ? Number(row.total).toFixed(2)
      : raw.total
      ? String(raw.total)
      : "0.00",
    total_tax: raw.total_tax || "0.00",
    customer_id: raw.customer_id || 0,
    customer_note: raw.customer_note || "",
    payment_method: raw.payment_method || "cod",
    payment_method_title: raw.payment_method_title || "Payment",
    transaction_id: raw.transaction_id || "",
    store_id: row.store_id,
    store_name: storeName || (raw as { store_name?: string }).store_name || "Connected Store",
    billing: (row.billing as WCOrder["billing"]) || {
      first_name: row.customer_name?.split(" ")[0] || "",
      last_name: row.customer_name?.split(" ").slice(1).join(" ") || "",
      email: row.customer_email || "",
      phone: "",
      address_1: "",
      city: "",
      state: "",
      postcode: "",
      country: "US",
    },
    shipping: (row.shipping as WCOrder["shipping"]) || {
      first_name: row.customer_name?.split(" ")[0] || "",
      last_name: row.customer_name?.split(" ").slice(1).join(" ") || "",
      address_1: "",
      city: "",
      state: "",
      postcode: "",
      country: "US",
    },
    line_items: (row.line_items as WCOrder["line_items"]) || [],
    tax_lines: raw.tax_lines || [],
    shipping_lines: raw.shipping_lines || [],
    fee_lines: raw.fee_lines || [],
    coupon_lines: raw.coupon_lines || [],
    meta_data: (row.meta_data as WCOrder["meta_data"]) || [],
  };
}
