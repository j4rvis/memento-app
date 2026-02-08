"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";

export async function createNewspaper(slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);

  const { data, error } = await supabase
    .from("newspapers")
    .insert({ user_id: user.id, instance_id: instanceId, title: "My Newspaper" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/i/${slug}/newspaper/${data.id}`);
}

export async function updateNewspaper(slug: string, id: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const kindleEmail = (formData.get("kindle_email") as string) || null;

  const { error } = await supabase
    .from("newspapers")
    .update({ title, description, kindle_email: kindleEmail })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper/${id}`);
}

export async function deleteNewspaper(slug: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("newspapers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper`);
  redirect(`/i/${slug}/newspaper`);
}

export async function addBlock(slug: string, newspaperId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);
  const blockType = formData.get("block_type") as string;
  const title = (formData.get("title") as string) || blockType;

  const { data: existing } = await supabase
    .from("newspaper_blocks")
    .select("sort_order")
    .eq("newspaper_id", newspaperId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const sortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const config: Record<string, unknown> = {};
  const configStr = formData.get("config") as string;
  if (configStr) {
    try {
      Object.assign(config, JSON.parse(configStr));
    } catch {
      // ignore invalid JSON
    }
  }

  const { error } = await supabase.from("newspaper_blocks").insert({
    newspaper_id: newspaperId,
    user_id: user.id,
    instance_id: instanceId,
    block_type: blockType,
    title,
    config,
    sort_order: sortOrder,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper/${newspaperId}`);
}

export async function updateBlock(slug: string, blockId: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const configStr = formData.get("config") as string;

  const updates: Record<string, unknown> = { title };
  if (configStr) {
    try {
      updates.config = JSON.parse(configStr);
    } catch {
      // ignore
    }
  }

  const { error } = await supabase
    .from("newspaper_blocks")
    .update(updates)
    .eq("id", blockId);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper`);
}

export async function deleteBlock(slug: string, blockId: string, newspaperId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("newspaper_blocks").delete().eq("id", blockId);
  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper/${newspaperId}`);
}

export async function moveBlock(slug: string, blockId: string, newspaperId: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: blocks } = await supabase
    .from("newspaper_blocks")
    .select("id, sort_order")
    .eq("newspaper_id", newspaperId)
    .order("sort_order");

  if (!blocks) return;

  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= blocks.length) return;

  const currentOrder = blocks[idx].sort_order;
  const swapOrder = blocks[swapIdx].sort_order;

  await supabase
    .from("newspaper_blocks")
    .update({ sort_order: swapOrder })
    .eq("id", blocks[idx].id);

  await supabase
    .from("newspaper_blocks")
    .update({ sort_order: currentOrder })
    .eq("id", blocks[swapIdx].id);

  revalidatePath(`/i/${slug}/newspaper/${newspaperId}`);
}

export async function generateEdition(slug: string, newspaperId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);

  const { data: newspaper } = await supabase
    .from("newspapers")
    .select("title")
    .eq("id", newspaperId)
    .single();

  if (!newspaper) throw new Error("Newspaper not found");

  const { data: blocks } = await supabase
    .from("newspaper_blocks")
    .select("*")
    .eq("newspaper_id", newspaperId)
    .order("sort_order");

  const content = [];

  for (const block of blocks || []) {
    const blockContent: Record<string, unknown> = {
      type: block.block_type,
      title: block.title,
      config: block.config,
      data: null,
    };

    switch (block.block_type) {
      case "todos": {
        const { data: todos } = await supabase
          .from("todos")
          .select("title, is_completed, priority, due_date")
          .eq("instance_id", instanceId)
          .eq("is_completed", false)
          .order("priority", { ascending: false })
          .limit(10);
        blockContent.data = todos;
        break;
      }
      case "notes": {
        const config = block.config as { filter?: string };
        let query = supabase.from("notes").select("title, content, is_pinned").eq("instance_id", instanceId).limit(5);
        if (config.filter === "pinned") {
          query = query.eq("is_pinned", true);
        }
        const { data: notes } = await query.order("updated_at", { ascending: false });
        blockContent.data = notes;
        break;
      }
      case "rss": {
        const config = block.config as { feed_id?: string; max_items?: number };
        if (config.feed_id) {
          const { data: entries } = await supabase
            .from("feed_entries")
            .select("title, url, summary, published_at")
            .eq("feed_id", config.feed_id)
            .order("published_at", { ascending: false })
            .limit(config.max_items || 5);
          blockContent.data = entries;
        }
        break;
      }
      case "articles": {
        const { data: articles } = await supabase
          .from("articles")
          .select("title, url, excerpt, site_name")
          .eq("instance_id", instanceId)
          .eq("is_archived", false)
          .order("created_at", { ascending: false })
          .limit(5);
        blockContent.data = articles;
        break;
      }
      case "text": {
        const config = block.config as { body?: string };
        blockContent.data = { body: config.body || "" };
        break;
      }
      case "weather": {
        const config = block.config as { location?: string };
        blockContent.data = { location: config.location || "Unknown" };
        break;
      }
    }

    content.push(blockContent);
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { data: edition, error } = await supabase
    .from("newspaper_editions")
    .insert({
      newspaper_id: newspaperId,
      user_id: user.id,
      instance_id: instanceId,
      title: `${newspaper.title} - ${today}`,
      content,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper/${newspaperId}`);
  redirect(`/i/${slug}/newspaper/${newspaperId}/preview?edition=${edition.id}`);
}
