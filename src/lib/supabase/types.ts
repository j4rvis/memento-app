export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author: string | null
          content: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          instance_id: string
          is_archived: boolean
          is_read: boolean
          scrape_error: string | null
          scraped_at: string | null
          site_name: string | null
          title: string | null
          updated_at: string
          url: string
          user_id: string
          youtube_video_id: string | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          instance_id: string
          is_archived?: boolean
          is_read?: boolean
          scrape_error?: string | null
          scraped_at?: string | null
          site_name?: string | null
          title?: string | null
          updated_at?: string
          url: string
          user_id: string
          youtube_video_id?: string | null
        }
        Update: {
          author?: string | null
          content?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          instance_id?: string
          is_archived?: boolean
          is_read?: boolean
          scrape_error?: string | null
          scraped_at?: string | null
          site_name?: string | null
          title?: string | null
          updated_at?: string
          url?: string
          user_id?: string
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_entries: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          feed_id: string
          guid: string | null
          id: string
          image_url: string | null
          instance_id: string
          is_read: boolean
          is_starred: boolean
          published_at: string | null
          summary: string | null
          title: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          feed_id: string
          guid?: string | null
          id?: string
          image_url?: string | null
          instance_id: string
          is_read?: boolean
          is_starred?: boolean
          published_at?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          feed_id?: string
          guid?: string | null
          id?: string
          image_url?: string | null
          instance_id?: string
          is_read?: boolean
          is_starred?: boolean
          published_at?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_entries_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_entries_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      feeds: {
        Row: {
          created_at: string
          description: string | null
          fetch_error: string | null
          icon_url: string | null
          id: string
          instance_id: string
          last_fetched_at: string | null
          site_url: string | null
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fetch_error?: string | null
          icon_url?: string | null
          id?: string
          instance_id: string
          last_fetched_at?: string | null
          site_url?: string | null
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fetch_error?: string | null
          icon_url?: string | null
          id?: string
          instance_id?: string
          last_fetched_at?: string | null
          site_url?: string | null
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeds_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      instance_memberships: {
        Row: {
          created_at: string
          id: string
          instance_id: string
          role: Database["public"]["Enums"]["instance_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_id: string
          role?: Database["public"]["Enums"]["instance_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_id?: string
          role?: Database["public"]["Enums"]["instance_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instance_memberships_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      newspaper_blocks: {
        Row: {
          block_type: Database["public"]["Enums"]["block_type"]
          config: Json
          created_at: string
          id: string
          instance_id: string
          newspaper_id: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          block_type: Database["public"]["Enums"]["block_type"]
          config?: Json
          created_at?: string
          id?: string
          instance_id: string
          newspaper_id: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          block_type?: Database["public"]["Enums"]["block_type"]
          config?: Json
          created_at?: string
          id?: string
          instance_id?: string
          newspaper_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newspaper_blocks_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newspaper_blocks_newspaper_id_fkey"
            columns: ["newspaper_id"]
            isOneToOne: false
            referencedRelation: "newspapers"
            referencedColumns: ["id"]
          },
        ]
      }
      newspaper_editions: {
        Row: {
          content: Json
          generated_at: string
          id: string
          instance_id: string
          newspaper_id: string
          sent_at: string | null
          sent_to_kindle: boolean
          title: string
          user_id: string
        }
        Insert: {
          content?: Json
          generated_at?: string
          id?: string
          instance_id: string
          newspaper_id: string
          sent_at?: string | null
          sent_to_kindle?: boolean
          title: string
          user_id: string
        }
        Update: {
          content?: Json
          generated_at?: string
          id?: string
          instance_id?: string
          newspaper_id?: string
          sent_at?: string | null
          sent_to_kindle?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newspaper_editions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newspaper_editions_newspaper_id_fkey"
            columns: ["newspaper_id"]
            isOneToOne: false
            referencedRelation: "newspapers"
            referencedColumns: ["id"]
          },
        ]
      }
      newspapers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instance_id: string
          is_default: boolean
          kindle_email: string | null
          schedule: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instance_id: string
          is_default?: boolean
          kindle_email?: string | null
          schedule?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instance_id?: string
          is_default?: boolean
          kindle_email?: string | null
          schedule?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newspapers_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          color: string | null
          content: string
          created_at: string
          id: string
          instance_id: string
          is_pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content?: string
          created_at?: string
          id?: string
          instance_id: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string
          created_at?: string
          id?: string
          instance_id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          instance_id: string
          is_completed: boolean
          priority: number
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instance_id: string
          is_completed?: boolean
          priority?: number
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instance_id?: string
          is_completed?: boolean
          priority?: number
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_instance_admin: { Args: { p_instance_id: string }; Returns: boolean }
      is_instance_member: { Args: { p_instance_id: string }; Returns: boolean }
      is_instance_owner: { Args: { p_instance_id: string }; Returns: boolean }
    }
    Enums: {
      block_type: "weather" | "rss" | "notes" | "text" | "articles" | "todos"
      content_type: "article" | "youtube" | "other"
      instance_role: "owner" | "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      block_type: ["weather", "rss", "notes", "text", "articles", "todos"],
      content_type: ["article", "youtube", "other"],
      instance_role: ["owner", "admin", "member"],
    },
  },
} as const
