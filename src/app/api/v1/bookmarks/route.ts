import { createServiceRoleClient } from "@/lib/supabase/server";
import { authenticateApiToken, requireScope } from "@/lib/api/auth";
import { ok, created, conflict, unprocessable } from "@/lib/api/response";
import { API_SCOPES } from "@/lib/api/types";
import { scrapeMetaTags } from "@/modules/articles/lib/scraper";

const BOOKMARK_FIELDS =
  "id,url,title,excerpt,author,site_name,content_type,is_read,is_archived,created_at";

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.BOOKMARKS_READ);
  if (scopeCheck) return scopeCheck;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const isArchivedParam = url.searchParams.get("is_archived");
  const isArchived = isArchivedParam === "true";

  const supabase = createServiceRoleClient();
  const { data, error, count } = await supabase
    .from("articles")
    .select(BOOKMARK_FIELDS, { count: "exact" })
    .eq("instance_id", auth.instanceId)
    .eq("is_archived", isArchived)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return ok(data ?? [], { total: count ?? 0 });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateApiToken(request);
  if (auth instanceof Response) return auth;

  const scopeCheck = requireScope(auth, API_SCOPES.BOOKMARKS_WRITE);
  if (scopeCheck) return scopeCheck;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return unprocessable("Request body must be valid JSON");
  }

  const { url: bookmarkUrl, title, content, excerpt, author, site_name } = body;

  if (!bookmarkUrl || typeof bookmarkUrl !== "string") {
    return unprocessable("url is required");
  }

  const supabase = createServiceRoleClient();

  // Check for duplicate URL
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("instance_id", auth.instanceId)
    .eq("url", bookmarkUrl)
    .single();

  if (existing) {
    return conflict("Bookmark with this URL already exists");
  }

  let insertData: Record<string, unknown> = {
    url: bookmarkUrl,
    instance_id: auth.instanceId,
    user_id: auth.userId,
    content_type: "article",
  };

  if (title) {
    // Full-body create — use provided values
    insertData = {
      ...insertData,
      title: title ?? null,
      content: content ?? null,
      excerpt: excerpt ?? null,
      author: author ?? null,
      site_name: site_name ?? null,
    };
  } else {
    // URL-only — scrape meta tags
    try {
      const meta = await scrapeMetaTags(bookmarkUrl);
      insertData = {
        ...insertData,
        title: meta.title ?? bookmarkUrl,
        excerpt: meta.description ?? null,
        site_name: meta.siteName ?? null,
        image_url: meta.imageUrl ?? null,
      };
    } catch {
      insertData = { ...insertData, title: bookmarkUrl };
    }
  }

  const { data, error } = await supabase
    .from("articles")
    .insert(insertData)
    .select(BOOKMARK_FIELDS)
    .single();

  if (error) throw error;

  return created(data);
}
