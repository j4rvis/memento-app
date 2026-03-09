"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import { type FillDirection, type LayoutConfig, type PaperFormat, GRID_DIMENSIONS } from "@/modules/newspaper/lib/types";

// --- Grid auto-fill helpers ---

function buildOccupancyGrid(
  blocks: { grid_col: number | null; grid_row: number | null; col_span: number; row_span: number }[],
  cols: number,
  rows: number
): boolean[][] {
  const grid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  for (const block of blocks) {
    if (block.grid_col === null || block.grid_row === null) continue;
    for (let r = block.grid_row; r < block.grid_row + block.row_span && r < rows; r++) {
      for (let c = block.grid_col; c < block.grid_col + block.col_span && c < cols; c++) {
        grid[r][c] = true;
      }
    }
  }
  return grid;
}

function findNextAvailableCell(
  grid: boolean[][],
  cols: number,
  rows: number,
  fillDirection: FillDirection
): { grid_col: number; grid_row: number } | null {
  if (fillDirection === "column") {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (!grid[r][c]) return { grid_col: c, grid_row: r };
      }
    }
  } else {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!grid[r][c]) return { grid_col: c, grid_row: r };
      }
    }
  }
  return null;
}

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
  const printConfig = {
    font_family: (formData.get("print_font_family") as string) || "serif",
    font_size: (formData.get("print_font_size") as string) || "md",
    line_height: (formData.get("print_line_height") as string) || "relaxed",
    columns: (formData.get("print_columns") as string) || "1",
  };
  const layoutConfig: LayoutConfig = {
    format: ((formData.get("layout_format") as string) || "A4") as PaperFormat,
    fill_direction: ((formData.get("layout_fill_direction") as string) || "column") as FillDirection,
  };

  const { error } = await supabase
    .from("newspapers")
    .update({ title, description, kindle_email: kindleEmail, print_config: printConfig, layout_config: layoutConfig })
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

function buildConfig(blockType: string, formData: FormData): Record<string, unknown> {
  switch (blockType) {
    case "weather":
      return { location: (formData.get("config_location") as string) || "Unknown" };
    case "rss":
      return {
        feed_id: (formData.get("config_feed_id") as string) || "",
        max_items: Number(formData.get("config_max_items") || 5),
      };
    case "notes":
      return {
        filter: (formData.get("config_filter") as string) || "all",
        max_items: Number(formData.get("config_max_items") || 5),
      };
    case "todos":
      return { max_items: Number(formData.get("config_max_items") || 10) };
    case "text":
      return { body: (formData.get("config_body") as string) || "" };
    case "articles": {
      const mode = (formData.get("config_mode") as string) || "latest";
      const config: Record<string, unknown> = {
        mode,
        count: Number(formData.get("config_count") || 5),
      };
      if (mode === "category") {
        config.category = (formData.get("config_category") as string) || "";
      }
      if (mode === "specific") {
        config.article_ids = formData.getAll("config_article_ids") as string[];
      }
      return config;
    }
    case "calendar":
      return { days_ahead: Number(formData.get("config_days_ahead") || 7) };
    default:
      return {};
  }
}

