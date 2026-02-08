"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import { parseFeed } from "@/modules/feeds/lib/feed-parser";

export async function addFeed(slug: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);
  const url = formData.get("url") as string;
  const parsed = await parseFeed(url);

  const { data: feed, error } = await supabase
    .from("feeds")
    .insert({
      user_id: user.id,
      instance_id: instanceId,
      title: parsed.title,
      url,
      site_url: parsed.siteUrl,
      description: parsed.description,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (parsed.entries.length > 0) {
    const entries = parsed.entries.map((entry) => ({
      feed_id: feed.id,
      user_id: user.id,
      instance_id: instanceId,
      guid: entry.guid,
      title: entry.title,
      url: entry.url,
      author: entry.author,
      content: entry.content,
      summary: entry.summary,
      image_url: entry.imageUrl,
      published_at: entry.publishedAt,
    }));

    await supabase.from("feed_entries").insert(entries);
  }

  await supabase
    .from("feeds")
    .update({ last_fetched_at: new Date().toISOString() })
    .eq("id", feed.id);

  revalidatePath(`/i/${slug}/feeds`);
}

export async function deleteFeed(slug: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("feeds").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/feeds`);
}

export async function refreshFeed(slug: string, feedId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);

  const { data: feed } = await supabase
    .from("feeds")
    .select("url")
    .eq("id", feedId)
    .single();

  if (!feed) throw new Error("Feed not found");

  try {
    const parsed = await parseFeed(feed.url);

    for (const entry of parsed.entries) {
      await supabase.from("feed_entries").upsert(
        {
          feed_id: feedId,
          user_id: user.id,
          instance_id: instanceId,
          guid: entry.guid,
          title: entry.title,
          url: entry.url,
          author: entry.author,
          content: entry.content,
          summary: entry.summary,
          image_url: entry.imageUrl,
          published_at: entry.publishedAt,
        },
        { onConflict: "feed_id,guid", ignoreDuplicates: true }
      );
    }

    await supabase
      .from("feeds")
      .update({ last_fetched_at: new Date().toISOString(), fetch_error: null })
      .eq("id", feedId);
  } catch (err) {
    await supabase
      .from("feeds")
      .update({ fetch_error: (err as Error).message })
      .eq("id", feedId);
  }

  revalidatePath(`/i/${slug}/feeds`);
  revalidatePath(`/i/${slug}/feeds/${feedId}`);
}

export async function markAsRead(slug: string, entryId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("feed_entries")
    .update({ is_read: true })
    .eq("id", entryId);
  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/feeds`);
}

export async function markAllAsRead(slug: string, feedId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("feed_entries")
    .update({ is_read: true })
    .eq("feed_id", feedId)
    .eq("is_read", false);
  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/feeds`);
  revalidatePath(`/i/${slug}/feeds/${feedId}`);
}

export async function toggleStar(slug: string, entryId: string) {
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("feed_entries")
    .select("is_starred")
    .eq("id", entryId)
    .single();

  if (!entry) throw new Error("Entry not found");

  const { error } = await supabase
    .from("feed_entries")
    .update({ is_starred: !entry.is_starred })
    .eq("id", entryId);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/feeds`);
}
