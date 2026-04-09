// src/types/database.ts

/**
 * Types générés par Supabase CLI (supabase gen types typescript).
 * Ce fichier est un placeholder — exécuter `npm run db:generate` pour le remplir
 * avec les types réels après application des migrations.
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          role: 'student' | 'parent' | 'teacher';
          is_premium: boolean;
          premium_expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          role: 'student' | 'parent' | 'teacher';
          is_premium?: boolean;
          premium_expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          role?: 'student' | 'parent' | 'teacher';
          is_premium?: boolean;
          premium_expires_at?: string | null;
          created_at?: string;
        };
      };
      student_profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          level: string;
          school: string | null;
          city: string | null;
          xp: number;
          streak_days: number;
          last_active_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          level: string;
          school?: string | null;
          city?: string | null;
          xp?: number;
          streak_days?: number;
          last_active_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          level?: string;
          school?: string | null;
          city?: string | null;
          xp?: number;
          streak_days?: number;
          last_active_at?: string;
        };
      };
      mastery_tree: {
        Row: {
          id: string;
          student_id: string;
          subject: string;
          topic: string;
          mastery_level: string;
          exercises_completed: number;
          last_score: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject: string;
          topic: string;
          mastery_level?: string;
          exercises_completed?: number;
          last_score?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject?: string;
          topic?: string;
          mastery_level?: string;
          exercises_completed?: number;
          last_score?: number | null;
          updated_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          student_id: string;
          subject: string | null;
          topic: string | null;
          messages: Record<string, unknown>[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject?: string | null;
          topic?: string | null;
          messages?: Record<string, unknown>[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject?: string | null;
          topic?: string | null;
          messages?: Record<string, unknown>[];
          created_at?: string;
          updated_at?: string;
        };
      };
      curriculum_content: {
        Row: {
          id: string;
          level: string;
          subject: string;
          topic: string;
          title: string;
          content: string;
          embedding: number[] | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          level: string;
          subject: string;
          topic: string;
          title: string;
          content: string;
          embedding?: number[] | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          level?: string;
          subject?: string;
          topic?: string;
          title?: string;
          content?: string;
          embedding?: number[] | null;
          source?: string | null;
          created_at?: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          content_id: string | null;
          type: 'qcm' | 'redaction' | 'calcul' | 'photo';
          difficulty: number;
          data: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id?: string | null;
          type: 'qcm' | 'redaction' | 'calcul' | 'photo';
          difficulty: number;
          data: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string | null;
          type?: 'qcm' | 'redaction' | 'calcul' | 'photo';
          difficulty?: number;
          data?: Record<string, unknown>;
          created_at?: string;
        };
      };
      parent_links: {
        Row: {
          id: string;
          parent_id: string;
          student_id: string;
          pairing_code: string | null;
          confirmed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          student_id: string;
          pairing_code?: string | null;
          confirmed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          student_id?: string;
          pairing_code?: string | null;
          confirmed?: boolean;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          cinetpay_transaction_id: string | null;
          amount: number;
          currency: string;
          status: string;
          payment_method: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cinetpay_transaction_id?: string | null;
          amount: number;
          currency?: string;
          status?: string;
          payment_method?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cinetpay_transaction_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          payment_method?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'student' | 'parent' | 'teacher';
      student_level:
        | '6eme' | '5eme' | '4eme' | '3eme'
        | '2nde' | '1ere' | 'tle'
        | 'l1' | 'l2' | 'l3' | 'm1' | 'm2';
      mastery: 'novice' | 'apprenti' | 'confirme' | 'expert' | 'maitre';
      exercise_type: 'qcm' | 'redaction' | 'calcul' | 'photo';
    };
  };
}
