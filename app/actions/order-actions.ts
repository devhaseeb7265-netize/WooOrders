"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { WCOrderStatus } from "@/types/woocommerce";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL and Key must be defined in environment");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Move Order to Trash (Soft Delete)
 * Calls WooCommerce DELETE without force=true and sets status = 'trash' in store_orders
 */
export async function trashOrderAction(
  storeId: string,
  wcOrderId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // 1. Update Supabase store_orders to 'trash'
    const { error: dbError } = await supabase
      .from("store_orders")
      .update({ status: "trash" })
      .match({ store_id: storeId, wc_order_id: wcOrderId });

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    // 2. Upstream WooCommerce API Call (soft delete - no force parameter)
    const { data: store } = await supabase
      .from("connected_stores")
      .select("url, consumer_key, consumer_secret")
      .eq("id", storeId)
      .single();

    if (store?.url && store?.consumer_key && store?.consumer_secret) {
      const basicAuthToken = Buffer.from(
        `${store.consumer_key}:${store.consumer_secret}`
      ).toString("base64");

      try {
        const cleanUrl = store.url.replace(/\/+$/, "");
        await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${wcOrderId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${basicAuthToken}`,
            Accept: "application/json",
          },
        });
      } catch (upstreamErr) {
        console.warn("[trashOrderAction] Upstream WooCommerce soft-delete warning:", upstreamErr);
      }
    }

    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath("/analytics");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Trash order error";
    return { success: false, error: msg };
  }
}

/**
 * Restore Order from Trash with Safe 404 Guard
 * Checks WooCommerce REST API first: GET /wp-json/wc/v3/orders/{wcOrderId}
 * If 404: Purges from store_orders and returns error toast
 * If exists: Updates WooCommerce PUT and updates store_orders
 */
export async function restoreOrderAction(
  storeId: string,
  wcOrderId: number,
  targetStatus: WCOrderStatus = "processing"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // 1. Fetch store credentials
    const { data: store, error: storeError } = await supabase
      .from("connected_stores")
      .select("url, consumer_key, consumer_secret")
      .eq("id", storeId)
      .single();

    if (storeError || !store?.url || !store?.consumer_key || !store?.consumer_secret) {
      return { success: false, error: "Store credentials not found." };
    }

    const basicAuthToken = Buffer.from(
      `${store.consumer_key}:${store.consumer_secret}`
    ).toString("base64");
    const cleanUrl = store.url.replace(/\/+$/, "");

    // 2. Safe Restore Guard: Check if the order still exists in WooCommerce
    try {
      const checkRes = await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${wcOrderId}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${basicAuthToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      // If WooCommerce returns 404 Not Found, it was permanently deleted in WooCommerce!
      if (checkRes.status === 404) {
        await supabase
          .from("store_orders")
          .delete()
          .match({ store_id: storeId, wc_order_id: wcOrderId });

        revalidatePath("/orders");
        revalidatePath("/");
        revalidatePath("/analytics");

        return {
          success: false,
          error: "This order was permanently purged from WooCommerce and cannot be restored.",
        };
      }
    } catch (checkErr) {
      console.warn("[restoreOrderAction] Existence check warning:", checkErr);
    }

    // 3. Upstream WooCommerce API Call: Update status back to active
    try {
      const updateRes = await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${wcOrderId}`, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${basicAuthToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!updateRes.ok && updateRes.status === 404) {
        await supabase
          .from("store_orders")
          .delete()
          .match({ store_id: storeId, wc_order_id: wcOrderId });

        revalidatePath("/orders");
        return {
          success: false,
          error: "This order was permanently purged from WooCommerce and cannot be restored.",
        };
      }
    } catch (upstreamErr) {
      console.warn("[restoreOrderAction] Upstream WooCommerce restore warning:", upstreamErr);
    }

    // 4. Update Supabase store_orders status
    const { error: dbError } = await supabase
      .from("store_orders")
      .update({ status: targetStatus })
      .match({ store_id: storeId, wc_order_id: wcOrderId });

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath("/analytics");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Restore order error";
    return { success: false, error: msg };
  }
}

/**
 * Permanently Delete Order (Hard Delete)
 * Calls WooCommerce DELETE with force=true and deletes row from store_orders
 */
export async function permanentlyDeleteOrderAction(
  storeId: string,
  wcOrderId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // 1. Delete row from store_orders
    const { error: dbError } = await supabase
      .from("store_orders")
      .delete()
      .match({ store_id: storeId, wc_order_id: wcOrderId });

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    // 2. Upstream WooCommerce API Call with force=true
    const { data: store } = await supabase
      .from("connected_stores")
      .select("url, consumer_key, consumer_secret")
      .eq("id", storeId)
      .single();

    if (store?.url && store?.consumer_key && store?.consumer_secret) {
      const basicAuthToken = Buffer.from(
        `${store.consumer_key}:${store.consumer_secret}`
      ).toString("base64");

      try {
        const cleanUrl = store.url.replace(/\/+$/, "");
        await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${wcOrderId}?force=true`, {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${basicAuthToken}`,
            Accept: "application/json",
          },
        });
      } catch (upstreamErr) {
        console.warn("[permanentlyDeleteOrderAction] Upstream permanent delete warning:", upstreamErr);
      }
    }

    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath("/analytics");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Permanent delete error";
    return { success: false, error: msg };
  }
}
/**
 * High-Speed Batch Update Order Status
 * Uses native WooCommerce batch endpoint (/wp-json/wc/v3/orders/batch) in chunks of 100
 */
