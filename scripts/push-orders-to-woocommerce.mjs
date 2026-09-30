import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Read env
let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lmnjeqpepxzeansgqaic.supabase.co";
let key = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbmplcXBlcHh6ZWFuc2dxYWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDY5Nzg5NywiZXhwIjoyMTA2MjczODk3fQ.mRtabKYAH3LZXbD-vi0mzr1Eonb03BvwD-FRYw4EKgA";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      url = trimmed.split("=")[1].trim();
    }
    if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
      key = trimmed.split("=")[1].trim();
    }
  }
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const FIRST_NAMES = [
  "Haseeb", "Hamza", "Zaid", "Usman", "Bilal", "Ali", "Farhan", "Saad", "Omer", "Daniyal",
  "Sarah", "Fatima", "Zainab", "Ayesha", "Mariam", "Hira", "Mahnoor", "Anum", "Sana", "Iqra"
];

const LAST_NAMES = [
  "Bhatti", "Khan", "Ahmed", "Raza", "Tariq", "Shah", "Malik", "Siddiqui", "Farooq", "Chaudhry"
];

const CITIES = [
  "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad"
];

async function syncToWooCommerce(totalOrdersToCreate = 50) {
  console.log(`🚀 Starting WooCommerce Live Order Creator (${totalOrdersToCreate} orders)...`);

  const { data: store, error: storeErr } = await supabase
    .from("connected_stores")
    .select("*")
    .eq("id", "81ca179c-c549-41a1-8a0a-660042b22baa")
    .single();

  if (storeErr || !store) {
    console.error("Store not found:", storeErr);
    return;
  }

  const basicAuthToken = Buffer.from(
    `${store.consumer_key}:${store.consumer_secret}`
  ).toString("base64");
  const cleanUrl = store.url.replace(/\/+$/, "");

  // 1. Fetch available store products
  console.log(`Fetching active catalog from ${cleanUrl}...`);
  const prodRes = await fetch(`${cleanUrl}/wp-json/wc/v3/products?per_page=20`, {
    headers: { Authorization: `Basic ${basicAuthToken}` },
  });
  const products = await prodRes.json();

  if (!Array.isArray(products) || products.length === 0) {
    console.error("No products found in WooCommerce store!");
    return;
  }

  console.log(`Found ${products.length} live products in WooCommerce store.`);
  const productIds = products.map((p) => p.id);

  // 2. Create in batches of 10
  const BATCH_SIZE = 10;
  let createdCount = 0;

  for (let i = 0; i < totalOrdersToCreate; i += BATCH_SIZE) {
    const currentBatchSize = Math.min(BATCH_SIZE, totalOrdersToCreate - i);
    const orderBatch = [];

    for (let j = 0; j < currentBatchSize; j++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const chosenProdId = productIds[Math.floor(Math.random() * productIds.length)];

      orderBatch.push({
        status: "processing",
        payment_method: "cod",
        payment_method_title: "Cash on Delivery",
        billing: {
          first_name: firstName,
          last_name: lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Date.now() % 999}@gmail.com`,
          phone: `+92 300 ${Math.floor(Math.random() * 9000000 + 1000000)}`,
          city,
          address_1: `Sector ${["G-10", "F-7", "Gulberg", "DHA", "Johar"][Math.floor(Math.random() * 5)]}, Street ${Math.floor(Math.random() * 20) + 1}`,
          country: "PK",
        },
        shipping: {
          first_name: firstName,
          last_name: lastName,
          city,
          address_1: `Sector ${["G-10", "F-7", "Gulberg", "DHA", "Johar"][Math.floor(Math.random() * 5)]}, Street ${Math.floor(Math.random() * 20) + 1}`,
          country: "PK",
        },
        line_items: [
          {
            product_id: chosenProdId,
            quantity: Math.floor(Math.random() * 2) + 1,
          },
        ],
      });
    }

    try {
      const res = await fetch(`${cleanUrl}/wp-json/wc/v3/orders/batch`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuthToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ create: orderBatch }),
      });

      const resData = await res.json();
      const createdInBatch = resData?.create?.filter((o) => o.id > 0) || [];
      createdCount += createdInBatch.length;

      console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Created ${createdInBatch.length} live orders on WooCommerce (IDs: ${createdInBatch.map((o) => o.id).join(", ")})`);

      // 3. Upsert newly created live WooCommerce orders into Supabase store_orders
      if (createdInBatch.length > 0) {
        const supabaseRows = createdInBatch.map((order) => ({
          store_id: store.id,
          wc_order_id: order.id,
          status: order.status,
          currency: order.currency || "USD",
          total: Number(order.total).toFixed(2),
          customer_name: `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim(),
          customer_email: order.billing?.email || "",
          billing: order.billing || {},
          shipping: order.shipping || {},
          line_items: order.line_items || [],
          meta_data: order.meta_data || [],
          raw_payload: order,
          date_created: order.date_created_gmt || order.date_created || new Date().toISOString(),
        }));

        await supabase
          .from("store_orders")
          .upsert(supabaseRows, { onConflict: "store_id,wc_order_id" });
      }
    } catch (e) {
      console.error("Batch error:", e);
    }
  }

  console.log(`\n🎉 Successfully pushed ${createdCount} genuine orders directly into WordPress WooCommerce!`);
}

// Run for 30 live orders to demonstrate
syncToWooCommerce(30);