export async function addBlock(slug: string, newspaperId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const instanceId = await getInstanceIdFromSlug(slug);
  const blockType = formData.get("block_type") as string;
  const title = (formData.get("title") as string) || blockType;
  const config = buildConfig(blockType, formData);

  // Fetch newspaper layout config and existing block positions for auto-placement
  const { data: newspaper } = await supabase
    .from("newspapers")
    .select("layout_config")
    .eq("id", newspaperId)
    .single();

  const layoutConfig = (newspaper?.layout_config ?? { format: "A4", fill_direction: "column" }) as LayoutConfig;
  const { cols, rows } = GRID_DIMENSIONS[layoutConfig.format];

  const { data: existingBlocks } = await supabase
    .from("newspaper_blocks")
    .select("grid_col, grid_row, col_span, row_span, sort_order")
    .eq("newspaper_id", newspaperId)
    .order("sort_order", { ascending: false });

  const sortOrder = existingBlocks && existingBlocks.length > 0 ? existingBlocks[0].sort_order + 1 : 0;

  const grid = buildOccupancyGrid(existingBlocks ?? [], cols, rows);
  const position = findNextAvailableCell(grid, cols, rows, layoutConfig.fill_direction);

  const { error } = await supabase.from("newspaper_blocks").insert({
    newspaper_id: newspaperId,
    user_id: user.id,
    instance_id: instanceId,
    block_type: blockType,
    title,
    config,
    sort_order: sortOrder,
    grid_col: position?.grid_col ?? null,
    grid_row: position?.grid_row ?? null,
    col_span: 1,
    row_span: 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper/${newspaperId}`);
}

export async function updateBlock(slug: string, blockId: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const blockType = formData.get("block_type") as string;
  const config = buildConfig(blockType, formData);

  const gridColRaw = formData.get("grid_col");
  const gridRowRaw = formData.get("grid_row");
  const colSpanRaw = formData.get("col_span");
  const rowSpanRaw = formData.get("row_span");

  const update: Record<string, unknown> = { title, block_type: blockType, config };
  if (gridColRaw !== null) update.grid_col = Number(gridColRaw);
  if (gridRowRaw !== null) update.grid_row = Number(gridRowRaw);
  if (colSpanRaw !== null) update.col_span = Number(colSpanRaw);
  if (rowSpanRaw !== null) update.row_span = Number(rowSpanRaw);

  const { error } = await supabase
    .from("newspaper_blocks")
    .update(update)
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

// Map Open-Meteo WMO weather codes to human-readable descriptions
function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code === 95) return "Thunderstorm";
  if (code >= 96 && code <= 99) return "Thunderstorm with hail";
  return "Unknown";
}

async function fetchWeatherData(location: string) {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
      { next: { revalidate: 3600 } }
    );
    const geoData = await geoRes.json();
    const place = geoData?.results?.[0];
    if (!place) return { location, error: "Location not found" };

    const { latitude, longitude, timezone, name, country } = place;
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(timezone)}&forecast_days=3`,
      { next: { revalidate: 3600 } }
    );
    const weatherData = await weatherRes.json();
    const current = weatherData?.current;
    const daily = weatherData?.daily;

    return {
      location: `${name}, ${country}`,
      current: {
        temperature: current?.temperature_2m,
        apparent_temperature: current?.apparent_temperature,
        condition: describeWeatherCode(current?.weather_code ?? -1),
        wind_speed: current?.wind_speed_10m,
      },
      forecast: daily?.time?.slice(0, 3).map((date: string, i: number) => ({
        date,
        condition: describeWeatherCode(daily.weather_code[i]),
        max: daily.temperature_2m_max[i],
        min: daily.temperature_2m_min[i],
      })) ?? [],
    };
  } catch {
    return { location, error: "Failed to fetch weather" };
  }
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
        const config = block.config as { max_items?: number };
        const { data: todos } = await supabase
          .from("todos")
          .select("title, is_completed, priority, due_date")
          .eq("instance_id", instanceId)
          .eq("is_completed", false)
          .order("priority", { ascending: false })
          .limit(config.max_items ?? 10);
        blockContent.data = todos;
        break;
      }
      case "notes": {
        const config = block.config as { filter?: string; max_items?: number };
        let query = supabase
          .from("notes")
          .select("title, content, is_pinned")
          .eq("instance_id", instanceId)
          .limit(config.max_items ?? 5);
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
            .limit(config.max_items ?? 5);
          blockContent.data = entries;
        }
        break;
      }
      case "articles": {
        const config = block.config as {
          mode?: string;
          count?: number;
          category?: string;
          article_ids?: string[];
        };
        const mode = config.mode ?? "latest";
        const count = config.count ?? 5;

        if (mode === "specific" && config.article_ids?.length) {
          const { data: articles } = await supabase
            .from("articles")
            .select("title, url, excerpt, site_name")
            .in("id", config.article_ids)
            .eq("instance_id", instanceId);
          blockContent.data = articles;
        } else if (mode === "category" && config.category) {
          const { data: articles } = await supabase
            .from("articles")
            .select("title, url, excerpt, site_name")
            .eq("instance_id", instanceId)
            .eq("category", config.category)
            .eq("is_archived", false)
            .order("created_at", { ascending: false })
            .limit(count);
          blockContent.data = articles;
        } else if (mode === "random") {
          // Fetch more than needed, then shuffle
          const { data: pool } = await supabase
            .from("articles")
            .select("title, url, excerpt, site_name")
            .eq("instance_id", instanceId)
            .eq("is_archived", false)
            .limit(count * 5);
          const shuffled = (pool ?? []).sort(() => Math.random() - 0.5);
          blockContent.data = shuffled.slice(0, count);
        } else {
          // latest (default)
          const { data: articles } = await supabase
            .from("articles")
            .select("title, url, excerpt, site_name")
            .eq("instance_id", instanceId)
            .eq("is_archived", false)
            .order("created_at", { ascending: false })
            .limit(count);
          blockContent.data = articles;
        }
        break;
      }
      case "text": {
        const config = block.config as { body?: string };
        blockContent.data = { body: config.body || "" };
        break;
      }
      case "weather": {
        const config = block.config as { location?: string };
        blockContent.data = await fetchWeatherData(config.location || "Unknown");
        break;
      }
      case "calendar": {
        const config = block.config as { days_ahead?: number };
        const daysAhead = config.days_ahead ?? 7;
        const now = new Date();
        const future = new Date(now);
        future.setDate(now.getDate() + daysAhead);
        const todayStr = now.toISOString().split("T")[0];
        const futureStr = future.toISOString().split("T")[0];
        const { data: todos } = await supabase
          .from("todos")
          .select("title, due_date, priority, is_completed")
          .eq("instance_id", instanceId)
          .eq("is_completed", false)
          .gte("due_date", todayStr)
          .lte("due_date", futureStr)
          .order("due_date");
        blockContent.data = todos;
        break;
      }
    }

    content.push(blockContent);
  }

  const now = new Date();
  const today = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()}`;

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
