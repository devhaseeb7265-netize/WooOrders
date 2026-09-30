export interface WordPressDetectionResult {
  readonly isWordPress: boolean;
  readonly isWooCommerce?: boolean;
  readonly siteName?: string;
  readonly siteUrl?: string;
  readonly apiNamespace?: string;
  readonly error?: string;
}

export async function detectWordPressStore(
  rawUrl: string
): Promise<WordPressDetectionResult> {
  let targetUrl = rawUrl.trim();

  if (!targetUrl) {
    return { isWordPress: false, error: "Store URL cannot be empty." };
  }

  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return { isWordPress: false, error: "Invalid URL format." };
  }

  const normalizedOrigin = parsed.origin;
  const endpoint = `${normalizedOrigin}/wp-json/`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7500);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "WooOrders-Discovery-Engine/1.0",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    const linkHeader = response.headers.get("Link") ?? response.headers.get("link");
    const hasWpLinkRel = linkHeader?.includes('rel="https://api.w.org/"') ?? false;

    if (!response.ok && !hasWpLinkRel) {
      return {
        isWordPress: false,
        error: `Could not reach WordPress REST endpoint (HTTP ${response.status}). Ensure the site is reachable and REST API is enabled.`,
      };
    }

    let payload: {
      name?: string;
      url?: string;
      namespaces?: string[];
    } = {};

    try {
      payload = await response.json();
    } catch {
      if (hasWpLinkRel) {
        return {
          isWordPress: true,
          isWooCommerce: false,
          siteUrl: normalizedOrigin,
          apiNamespace: "wp/v2",
        };
      }
      return {
        isWordPress: false,
        error: "Endpoint did not return valid JSON. Ensure permalinks are enabled on the WordPress site.",
      };
    }

    const namespaces = Array.isArray(payload.namespaces) ? payload.namespaces : [];
    const isWp = hasWpLinkRel || namespaces.includes("wp/v2") || namespaces.length > 0;
    const isWc = namespaces.includes("wc/v3") || namespaces.includes("wc/v2");

    if (!isWp) {
      return {
        isWordPress: false,
        error: "Valid WordPress REST API structure was not detected at /wp-json/.",
      };
    }

    return {
      isWordPress: true,
      isWooCommerce: isWc,
      siteName: payload.name || parsed.hostname,
      siteUrl: payload.url || normalizedOrigin,
      apiNamespace: isWc ? "wc/v3" : "wp/v2",
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return {
          isWordPress: false,
          error: "Connection timed out while reaching store URL. Verify the server is online.",
        };
      }
      return {
        isWordPress: false,
        error: `Network error: ${err.message}`,
      };
    }
    return {
      isWordPress: false,
      error: "Unexpected network failure occurred during store discovery.",
    };
  }
}
