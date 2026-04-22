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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bio_blocks: {
        Row: {
          badge: string | null
          created_at: string
          description: string | null
          highlight: boolean
          icon: string | null
          icon_generations_count: number
          icon_url: string | null
          id: string
          is_active: boolean
          kind: string
          label: string
          position: number
          updated_at: string
          url: string
          use_brand_color: boolean
        }
        Insert: {
          badge?: string | null
          created_at?: string
          description?: string | null
          highlight?: boolean
          icon?: string | null
          icon_generations_count?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          label: string
          position?: number
          updated_at?: string
          url: string
          use_brand_color?: boolean
        }
        Update: {
          badge?: string | null
          created_at?: string
          description?: string | null
          highlight?: boolean
          icon?: string | null
          icon_generations_count?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          label?: string
          position?: number
          updated_at?: string
          url?: string
          use_brand_color?: boolean
        }
        Relationships: []
      }
      bio_clicks: {
        Row: {
          block_id: string | null
          block_kind: string | null
          block_label: string | null
          block_url: string | null
          created_at: string
          device: string | null
          id: string
          referrer: string | null
          session_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          block_id?: string | null
          block_kind?: string | null
          block_label?: string | null
          block_url?: string | null
          created_at?: string
          device?: string | null
          id?: string
          referrer?: string | null
          session_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          block_id?: string | null
          block_kind?: string | null
          block_label?: string | null
          block_url?: string | null
          created_at?: string
          device?: string | null
          id?: string
          referrer?: string | null
          session_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      bio_config: {
        Row: {
          avatar_url: string | null
          contact_url: string | null
          created_at: string
          display_name: string
          footer_text: string | null
          headline: string
          id: string
          singleton: boolean
          sub_headline: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          contact_url?: string | null
          created_at?: string
          display_name?: string
          footer_text?: string | null
          headline?: string
          id?: string
          singleton?: boolean
          sub_headline?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          contact_url?: string | null
          created_at?: string
          display_name?: string
          footer_text?: string | null
          headline?: string
          id?: string
          singleton?: boolean
          sub_headline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bio_icon_generations: {
        Row: {
          block_id: string | null
          created_at: string
          icon_url: string
          id: string
          prompt: string
          storage_path: string
          style: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          icon_url: string
          id?: string
          prompt: string
          storage_path: string
          style?: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          icon_url?: string
          id?: string
          prompt?: string
          storage_path?: string
          style?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_icon_generations_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "bio_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics: {
        Row: {
          ai_summary: string | null
          created_at: string
          error_message: string | null
          id: string
          insights: Json | null
          instagram_handle: string
          is_private: boolean
          lead_id: string | null
          profile_data: Json | null
          scores: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          insights?: Json | null
          instagram_handle: string
          is_private?: boolean
          lead_id?: string | null
          profile_data?: Json | null
          scores?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          insights?: Json | null
          instagram_handle?: string
          is_private?: boolean
          lead_id?: string | null
          profile_data?: Json | null
          scores?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          created_at: string
          diagnostic_id: string | null
          event_name: string
          id: string
          instagram_handle: string | null
          meta: Json | null
          session_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          diagnostic_id?: string | null
          event_name: string
          id?: string
          instagram_handle?: string | null
          meta?: Json | null
          session_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          diagnostic_id?: string | null
          event_name?: string
          id?: string
          instagram_handle?: string | null
          meta?: Json | null
          session_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          instagram_handle: string
          phone: string | null
          profile_is_private: boolean | null
          source: string | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          instagram_handle: string
          phone?: string | null
          profile_is_private?: boolean | null
          source?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          instagram_handle?: string
          phone?: string | null
          profile_is_private?: boolean | null
          source?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          device: string | null
          id: string
          meta: Json | null
          path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          device?: string | null
          id?: string
          meta?: Json | null
          path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          device?: string | null
          id?: string
          meta?: Json | null
          path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_analytics_summary: { Args: { _days?: number }; Returns: Json }
      get_block_analytics: {
        Args: { _block_id: string; _days?: number }
        Returns: Json
      }
      get_diagnostic_public: {
        Args: { _id: string }
        Returns: {
          ai_summary: string
          created_at: string
          id: string
          insights: Json
          instagram_handle: string
          is_private: boolean
          profile_data: Json
          scores: Json
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
