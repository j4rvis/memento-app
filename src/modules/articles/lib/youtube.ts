const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractYouTubeId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url);
}

interface YouTubeOEmbedResponse {
  title: string;
  author_name: string;
  thumbnail_url: string;
}

export async function fetchYouTubeOEmbed(
  url: string
): Promise<YouTubeOEmbedResponse | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      title: data.title,
      author_name: data.author_name,
      thumbnail_url: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}
