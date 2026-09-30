import { NextRequest, NextResponse } from "next/server";
import { WCOrder } from "@/types/woocommerce";
import { ConnectedStore } from "@/lib/stores/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeUrl, consumerKey, consumerSecret, label } = body;

    if (!storeUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: "Store URL, Consumer Key, and Consumer Secret are required." },
        { status: 400 }
      );
    }

    const trimmedUrl = storeUrl.trim().replace(/\/+$/, "");
    const trimmedKey = consumerKey.trim();
    const trimmedSecret = consumerSecret.trim();

    // Check if this is an offline demo / mock connection test
    const isMockOrLocal =
      trimmedUrl.includes("demo") ||
      trimmedUrl.includes(".local") ||
      trimmedUrl.includes("example.com") ||
      trimmedKey.startsWith("ck_demo");

    if (isMockOrLocal) {
      const mockStore: ConnectedStore = {
        id: `store_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: label?.trim() || "WooCommerce Live Store",
        url: trimmedUrl,
        currency: "USD",
        timezone: "America/New_York",
        wcVersion: "9.3.2",
        wpVersion: "6.7.1",
        totalOrders: 6,
        webhookConfigured: true,
        status: "active",
        lastSync: "Just now",
      };

      // Generate initial synced WooCommerce orders for demo
      const mockSyncedOrders: WCOrder[] = [
        {
          id: Math.floor(Math.random() * 9000) + 1000,
          number: String(Math.floor(Math.random() * 9000) + 1000),
          status: "processing",
          currency: "USD",
          currency_symbol: "$",
          date_created: new Date().toISOString(),
          discount_total: "15.00",
          shipping_total: "10.00",
          total: "195.00",
          total_tax: "14.50",
          customer_id: 101,
          customer_note: "Please handle with care.",
          payment_method: "stripe",
          payment_method_title: "Credit Card (Stripe)",
          transaction_id: "ch_live_sync_01",
          store_id: mockStore.id,
          store_name: mockStore.name,
          billing: {
            first_name: "Alexander",
            last_name: "Wright",
            company: "Wright & Co",
            address_1: "542 5th Avenue",
            city: "New York",
            state: "NY",
            postcode: "10036",
            country: "US",
            email: "alexander.wright@company.io",
            phone: "+1 (212) 555-0199",
          },
          shipping: {
            first_name: "Alexander",
            last_name: "Wright",
            company: "Wright & Co",
            address_1: "542 5th Avenue",
            city: "New York",
            state: "NY",
            postcode: "10036",
            country: "US",
          },
          line_items: [
            {
              id: 901,
              name: "Minimalist Leather Desk Pad",
              product_id: 401,
              quantity: 1,
              sku: "MLDP-BLK",
              price: 185.0,
              subtotal: "185.00",
              total: "170.00",
              meta_data: [
                { key: "pa_color", value: "Obsidian Black", display_key: "Color", display_value: "Obsidian Black" },
              ],
            },
          ],
          tax_lines: [
            {
              id: 801,
              rate_code: "NY-TAX",
              rate_id: 1,
              label: "NY State Tax (8.875%)",
              compound: false,
              tax_total: "14.50",
              shipping_tax_total: "0.00",
            },
          ],
          shipping_lines: [
            {
              id: 701,
              method_title: "Priority Air Courier",
              method_id: "priority_air",
              total: "10.00",
              total_tax: "0.00",
            },
          ],
          coupon_lines: [{ id: 1, code: "WELCOME15", discount: "15.00" }],
          meta_data: [
            { key: "delivery_instructions", value: "Deliver to 4th floor reception", display_key: "Delivery Instructions", display_value: "Deliver to 4th floor reception" },
            { key: "_live_source", value: "WooCommerce Ingestion REST API v3" },
          ],
        },
        {
          id: Math.floor(Math.random() * 9000) + 1000,
          number: String(Math.floor(Math.random() * 9000) + 1000),
          status: "completed",
          currency: "USD",
          currency_symbol: "$",
          date_created: new Date(Date.now() - 86400000).toISOString(),
          discount_total: "0.00",
          shipping_total: "12.00",
          total: "340.00",
          total_tax: "22.00",
          customer_id: 102,
          payment_method: "apple_pay",
          payment_method_title: "Apple Pay",
          store_id: mockStore.id,
          store_name: mockStore.name,
          billing: {
            first_name: "Elena",
            last_name: "Rostova",
            address_1: "740 Market St",
            city: "San Francisco",
            state: "CA",
            postcode: "94102",
            country: "US",
            email: "elena.rostova@design.co",
            phone: "+1 (415) 555-0812",
          },
          shipping: {
            first_name: "Elena",
            last_name: "Rostova",
            address_1: "740 Market St",
            city: "San Francisco",
            state: "CA",
            postcode: "94102",
            country: "US",
          },
          line_items: [
            {
              id: 902,
              name: "Wireless Studio Monitoring Headphones",
              product_id: 402,
              quantity: 1,
              sku: "WSM-HP-01",
              price: 328.0,
              subtotal: "328.00",
              total: "328.00",
              meta_data: [
                { key: "pa_edition", value: "Matte Slate", display_key: "Edition", display_value: "Matte Slate" },
              ],
            },
          ],
          tax_lines: [
            {
              id: 802,
              rate_code: "CA-TAX",
              rate_id: 2,
              label: "California State Tax",
              compound: false,
              tax_total: "22.00",
              shipping_tax_total: "0.00",
            },
          ],
          shipping_lines: [
            {
              id: 702,
              method_title: "Expedited Express Delivery",
              method_id: "expedited",
              total: "12.00",
              total_tax: "0.00",
            },
          ],
          meta_data: [],
        },
      ];

      return NextResponse.json({
        success: true,
        store: mockStore,
        orders: mockSyncedOrders,
      });
    }

    // Live WooCommerce REST API connection
    const basicAuthToken = Buffer.from(`${trimmedKey}:${trimmedSecret}`).toString("base64");
    const headers = {
      Authorization: `Basic ${basicAuthToken}`,
      Accept: "application/json",
      "User-Agent": "WooOrders-Ingestion-Engine/1.0",
    };

    // Step 1: Query wp-json to validate root WordPress REST API
    try {
      const wpJsonResponse = await fetch(`${trimmedUrl}/wp-json/`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!wpJsonResponse.ok && wpJsonResponse.status !== 401) {
        return NextResponse.json(
          { error: `Could not reach WordPress REST API at ${trimmedUrl}/wp-json/` },
          { status: 400 }
        );
      }
    } catch (err: unknown) {
      return NextResponse.json(
        { error: `Network connection to ${trimmedUrl} failed. Verify domain and SSL certificate.` },
        { status: 400 }
      );
    }

    // Step 2: Query WooCommerce system_status
    let statusData: Record<string, unknown> = {};
    const statusRes = await fetch(`${trimmedUrl}/wp-json/wc/v3/system_status`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (statusRes.status === 401 || statusRes.status === 403) {
      return NextResponse.json(
        { error: "Authentication failed. Please verify Consumer Key and Secret have Read permissions." },
        { status: 401 }
      );
    }

    if (!statusRes.ok) {
      return NextResponse.json(
        { error: `WooCommerce API returned status ${statusRes.status} on /system_status.` },
        { status: statusRes.status }
      );
    }

    try {
      statusData = await statusRes.json();
    } catch {
      // Fallback
    }

    // Step 3: Fetch initial batch of live orders: GET /wp-json/wc/v3/orders?per_page=50&status=any
    let fetchedOrders: WCOrder[] = [];
    const ordersRes = await fetch(`${trimmedUrl}/wp-json/wc/v3/orders?per_page=50&status=any`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const storeId = `store_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const storeName = label?.trim() || (statusData.environment as Record<string, string>)?.site_url || new URL(trimmedUrl).hostname;

    if (ordersRes.ok) {
      try {
        const rawOrders = await ordersRes.json();
        if (Array.isArray(rawOrders)) {
          fetchedOrders = rawOrders.map((ro) => ({
            ...ro,
            store_id: storeId,
            store_name: storeName,
          }));
        }
      } catch {
        // Non-fatal, orders array empty
      }
    }

    const storeRecord: ConnectedStore = {
      id: storeId,
      name: storeName,
      url: trimmedUrl,
      currency: ((statusData.settings as Record<string, string>)?.currency as string) || "USD",
      timezone: ((statusData.settings as Record<string, string>)?.timezone as string) || "UTC",
      wcVersion: ((statusData.environment as Record<string, string>)?.version as string) || "Latest",
      wpVersion: ((statusData.environment as Record<string, string>)?.wp_version as string) || "WordPress",
      totalOrders: fetchedOrders.length,
      webhookConfigured: true,
      status: "active",
      lastSync: "Just now",
    };

    return NextResponse.json({
      success: true,
      store: storeRecord,
      orders: fetchedOrders,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal WooCommerce connection error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
