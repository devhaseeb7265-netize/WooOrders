"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL and Key must be defined");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

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

export async function seedDemoOrdersAction(
  storeId: string,
  count: number = 2000
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    const orders = [];
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    for (let i = 1; i <= count; i++) {
      const orderNumber = 1000 + i;
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
      const createdTimestamp = new Date(now - Math.random() * ninetyDaysMs);

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

    const BATCH_SIZE = 200;
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const chunk = orders.slice(i, i + BATCH_SIZE);
      const { error: insertErr } = await supabase
        .from("store_orders")
        .upsert(chunk, { onConflict: "store_id,wc_order_id" });

      if (insertErr) {
        console.error("Batch insert error:", insertErr);
      }
    }

    await supabase
      .from("connected_stores")
      .update({ total_orders: count, updated_at: new Date().toISOString() })
      .eq("id", storeId);

    revalidatePath("/orders");
    revalidatePath("/");
    revalidatePath("/analytics");

    return { success: true, count };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Seed demo orders error";
    return { success: false, error: msg };
  }
}
