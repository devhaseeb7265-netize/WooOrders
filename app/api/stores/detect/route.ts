import { NextRequest, NextResponse } from "next/server";
import { detectWordPressStore } from "@/lib/woocommerce/detector";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required and must be a valid string." },
        { status: 400 }
      );
    }

    const result = await detectWordPressStore(url);

    if (!result.isWordPress) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process store discovery request." },
      { status: 500 }
    );
  }
}
