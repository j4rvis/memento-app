import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptToken, encryptToken } from "./encryption";
import { refreshAccessToken } from "./x-oauth";
import { fetchListTweets, fetchUserTweets } from "./x-api";
import type { ExternalConnection, ExternalFeed } from "./types";

const X_TOKEN_SECRET = process.env.X_TOKEN_SECRET!;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

async function getAccessToken(
  connection: ExternalConnection,
  supabase: SupabaseClient
): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at);
  const needsRefresh =
    connection.refresh_token &&
    expiresAt.getTime() - Date.now() < FIVE_MINUTES_MS;

  if (!needsRefresh) {
    return decryptToken(connection.access_token, X_TOKEN_SECRET);
  }

  const refreshToken = decryptToken(connection.refresh_token!, X_TOKEN_SECRET);
  const refreshed = await refreshAccessToken(refreshToken);

  await supabase
    .from("external_connections")
    .update({
      access_token: encryptToken(refreshed.access_token, X_TOKEN_SECRET),
      refresh_token: refreshed.refresh_token
        ? encryptToken(refreshed.refresh_token, X_TOKEN_SECRET)
        : connection.refresh_token,
      token_expires_at: new Date(
        Date.now() + refreshed.expires_in * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  return refreshed.access_token;
}

export async function syncXFeed(
  feed: ExternalFeed,
  connection: ExternalConnection,
  supabase: SupabaseClient
): Promise<void> {
  const accessToken = await getAccessToken(connection, supabase);

  // Use the most recent tweet's ID as since_id to avoid re-fetching
  const { data: latestEntry } = await supabase
    .from("feed_entries")
    .select("guid")
    .eq("feed_id", feed.id)
    .like("guid", "x:%")
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  const sinceId = latestEntry?.guid?.replace("x:", "") ?? undefined;

  const { tweets, authors, media } =
    feed.provider_resource_type === "list"
      ? await fetchListTweets(accessToken, feed.provider_resource_id!, sinceId)
      : await fetchUserTweets(accessToken, feed.provider_resource_id!, sinceId);

  if (tweets.length === 0) return;

  const entries = tweets.map((tweet) => {
    const author = authors[tweet.author_id];
    const firstMediaKey = tweet.attachments?.media_keys?.[0];
    const firstMedia = firstMediaKey ? media[firstMediaKey] : undefined;
    const imageUrl =
      firstMedia?.url ?? firstMedia?.preview_image_url ?? null;

    return {
      feed_id: feed.id,
      user_id: feed.user_id,
      instance_id: feed.instance_id,
      guid: `x:${tweet.id}`,
      title: null,
      url: `https://x.com/${author?.username ?? "i"}/status/${tweet.id}`,
      author: author ? `@${author.username}` : null,
      content: tweet.text,
      summary: tweet.text.slice(0, 280),
      image_url: imageUrl,
      published_at: tweet.created_at,
    };
  });

  await supabase
    .from("feed_entries")
    .upsert(entries, { onConflict: "feed_id,guid", ignoreDuplicates: true });
}
