export interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  folder_id: string | null;
  instance_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface NoteFolder {
  id: string;
  name: string;
  instance_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type SyncState = "idle" | "saving" | "saved" | "error";
