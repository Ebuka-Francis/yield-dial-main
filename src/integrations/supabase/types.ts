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
      market_resolutions: {
        Row: {
          asset: string
          created_at: string
          final_apy: number | null
          id: string
          market_id: string
          resolution_data: Json | null
          resolution_source: string | null
          resolution_timestamp: string | null
          resolved: boolean
          threshold: number
          updated_at: string
        }
        Insert: {
          asset: string
          created_at?: string
          final_apy?: number | null
          id?: string
          market_id: string
          resolution_data?: Json | null
          resolution_source?: string | null
          resolution_timestamp?: string | null
          resolved?: boolean
          threshold: number
          updated_at?: string
        }
        Update: {
          asset?: string
          created_at?: string
          final_apy?: number | null
          id?: string
          market_id?: string
          resolution_data?: Json | null
          resolution_source?: string | null
          resolution_timestamp?: string | null
          resolved?: boolean
          threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      yield_pools: {
        Row: {
          apy: number | null
          apy_base: number | null
          apy_mean_30d: number | null
          apy_reward: number | null
          chain: string
          created_at: string
          exposure: string | null
          id: string
          il_risk: string | null
          pool_id: string
          pool_meta: string | null
          project: string
          stablecoin: boolean | null
          symbol: string
          tvl_usd: number | null
          updated_at: string
        }
        Insert: {
          apy?: number | null
          apy_base?: number | null
          apy_mean_30d?: number | null
          apy_reward?: number | null
          chain: string
          created_at?: string
          exposure?: string | null
          id?: string
          il_risk?: string | null
          pool_id: string
          pool_meta?: string | null
          project: string
          stablecoin?: boolean | null
          symbol: string
          tvl_usd?: number | null
          updated_at?: string
        }
        Update: {
          apy?: number | null
          apy_base?: number | null
          apy_mean_30d?: number | null
          apy_reward?: number | null
          chain?: string
          created_at?: string
          exposure?: string | null
          id?: string
          il_risk?: string | null
          pool_id?: string
          pool_meta?: string | null
          project?: string
          stablecoin?: boolean | null
          symbol?: string
          tvl_usd?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      yield_predictions: {
        Row: {
          asset: string
          confidence: number
          created_at: string
          current_apy: number
          data_sources: Json
          id: string
          market_id: string
          model_used: string
          predicted_apy: number
          prediction_direction: string
          probability_above_threshold: number
          reasoning: string
          settlement_date: string | null
          threshold: number
        }
        Insert: {
          asset: string
          confidence: number
          created_at?: string
          current_apy: number
          data_sources?: Json
          id?: string
          market_id: string
          model_used: string
          predicted_apy: number
          prediction_direction: string
          probability_above_threshold: number
          reasoning: string
          settlement_date?: string | null
          threshold: number
        }
        Update: {
          asset?: string
          confidence?: number
          created_at?: string
          current_apy?: number
          data_sources?: Json
          id?: string
          market_id?: string
          model_used?: string
          predicted_apy?: number
          prediction_direction?: string
          probability_above_threshold?: number
          reasoning?: string
          settlement_date?: string | null
          threshold?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
