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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: string
          broker: string
          created_at: string
          funding_company: string | null
          id: string
          initial_balance: number
          is_active: boolean
          name: string
          risk_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: string
          broker: string
          created_at?: string
          funding_company?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          name: string
          risk_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          broker?: string
          created_at?: string
          funding_company?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          name?: string
          risk_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backtest_config: {
        Row: {
          created_at: string
          id: string
          initial_capital: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial_capital?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial_capital?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backtest_strategies: {
        Row: {
          asset: string
          created_at: string
          description: string | null
          id: string
          initial_capital: number
          name: string
          risk_reward_ratio: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset?: string
          created_at?: string
          description?: string | null
          id?: string
          initial_capital?: number
          name: string
          risk_reward_ratio?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset?: string
          created_at?: string
          description?: string | null
          id?: string
          initial_capital?: number
          name?: string
          risk_reward_ratio?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backtest_trades: {
        Row: {
          asset: string
          created_at: string
          custom_news_description: string | null
          date: string
          day_of_week: string
          drawdown: number | null
          entry_model: string
          entry_time: string
          execution_timing: string | null
          exit_time: string | null
          had_news: boolean | null
          id: string
          image_link: string | null
          max_rr: number | null
          news_description: string | null
          news_time: string | null
          no_trade_day: boolean | null
          result_dollars: number
          result_type: string
          risk_percentage: number
          strategy_id: string | null
          trade_type: string
          updated_at: string
          user_id: string
          week_of_month: number | null
        }
        Insert: {
          asset?: string
          created_at?: string
          custom_news_description?: string | null
          date: string
          day_of_week: string
          drawdown?: number | null
          entry_model: string
          entry_time: string
          execution_timing?: string | null
          exit_time?: string | null
          had_news?: boolean | null
          id?: string
          image_link?: string | null
          max_rr?: number | null
          news_description?: string | null
          news_time?: string | null
          no_trade_day?: boolean | null
          result_dollars: number
          result_type: string
          risk_percentage?: number
          strategy_id?: string | null
          trade_type: string
          updated_at?: string
          user_id: string
          week_of_month?: number | null
        }
        Update: {
          asset?: string
          created_at?: string
          custom_news_description?: string | null
          date?: string
          day_of_week?: string
          drawdown?: number | null
          entry_model?: string
          entry_time?: string
          execution_timing?: string | null
          exit_time?: string | null
          had_news?: boolean | null
          id?: string
          image_link?: string | null
          max_rr?: number | null
          news_description?: string | null
          news_time?: string | null
          no_trade_day?: boolean | null
          result_dollars?: number
          result_type?: string
          risk_percentage?: number
          strategy_id?: string | null
          trade_type?: string
          updated_at?: string
          user_id?: string
          week_of_month?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "backtest_trades_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "backtest_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          account_id: string | null
          asset: string
          created_at: string | null
          custom_news_description: string | null
          date: string
          day_of_week: string
          drawdown: number | null
          entry_model: string
          entry_time: string
          execution_timing: string | null
          exit_time: string | null
          had_news: boolean | null
          id: string
          image_link: string | null
          max_rr: number | null
          news_description: string | null
          news_time: string | null
          no_trade_day: boolean | null
          result_dollars: number
          result_type: string
          risk_percentage: number
          trade_type: string
          updated_at: string | null
          user_id: string
          week_of_month: number | null
        }
        Insert: {
          account_id?: string | null
          asset?: string
          created_at?: string | null
          custom_news_description?: string | null
          date: string
          day_of_week: string
          drawdown?: number | null
          entry_model: string
          entry_time: string
          execution_timing?: string | null
          exit_time?: string | null
          had_news?: boolean | null
          id?: string
          image_link?: string | null
          max_rr?: number | null
          news_description?: string | null
          news_time?: string | null
          no_trade_day?: boolean | null
          result_dollars: number
          result_type: string
          risk_percentage?: number
          trade_type: string
          updated_at?: string | null
          user_id: string
          week_of_month?: number | null
        }
        Update: {
          account_id?: string | null
          asset?: string
          created_at?: string | null
          custom_news_description?: string | null
          date?: string
          day_of_week?: string
          drawdown?: number | null
          entry_model?: string
          entry_time?: string
          execution_timing?: string | null
          exit_time?: string | null
          had_news?: boolean | null
          id?: string
          image_link?: string | null
          max_rr?: number | null
          news_description?: string | null
          news_time?: string | null
          no_trade_day?: boolean | null
          result_dollars?: number
          result_type?: string
          risk_percentage?: number
          trade_type?: string
          updated_at?: string | null
          user_id?: string
          week_of_month?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
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
