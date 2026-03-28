const X_API_BASE = "https://api.twitter.com/2";

export interface XList {
  id: string;
  name: string;
  member_count?: number;
}

export interface XUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

export interface XTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  attachments?: { media_keys?: string[] };
}

export interface XMedia {
  media_key: string;
  type: string;
  url?: string;
  preview_image_url?: string;
}

function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function fetchAuthenticatedUser(accessToken: string): Promise<XUser> {
  const res = await fetch(`${X_API_BASE}/users/me?user.fields=profile_image_url`, {
    headers: authHeader(accessToken),
  });
  if (!res.ok) throw new Error(`Failed to fetch X user: ${await res.text()}`);
  const json = await res.json();
  return json.data as XUser;
}

export async function fetchUserLists(
  accessToken: string,
  userId: string
): Promise<XList[]> {
  const [ownedRes, followedRes] = await Promise.all([
    fetch(
      `${X_API_BASE}/users/${userId}/owned_lists?list.fields=member_count&max_results=100`,
      { headers: authHeader(accessToken) }
    ),
    fetch(
      `${X_API_BASE}/users/${userId}/list_memberships?list.fields=member_count&max_results=100`,
      { headers: authHeader(accessToken) }
    ),
  ]);

  const owned = ownedRes.ok ? await ownedRes.json() : { data: [] };
  const followed = followedRes.ok ? await followedRes.json() : { data: [] };

  return [...(owned.data ?? []), ...(followed.data ?? [])];
}

export interface TweetPage {
  tweets: XTweet[];
  authors: Record<string, XUser>;
  media: Record<string, XMedia>;
}

export async function fetchListTweets(
  accessToken: string,
  listId: string,
  sinceId?: string,
  maxResults = 10
): Promise<TweetPage> {
  const params = new URLSearchParams({
    max_results: String(Math.min(maxResults, 100)),
    "tweet.fields": "author_id,created_at,attachments",
    expansions: "author_id,attachments.media_keys",
    "user.fields": "username,name,profile_image_url",
    "media.fields": "url,preview_image_url",
  });
  if (sinceId) params.set("since_id", sinceId);

  const res = await fetch(`${X_API_BASE}/lists/${listId}/tweets?${params}`, {
    headers: authHeader(accessToken),
  });
  if (!res.ok) throw new Error(`Failed to fetch list tweets: ${await res.text()}`);
  return parseTweetResponse(await res.json());
}

export async function fetchUserTweets(
  accessToken: string,
  userId: string,
  sinceId?: string,
  maxResults = 10
): Promise<TweetPage> {
  const params = new URLSearchParams({
    max_results: String(Math.min(maxResults, 100)),
    "tweet.fields": "author_id,created_at,attachments",
    expansions: "author_id,attachments.media_keys",
    "user.fields": "username,name,profile_image_url",
    "media.fields": "url,preview_image_url",
    exclude: "retweets,replies",
  });
  if (sinceId) params.set("since_id", sinceId);

  const res = await fetch(`${X_API_BASE}/users/${userId}/tweets?${params}`, {
    headers: authHeader(accessToken),
  });
  if (!res.ok) throw new Error(`Failed to fetch user tweets: ${await res.text()}`);
  return parseTweetResponse(await res.json());
}

function parseTweetResponse(json: Record<string, unknown>): TweetPage {
  const tweets: XTweet[] = (json.data as XTweet[] | undefined) ?? [];
  const includes = json.includes as Record<string, unknown> | undefined;

  const authors: Record<string, XUser> = {};
  for (const user of (includes?.users as XUser[] | undefined) ?? []) {
    authors[user.id] = user;
  }

  const media: Record<string, XMedia> = {};
  for (const m of (includes?.media as XMedia[] | undefined) ?? []) {
    media[m.media_key] = m;
  }

  return { tweets, authors, media };
}
