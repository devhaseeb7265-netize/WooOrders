import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// 1. Read env from .env.local if present
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
  "Sarah", "Fatima", "Zainab", "Ayesha", "Mariam", "Hira", "Mahnoor", "Anum", "Sana", "Iqra",
  "David", "James", "Alex", "Michael", "Emma", "Olivia", "Sophia", "Daniel", "Lucas", "Noah"
];

const LAST_NAMES = [
  "Bhatti", "Khan", "Ahmed", "Raza", "Tariq", "Shah", "Malik", "Siddiqui", "Farooq", "Chaudhry",
  "Mirza", "Sheikh", "Qureshi", "Ansari", "Abbasi", "Rehman", "Javed", "Iqbal", "Akram", "Butt",
  "Miller", "Smith", "Johnson", "Brown", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris"
];

const CITIES = [
  "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad"
];

const PRODUCTS = [
  { name: "Premium Heavyweight Cotton Tee", price: 24.50 },
  { name: "Slim Fit Stretch Chino Trousers", price: 48.00 },
  { name: "Oversized French Terry Hoodie", price: 62.00 },
  { name: "Classic Oxford Button-Down Shirt", price: 38.00 },
  { name: "Minimalist Leather Cardholder", price: 18.00 },
  { name: "Waterproof Commuter Backpack", price: 79.00 },
  { name: "Active Pro Breathable Mesh Runners", price: 89.50 },
  { name: "Stainless Steel Chrono Watch", price: 145.00 },
  { name: "Vintage Wash Relaxed Denim", price: 54.00 },
  { name: "Merino Wool Thermal Sweater", price: 75.00 },
];

const STATUSES = [
  "processing", "processing", "processing",
  "completed", "completed", "completed", "completed",
  "on-hold", "pending", "cancelled"
];

