// requestUrl is intentionally unused — we use fetch directly for full header control

const SCRYFALL_HEADERS = {
  "Accept": "application/json",
  "User-Agent": "scryfall-obsidian-plugin/1.0",
};

export interface ScryfallCard {
  id: string;
  name: string;
  printed_name?: string; // localized name (e.g. German)
  mana_cost?: string;
  type_line: string;
  oracle_text?: string;
  set: string;
  set_name: string;
  rarity: string;
  legalities: Record<string, string>;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
  };
  card_faces?: Array<{
    image_uris?: { small: string; normal: string; large: string; png: string };
  }>;
  lang: string;
}

interface ScryfallSearchResponse {
  data: ScryfallCard[];
  total_cards: number;
}

const BASE_URL = "https://api.scryfall.com";

async function searchCards(query: string): Promise<ScryfallCard[]> {
  const url = `${BASE_URL}/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name`;
  console.log("[Scryfall] fetching:", url);
  try {
    const res = await fetch(url, { headers: SCRYFALL_HEADERS });
    console.log("[Scryfall] response status:", res.status);
    if (!res.ok) {
      console.warn("[Scryfall] non-ok response:", res.status, res.statusText);
      return [];
    }
    const body = await res.json() as ScryfallSearchResponse;
    return body.data ?? [];
  } catch (e) {
    console.warn("[Scryfall] searchCards error:", e);
    return [];
  }
}

/**
 * Two-pass search: primary language first, then fallback.
 * Deduplicates by Scryfall card ID.
 */
export async function searchByName(
  term: string,
  primaryLang: "en" | "de"
): Promise<ScryfallCard[]> {
  const [primaryQuery, fallbackQuery] =
    primaryLang === "en"
      ? [`name:${term}`, `name:${term} lang:de`]
      : [`name:${term} lang:de`, `name:${term}`];

  const primaryResults = await searchCards(primaryQuery);

  // Only run fallback if primary returned nothing
  const fallbackResults =
    primaryResults.length === 0 ? await searchCards(fallbackQuery) : [];

  // Merge and deduplicate by card ID
  const seen = new Set<string>();
  const merged: ScryfallCard[] = [];
  for (const card of [...primaryResults, ...fallbackResults]) {
    if (!seen.has(card.id)) {
      seen.add(card.id);
      merged.push(card);
    }
  }
  return merged;
}

/**
 * Returns the image URL for a card (front face, normal size).
 */
export function getCardImageUrl(card: ScryfallCard): string | undefined {
  return (
    card.image_uris?.normal ??
    card.card_faces?.[0]?.image_uris?.normal
  );
}

/**
 * Downloads a card image and returns it as an ArrayBuffer.
 */
export async function downloadImage(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}
