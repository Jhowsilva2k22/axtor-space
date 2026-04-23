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
      bio_block_campaigns: {
        Row: {
          block_id: string
          clicks_count: number
          created_at: string
          id: string
          is_active: boolean
          label: string
          slug: string
          tenant_id: string
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          block_id: string
          clicks_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          slug: string
          tenant_id?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          block_id?: string
          clicks_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          tenant_id?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bio_block_campaigns_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "bio_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bio_block_campaigns_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_blocks: {
        Row: {
          badge: string | null
          category_id: string | null
          created_at: string
          description: string | null
          draft_data: Json | null
          has_draft: boolean
          highlight: boolean
          icon: string | null
          icon_generations_count: number
          icon_url: string | null
          id: string
          is_active: boolean
          kind: string
          label: string
          position: number
          size: string
          tenant_id: string
          updated_at: string
          url: string
          use_brand_color: boolean
        }
        Insert: {
          badge?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          draft_data?: Json | null
          has_draft?: boolean
          highlight?: boolean
          icon?: string | null
          icon_generations_count?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          label: string
          position?: number
          size?: string
          tenant_id?: string
          updated_at?: string
          url: string
          use_brand_color?: boolean
        }
        Update: {
          badge?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          draft_data?: Json | null
          has_draft?: boolean
          highlight?: boolean
          icon?: string | null
          icon_generations_count?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          label?: string
          position?: number
          size?: string
          tenant_id?: string
          updated_at?: string
          url?: string
          use_brand_color?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bio_blocks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "bio_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bio_blocks_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          position: number
          slug: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          position?: number
          slug: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          slug?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_categories_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_clicks: {
        Row: {
          block_id: string | null
          block_kind: string | null
          block_label: string | null
          block_url: string | null
          campaign_slug: string | null
          created_at: string
          device: string | null
          id: string
          referrer: string | null
          session_id: string
          tenant_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          block_id?: string | null
          block_kind?: string | null
          block_label?: string | null
          block_url?: string | null
          campaign_slug?: string | null
          created_at?: string
          device?: string | null
          id?: string
          referrer?: string | null
          session_id: string
          tenant_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          block_id?: string | null
          block_kind?: string | null
          block_label?: string | null
          block_url?: string | null
          campaign_slug?: string | null
          created_at?: string
          device?: string | null
          id?: string
          referrer?: string | null
          session_id?: string
          tenant_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bio_clicks_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_config: {
        Row: {
          active_theme_slug: string
          avatar_url: string | null
          contact_url: string | null
          cover_url: string | null
          created_at: string
          display_name: string
          footer_text: string | null
          headline: string
          id: string
          singleton: boolean
          sub_headline: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active_theme_slug?: string
          avatar_url?: string | null
          contact_url?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          footer_text?: string | null
          headline?: string
          id?: string
          singleton?: boolean
          sub_headline?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          active_theme_slug?: string
          avatar_url?: string | null
          contact_url?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          footer_text?: string | null
          headline?: string
          id?: string
          singleton?: boolean
          sub_headline?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_config_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          icon_url: string
          id?: string
          prompt: string
          storage_path: string
          style?: string
          tenant_id?: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          icon_url?: string
          id?: string
          prompt?: string
          storage_path?: string
          style?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_icon_generations_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "bio_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bio_icon_generations_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_themes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          preview_image_url: string | null
          slug: string
          tokens: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          preview_image_url?: string | null
          slug: string
          tokens: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          preview_image_url?: string | null
          slug?: string
          tokens?: Json
          updated_at?: string
        }
        Relationships: []
      }
      client_error_log: {
        Row: {
          app_version: string | null
          component_stack: string | null
          created_at: string
          extra: Json | null
          id: string
          message: string
          route: string | null
          severity: string
          stack: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          component_stack?: string | null
          created_at?: string
          extra?: Json | null
          id?: string
          message: string
          route?: string | null
          severity?: string
          stack?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          component_stack?: string | null
          created_at?: string
          extra?: Json | null
          id?: string
          message?: string
          route?: string | null
          severity?: string
          stack?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deep_diagnostics: {
        Row: {
          ai_veredict: string | null
          answers: Json
          created_at: string
          funnel_id: string
          id: string
          instagram_handle: string | null
          lead_email: string | null
          lead_id: string | null
          lead_name: string | null
          lead_phone: string | null
          pain_detected: string | null
          pain_scores: Json
          parent_diagnostic_id: string | null
          recommended_product_id: string | null
          session_id: string | null
          status: string
          tenant_id: string
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          ai_veredict?: string | null
          answers?: Json
          created_at?: string
          funnel_id: string
          id?: string
          instagram_handle?: string | null
          lead_email?: string | null
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          pain_detected?: string | null
          pain_scores?: Json
          parent_diagnostic_id?: string | null
          recommended_product_id?: string | null
          session_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          ai_veredict?: string | null
          answers?: Json
          created_at?: string
          funnel_id?: string
          id?: string
          instagram_handle?: string | null
          lead_email?: string | null
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          pain_detected?: string | null
          pain_scores?: Json
          parent_diagnostic_id?: string | null
          recommended_product_id?: string | null
          session_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_diagnostics_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "deep_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      deep_funnel_products: {
        Row: {
          benefits: Json
          checkout_url: string | null
          created_at: string
          cta_label: string | null
          cta_mode: string
          cta_secondary_label: string | null
          description: string | null
          funnel_id: string
          how_it_works: string | null
          id: string
          is_active: boolean
          name: string
          pain_tag: string
          position: number
          price_hint: string | null
          result_media_caption: string | null
          result_media_type: string | null
          result_media_url: string | null
          thankyou_media_caption: string | null
          thankyou_media_type: string | null
          thankyou_media_url: string | null
          thankyou_text: string | null
          thankyou_whatsapp_template: string | null
          updated_at: string
          urgency_text: string | null
          whatsapp_template: string | null
          who_for: string | null
        }
        Insert: {
          benefits?: Json
          checkout_url?: string | null
          created_at?: string
          cta_label?: string | null
          cta_mode?: string
          cta_secondary_label?: string | null
          description?: string | null
          funnel_id: string
          how_it_works?: string | null
          id?: string
          is_active?: boolean
          name: string
          pain_tag: string
          position?: number
          price_hint?: string | null
          result_media_caption?: string | null
          result_media_type?: string | null
          result_media_url?: string | null
          thankyou_media_caption?: string | null
          thankyou_media_type?: string | null
          thankyou_media_url?: string | null
          thankyou_text?: string | null
          thankyou_whatsapp_template?: string | null
          updated_at?: string
          urgency_text?: string | null
          whatsapp_template?: string | null
          who_for?: string | null
        }
        Update: {
          benefits?: Json
          checkout_url?: string | null
          created_at?: string
          cta_label?: string | null
          cta_mode?: string
          cta_secondary_label?: string | null
          description?: string | null
          funnel_id?: string
          how_it_works?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pain_tag?: string
          position?: number
          price_hint?: string | null
          result_media_caption?: string | null
          result_media_type?: string | null
          result_media_url?: string | null
          thankyou_media_caption?: string | null
          thankyou_media_type?: string | null
          thankyou_media_url?: string | null
          thankyou_text?: string | null
          thankyou_whatsapp_template?: string | null
          updated_at?: string
          urgency_text?: string | null
          whatsapp_template?: string | null
          who_for?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_funnel_products_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "deep_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      deep_funnel_questions: {
        Row: {
          allow_skip_after_seconds: number | null
          created_at: string
          funnel_id: string
          id: string
          lock_until_media_ends: boolean
          media_caption: string | null
          media_type: string | null
          media_url: string | null
          options: Json
          position: number
          question_text: string
          question_type: string
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          allow_skip_after_seconds?: number | null
          created_at?: string
          funnel_id: string
          id?: string
          lock_until_media_ends?: boolean
          media_caption?: string | null
          media_type?: string | null
          media_url?: string | null
          options?: Json
          position?: number
          question_text: string
          question_type?: string
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          allow_skip_after_seconds?: number | null
          created_at?: string
          funnel_id?: string
          id?: string
          lock_until_media_ends?: boolean
          media_caption?: string | null
          media_type?: string | null
          media_url?: string | null
          options?: Json
          position?: number
          question_text?: string
          question_type?: string
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deep_funnel_questions_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "deep_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      deep_funnels: {
        Row: {
          allow_skip_after_seconds: number
          briefing: Json
          created_at: string
          id: string
          is_published: boolean
          lock_until_media_ends: boolean
          name: string
          published_at: string | null
          result_intro: string | null
          slug: string
          tenant_id: string
          thankyou_media_caption: string | null
          thankyou_media_type: string | null
          thankyou_media_url: string | null
          thankyou_text: string | null
          updated_at: string
          welcome_media_caption: string | null
          welcome_media_type: string | null
          welcome_media_url: string | null
          welcome_text: string | null
        }
        Insert: {
          allow_skip_after_seconds?: number
          briefing?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          lock_until_media_ends?: boolean
          name: string
          published_at?: string | null
          result_intro?: string | null
          slug: string
          tenant_id: string
          thankyou_media_caption?: string | null
          thankyou_media_type?: string | null
          thankyou_media_url?: string | null
          thankyou_text?: string | null
          updated_at?: string
          welcome_media_caption?: string | null
          welcome_media_type?: string | null
          welcome_media_url?: string | null
          welcome_text?: string | null
        }
        Update: {
          allow_skip_after_seconds?: number
          briefing?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          lock_until_media_ends?: boolean
          name?: string
          published_at?: string | null
          result_intro?: string | null
          slug?: string
          tenant_id?: string
          thankyou_media_caption?: string | null
          thankyou_media_type?: string | null
          thankyou_media_url?: string | null
          thankyou_text?: string | null
          updated_at?: string
          welcome_media_caption?: string | null
          welcome_media_type?: string | null
          welcome_media_url?: string | null
          welcome_text?: string | null
        }
        Relationships: []
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
          tenant_id: string
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
          tenant_id?: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "diagnostics_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
          tenant_id: string
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
          tenant_id?: string
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
          tenant_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_recommendations: {
        Row: {
          action_payload: Json | null
          action_type: string | null
          applied_at: string | null
          category: string
          created_at: string
          effort: string
          evidence: Json
          id: string
          impact: string
          priority_score: number
          rationale: string | null
          source_run_id: string | null
          status: string
          summary: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          action_payload?: Json | null
          action_type?: string | null
          applied_at?: string | null
          category?: string
          created_at?: string
          effort?: string
          evidence?: Json
          id?: string
          impact?: string
          priority_score?: number
          rationale?: string | null
          source_run_id?: string | null
          status?: string
          summary: string
          tenant_id?: string
          title: string
          updated_at?: string
        }
        Update: {
          action_payload?: Json | null
          action_type?: string | null
          applied_at?: string | null
          category?: string
          created_at?: string
          effort?: string
          evidence?: Json
          id?: string
          impact?: string
          priority_score?: number
          rationale?: string | null
          source_run_id?: string | null
          status?: string
          summary?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "improvement_recommendations_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_runs: {
        Row: {
          ai_summary: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          inputs_summary: Json | null
          recommendations_count: number
          status: string
          tenant_id: string
        }
        Insert: {
          ai_summary?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          inputs_summary?: Json | null
          recommendations_count?: number
          status?: string
          tenant_id?: string
        }
        Update: {
          ai_summary?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          inputs_summary?: Json | null
          recommendations_count?: number
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "improvement_runs_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          email_sent_at: string | null
          expires_at: string | null
          id: string
          mode: string
          note: string | null
          revoked_at: string | null
          target_email: string | null
          type: string
          updated_at: string
          used_at: string | null
          used_by_user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          mode: string
          note?: string | null
          revoked_at?: string | null
          target_email?: string | null
          type: string
          updated_at?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          mode?: string
          note?: string | null
          revoked_at?: string | null
          target_email?: string | null
          type?: string
          updated_at?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Relationships: []
      }
      landing_partners: {
        Row: {
          bio_url: string | null
          created_at: string
          id: string
          instagram_handle: string | null
          is_active: boolean
          note: string | null
          priority: number
          secondary_cta_label: string | null
          secondary_cta_url: string | null
          tenant_id: string
          updated_at: string
          utm_source: string
          whatsapp_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          bio_url?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          note?: string | null
          priority?: number
          secondary_cta_label?: string | null
          secondary_cta_url?: string | null
          tenant_id: string
          updated_at?: string
          utm_source: string
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          bio_url?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          note?: string | null
          priority?: number
          secondary_cta_label?: string | null
          secondary_cta_url?: string | null
          tenant_id?: string
          updated_at?: string
          utm_source?: string
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_partners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string
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
          tenant_id?: string
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
          tenant_id?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string
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
          tenant_id?: string
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
          tenant_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tenant_addons: {
        Row: {
          activated_at: string
          addon_slug: string
          created_at: string
          expires_at: string | null
          id: string
          purchase_type: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string
          addon_slug: string
          created_at?: string
          expires_at?: string | null
          id?: string
          purchase_type?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string
          addon_slug?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          purchase_type?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          display_name: string
          id: string
          owner_user_id: string | null
          plan: string
          plan_limits: Json
          slug: string
          status: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          owner_user_id?: string | null
          plan?: string
          plan_limits?: Json
          slug: string
          status?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          owner_user_id?: string | null
          plan?: string
          plan_limits?: Json
          slug?: string
          status?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          block_id: string | null
          category: string
          created_at: string
          device: string | null
          email: string | null
          id: string
          message: string
          page_path: string | null
          sentiment: string | null
          session_id: string | null
          status: string
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          block_id?: string | null
          category?: string
          created_at?: string
          device?: string | null
          email?: string | null
          id?: string
          message: string
          page_path?: string | null
          sentiment?: string | null
          session_id?: string | null
          status?: string
          tenant_id?: string
          user_agent?: string | null
        }
        Update: {
          block_id?: string | null
          category?: string
          created_at?: string
          device?: string | null
          email?: string | null
          id?: string
          message?: string
          page_path?: string | null
          sentiment?: string | null
          session_id?: string | null
          status?: string
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      check_slug_available: { Args: { _slug: string }; Returns: Json }
      create_tenant_for_user: {
        Args: { _display_name: string; _invite_code?: string; _slug: string }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
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
      get_landing_partner_ctas: {
        Args: { _utm_source: string }
        Returns: {
          bio_url: string
          display_name: string
          instagram_handle: string
          secondary_cta_label: string
          secondary_cta_url: string
          slug: string
          tenant_id: string
          whatsapp_message: string
          whatsapp_number: string
        }[]
      }
      get_tenant_analytics: {
        Args: { _days?: number; _tenant_id: string }
        Returns: Json
      }
      has_addon: {
        Args: { _addon_slug: string; _tenant_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_tenant_owner: { Args: { _tenant_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      resolve_campaign: {
        Args: { _slug: string }
        Returns: {
          block_id: string
          block_kind: string
          block_label: string
          block_url: string
          utm_campaign: string
          utm_medium: string
          utm_source: string
        }[]
      }
      resolve_landing_tenant: { Args: { _utm_source: string }; Returns: string }
      resolve_tenant_by_slug: {
        Args: { _slug: string }
        Returns: {
          display_name: string
          id: string
          plan: string
          slug: string
          status: string
        }[]
      }
      validate_invite_code: {
        Args: { _code: string; _email?: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "tenant_owner"
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
      app_role: ["admin", "user", "tenant_owner"],
    },
  },
} as const
