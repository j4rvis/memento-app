const PLATFORM_MAP: Record<string, string> = {
  "instagram.com": "Instagram",
  "www.instagram.com": "Instagram",
  "twitter.com": "Twitter",
  "www.twitter.com": "Twitter",
  "x.com": "X",
  "www.x.com": "X",
  "tiktok.com": "TikTok",
  "www.tiktok.com": "TikTok",
  "reddit.com": "Reddit",
  "www.reddit.com": "Reddit",
  "old.reddit.com": "Reddit",
  "threads.net": "Threads",
  "www.threads.net": "Threads",
  "bsky.app": "Bluesky",
  "mastodon.social": "Mastodon",
  "linkedin.com": "LinkedIn",
  "www.linkedin.com": "LinkedIn",
  "facebook.com": "Facebook",
  "www.facebook.com": "Facebook",
  "m.facebook.com": "Facebook",
};

export function detectPlatform(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    return PLATFORM_MAP[hostname] ?? null;
  } catch {
    return null;
  }
}

export function platformDisplayName(platform: string): string {
  return platform;
}
