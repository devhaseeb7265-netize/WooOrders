import { NextRequest, NextResponse } from "next/server";
import {
  verifyWooCommerceCredentials,
  WooCommerceApiError,
} from "@/lib/woocommerce/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, consumerKey, consumerSecret, label } = body;

    if (!url || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: "Store URL, Consumer Key, and Consumer Secret are required." },
        { status: 400 }
      );
    }

    const verification = await verifyWooCommerceCredentials(
      url,
      consumerKey,
      consumerSecret
    );

    const storeRecord = {
      id: `store_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: label?.trim() || verification.siteName || new URL(url).hostname,
      url: verification.siteUrl,
      currency: verification.currency,
      timezone: verification.timezone,
      wcVersion: verification.wcVersion,
      wpVersion: verification.wpVersion,
      totalOrders: verification.totalOrders,
      webhookConfigured: verification.webhookConfigured,
      status: "active" as const,
      lastSync: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        store: storeRecord,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof WooCommerceApiError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode || 400 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred during credential verification." },
      { status: 500 }
    );
  }
}
