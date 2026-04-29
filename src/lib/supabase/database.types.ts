export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type FiveElementsScore = { 木: number; 火: number; 土: number; 金: number; 水: number };
type HealthReadingJson = {
  organHealth: { organ: string; element: string; status: "strong" | "balanced" | "weak" | "excess"; description: string }[];
  dietTherapy: { recommended: { name: string; nameLocal: string }[]; avoid: { name: string; nameLocal: string }[] };
  seasonalWellness: { season: string; advice: string }[];
  lifestyle: string;
  warnings: string[];
  summary: string;
};
type HealthConversationMessage = {
  role: string;
  content: string;
  ts?: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          preferred_locale: string | null;
          referral_code: string | null;
          referred_by: string | null;
          free_readings: number;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          preferred_locale?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          free_readings?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          preferred_locale?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          free_readings?: number;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          stripe_session_id: string;
          stripe_payment_intent: string | null;
          customer_email: string | null;
          user_id: string | null;
          chart_id: string;
          user_name: string;
          tier: string;
          amount: number;
          currency: string;
          status: string;
          reading_data: Json | null;
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          stripe_session_id: string;
          stripe_payment_intent?: string | null;
          customer_email?: string | null;
          user_id?: string | null;
          chart_id?: string;
          user_name?: string;
          tier?: string;
          amount?: number;
          currency?: string;
          status?: string;
          reading_data?: Json | null;
          paid_at?: string | null;
        };
        Update: {
          stripe_session_id?: string;
          stripe_payment_intent?: string | null;
          customer_email?: string | null;
          user_id?: string | null;
          chart_id?: string;
          user_name?: string;
          tier?: string;
          amount?: number;
          currency?: string;
          status?: string;
          reading_data?: Json | null;
          paid_at?: string | null;
        };
        Relationships: [];
      };
      readings_cache: {
        Row: {
          id: string;
          chart_hash: string;
          chart_summary: Json;
          reading: Json;
          tier: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chart_hash: string;
          chart_summary: Json;
          reading: Json;
          tier?: string;
        };
        Update: {
          chart_hash?: string;
          chart_summary?: Json;
          reading?: Json;
          tier?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string | null;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          plan: string;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          plan?: string;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
        };
        Update: {
          user_id?: string | null;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          plan?: string;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          status: string;
          reward_given: boolean;
          created_at: string;
          converted_at: string | null;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id: string;
          status?: string;
          reward_given?: boolean;
          converted_at?: string | null;
        };
        Update: {
          status?: string;
          reward_given?: boolean;
          converted_at?: string | null;
        };
        Relationships: [];
      };
      horoscope_cache: {
        Row: {
          id: string;
          sign: string;
          locale: string;
          date: string;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          sign: string;
          locale: string;
          date: string;
          data: Json;
        };
        Update: {
          sign?: string;
          locale?: string;
          date?: string;
          data?: Json;
        };
        Relationships: [];
      };
      health_assessments: {
        Row: {
          id: string;
          user_id: string;
          answers: number[];
          constitution_type: string;
          constitution_subtype: string;
          secondary_type: string | null;
          five_elements_score: FiveElementsScore;
          nine_constitutions_score: Record<string, number>;
          bazi_chart_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          answers: number[];
          constitution_type: string;
          constitution_subtype: string;
          secondary_type?: string | null;
          five_elements_score: FiveElementsScore;
          nine_constitutions_score: Record<string, number>;
          bazi_chart_hash?: string | null;
        };
        Update: {
          answers?: number[];
          constitution_type?: string;
          constitution_subtype?: string;
          secondary_type?: string | null;
          five_elements_score?: FiveElementsScore;
          nine_constitutions_score?: Record<string, number>;
          bazi_chart_hash?: string | null;
        };
        Relationships: [];
      };
      health_readings_cache: {
        Row: {
          id: string;
          assessment_id: string;
          reading: HealthReadingJson;
          created_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          reading: HealthReadingJson;
        };
        Update: {
          reading?: HealthReadingJson;
        };
        Relationships: [];
      };
      health_conversations: {
        Row: {
          id: string;
          assessment_id: string;
          user_id: string;
          messages: HealthConversationMessage[];
          message_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          user_id: string;
          messages?: HealthConversationMessage[];
          message_count?: number;
        };
        Update: {
          messages?: HealthConversationMessage[];
          message_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_free_readings: {
        Args: { user_id: string };
        Returns: void;
      };
    };
  };
};
