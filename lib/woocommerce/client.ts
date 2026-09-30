export interface WooCommerceVerificationResult {
  readonly success: boolean;
  readonly siteName?: string;
  readonly siteUrl: string;
  readonly currency: string;
  readonly timezone: string;
  readonly wcVersion: string;
  readonly wpVersion?: string;
  readonly totalOrders: number;
  readonly webhookConfigured: boolean;
}

export class WooCommerceApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "WooCommerceApiError";
  }
}

export async function verifyWooCommerceCredentials(
  rawUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<WooCommerceVerificationResult> {
  const trimmedUrl = rawUrl.trim();
  const trimmedKey = consumerKey.trim();
  const trimmedSecret = consumerSecret.trim();

  if (!trimmedUrl || !trimmedKey || !trimmedSecret) {
    throw new WooCommerceApiError("Store URL, Consumer Key, and Consumer Secret are required.");
  }

  const normalizedUrl = trimmedUrl.replace(/\/+$/, "");
  const basicAuthToken = Buffer.from(`${trimmedKey}:${trimmedSecret}`).toString("base64");
  const authHeaders = {
    Authorization: `Basic ${basicAuthToken}`,
    Accept: "application/json",
    "User-Agent": "WooOrders-Verification-Client/1.0",
  };

  // 1. Verify system status & credentials
  const statusEndpoint = `${normalizedUrl}/wp-json/wc/v3/system_status`;

  let statusResponse: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    statusResponse = await fetch(statusEndpoint, {
      method: "GET",
      headers: authHeaders,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new WooCommerceApiError("Verification timed out. Check your store connectivity.", 408);
    }
    throw new WooCommerceApiError(
      `Could not establish connection to ${normalizedUrl}. Check SSL certificate and domain availability.`
    );
  }

  if (statusResponse.status === 401 || statusResponse.status === 403) {
    throw new WooCommerceApiError(
      "Authentication failed. Verify Consumer Key and Consumer Secret have Read/Write permissions.",
      statusResponse.status,
      "AUTH_FAILED"
    );
  }

  if (statusResponse.status === 404) {
    throw new WooCommerceApiError(
      "WooCommerce REST API endpoint not found at /wp-json/wc/v3/. Ensure WooCommerce is installed and active.",
      404,
      "WC_NOT_FOUND"
    );
  }

  if (!statusResponse.ok) {
    throw new WooCommerceApiError(
      `Store API returned error: HTTP ${statusResponse.status} ${statusResponse.statusText}`,
      statusResponse.status
    );
  }

  interface SystemStatusPayload {
    environment?: {
      version?: string;
      wp_version?: string;
      site_url?: string;
    };
    settings?: {
      currency?: string;
      timezone?: string;
    };
  }

  let statusData: SystemStatusPayload = {};
  try {
    statusData = await statusResponse.json();
  } catch {
    throw new WooCommerceApiError("Store returned invalid JSON response from /system_status.");
  }

  // 2. Fetch total orders count via header
  let totalOrders = 0;
  try {
    const ordersCountResponse = await fetch(
      `${normalizedUrl}/wp-json/wc/v3/orders?per_page=1`,
      {
        method: "GET",
        headers: authHeaders,
        cache: "no-store",
      }
    );

    if (ordersCountResponse.ok) {
      const headerTotal = ordersCountResponse.headers.get("x-wp-total");
      if (headerTotal) {
        totalOrders = parseInt(headerTotal, 10) || 0;
      }
    }
  } catch {
    // Non-fatal, fallback to 0
  }

  // 3. Auto-configure WooCommerce webhook for real-time order sync
  let webhookConfigured = false;
  try {
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://app.wooorders.com";
    const webhookDeliveryUrl = `${appOrigin}/api/webhooks/woocommerce`;

    const webhookResponse = await fetch(`${normalizedUrl}/wp-json/wc/v3/webhooks`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "WooOrders Real-Time Ingestion",
        topic: "order.created",
        delivery_url: webhookDeliveryUrl,
        status: "active",
      }),
      cache: "no-store",
    });

    if (webhookResponse.ok || webhookResponse.status === 201) {
      webhookConfigured = true;
    }
  } catch {
    // Non-fatal if webhook registration fails
  }

  return {
    success: true,
    siteName: statusData.environment?.site_url || normalizedUrl,
    siteUrl: normalizedUrl,
    currency: statusData.settings?.currency || "USD",
    timezone: statusData.settings?.timezone || "UTC",
    wcVersion: statusData.environment?.version || "Latest",
    wpVersion: statusData.environment?.wp_version || "WordPress Core",
    totalOrders,
    webhookConfigured,
  };
}