export async function batchUpdateOrderStatusAction(
  storeId: string,
  wcOrderIds: number[],
  newStatus: WCOrderStatus
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // 1. Instant Bulk Update in Supabase store_orders
    const { error: dbError } = await supabase
      .from("store_orders")
      .update({ status: newStatus })
      .eq("store_id", storeId)
      .in("wc_order_id", wcOrderIds);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    // 2. Upstream WooCommerce Native Batch API Call (/orders/batch)
    const { data: store } = await supabase
      .from("connected_stores")
      .select("url, consumer_key, consumer_secret")
      .eq("id", storeId)
      .single();

    if (store?.url && store?.consumer_key && store?.consumer_secret) {
      const basicAuthToken = Buffer.from(
        `${store.consumer_key}:${store.consumer_secret}`
      ).toString("base64");
      const cleanUrl = store.url.replace(/\/+$/, "");

      // Chunk into groups of 100 (WooCommerce batch max)
      const WC_BATCH_SIZE = 100;
      const batches: number[][] = [];
      for (let i = 0; i < wcOrderIds.length; i += WC_BATCH_SIZE) {
        batches.push(wcOrderIds.slice(i, i + WC_BATCH_SIZE));
      }

      await Promise.allSettled(
        batches.map((batchIds) =>
          fetch(`${cleanUrl}/wp-json/wc/v3/orders/batch`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${basicAuthToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              update: batchIds.map((id) => ({ id, status: newStatus })),
            }),
            signal: AbortSignal.timeout(8000),
          })
        )
      );
    }

    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath("/analytics");

    return { success: true, count: wcOrderIds.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Batch status update error";
    return { success: false, error: msg };
  }
}

/**
 * High-Speed Batch Move to Trash
 */
