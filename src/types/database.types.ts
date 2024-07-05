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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          updated_at: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          updated_at?: string
          userId: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          updated_at?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: number
          operation: string
          success: boolean
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: number
          operation: string
          success: boolean
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: number
          operation?: string
          success?: boolean
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          author_id: string | null
          background_color: string | null
          button_bg_color: string | null
          button_text_color: string | null
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_pinned: boolean | null
          link_label: string | null
          link_url: string | null
          message: string
          start_date: string
          text_color: string | null
          title: string
          type: string | null
        }
        Insert: {
          author_id?: string | null
          background_color?: string | null
          button_bg_color?: string | null
          button_text_color?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          link_label?: string | null
          link_url?: string | null
          message: string
          start_date?: string
          text_color?: string | null
          title: string
          type?: string | null
        }
        Update: {
          author_id?: string | null
          background_color?: string | null
          button_bg_color?: string | null
          button_text_color?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          link_label?: string | null
          link_url?: string | null
          message?: string
          start_date?: string
          text_color?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chapter_versions: {
        Row: {
          chapter_id: string
          content: Json
          created_at: string | null
          id: string
          source: string | null
          title: string | null
          word_count: number | null
        }
        Insert: {
          chapter_id: string
          content: Json
          created_at?: string | null
          id?: string
          source?: string | null
          title?: string | null
          word_count?: number | null
        }
        Update: {
          chapter_id?: string
          content?: Json
          created_at?: string | null
          id?: string
          source?: string | null
          title?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_versions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          author_id: string
          author_note: string | null
          chapter_number: number
          comment_count: number | null
          content: string | null
          created_at: string | null
          id: string
          is_draft: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          published_at: string | null
          series_id: string
          slug: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          author_note?: string | null
          chapter_number: number
          comment_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_draft?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          published_at?: string | null
          series_id: string
          slug?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          author_note?: string | null
          chapter_number?: number
          comment_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_draft?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          published_at?: string | null
          series_id?: string
          slug?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_with_author"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          announcement_id: string | null
          author_id: string | null
          block_id: string | null
          chapter_id: string | null
          community_post_id: string | null
          created_at: string | null
          dislike_count: number | null
          id: string
          is_inline: boolean | null
          like_count: number | null
          parent_id: string | null
          series_id: string | null
          story_id: string | null
          text: string
        }
        Insert: {
          announcement_id?: string | null
          author_id?: string | null
          block_id?: string | null
          chapter_id?: string | null
          community_post_id?: string | null
          created_at?: string | null
          dislike_count?: number | null
          id?: string
          is_inline?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          series_id?: string | null
          story_id?: string | null
          text: string
        }
        Update: {
          announcement_id?: string | null
          author_id?: string | null
          block_id?: string | null
          chapter_id?: string | null
          community_post_id?: string | null
          created_at?: string | null
          dislike_count?: number | null
          id?: string
          is_inline?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          series_id?: string | null
          story_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_profile_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_community_post_id_fkey"
            columns: ["community_post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_color: string | null
          avatar_url: string | null
          cover_color: string | null
          cover_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_featured: boolean
          is_private: boolean
          name: string
          rules: string[]
          slug: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          avatar_color?: string | null
          avatar_url?: string | null
          cover_color?: string | null
          cover_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_private?: boolean
          name: string
          rules?: string[]
          slug: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          avatar_color?: string | null
          avatar_url?: string | null
          cover_color?: string | null
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_private?: boolean
          name?: string
          rules?: string[]
          slug?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_invites: {
        Row: {
          community_id: string
          created_at: string
          id: string
          invited_by: string
          invitee_id: string
          status: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          invited_by: string
          invitee_id: string
          status?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          invited_by?: string
          invitee_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_invites_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_invites_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          created_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          community_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          community_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          html: string
          id: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          html: string
          id?: string
          subject?: string
          updated_at?: string | null
        }
        Update: {
          html?: string
          id?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          additional_data: Json | null
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          related_id: string | null
          target_user_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          additional_data?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          target_user_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          additional_data?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          target_user_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reposts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          like_count: number | null
          parent_id: string | null
          reply_count: number | null
          repost_count: number | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          reply_count?: number | null
          repost_count?: number | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          reply_count?: number | null
          repost_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          abacate_customer_id: string | null
          account_status: string | null
          age_verified: boolean | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          birth_date_change_count: number | null
          created_at: string | null
          current_period_end: string | null
          deleted_at: string | null
          deletion_scheduled_at: string | null
          deletion_warning_sent_at: string | null
          email: string | null
          facebook_url: string | null
          first_book_used: boolean
          first_name: string | null
          has_elite_badge: boolean | null
          has_premium_badge: boolean | null
          id: string
          instagram_url: string | null
          is_admin: boolean | null
          last_billing_id: string | null
          last_interaction_at: string | null
          last_name: string | null
          level: number | null
          reader_level: number | null
          reader_xp: number | null
          remind_email_count: number | null
          remind_email_sent_at: string | null
          returned_after_reengage_at: string | null
          role: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          twitter_url: string | null
          updated_at: string | null
          username: string | null
          website_url: string | null
          writer_level: number | null
          writer_xp: number | null
          xp: number | null
        }
        Insert: {
          abacate_customer_id?: string | null
          account_status?: string | null
          age_verified?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          birth_date_change_count?: number | null
          created_at?: string | null
          current_period_end?: string | null
          deleted_at?: string | null
          deletion_scheduled_at?: string | null
          deletion_warning_sent_at?: string | null
          email?: string | null
          facebook_url?: string | null
          first_book_used?: boolean
          first_name?: string | null
          has_elite_badge?: boolean | null
          has_premium_badge?: boolean | null
          id: string
          instagram_url?: string | null
          is_admin?: boolean | null
          last_billing_id?: string | null
          last_interaction_at?: string | null
          last_name?: string | null
          level?: number | null
          reader_level?: number | null
          reader_xp?: number | null
          remind_email_count?: number | null
          remind_email_sent_at?: string | null
          returned_after_reengage_at?: string | null
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          website_url?: string | null
          writer_level?: number | null
          writer_xp?: number | null
          xp?: number | null
        }
        Update: {
          abacate_customer_id?: string | null
          account_status?: string | null
          age_verified?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          birth_date_change_count?: number | null
          created_at?: string | null
          current_period_end?: string | null
          deleted_at?: string | null
          deletion_scheduled_at?: string | null
          deletion_warning_sent_at?: string | null
          email?: string | null
          facebook_url?: string | null
          first_book_used?: boolean
          first_name?: string | null
          has_elite_badge?: boolean | null
          has_premium_badge?: boolean | null
          id?: string
          instagram_url?: string | null
          is_admin?: boolean | null
          last_billing_id?: string | null
          last_interaction_at?: string | null
          last_name?: string | null
          level?: number | null
          reader_level?: number | null
          reader_xp?: number | null
          remind_email_count?: number | null
          remind_email_sent_at?: string | null
          returned_after_reengage_at?: string | null
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          website_url?: string | null
          writer_level?: number | null
          writer_xp?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_history: {
        Row: {
          chapter_id: string | null
          id: string
          read_at: string
          series_id: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          id?: string
          read_at?: string
          series_id?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          id?: string
          read_at?: string
          series_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_history_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_history_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_list_items: {
        Row: {
          chapter_id: string | null
          created_at: string | null
          id: string
          playlist_id: string | null
          series_id: string | null
          story_id: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          playlist_id?: string | null
          series_id?: string | null
          story_id?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          playlist_id?: string | null
          series_id?: string | null
          story_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_list_items_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_list_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_list_items_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_list_items_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_list_items_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_list_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reengagement_logs: {
        Row: {
          created_at: string | null
          failed: number | null
          id: string
          matched: number | null
          results: Json | null
          sent: number | null
        }
        Insert: {
          created_at?: string | null
          failed?: number | null
          id?: string
          matched?: number | null
          results?: Json | null
          sent?: number | null
        }
        Update: {
          created_at?: string | null
          failed?: number | null
          id?: string
          matched?: number | null
          results?: Json | null
          sent?: number | null
        }
        Relationships: []
      }
      series: {
        Row: {
          abuse_infractions: number | null
          abuse_locked_until: string | null
          ai_cover_generated: string | null
          author_id: string
          author_note: string | null
          related_series_id: string | null
          related_title: string | null
          related_url: string | null
          related_banner_url: string | null
          chapter_count: number | null
          comments_enabled: boolean
          copyright_type: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          genres: string[] | null
          id: string
          is_ai_generated: string | null
          is_archived: boolean | null
          is_completed: boolean | null
          is_draft: boolean | null
          is_explicit: boolean | null
          is_first_book: boolean
          is_force_archived: boolean | null
          is_pinned: boolean | null
          slug: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
          work_type: string | null
        }
        Insert: {
          abuse_infractions?: number | null
          abuse_locked_until?: string | null
          ai_cover_generated?: string | null
          author_id: string
          author_note?: string | null
          related_series_id?: string | null
          related_title?: string | null
          related_url?: string | null
          related_banner_url?: string | null
          chapter_count?: number | null
          comments_enabled?: boolean
          copyright_type?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          genres?: string[] | null
          id?: string
          is_ai_generated?: string | null
          is_archived?: boolean | null
          is_completed?: boolean | null
          is_draft?: boolean | null
          is_explicit?: boolean | null
          is_first_book?: boolean
          is_force_archived?: boolean | null
          is_pinned?: boolean | null
          slug?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          work_type?: string | null
        }
        Update: {
          abuse_infractions?: number | null
          abuse_locked_until?: string | null
          ai_cover_generated?: string | null
          author_id?: string
          author_note?: string | null
          related_series_id?: string | null
          related_title?: string | null
          related_url?: string | null
          related_banner_url?: string | null
          chapter_count?: number | null
          comments_enabled?: boolean
          copyright_type?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          genres?: string[] | null
          id?: string
          is_ai_generated?: string | null
          is_archived?: boolean | null
          is_completed?: boolean | null
          is_draft?: boolean | null
          is_explicit?: boolean | null
          is_first_book?: boolean
          is_force_archived?: boolean | null
          is_pinned?: boolean | null
          slug?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      series_follows: {
        Row: {
          created_at: string | null
          id: string
          notify_new_chapter: boolean | null
          series_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notify_new_chapter?: boolean | null
          series_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notify_new_chapter?: boolean | null
          series_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_follows_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_follows_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_with_author"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          expires: string
          id: string
          sessionToken: string
          updated_at: string
          userId: string
        }
        Insert: {
          created_at?: string
          expires: string
          id?: string
          sessionToken: string
          updated_at?: string
          userId: string
        }
        Update: {
          created_at?: string
          expires?: string
          id?: string
          sessionToken?: string
          updated_at?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          path: string
          referer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          author_id: string
          category: string | null
          chapter_number: number | null
          content: string
          created_at: string | null
          expires_at: string | null
          fts: unknown
          id: string
          is_part_of_series: boolean | null
          is_pinned: boolean | null
          is_published: boolean | null
          is_series_finale: boolean | null
          like_count: number | null
          series_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number
        }
        Insert: {
          author_id: string
          category?: string | null
          chapter_number?: number | null
          content: string
          created_at?: string | null
          expires_at?: string | null
          fts?: unknown
          id?: string
          is_part_of_series?: boolean | null
          is_pinned?: boolean | null
          is_published?: boolean | null
          is_series_finale?: boolean | null
          like_count?: number | null
          series_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number
        }
        Update: {
          author_id?: string
          category?: string | null
          chapter_number?: number | null
          content?: string
          created_at?: string | null
          expires_at?: string | null
          fts?: unknown
          id?: string
          is_part_of_series?: boolean | null
          is_pinned?: boolean | null
          is_published?: boolean | null
          is_series_finale?: boolean | null
          like_count?: number | null
          series_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_with_author"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_metrics: {
        Row: {
          id: number
          total_elite_subscribers: number | null
        }
        Insert: {
          id?: number
          total_elite_subscribers?: number | null
        }
        Update: {
          id?: number
          total_elite_subscribers?: number | null
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          image_url: string | null
          is_read: boolean | null
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      tiers: {
        Row: {
          color: string
          icon_name: string | null
          id: number
          min_points: number
          name: string
        }
        Insert: {
          color: string
          icon_name?: string | null
          id?: number
          min_points: number
          name: string
        }
        Update: {
          color?: string
          icon_name?: string | null
          id?: number
          min_points?: number
          name?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          bonus_points: number | null
          chapters_published: number | null
          chapters_read: number | null
          comments_made: number | null
          comments_received: number | null
          created_at: string | null
          favorites_count: number | null
          id: string
          likes_given: number | null
          likes_received: number | null
          reader_points: number | null
          reader_tier: number | null
          series_completed: number | null
          stories_published: number | null
          tier: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
          writer_points: number | null
          writer_tier: number | null
        }
        Insert: {
          bonus_points?: number | null
          chapters_published?: number | null
          chapters_read?: number | null
          comments_made?: number | null
          comments_received?: number | null
          created_at?: string | null
          favorites_count?: number | null
          id?: string
          likes_given?: number | null
          likes_received?: number | null
          reader_points?: number | null
          reader_tier?: number | null
          series_completed?: number | null
          stories_published?: number | null
          tier?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
          writer_points?: number | null
          writer_tier?: number | null
        }
        Update: {
          bonus_points?: number | null
          chapters_published?: number | null
          chapters_read?: number | null
          comments_made?: number | null
          comments_received?: number | null
          created_at?: string | null
          favorites_count?: number | null
          id?: string
          likes_given?: number | null
          likes_received?: number | null
          reader_points?: number | null
          reader_tier?: number | null
          series_completed?: number | null
          stories_published?: number | null
          tier?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
          writer_points?: number | null
          writer_tier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          emailVerified: string | null
          id: string
          image: string | null
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      verification_tokens: {
        Row: {
          created_at: string
          expires: string
          identifier: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires: string
          identifier: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires?: string
          identifier?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      xp_history: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          entity_id: string
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string
          entity_id: string
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          entity_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_rate_limits: {
        Row: {
          action_count: number | null
          action_type: string
          banned_until: string | null
          created_at: string | null
          user_id: string
          window_start: string | null
        }
        Insert: {
          action_count?: number | null
          action_type: string
          banned_until?: string | null
          created_at?: string | null
          user_id: string
          window_start?: string | null
        }
        Update: {
          action_count?: number | null
          action_type?: string
          banned_until?: string | null
          created_at?: string | null
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      comments_with_author: {
        Row: {
          author_avatar: string | null
          author_id: string | null
          author_name: string | null
          chapter_id: string | null
          created_at: string | null
          id: string | null
          parent_id: string | null
          series_id: string | null
          story_id: string | null
          text: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_profile_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      series_with_author: {
        Row: {
          author_avatar_url: string | null
          author_first_name: string | null
          author_id: string | null
          author_last_name: string | null
          author_username: string | null
          chapter_count: number | null
          copyright_type: string | null
          cover_url: string | null
          author_note: string | null
          related_series_id: string | null
          related_title: string | null
          related_url: string | null
          related_banner_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          genres: string[] | null
          id: string | null
          is_ai_generated: string | null
          is_archived: boolean | null
          is_completed: boolean | null
          is_explicit: boolean | null
          slug: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          view_count: number | null
          work_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_comment: {
        Args: { p_author_id: string; p_story_id: string; p_text: string }
        Returns: string
      }
      award_gamification_xp: {
        Args: { p_amount: number; p_type: string; p_user_id: string }
        Returns: undefined
      }
      calculate_level: { Args: { p_xp: number }; Returns: number }
      calculate_tier: { Args: { points: number }; Returns: number }
      check_xp_rate_limit: {
        Args: {
          p_action_type: string
          p_ban_minutes?: number
          p_max_count?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      claim_first_series_bonus: { Args: { p_user_id: string }; Returns: Json }
      cleanup_expired_deleted_users: { Args: never; Returns: undefined }
      complete_chapter_reading: {
        Args: { p_chapter_id: string; p_series_id: string }
        Returns: Json
      }
      create_community_notification: {
        Args: {
          p_actor_id: string
          p_additional_data: Json
          p_content: string
          p_related_id: string
          p_target_user_id: string
          p_type: string
        }
        Returns: undefined
      }
      create_user_profile: {
        Args: { user_email: string; user_id: string; user_name: string }
        Returns: undefined
      }
      delete_auth_user: { Args: { user_id: string }; Returns: boolean }
      delete_user: { Args: { user_id: string }; Returns: Json }
      ensure_user_exists: { Args: { user_id: string }; Returns: undefined }
      get_admin_path_stats: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          path: string
          total_clicks: number
          unique_sessions: number
        }[]
      }
      get_admin_stats: {
        Args: never
        Returns: {
          announcements_count: number
          categories_count: number
          comments_count: number
          conversations_count: number
          series_count: number
          unread_suggestions_count: number
          users_count: number
        }[]
      }
      get_admin_traffic_chart: {
        Args: {
          p_end_date?: string
          p_interval?: string
          p_start_date?: string
        }
        Returns: {
          anonymous: number
          chart_date: string
          clicks: number
          logged_in: number
          sessions: number
        }[]
      }
      get_admin_user_rankings: {
        Args: { p_end_date?: string; p_start_date?: string; p_type?: string }
        Returns: {
          avatar_url: string
          total_count: number
          user_id: string
          username: string
        }[]
      }
      get_author_dashboard: { Args: { p_author_id: string }; Returns: Json }
      get_communities_with_stats: {
        Args: { p_user_id?: string }
        Returns: {
          avatar_color: string
          avatar_url: string
          cover_color: string
          cover_url: string
          created_at: string
          creator_id: string
          description: string
          id: string
          is_private: boolean
          member_count: number
          name: string
          slug: string
          user_status: string
        }[]
      }
      get_featured_writers: {
        Args: { p_limit?: number; p_type?: string }
        Returns: {
          avatar_url: string
          bio: string
          bonus_points: number
          calculated_total_points: number
          chapters_published: number
          chapters_read: number
          comments_made: number
          comments_received: number
          created_at: string
          first_name: string
          id: string
          last_name: string
          likes_given: number
          likes_received: number
          reader_points: number
          reader_tier: number
          reading_points: number
          series_completed: number
          stories_published: number
          total_views: number
          username: string
          writer_points: number
          writer_tier: number
        }[]
      }
      get_most_commented_content: {
        Args: { p_limit: number; p_offset: number }
        Returns: {
          author_username: string
          chapter_number: number
          comment_count: number
          content: string
          created_at: string
          id: string
          series_title: string
          series_type: string
          slug: string
          title: string
          type: string
        }[]
      }
      get_most_commented_content_count: { Args: never; Returns: number }
      get_most_commented_content_old: {
        Args: { limit_count: number }
        Returns: {
          author_username: string
          calculated_chapter_number: number
          comment_count: number
          content: string
          created_at: string
          id: string
          series_id: string
          series_title: string
          title: string
          type: string
        }[]
      }
      get_popular_series_highlights: {
        Args: { p_limit: number }
        Returns: {
          author_id: string
          author_username: string
          chapter_count: number
          cover_url: string
          genre: string
          id: string
          is_completed: boolean
          title: string
          view_count: number
        }[]
      }
      get_popular_tags: {
        Args: { limit_count?: number }
        Returns: {
          count: number
          tag: string
        }[]
      }
      get_recent_content: {
        Args: { p_limit: number; p_offset: number }
        Returns: {
          author_is_admin: boolean
          author_username: string
          chapter_number: number
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          series_title: string
          series_type: string
          slug: string
          title: string
          type: string
        }[]
      }
      get_recent_content_count: { Args: never; Returns: number }
      get_recent_content_old: {
        Args: { limit_count: number }
        Returns: {
          author_username: string
          chapter_number: number
          content: string
          created_at: string
          id: string
          series_id: string
          series_title: string
          title: string
          type: string
        }[]
      }
      get_top_writers: {
        Args: { p_limit: number; p_offset: number }
        Returns: {
          avatar_url: string
          content_count: number
          id: string
          username: string
        }[]
      }
      get_top_writers_count: { Args: never; Returns: number }
      get_top_writers_old: {
        Args: { limit_count: number }
        Returns: {
          author_id: string
          avatar_url: string
          publication_count: number
          username: string
        }[]
      }
      get_total_content_views: { Args: never; Returns: number }
      get_user_timeline: {
        Args: { p_limit: number; p_offset: number; p_user_id: string }
        Returns: {
          activity_created_at: string
          activity_id: string
          activity_type: string
          author_avatar_url: string
          author_first_name: string
          author_id: string
          author_last_name: string
          author_username: string
          content: string
          created_at: string
          id: string
          item_type: string
          like_count: number
          parent_id: string
          reply_content: string
          reply_count: number
          repost_count: number
        }[]
      }
      grant_xp: {
        Args: {
          p_action_type: string
          p_amount: number
          p_entity_id?: string
          p_role: string
          p_user_id: string
        }
        Returns: undefined
      }
      increment_chapter_view: {
        Args: { chapter_id_param: string }
        Returns: undefined
      }
      increment_chapter_views: {
        Args: { chapter_id: string }
        Returns: undefined
      }
      increment_post_reply_count: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_story_view: {
        Args: { story_id_param: string }
        Returns: undefined
      }
      increment_view_count:
        | { Args: never; Returns: undefined }
        | { Args: { story_id: string }; Returns: undefined }
      is_active_author: { Args: { author_uuid: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_community_member: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: boolean
      }
      is_community_owner_or_admin: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: boolean
      }
      is_community_public: {
        Args: { p_community_id: string }
        Returns: boolean
      }
      permanent_delete_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      process_subscription_success: {
        Args: { billing_uuid: string; user_uuid: string }
        Returns: undefined
      }
      recalculate_all_user_stats: { Args: never; Returns: Json }
      sanitize_slug: { Args: { text: string }; Returns: string }
      search_content:
        | {
            Args: {
              content_type?: string
              p_limit?: number
              p_offset?: number
              search_query: string
            }
            Returns: Json
          }
        | {
            Args: {
              content_type?: string
              p_genre?: string
              p_is_completed?: boolean
              p_limit?: number
              p_offset?: number
              p_order_by?: string
              search_query: string
            }
            Returns: Json
          }
      search_stories: {
        Args: { page_limit: number; page_offset: number; search_query: string }
        Returns: {
          category: string
          content: string
          created_at: string
          id: string
          rank: number
          title: string
          username: string
        }[]
      }
      spend_xp: {
        Args: {
          p_action_type: string
          p_amount: number
          p_entity_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      transfer_xp: {
        Args: {
          p_action_type: string
          p_amount: number
          p_entity_id: string
          p_receiver_id: string
          p_sender_id: string
        }
        Returns: Json
      }
      update_reader_stats: { Args: { p_user_id: string }; Returns: undefined }
      update_user_stats: { Args: { p_user_id: string }; Returns: undefined }
      update_writer_stats: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
