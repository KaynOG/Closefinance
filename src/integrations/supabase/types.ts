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
      banks: {
        Row: {
          account_balance: number
          color: string
          created_at: string
          id: string
          name: string
          note: string | null
          saved_amount: number
          user_id: string
        }
        Insert: {
          account_balance?: number
          color?: string
          created_at?: string
          id?: string
          name: string
          note?: string | null
          saved_amount?: number
          user_id: string
        }
        Update: {
          account_balance?: number
          color?: string
          created_at?: string
          id?: string
          name?: string
          note?: string | null
          saved_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          closing_day: number
          color: string
          created_at: string
          due_day: number
          id: string
          limit_amount: number
          name: string
          used_manual: number
          user_id: string
        }
        Insert: {
          closing_day?: number
          color?: string
          created_at?: string
          due_day?: number
          id?: string
          limit_amount?: number
          name: string
          used_manual?: number
          user_id: string
        }
        Update: {
          closing_day?: number
          color?: string
          created_at?: string
          due_day?: number
          id?: string
          limit_amount?: number
          name?: string
          used_manual?: number
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          kind: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          kind?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          kind?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      mission_history: {
        Row: {
          day: string
          id: string
          mission_id: string
          occurred_at: string
          points: number
          user_id: string
        }
        Insert: {
          day?: string
          id?: string
          mission_id: string
          occurred_at?: string
          points?: number
          user_id: string
        }
        Update: {
          day?: string
          id?: string
          mission_id?: string
          occurred_at?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          birthdate: string | null
          cash_amount: number
          created_at: string
          email: string | null
          friend_code: string | null
          gender: string | null
          id: string
          job: string | null
          name: string
          sound_enabled: boolean
          total_points: number
          updated_at: string
          yearly_goal: number | null
        }
        Insert: {
          avatar?: string | null
          birthdate?: string | null
          cash_amount?: number
          created_at?: string
          email?: string | null
          friend_code?: string | null
          gender?: string | null
          id: string
          job?: string | null
          name?: string
          sound_enabled?: boolean
          total_points?: number
          updated_at?: string
          yearly_goal?: number | null
        }
        Update: {
          avatar?: string | null
          birthdate?: string | null
          cash_amount?: number
          created_at?: string
          email?: string | null
          friend_code?: string | null
          gender?: string | null
          id?: string
          job?: string | null
          name?: string
          sound_enabled?: boolean
          total_points?: number
          updated_at?: string
          yearly_goal?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          applied_to_balance: boolean
          bank_id: string | null
          card_id: string | null
          category_id: string | null
          created_at: string
          date: string
          description: string
          essential: string | null
          id: string
          installment_group_id: string | null
          installment_no: number | null
          installment_total: number | null
          payment_method: string | null
          tag: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          applied_to_balance?: boolean
          bank_id?: string | null
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          date: string
          description?: string
          essential?: string | null
          id?: string
          installment_group_id?: string | null
          installment_no?: number | null
          installment_total?: number | null
          payment_method?: string | null
          tag?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          applied_to_balance?: boolean
          bank_id?: string | null
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          essential?: string | null
          id?: string
          installment_group_id?: string | null
          installment_no?: number | null
          installment_total?: number | null
          payment_method?: string | null
          tag?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_profile_by_friend_code: {
        Args: { _code: string }
        Returns: {
          avatar: string
          friend_code: string
          id: string
          name: string
          total_points: number
        }[]
      }
      gen_friend_code: { Args: never; Returns: string }
      get_my_friends_ranking: {
        Args: never
        Returns: {
          avatar: string
          friend_code: string
          id: string
          name: string
          total_points: number
        }[]
      }
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
