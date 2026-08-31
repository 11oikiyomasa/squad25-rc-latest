export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      achievements: {
        Row: { created_at: string; description: string; event: string | null; id: string; image_url: string | null; placement: string | null; sort_order: number; title: string; year: number | null };
        Insert: { created_at?: string; description?: string; event?: string | null; id?: string; image_url?: string | null; placement?: string | null; sort_order?: number; title: string; year?: number | null };
        Update: { created_at?: string; description?: string; event?: string | null; id?: string; image_url?: string | null; placement?: string | null; sort_order?: number; title?: string; year?: number | null };
        Relationships: [];
      };
      admin_users: {
        Row: { created_at: string; user_id: string };
        Insert: { created_at?: string; user_id: string };
        Update: { created_at?: string; user_id?: string };
        Relationships: [];
      };
      audit_logs: {
        Row: { action: string; actor_name: string; actor_user_id: string | null; after_data: Json | null; before_data: Json | null; created_at: string; entity_id: string | null; entity_type: string; id: number; ip: unknown };
        Insert: { action: string; actor_name?: string; actor_user_id?: string | null; after_data?: Json | null; before_data?: Json | null; created_at?: string; entity_id?: string | null; entity_type: string; id?: never; ip?: unknown };
        Update: { action?: string; actor_name?: string; actor_user_id?: string | null; after_data?: Json | null; before_data?: Json | null; created_at?: string; entity_id?: string | null; entity_type?: string; id?: never; ip?: unknown };
        Relationships: [];
      };
      gallery_items: {
        Row: { caption: string; created_at: string; id: string; image_url: string; sort_order: number; title: string };
        Insert: { caption?: string; created_at?: string; id?: string; image_url: string; sort_order?: number; title: string };
        Update: { caption?: string; created_at?: string; id?: string; image_url?: string; sort_order?: number; title?: string };
        Relationships: [];
      };
      members: {
        Row: { accent: string; bio: string; created_at: string; full_name: string | null; id: string; main_hero: string | null; nickname: string; number: string; photo_url: string | null; role: string; slug: string; sort_order: number; status: string; updated_at: string };
        Insert: { accent?: string; bio?: string; created_at?: string; full_name?: string | null; id?: string; main_hero?: string | null; nickname: string; number?: string; photo_url?: string | null; role: string; slug: string; sort_order?: number; status?: string; updated_at?: string };
        Update: { accent?: string; bio?: string; created_at?: string; full_name?: string | null; id?: string; main_hero?: string | null; nickname?: string; number?: string; photo_url?: string | null; role?: string; slug?: string; sort_order?: number; status?: string; updated_at?: string };
        Relationships: [];
      };
      montages: {
        Row: { content_key: string | null; created_at: string; description: string; duration: string; hero: string | null; id: string; member_id: string; published_at: string | null; sort_order: number; title: string; youtube_id: string };
        Insert: { content_key?: string | null; created_at?: string; description?: string; duration?: string; hero?: string | null; id?: string; member_id: string; published_at?: string | null; sort_order?: number; title: string; youtube_id: string };
        Update: { content_key?: string | null; created_at?: string; description?: string; duration?: string; hero?: string | null; id?: string; member_id?: string; published_at?: string | null; sort_order?: number; title?: string; youtube_id?: string };
        Relationships: [{ foreignKeyName: "montages_member_id_fkey"; columns: ["member_id"]; isOneToOne: false; referencedRelation: "members"; referencedColumns: ["id"] }];
      };
      recruitment_application_notes: {
        Row: { admin_name: string; admin_user_id: string; application_id: string; created_at: string; id: string; note: string };
        Insert: { admin_name: string; admin_user_id: string; application_id: string; created_at?: string; id?: string; note: string };
        Update: { admin_name?: string; admin_user_id?: string; application_id?: string; created_at?: string; id?: string; note?: string };
        Relationships: [{ foreignKeyName: "recruitment_application_notes_application_id_fkey"; columns: ["application_id"]; isOneToOne: false; referencedRelation: "recruitment_applications"; referencedColumns: ["id"] }];
      };
      recruitment_applications: {
        Row: { admin_note: string; availability: string; captcha_verified_at: string | null; contact: string; cover_letter: string; created_at: string; email: string; experience: string; full_name: string; hero_pool: string; id: string; job_id: string | null; message: string; nickname: string; phone: string | null; portfolio_link: string; rank: string; resume_original_name: string | null; resume_path: string | null; resume_sha256: string | null; resume_size: number | null; reviewed_at: string | null; role: string; social_url: string; source: string; status: string; updated_at: string };
        Insert: { admin_note?: string; availability?: string; captcha_verified_at?: string | null; contact: string; cover_letter?: string; created_at?: string; email: string; experience?: string; full_name: string; hero_pool?: string; id?: string; job_id?: string | null; message?: string; nickname: string; phone?: string | null; portfolio_link?: string; rank?: string; resume_original_name?: string | null; resume_path?: string | null; resume_sha256?: string | null; resume_size?: number | null; reviewed_at?: string | null; role: string; social_url?: string; source?: string; status?: string; updated_at?: string };
        Update: { admin_note?: string; availability?: string; captcha_verified_at?: string | null; contact?: string; cover_letter?: string; created_at?: string; email?: string; experience?: string; full_name?: string; hero_pool?: string; id?: string; job_id?: string | null; message?: string; nickname?: string; phone?: string | null; portfolio_link?: string; rank?: string; resume_original_name?: string | null; resume_path?: string | null; resume_sha256?: string | null; resume_size?: number | null; reviewed_at?: string | null; role?: string; social_url?: string; source?: string; status?: string; updated_at?: string };
        Relationships: [{ foreignKeyName: "recruitment_applications_job_id_fkey"; columns: ["job_id"]; isOneToOne: false; referencedRelation: "recruitment_jobs"; referencedColumns: ["id"] }];
      };
      recruitment_jobs: {
        Row: { closes_at: string | null; created_at: string; description: string; id: string; is_active: boolean; requirements: string[]; slug: string; title: string; updated_at: string };
        Insert: { closes_at?: string | null; created_at?: string; description?: string; id?: string; is_active?: boolean; requirements?: string[]; slug: string; title: string; updated_at?: string };
        Update: { closes_at?: string | null; created_at?: string; description?: string; id?: string; is_active?: boolean; requirements?: string[]; slug?: string; title?: string; updated_at?: string };
        Relationships: [];
      };
      scrims: {
        Row: { admin_note: string; created_at: string; event_name: string; format: string; id: string; media_url: string | null; opponent_name: string; public_note: string; recap_url: string | null; result_against: number | null; result_for: number | null; scheduled_at: string; status: string; updated_at: string; visibility: string };
        Insert: { admin_note?: string; created_at?: string; event_name?: string; format?: string; id?: string; media_url?: string | null; opponent_name?: string; public_note?: string; recap_url?: string | null; result_against?: number | null; result_for?: number | null; scheduled_at: string; status?: string; updated_at?: string; visibility?: string };
        Update: { admin_note?: string; created_at?: string; event_name?: string; format?: string; id?: string; media_url?: string | null; opponent_name?: string; public_note?: string; recap_url?: string | null; result_against?: number | null; result_for?: number | null; scheduled_at?: string; status?: string; updated_at?: string; visibility?: string };
        Relationships: [];
      };
      squad_settings: {
        Row: { description: string; discord_url: string | null; id: number; instagram_url: string | null; logo_url: string | null; name: string; season: string; tagline: string; tiktok_url: string | null; updated_at: string; youtube_url: string | null };
        Insert: { description?: string; discord_url?: string | null; id?: number; instagram_url?: string | null; logo_url?: string | null; name?: string; season?: string; tagline?: string; tiktok_url?: string | null; updated_at?: string; youtube_url?: string | null };
        Update: { description?: string; discord_url?: string | null; id?: number; instagram_url?: string | null; logo_url?: string | null; name?: string; season?: string; tagline?: string; tiktok_url?: string | null; updated_at?: string; youtube_url?: string | null };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      admin_update_recruitment_application_v7: { Args: { application_id: string; client_ip: string; expected_status: string; next_status: string; note_text: string }; Returns: Json };
      publish_squad_content: { Args: { payload: Json }; Returns: Json };
      submit_recruitment_application: { Args: { client_ip: string; payload: Json }; Returns: Json };
      submit_recruitment_application_v7: { Args: { client_ip: string; payload: Json }; Returns: string };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, "public">];

export type Tables<T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])> = DefaultSchema["Tables"][T] extends { Row: infer R } ? R : never;
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never;
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never;
export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T];
export type CompositeTypes<T extends keyof DefaultSchema["CompositeTypes"]> = DefaultSchema["CompositeTypes"][T];
export const Constants = { public: { Enums: {} } } as const;
