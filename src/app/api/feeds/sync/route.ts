import { NextRequest, NextResponse } from "next/server";
import { syncAllExternalFeeds } from "@/modules/external-feeds/lib/sync";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const syncSecret = process.env.FEEDS_SYNC_SECRET;

  if (!syncSecret || authHeader !== `Bearer ${syncSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await syncAllExternalFeeds();

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({
    processed: results.length,
    succeeded,
    failed,
    results,
  });
}
