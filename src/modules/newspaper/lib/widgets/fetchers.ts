import type { SupabaseClient } from "@supabase/supabase-js";

function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code === 95) return "Thunderstorm";
  if (code >= 96 && code <= 99) return "Thunderstorm with hail";
  return "Unknown";
}

export async function fetchWeatherData(location: string) {
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

interface BlockRow {
  block_type: string;
  config: Record<string, unknown>;
}

export async function fetchBlockData(
  block: BlockRow,
  instanceId: string,
  supabase: SupabaseClient
): Promise<unknown> {
  switch (block.block_type) {
    case "todos": {
      const config = block.config as { max_items?: number };
      const { data } = await supabase
        .from("todos")
        .select("title, is_completed, priority, due_date")
        .eq("instance_id", instanceId)
        .eq("is_completed", false)
        .order("priority", { ascending: false })
        .limit(config.max_items ?? 10);
      return data;
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
      const { data } = await query.order("updated_at", { ascending: false });
      return data;
    }
    case "rss": {
      const config = block.config as { feed_id?: string; max_items?: number };
      if (!config.feed_id) return null;
      const { data } = await supabase
        .from("feed_entries")
        .select("title, url, summary, published_at")
        .eq("feed_id", config.feed_id)
        .order("published_at", { ascending: false })
        .limit(config.max_items ?? 5);
      return data;
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
        const { data } = await supabase
          .from("articles")
          .select("title, url, excerpt, site_name")
          .in("id", config.article_ids)
          .eq("instance_id", instanceId);
        return data;
      } else if (mode === "category" && config.category) {
        const { data } = await supabase
          .from("articles")
          .select("title, url, excerpt, site_name")
          .eq("instance_id", instanceId)
          .eq("category", config.category)
          .eq("is_archived", false)
          .order("created_at", { ascending: false })
          .limit(count);
        return data;
      } else if (mode === "random") {
        const { data: pool } = await supabase
          .from("articles")
          .select("title, url, excerpt, site_name")
          .eq("instance_id", instanceId)
          .eq("is_archived", false)
          .limit(count * 5);
        const shuffled = (pool ?? []).sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
      } else {
        const { data } = await supabase
          .from("articles")
          .select("title, url, excerpt, site_name")
          .eq("instance_id", instanceId)
          .eq("is_archived", false)
          .order("created_at", { ascending: false })
          .limit(count);
        return data;
      }
    }
    case "text": {
      const config = block.config as { body?: string };
      return { body: config.body || "" };
    }
    case "weather": {
      const config = block.config as { location?: string };
      return fetchWeatherData(config.location || "Unknown");
    }
    case "calendar": {
      const config = block.config as { days_ahead?: number };
      const daysAhead = config.days_ahead ?? 7;
      const now = new Date();
      const future = new Date(now);
      future.setDate(now.getDate() + daysAhead);
      const todayStr = now.toISOString().split("T")[0];
      const futureStr = future.toISOString().split("T")[0];
      const { data } = await supabase
        .from("todos")
        .select("title, due_date, priority, is_completed")
        .eq("instance_id", instanceId)
        .eq("is_completed", false)
        .gte("due_date", todayStr)
        .lte("due_date", futureStr)
        .order("due_date");
      return data;
    }
    default:
      return null;
  }
}
