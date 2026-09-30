"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { WCOrder } from "@/types/woocommerce";

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

export interface ConnectStoreInput {
  name?: string;
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface ConnectStoreResult {
  success: boolean;
  store?: {
    id: string;
    name: string;
    url: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  ordersCount?: number;
  error?: string;
}

export async function connectStoreAction(
  input: ConnectStoreInput
): Promise<ConnectStoreResult> {
  try {
    const { url, consumerKey, consumerSecret, name } = input;

    if (!url || !consumerKey || !consumerSecret) {
      return {
        success: false,
        error: "Store URL, Consumer Key, and Consumer Secret are required.",
      };
    }

    let cleanUrl = url.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const cKey = consumerKey.trim();
    const cSecret = consumerSecret.trim();

    // ─── Step 1: Verify Credentials against WooCommerce REST API ──────────────
    const basicAuthToken = Buffer.from(`${cKey}:${cSecret}`).toString("base64");
    const headers = {
      Authorization: `Basic ${basicAuthToken}`,
      Accept: "application/json",
      "User-Agent": "WooOrders-SaaS/2.0",
    };

    let statusResponse: Response;
    try {
      statusResponse = await fetch(`${cleanUrl}/wp-json/wc/v3/system_status`, {
        method: "GET",
        headers,
        cache: "no-store",
      });
    } catch {
      return {
        success: false,
        error: `Could not reach ${cleanUrl}. Check the URL and SSL certificate.`,
      };
    }

    if (statusResponse.status === 401 || statusResponse.status === 403) {
      return {
        success: false,
        error:
          "Authentication failed. Please verify Consumer Key and Secret have Read/Write permissions.",
      };
    }

    let sysData: Record<string, any> | null = null;
    try {
      sysData = await statusResponse.json();
    } catch {}

    const wpVersion = sysData?.environment?.wp_version || "N/A";
    const wcVersion = sysData?.environment?.version || "N/A";

    let storeTitle = name?.trim();
    if (!storeTitle) {
      storeTitle =
        sysData?.environment?.site_url ||
        new URL(cleanUrl).hostname.replace(/^www\./, "");
    }

    // ─── Step 2: Resilient store save (independent of DB unique constraint naming) ───
    const supabase = getSupabaseServerClient();
    let store: {
      id: string;
      name: string;
      url: string;
      status: string;
      created_at: string;
      updated_at: string;
    } | null = null;

    const { data: existingStore } = await supabase
      .from("connected_stores")
      .select("*")
      .eq("url", cleanUrl)
      .maybeSingle();

    if (existingStore) {
      const { data: updated, error: updateError } = await supabase
        .from("connected_stores")
        .update({
          name: storeTitle,
          consumer_key: cKey,
          consumer_secret: cSecret,
          status: "active",
          wp_version: wpVersion,
          wc_version: wcVersion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingStore.id)
        .select()
        .single();

      if (updateError || !updated) {
        console.error("[connectStoreAction] DB update error:", updateError);
        return {
          success: false,
          error: `Failed to update store in database: ${updateError?.message || "Unknown error"}`,
        };
      }
      store = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("connected_stores")
        .insert({
          name: storeTitle,
          url: cleanUrl,
          consumer_key: cKey,
          consumer_secret: cSecret,
          status: "active",
          wp_version: wpVersion,
          wc_version: wcVersion,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError || !inserted) {
        console.error("[connectStoreAction] DB insert error:", insertError);
        return {
          success: false,
          error: `Failed to save store to database: ${insertError?.message || "Unknown error"}`,
        };
      }
      store = inserted;
    }

    if (!store) {
      return {
        success: false,
        error: "Failed to persist store record.",
      };
    }

    // ─── Step 3: Immediate Initial Ingestion (Orders Pull) ───────────────────
    let ingestedCount = 0;
    try {
      const ordersRes = await fetch(
        `${cleanUrl}/wp-json/wc/v3/orders?per_page=100&status=any`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

      if (ordersRes.ok) {
        const wcOrders = await ordersRes.json();
        if (Array.isArray(wcOrders) && wcOrders.length > 0) {
          const mappedOrders = wcOrders.map((order: WCOrder) => {
            const cleanTotal = Number(order.total);
            return {
              store_id: store.id,
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

          const { error: ordersError } = await supabase
            .from("store_orders")
            .upsert(mappedOrders, { onConflict: "store_id,wc_order_id" });

          if (ordersError) {
            console.error("[connectStoreAction] Orders upsert error:", ordersError);
          } else {
            ingestedCount = mappedOrders.length;
          }
        }
      }
    } catch (ingestErr) {
      console.error("[connectStoreAction] Initial ingestion failed:", ingestErr);
    }

    // ─── Step 4: Automatically Create WooCommerce Webhooks ───────────────────
    let webhookCreatedSuccessfully = false;
    try {
      const webhookTopics = [
        { name: "WooOrders Order Created", topic: "order.created" },
        { name: "WooOrders Order Updated", topic: "order.updated" },
        { name: "WooOrders Order Deleted", topic: "order.deleted" },
      ];

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const deliveryUrl = `${appUrl}/api/webhooks/woocommerce`;

      for (const item of webhookTopics) {
        try {
          await fetch(`${cleanUrl}/wp-json/wc/v3/webhooks`, {
            method: "POST",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: item.name,
              topic: item.topic,
              delivery_url: deliveryUrl,
              status: "active",
            }),
          });
        } catch {}
      }
      webhookCreatedSuccessfully = true;
    } catch (whErr) {
      console.warn("[connectStoreAction] Webhook setup warning:", whErr);
    }

    // ─── Step 5: Update Connected Store Telemetry ─────────────────────────────
    await supabase
      .from("connected_stores")
      .update({
        wp_version: wpVersion,
        wc_version: wcVersion,
        total_orders_count: ingestedCount,
        webhook_active: webhookCreatedSuccessfully,
        last_sync_at: new Date().toISOString(),
      })
      .eq("id", store.id);

    revalidatePath("/");
    revalidatePath("/sites");
    revalidatePath("/orders");
    revalidatePath("/analytics");

    return {
      success: true,
      store,
      ordersCount: ingestedCount,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown connection error";
    return { success: false, error: msg };
  }
}

export async function syncStoreOrdersAction(
  storeId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    const { data: store, error: storeError } = await supabase
      .from("connected_stores")
      .select("*")
      .eq("id", storeId)
      .single();

    if (storeError || !store) {
      return { success: false, error: "Store not found in database." };
    }

    const basicAuthToken = Buffer.from(
      `${store.consumer_key}:${store.consumer_secret}`
    ).toString("base64");

    const ordersRes = await fetch(
      `${store.url}/wp-json/wc/v3/orders?per_page=50&status=any`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${basicAuthToken}`,
          Accept: "application/json",
          "User-Agent": "WooOrders-SaaS/2.0",
        },
        cache: "no-store",
      }
    );

    if (!ordersRes.ok) {
      return {
        success: false,
        error: `WooCommerce REST API returned HTTP ${ordersRes.status}`,
      };
    }

    const wcOrders = await ordersRes.json();
    let count = 0;

    if (Array.isArray(wcOrders) && wcOrders.length > 0) {
      const mappedOrders = wcOrders.map((order: WCOrder) => {
        const cleanTotal = Number(order.total);
        return {
          store_id: store.id,
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

      const { error: upsertError } = await supabase
        .from("store_orders")
        .upsert(mappedOrders, { onConflict: "store_id,wc_order_id" });

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }
      count = mappedOrders.length;
    }

    // Verify whether any trashed orders in store_orders were permanently purged in WooCommerce
    try {
      const { data: dbTrashOrders } = await supabase
        .from("store_orders")
        .select("wc_order_id")
        .eq("store_id", storeId)
        .eq("status", "trash");

      if (dbTrashOrders && dbTrashOrders.length > 0) {
        for (const tOrder of dbTrashOrders) {
          try {
            const checkRes = await fetch(
              `${store.url}/wp-json/wc/v3/orders/${tOrder.wc_order_id}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Basic ${basicAuthToken}`,
                  Accept: "application/json",
                },
                cache: "no-store",
              }
            );

            // 404 means the order was permanently deleted in WooCommerce!
            if (checkRes.status === 404) {
              await supabase
                .from("store_orders")
                .delete()
                .match({ store_id: storeId, wc_order_id: tOrder.wc_order_id });
            }
          } catch {}
        }
      }
    } catch (cleanupErr) {
      console.warn("[syncStoreOrdersAction] Trash sync check warning:", cleanupErr);
    }

    await supabase
      .from("connected_stores")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", storeId);

    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath("/analytics");

    return { success: true, count };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync error";
    return { success: false, error: msg };
  }
}

export async function disconnectStoreAction(
  storeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("connected_stores")
      .delete()
      .eq("id", storeId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/sites");
    revalidatePath("/orders");
    revalidatePath("/analytics");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Disconnect error";
    return { success: false, error: msg };
  }
}

export async function updateStoreOrderStatusAction(
  storeId: string,
  wcOrderId: number,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // 1. Update DB
    const { error: dbError } = await supabase
      .from("store_orders")
      .update({ status: newStatus })
      .match({ store_id: storeId, wc_order_id: wcOrderId });

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    // 2. Sync upstream to WooCommerce if store credentials available
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
        await fetch(`${store.url}/wp-json/wc/v3/orders/${wcOrderId}`, {
          method: "PUT",
          headers: {
            Authorization: `Basic ${basicAuthToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (err) {
        console.warn("[updateStoreOrderStatusAction] Upstream sync warning:", err);
      }
    }

    revalidatePath("/orders");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update status error";
    return { success: false, error: msg };
  }
}

export async function deleteStoreOrderAction(
  storeId: string,
  wcOrderId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from("store_orders")
      .delete()
      .match({ store_id: storeId, wc_order_id: wcOrderId });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/orders");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Delete error";
    return { success: false, error: msg };
  }
}

export async function simulateWebhookEventAction(
  storeId?: string,
  topic: string = "order.created"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    let targetStoreId = storeId;

    if (!targetStoreId) {
      const { data: store } = await supabase
        .from("connected_stores")
        .select("id")
        .limit(1)
        .maybeSingle();

      targetStoreId = store?.id;
    }

    if (!targetStoreId) {
      return { success: false, error: "No connected store found to associate webhook." };
    }

    const dummyOrderId = Math.floor(1000 + Math.random() * 9000);
    const dummyPayload = {
      id: dummyOrderId,
      status: "processing",
      currency: "USD",
      total: (Math.random() * 180 + 20).toFixed(2),
      date_created: new Date().toISOString(),
      billing: {
        first_name: "Live",
        last_name: "Customer",
        email: "customer@example.com",
      },
      line_items: [
        {
          id: 1,
          name: "Sample Store Product",
          quantity: 1,
          price: 49.99,
          total: "49.99",
        },
      ],
    };

    const { error: logError } = await supabase.from("webhook_logs").insert({
      store_id: targetStoreId,
      topic,
      event_id: `evt_sim_${Date.now()}`,
      resource_id: String(dummyOrderId),
      status: "delivered",
      http_code: 200,
      payload: dummyPayload,
      received_at: new Date().toISOString(),
    });

    if (logError) {
      console.warn("[simulateWebhookEventAction] log warning:", logError.message);
    }

    revalidatePath("/webhooks");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Simulation error";
    return { success: false, error: msg };
  }
}

export interface StoreInvoiceSettingsInput {
  logo_url?: string;
  company_name?: string;
  bill_from_address?: string;
  company_phone?: string;
  invoice_terms?: string;
}

export async function updateStoreInvoiceSettingsAction(
  storeId: string,
  settings: StoreInvoiceSettingsInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from("connected_stores")
      .update({
        logo_url: settings.logo_url?.trim() || null,
        company_name: settings.company_name?.trim() || null,
        bill_from_address: settings.bill_from_address?.trim() || null,
        company_phone: settings.company_phone?.trim() || null,
        invoice_terms: settings.invoice_terms?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath("/orders");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update invoice settings";
    return { success: false, error: msg };
  }
}



