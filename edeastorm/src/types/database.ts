/** @format */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          allowed_domains: string[] | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          allowed_domains?: string[] | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          allowed_domains?: string[] | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          organization_id: string | null;
          role: "viewer" | "contributor" | "editor" | "admin" | "super_admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          organization_id?: string | null;
          role?: "viewer" | "contributor" | "editor" | "admin" | "super_admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          organization_id?: string | null;
          role?: "viewer" | "contributor" | "editor" | "admin" | "super_admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: "member" | "moderator" | "owner";
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: "member" | "moderator" | "owner";
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: "member" | "moderator" | "owner";
          joined_at?: string;
        };
      };
      boards: {
        Row: {
          id: string;
          short_id: string;
          team_id: string | null;
          organization_id: string;
          title: string;
          problem_statement: string | null;
          description: string | null;
          thumbnail_url: string | null;
          is_public: boolean;
          is_archived: boolean;
          settings: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          short_id?: string;
          team_id?: string | null;
          organization_id: string;
          title: string;
          problem_statement?: string | null;
          description?: string | null;
          thumbnail_url?: string | null;
          is_public?: boolean;
          is_archived?: boolean;
          settings?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          short_id?: string;
          team_id?: string | null;
          organization_id?: string;
          title?: string;
          problem_statement?: string | null;
          description?: string | null;
          thumbnail_url?: string | null;
          is_public?: boolean;
          is_archived?: boolean;
          settings?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      board_collaborators: {
        Row: {
          id: string;
          board_id: string;
          user_id: string;
          role: "viewer" | "contributor" | "editor" | "admin";
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          user_id: string;
          role?: "viewer" | "contributor" | "editor" | "admin";
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          user_id?: string;
          role?: "viewer" | "contributor" | "editor" | "admin";
          invited_by?: string | null;
          joined_at?: string;
        };
      };
      board_images: {
        Row: {
          id: string;
          board_id: string;
          storage_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          width: number | null;
          height: number | null;
          caption: string | null;
          display_order: number;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          storage_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          width?: number | null;
          height?: number | null;
          caption?: string | null;
          display_order?: number;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          storage_path?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          width?: number | null;
          height?: number | null;
          caption?: string | null;
          display_order?: number;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      canvas_items: {
        Row: {
          id: string;
          board_id: string;
          item_type: "sticky_note" | "image" | "header" | "shape" | "connector";
          x: number;
          y: number;
          z_index: number;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          item_type: "sticky_note" | "image" | "header" | "shape" | "connector";
          x?: number;
          y?: number;
          z_index?: number;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          item_type?:
            | "sticky_note"
            | "image"
            | "header"
            | "shape"
            | "connector";
          x?: number;
          y?: number;
          z_index?: number;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      room_users: {
        Row: {
          id: string;
          board_id: string;
          user_id: string | null;
          username: string;
          cursor_x: number;
          cursor_y: number;
          color: string;
          is_active: boolean;
          last_seen: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          user_id?: string | null;
          username: string;
          cursor_x?: number;
          cursor_y?: number;
          color?: string;
          is_active?: boolean;
          last_seen?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          user_id?: string | null;
          username?: string;
          cursor_x?: number;
          cursor_y?: number;
          color?: string;
          is_active?: boolean;
          last_seen?: string;
          joined_at?: string;
        };
      };
      board_snapshots: {
        Row: {
          id: string;
          board_id: string;
          name: string;
          description: string | null;
          snapshot_data: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          name: string;
          description?: string | null;
          snapshot_data: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          name?: string;
          description?: string | null;
          snapshot_data?: Json;
          created_by?: string | null;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          board_id: string | null;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id?: string | null;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string | null;
          user_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      check_board_access: {
        Args: {
          p_board_id: string;
          p_user_id: string;
        };
        Returns: {
          has_access: boolean;
          access_role: string | null;
        }[];
      };
      generate_short_id: {
        Args: {
          length?: number;
        };
        Returns: string;
      };
    };
    Enums: {};
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