async function seed() {
  console.log("🚀 Starting 2,000 High-Volume Orders Seeder...");
  console.log("Supabase URL:", url);

  // 1. Get or create a connected store
  let { data: stores, error: storeErr } = await supabase
    .from("connected_stores")
    .select("*")
    .limit(1);

  if (storeErr) {
    console.error("Error fetching stores:", storeErr);
    return;
  }

  let store = stores?.[0];

  if (!store) {
    console.log("No store found. Creating default 'Urban Fits Apparel' store...");
    const { data: newStore, error: insertStoreErr } = await supabase
      .from("connected_stores")
      .insert({
        name: "Urban Fits Apparel",
        url: "https://demo.urbanfitsapparel.com",
        consumer_key: "ck_live_demo_key_991823746",
        consumer_secret: "cs_live_demo_secret_881923746",
        currency: "USD",
        timezone: "Asia/Karachi",
        status: "active",
        total_orders: 2000,
        webhook_configured: true,
        company_name: "Urban Fits Apparel Ltd.",
        bill_from_address: "Plot 42-B, Industrial Area, Phase 5\nLahore, Pakistan",
        company_phone: "+92 300 1234567",
        invoice_terms: "Thank you for shopping with Urban Fits. 14-day hassle-free return on all non-perishable merchandise.",
      })
      .select()
      .single();

    if (insertStoreErr) {
      console.error("Failed to create store:", insertStoreErr);
      return;
    }
    store = newStore;
  }

  const storeId = store.id;
  const storeName = store.name;
  console.log(`Target Store: "${storeName}" (ID: ${storeId})`);

  // 2. Generate 2,000 Orders in Memory
  const TOTAL_ORDERS = 2000;
  const orders = [];
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  for (let i = 1; i <= TOTAL_ORDERS; i++) {
    const orderNumber = 1000 + i;
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const createdTimestamp = new Date(now - Math.random() * ninetyDaysMs);

    // 1 to 3 items
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const lineItems = [];
    let itemsTotal = 0;

    for (let k = 0; k < itemCount; k++) {
      const prod = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      const total = prod.price * qty;
      itemsTotal += total;
      lineItems.push({
        id: (orderNumber * 10) + k,
        name: prod.name,
        product_id: 100 + k,
        variation_id: 0,
        quantity: qty,
        subtotal: total.toFixed(2),
        total: total.toFixed(2),
        price: prod.price,
        sku: `UF-${prod.name.substring(0, 3).toUpperCase()}-${100 + k}`,
      });
    }

    const shippingTotal = itemsTotal > 100 ? 0 : 5.00;
    const taxTotal = parseFloat((itemsTotal * 0.05).toFixed(2));
    const grandTotal = (itemsTotal + shippingTotal + taxTotal).toFixed(2);

    const isCod = Math.random() > 0.35;
    const phone = `+92 3${Math.floor(Math.random() * 4)}${Math.floor(Math.random() * 9)} ${Math.floor(Math.random() * 9000000 + 1000000)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${orderNumber % 99}@gmail.com`;
    const address = `House #${Math.floor(Math.random() * 250) + 1}, Street ${Math.floor(Math.random() * 25) + 1}, Sector ${["F", "G", "H", "I"][Math.floor(Math.random() * 4)]}`;

    const rawPayload = {
      id: orderNumber,
      number: String(orderNumber),
      status,
      currency: "USD",
      currency_symbol: "$",
      total: grandTotal,
      subtotal: itemsTotal.toFixed(2),
      total_tax: taxTotal.toFixed(2),
      shipping_total: shippingTotal.toFixed(2),
      discount_total: "0.00",
      date_created: createdTimestamp.toISOString(),
      date_created_gmt: createdTimestamp.toISOString(),
      date_modified: createdTimestamp.toISOString(),
      payment_method: isCod ? "cod" : "stripe",
      payment_method_title: isCod ? "Cash on Delivery" : "Credit Card / Stripe",
      transaction_id: isCod ? "" : `ch_demo_${Math.random().toString(36).substring(2, 10)}`,
      customer_note: Math.random() > 0.7 ? "Please call before arrival" : "",
      billing: {
        first_name: firstName,
        last_name: lastName,
        company: "",
        address_1: address,
        address_2: "",
        city,
        state: "Punjab",
        postcode: "54000",
        country: "PK",
        email,
        phone,
      },
      shipping: {
        first_name: firstName,
        last_name: lastName,
        company: "",
        address_1: address,
        address_2: "",
        city,
        state: "Punjab",
        postcode: "54000",
        country: "PK",
        phone,
      },
      line_items: lineItems,
      tax_lines: [{ id: 1, label: "Sales Tax", tax_total: taxTotal.toFixed(2) }],
      fee_lines: [],
      coupon_lines: [],
      meta_data: [{ id: 1, key: "customer_delivery_time", value: "Morning (9am - 1pm)" }],
    };

    orders.push({
      store_id: storeId,
      wc_order_id: orderNumber,
      status,
      currency: "USD",
      total: grandTotal,
      customer_name: `${firstName} ${lastName}`,
      customer_email: email,
      billing: rawPayload.billing,
      shipping: rawPayload.shipping,
      line_items: rawPayload.line_items,
      meta_data: rawPayload.meta_data,
      raw_payload: rawPayload,
      date_created: createdTimestamp.toISOString(),
    });
  }

  // 3. Batch insert in chunks of 200 to Supabase
  const BATCH_SIZE = 200;
  console.log(`Inserting ${TOTAL_ORDERS} orders in chunks of ${BATCH_SIZE}...`);

  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const chunk = orders.slice(i, i + BATCH_SIZE);
    const { error: insertErr } = await supabase
      .from("store_orders")
      .upsert(chunk, { onConflict: "store_id,wc_order_id" });

    if (insertErr) {
      console.error(`Error inserting chunk ${i / BATCH_SIZE + 1}:`, insertErr);
    } else {
      process.stdout.write(`✅ Chunk ${i / BATCH_SIZE + 1} of ${Math.ceil(orders.length / BATCH_SIZE)} inserted (${i + chunk.length}/${TOTAL_ORDERS})\r`);
    }
  }

  console.log("\n🎉 Updating store total orders count...");
  await supabase
    .from("connected_stores")
    .update({ total_orders: TOTAL_ORDERS, updated_at: new Date().toISOString() })
    .eq("id", storeId);

  console.log(`\n✨ Successfully populated ${TOTAL_ORDERS} live orders for store: ${storeName}!`);
}

seed().catch((err) => {
  console.error("Fatal seed error:", err);
});