export async function batchTrashOrdersAction(
  storeId: string,
  wcOrderIds: number[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // 1. Instant Bulk Update in Supabase store_orders
    await supabase
      .from("store_orders")
      .update({ status: "trash" })
      .eq("store_id", storeId)
      .in("wc_order_id", wcOrderIds);

    // 2. Upstream WooCommerce Native Batch Delete
    const { data: store } = await supabase
      .from("connected_stores")
      .select("url, consumer_key, consumer_secret")
      .eq("id", storeId)
      .single();

    if (store?.url && store?.consumer_key && store?.consumer_secret) {
      const basicAuthToken = Buffer.from(
        `${store.consumer_key}:${store.consumer_secret}`
      ).toString("base64");
      const cleanUrl = store.url.replace(/\/+$/, "");

      const WC_BATCH_SIZE = 100;
      const batches: number[][] = [];
      for (let i = 0; i < wcOrderIds.length; i += WC_BATCH_SIZE) {
        batches.push(wcOrderIds.slice(i, i + WC_BATCH_SIZE));
      }

      await Promise.allSettled(
        batches.map((batchIds) =>
          fetch(`${cleanUrl}/wp-json/wc/v3/orders/batch`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${basicAuthToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              delete: batchIds,
            }),
            signal: AbortSignal.timeout(8000),
          })
        )
      );
    }

    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath("/analytics");

    return { success: true, count: wcOrderIds.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Batch trash error";
    return { success: false, error: msg };
  }
}

/**
 * High-Speed Batch Restore from Trash
 */
export async function batchRestoreOrdersAction(
  storeId: string,
  wcOrderIds: number[],
  targetStatus: WCOrderStatus = "processing"
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    await supabase
      .from("store_orders")
      .update({ status: targetStatus })
      .eq("store_id", storeId)
      .in("wc_order_id", wcOrderIds);

    const { data: store } = await supabase
      .from("connected_stores")
      .select("url, consumer_key, consumer_secret")
      .eq("id", storeId)
      .single();

    if (store?.url && store?.consumer_key && store?.consumer_secret) {
      const basicAuthToken = Buffer.from(
        `${store.consumer_key}:${store.consumer_secret}`
      ).toString("base64");
      const cleanUrl = store.url.replace(/\/+$/, "");

      const WC_BATCH_SIZE = 100;
      const batches: number[][] = [];
      for (let i = 0; i < wcOrderIds.length; i += WC_BATCH_SIZE) {
        batches.push(wcOrderIds.slice(i, i + WC_BATCH_SIZE));
      }

      await Promise.allSettled(
        batches.map((batchIds) =>
          fetch(`${cleanUrl}/wp-json/wc/v3/orders/batch`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${basicAuthToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              update: batchIds.map((id) => ({ id, status: targetStatus })),
            }),
            signal: AbortSignal.timeout(8000),
          })
        )
      );
    }

    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath("/analytics");

    return { success: true, count: wcOrderIds.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Batch restore error";
    return { success: false, error: msg };
  }
}

/**
 * High-Speed Batch Permanent Delete
 */
export async function batchPermanentlyDeleteOrdersAction(
  storeId: string,
  wcOrderIds: number[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    await supabase
      .from("store_orders")
      .delete()
      .eq("store_id", storeId)
      .in("wc_order_id", wcOrderIds);

    const { data: store } = await supabase
      .from("connected_stores")
      .select("url, consumer_key, consumer_secret")
      .eq("id", storeId)
      .single();

    if (store?.url && store?.consumer_key && store?.consumer_secret) {
      const basicAuthToken = Buffer.from(
        `${store.consumer_key}:${store.consumer_secret}`
      ).toString("base64");
      const cleanUrl = store.url.replace(/\/+$/, "");

      const WC_BATCH_SIZE = 100;
      const batches: number[][] = [];
      for (let i = 0; i < wcOrderIds.length; i += WC_BATCH_SIZE) {
        batches.push(wcOrderIds.slice(i, i + WC_BATCH_SIZE));
      }

      await Promise.allSettled(
        batches.map((batchIds) =>
          fetch(`${cleanUrl}/wp-json/wc/v3/orders/batch?force=true`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${basicAuthToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              delete: batchIds,
            }),
            signal: AbortSignal.timeout(8000),
          })
        )
      );
    }

    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath("/analytics");

    return { success: true, count: wcOrderIds.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Batch permanent delete error";
    return { success: false, error: msg };
  }
}

