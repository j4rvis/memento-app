import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateApiToken, requireScope } from "@/lib/api/auth";
import { ok, created, conflict, unprocessable } from "@/lib/api/response";
import { API_SCOPES } from "@/lib/api/types";
import { parseFeed } from "@/modules/feeds/lib/feed-parser";

const FEED_FIELDS =
  "id,title,url,site_url,description,last_fetched_at,created_at";

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.FEEDS_READ);
  if (scopeCheck) return scopeCheck;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("feeds")
    .select(FEED_FIELDS)
    .eq("instance_id", auth.instanceId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Fetch unread counts
  const feedIds = (data ?? []).map((f) => f.id);
  let unreadCounts: Record<string, number> = {};
  if (feedIds.length > 0) {
    const { data: entries } = await supabase
      .from("feed_entries")
      .select("feed_id")
      .eq("instance_id", auth.instanceId)
      .eq("is_read", false)
      .in("feed_id", feedIds);
    for (const entry of entries ?? []) {
      unreadCounts[entry.feed_id] = (unreadCounts[entry.feed_id] ?? 0) + 1;
    }
  }

  const result = (data ?? []).map((feed) => ({
    ...feed,
    unread_count: unreadCounts[feed.id] ?? 0,
  }));

  return ok(result);
}

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.FEEDS_WRITE);
  if (scopeCheck) return scopeCheck;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return unprocessable("Request body must be valid JSON");
  }

  const { url: feedUrl } = body;

  if (!feedUrl || typeof feedUrl !== "string") {
    return unprocessable("url is required");
  }

  const supabase = createServiceRoleClient();

  // Check for duplicate
  const { data: existing } = await supabase
    .from("feeds")
    .select("id")
    .eq("instance_id", auth.instanceId)
    .eq("url", feedUrl)
    .single();

  if (existing) {
    return conflict("Feed with this URL already exists");
  }

  // Parse the feed
  const parsed = await parseFeed(feedUrl);

  const { data, error } = await supabase
    .from("feeds")
    .insert({
      url: feedUrl,
      title: parsed.title,
      description: parsed.description ?? null,
      site_url: parsed.siteUrl ?? null,
      instance_id: auth.instanceId,
      user_id: auth.userId,
    })
    .select(FEED_FIELDS)
    .single();

  if (error) throw error;

  return created({ ...data, unread_count: 0 });
}
