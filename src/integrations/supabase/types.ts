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
      broker_connections: {
        Row: {
          access_token: string | null
          broker_name: string
          client_id: string | null
          connected_at: string | null
          created_at: string
          id: string
          is_connected: boolean | null
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          broker_name: string
          client_id?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          broker_name?: string
          client_id?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fund_flows: {
        Row: {
          amount: number
          broker_connection_id: string | null
          created_at: string
          description: string | null
          flow_date: string
          flow_type: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          broker_connection_id?: string | null
          created_at?: string
          description?: string | null
          flow_date: string
          flow_type: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          broker_connection_id?: string | null
          created_at?: string
          description?: string | null
          flow_date?: string
          flow_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_flows_broker_connection_id_fkey"
            columns: ["broker_connection_id"]
            isOneToOne: false
            referencedRelation: "broker_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_analysis: {
        Row: {
          ai_analysis: string | null
          ai_suggestion: string | null
          created_at: string
          emotion_score: number | null
          fear_indicator: boolean | null
          fomo_indicator: boolean | null
          greed_indicator: boolean | null
          id: string
          overtrading: boolean | null
          psychology_tags: string[] | null
          revenge_trade: boolean | null
          risk_reward_ratio: number | null
          trade_id: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_suggestion?: string | null
          created_at?: string
          emotion_score?: number | null
          fear_indicator?: boolean | null
          fomo_indicator?: boolean | null
          greed_indicator?: boolean | null
          id?: string
          overtrading?: boolean | null
          psychology_tags?: string[] | null
          revenge_trade?: boolean | null
          risk_reward_ratio?: number | null
          trade_id?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          ai_suggestion?: string | null
          created_at?: string
          emotion_score?: number | null
          fear_indicator?: boolean | null
          fomo_indicator?: boolean | null
          greed_indicator?: boolean | null
          id?: string
          overtrading?: boolean | null
          psychology_tags?: string[] | null
          revenge_trade?: boolean | null
          risk_reward_ratio?: number | null
          trade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_analysis_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          avg_price: number
          broker_connection_id: string | null
          brokerage: number | null
          created_at: string
          entry_time: string
          exit_price: number | null
          exit_time: string | null
          expiry: string | null
          id: string
          instrument_type: string
          lot_size: number | null
          notes: string | null
          option_type: string | null
          pnl: number | null
          quantity: number
          setup: string | null
          side: string
          source: string | null
          status: string | null
          stop_loss: number | null
          strategy: string | null
          strike: number | null
          symbol: string
          tags: string[] | null
          target_price: number | null
          taxes: number | null
          underlying: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_price: number
          broker_connection_id?: string | null
          brokerage?: number | null
          created_at?: string
          entry_time: string
          exit_price?: number | null
          exit_time?: string | null
          expiry?: string | null
          id?: string
          instrument_type: string
          lot_size?: number | null
          notes?: string | null
          option_type?: string | null
          pnl?: number | null
          quantity: number
          setup?: string | null
          side: string
          source?: string | null
          status?: string | null
          stop_loss?: number | null
          strategy?: string | null
          strike?: number | null
          symbol: string
          tags?: string[] | null
          target_price?: number | null
          taxes?: number | null
          underlying?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_price?: number
          broker_connection_id?: string | null
          brokerage?: number | null
          created_at?: string
          entry_time?: string
          exit_price?: number | null
          exit_time?: string | null
          expiry?: string | null
          id?: string
          instrument_type?: string
          lot_size?: number | null
          notes?: string | null
          option_type?: string | null
          pnl?: number | null
          quantity?: number
          setup?: string | null
          side?: string
          source?: string | null
          status?: string | null
          stop_loss?: number | null
          strategy?: string | null
          strike?: number | null
          symbol?: string
          tags?: string[] | null
          target_price?: number | null
          taxes?: number | null
          underlying?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_broker_connection_id_fkey"
            columns: ["broker_connection_id"]
            isOneToOne: false
            referencedRelation: "broker_connections"
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
