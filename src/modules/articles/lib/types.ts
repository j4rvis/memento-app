export interface Article {
  id: string;
  title: string | null;
  url: string;
  content: string | null;
  excerpt: string | null;
  author: string | null;
  site_name: string | null;
  content_type: string;
  category: string | null;
  tag_id: string | null;
  youtube_video_id: string | null;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  instance_id: string;
  user_id: string;
}

export interface ArticleTag {
  id: string;
  name: string;
  instance_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
