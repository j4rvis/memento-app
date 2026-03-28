import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { syncXFeed } from "./x-sync";
import type { ExternalConnection, ExternalFeed } from "./types";

type ProviderSyncer = (
  feed: ExternalFeed,
  connection: ExternalConnection,
  supabase: SupabaseClient
) => Promise<void>;

const PROVIDER_SYNCERS: Record<string, ProviderSyncer> = {
  x: syncXFeed,
};

export interface SyncResult {
  feedId: string;
  provider: string;
  success: boolean;
  error?: string;
}

export async function syncAllExternalFeeds(): Promise<SyncResult[]> {
  const supabase = createServiceRoleClient();

  const { data: feeds, error } = await supabase
    .from("feeds")
    .select(
      "id, instance_id, user_id, title, url, provider, external_connection_id, provider_resource_id, provider_resource_type, last_fetched_at, fetch_error"
    )
    .neq("provider", "rss")
    .not("external_connection_id", "is", null);

  if (error) throw error;
  if (!feeds?.length) return [];

  const connectionIds = [...new Set(feeds.map((f) => f.external_connection_id!))];
  const { data: connections } = await supabase
    .from("external_connections")
    .select("*")
    .in("id", connectionIds);

  const connectionMap = new Map<string, ExternalConnection>();
  for (const conn of connections ?? []) {
    connectionMap.set(conn.id, conn as ExternalConnection);
  }

  const results: SyncResult[] = [];

  for (const feed of feeds) {
    const connection = connectionMap.get(feed.external_connection_id!);
    if (!connection) {
      results.push({
        feedId: feed.id,
        provider: feed.provider,
        success: false,
        error: "Connection not found",
      });
      continue;
    }

    const syncer = PROVIDER_SYNCERS[feed.provider];
    if (!syncer) {
      results.push({
        feedId: feed.id,
        provider: feed.provider,
        success: false,
        error: `No syncer registered for provider '${feed.provider}'`,
      });
      continue;
    }

    try {
      await syncer(feed as ExternalFeed, connection, supabase);
      await supabase
        .from("feeds")
        .update({ last_fetched_at: new Date().toISOString(), fetch_error: null })
        .eq("id", feed.id);
      results.push({ feedId: feed.id, provider: feed.provider, success: true });
    } catch (err) {
      const message = (err as Error).message;
      await supabase.from("feeds").update({ fetch_error: message }).eq("id", feed.id);
      results.push({
        feedId: feed.id,
        provider: feed.provider,
        success: false,
        error: message,
      });
    }
  }

  return results;
}
