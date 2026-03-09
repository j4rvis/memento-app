"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstanceIdFromSlug } from "@/lib/instance/server";
import { type FillDirection, type LayoutConfig, type PaperFormat, GRID_DIMENSIONS } from "@/modules/newspaper/lib/types";
import { checkOverlap } from "@/modules/newspaper/lib/grid";
import { fetchBlockData } from "@/modules/newspaper/lib/widgets/fetchers";

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
    case "quote":
      return {
        text: (formData.get("config_text") as string) || "",
        attribution: (formData.get("config_attribution") as string) || "",
      };
    case "image":
      return {
        url: (formData.get("config_url") as string) || "",
        keywords: (formData.get("config_keywords") as string) || "",
        caption: (formData.get("config_caption") as string) || "",
      };
    case "calendar":
      return { days_ahead: Number(formData.get("config_days_ahead") || 7) };
    case "header":
      return {
        location: (formData.get("config_location") as string) || "",
        tagline: (formData.get("config_tagline") as string) || "",
      };
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

  const pageIndex = Number(formData.get("page_index") ?? 0);

  const { data: existingBlocks } = await supabase
    .from("newspaper_blocks")
    .select("grid_col, grid_row, col_span, row_span, sort_order, page_index")
    .eq("newspaper_id", newspaperId)
    .order("sort_order", { ascending: false });

  const sortOrder = existingBlocks && existingBlocks.length > 0 ? existingBlocks[0].sort_order + 1 : 0;

  // Overlap checks are scoped to the same page
  const samePageBlocks = (existingBlocks ?? []).filter((b) => (b.page_index ?? 0) === pageIndex);

  const explicitColRaw = formData.get("grid_col");
  const explicitRowRaw = formData.get("grid_row");

  let position: { grid_col: number; grid_row: number } | null;
  if (explicitColRaw !== null && explicitRowRaw !== null) {
    const col = Number(explicitColRaw);
    const row = Number(explicitRowRaw);
    if (checkOverlap(samePageBlocks, col, row, 1, 1)) {
      throw new Error("Position conflicts with an existing block");
    }
    position = { grid_col: col, grid_row: row };
  } else {
    const grid = buildOccupancyGrid(samePageBlocks, cols, rows);
    position = findNextAvailableCell(grid, cols, rows, layoutConfig.fill_direction);
  }

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
    page_index: pageIndex,
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

  // Revalidate the specific newspaper page
  const { data: updatedBlock } = await supabase
    .from("newspaper_blocks")
    .select("newspaper_id")
    .eq("id", blockId)
    .single();
  if (updatedBlock?.newspaper_id) {
    revalidatePath(`/i/${slug}/newspaper/${updatedBlock.newspaper_id}`);
  }
  revalidatePath(`/i/${slug}/newspaper`);
}

export async function moveBlockToCell(
  slug: string,
  blockId: string,
  newspaperId: string,
  gridCol: number,
  gridRow: number,
  pageIndex?: number
) {
  const supabase = await createClient();

  const { data: block } = await supabase
    .from("newspaper_blocks")
    .select("col_span, row_span, page_index")
    .eq("id", blockId)
    .single();

  if (!block) throw new Error("Block not found");

  const targetPage = pageIndex ?? (block.page_index ?? 0);

  const { data: newspaper } = await supabase
    .from("newspapers")
    .select("layout_config")
    .eq("id", newspaperId)
    .single();

  const layoutConfig = (newspaper?.layout_config ?? { format: "A4" }) as LayoutConfig;
  const { cols, rows } = GRID_DIMENSIONS[layoutConfig.format];

  if (
    gridCol < 0 ||
    gridCol + block.col_span > cols ||
    gridRow < 0 ||
    gridRow + block.row_span > rows
  ) {
    throw new Error("Position out of grid bounds");
  }

  const { data: existingBlocks } = await supabase
    .from("newspaper_blocks")
    .select("id, grid_col, grid_row, col_span, row_span, page_index")
    .eq("newspaper_id", newspaperId)
    .neq("id", blockId);

  const samePageBlocks = (existingBlocks ?? []).filter((b) => (b.page_index ?? 0) === targetPage);

  if (checkOverlap(samePageBlocks, gridCol, gridRow, block.col_span, block.row_span)) {
    throw new Error("Position conflicts with an existing block");
  }

  const { error } = await supabase
    .from("newspaper_blocks")
    .update({ grid_col: gridCol, grid_row: gridRow, page_index: targetPage })
    .eq("id", blockId);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper/${newspaperId}`);
}

export async function updateBlockSpan(
  slug: string,
  blockId: string,
  newspaperId: string,
  colSpan: number,
  rowSpan: number
) {
  const supabase = await createClient();

  const { data: block } = await supabase
    .from("newspaper_blocks")
    .select("grid_col, grid_row, page_index")
    .eq("id", blockId)
    .single();

  if (!block) throw new Error("Block not found");

  if (block.grid_col !== null && block.grid_row !== null) {
    const { data: newspaper } = await supabase
      .from("newspapers")
      .select("layout_config")
      .eq("id", newspaperId)
      .single();

    const layoutConfig = (newspaper?.layout_config ?? { format: "A4" }) as LayoutConfig;
    const { cols, rows } = GRID_DIMENSIONS[layoutConfig.format];

    if (block.grid_col + colSpan > cols || block.grid_row + rowSpan > rows) {
      throw new Error("Span exceeds grid bounds");
    }

    const { data: existingBlocks } = await supabase
      .from("newspaper_blocks")
      .select("id, grid_col, grid_row, col_span, row_span, page_index")
      .eq("newspaper_id", newspaperId)
      .neq("id", blockId);

    const samePageBlocks = (existingBlocks ?? []).filter(
      (b) => (b.page_index ?? 0) === (block.page_index ?? 0)
    );

    if (checkOverlap(samePageBlocks, block.grid_col, block.grid_row, colSpan, rowSpan)) {
      throw new Error("New span conflicts with existing blocks");
    }
  }

  const { error } = await supabase
    .from("newspaper_blocks")
    .update({ col_span: colSpan, row_span: rowSpan })
    .eq("id", blockId);

  if (error) throw new Error(error.message);
  revalidatePath(`/i/${slug}/newspaper/${newspaperId}`);
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
    const data = await fetchBlockData(
      { block_type: block.block_type, config: block.config as Record<string, unknown> },
      instanceId,
      supabase
    );
    content.push({ type: block.block_type, title: block.title, config: block.config, data, page_index: block.page_index ?? 0 });
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
