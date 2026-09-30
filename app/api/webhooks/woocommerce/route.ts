import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { WCOrder } from "@/types/woocommerce";

import crypto from "node:crypto";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL and Key must be defined");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return true;
  try {
    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(computed)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const topic = req.headers.get("x-wc-webhook-topic") || "order.created";
    const source = req.headers.get("x-wc-webhook-source") || "";
    const eventId = req.headers.get("x-wc-webhook-event-id") || null;
    const resourceId = req.headers.get("x-wc-webhook-resource-id") || null;
    const signature = req.headers.get("x-wc-webhook-signature");

    const rawBody = await req.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    // 1. Identify Store from source URL or first available connected store
    let targetStoreId: string | null = null;

    if (source) {
      try {
        const sourceHostname = new URL(source).hostname;
        const { data: store } = await supabase
          .from("connected_stores")
          .select("id, url, consumer_secret")
          .ilike("url", `%${sourceHostname}%`)
          .limit(1)
          .maybeSingle();

        if (store) {
          targetStoreId = store.id;
          const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || store.consumer_secret;
          if (signature && secret && !verifyWebhookSignature(rawBody, signature, secret)) {
            console.warn(`[webhook/woocommerce] HMAC signature mismatch for store ${store.id}`);
          }
        }
      } catch {}
    }

    if (!targetStoreId) {
      const { data: firstStore } = await supabase
        .from("connected_stores")
        .select("id, consumer_secret")
        .limit(1)
        .maybeSingle();

      if (firstStore) {
        targetStoreId = firstStore.id;
        const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || firstStore.consumer_secret;
        if (signature && secret && !verifyWebhookSignature(rawBody, signature, secret)) {
          console.warn(`[webhook/woocommerce] HMAC signature mismatch for fallback store ${firstStore.id}`);
        }
      }
    }

    // 2. Log Inbound Webhook Event in Supabase
    if (targetStoreId) {
      try {
        await supabase.from("webhook_logs").insert({
          store_id: targetStoreId,
          topic,
          event_id: eventId || `evt_${Date.now()}`,
          resource_id: resourceId || String(payload.id || ""),
          status: "delivered",
          http_code: 200,
          payload,
          received_at: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn("[webhook/woocommerce] log insert warning:", logErr);
      }
    }

    // 3. Normalize Topic & Order ID
    const normalizedTopic = (topic || "").toLowerCase().trim();
    const rawId = payload.id ?? payload.ID ?? payload.order_id ?? resourceId;
    const orderId = rawId ? Number(rawId) : null;

    const isOrderDeleted =
      normalizedTopic === "order.deleted" ||
      normalizedTopic.endsWith(".deleted") ||
      normalizedTopic.includes("delete") ||
      payload.status === "deleted" ||
      payload.deleted === true;

    // 4. If Order Deleted: Permanently remove from store_orders so no ghost orders persist
    if (isOrderDeleted && orderId) {
      try {
        if (targetStoreId) {
          await supabase
            .from("store_orders")
            .delete()
            .match({ store_id: targetStoreId, wc_order_id: orderId });

          // Record delivery telemetry
          await supabase.from("webhook_logs").insert({
            store_id: targetStoreId,
            topic: "order.deleted (purged)",
            http_code: 200,
            payload: { deleted_order_id: orderId },
            received_at: new Date().toISOString(),
          });
        } else {
          await supabase
            .from("store_orders")
            .delete()
            .eq("wc_order_id", orderId);
        }

        revalidatePath("/orders");
        revalidatePath("/");
        revalidatePath("/analytics");
        revalidatePath("/webhooks");

        return NextResponse.json({
          success: true,
          message: "Order permanently purged",
          deleted_order_id: orderId,
        });
      } catch (delErr) {
        console.error("[webhook/woocommerce] order.deleted DB purge error:", delErr);
      }
    }

    // 5. If Order Created or Updated (and not a permanent deletion)
    if (
      !isOrderDeleted &&
      targetStoreId &&
      (normalizedTopic.includes("created") ||
        normalizedTopic.includes("updated") ||
        normalizedTopic === "order.created" ||
        normalizedTopic === "order.updated") &&
      payload.id
    ) {
      try {
        const order = payload as unknown as WCOrder;
        const currentStatus = (order.status || payload.status || "processing") as string;

        const cleanTotal = Number(order.total ?? payload.total);
        const mappedOrder = {
          store_id: targetStoreId,
          wc_order_id: Number(order.id),
          status: currentStatus,
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

        await supabase
          .from("store_orders")
          .upsert(mappedOrder, { onConflict: "store_id,wc_order_id" });

        revalidatePath("/orders");
        revalidatePath("/");
        revalidatePath("/analytics");
      } catch (orderErr) {
        console.error("[webhook/woocommerce] order upsert error:", orderErr);
      }
    }

    revalidatePath("/webhooks");

    return NextResponse.json({
      success: true,
      received: true,
      topic,
      storeId: targetStoreId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook processing error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
