export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          password: string
          role: Database["public"]["Enums"]["user_role"]
          username: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          password: string
          role?: Database["public"]["Enums"]["user_role"]
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          password?: string
          role?: Database["public"]["Enums"]["user_role"]
          username?: string
        }
        Relationships: []
      }
      mentors: {
        Row: {
          branches: string[] | null
          contact_number: string | null
          courses: string[] | null
          created_at: string | null
          department: string | null
          email: string
          id: string
          name: string
          password: string
          role: Database["public"]["Enums"]["user_role"]
          sections: string[] | null
          semesters: string[] | null
        }
        Insert: {
          branches?: string[] | null
          contact_number?: string | null
          courses?: string[] | null
          created_at?: string | null
          department?: string | null
          email: string
          id?: string
          name: string
          password: string
          role?: Database["public"]["Enums"]["user_role"]
          sections?: string[] | null
          semesters?: string[] | null
        }
        Update: {
          branches?: string[] | null
          contact_number?: string | null
          courses?: string[] | null
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          name?: string
          password?: string
          role?: Database["public"]["Enums"]["user_role"]
          sections?: string[] | null
          semesters?: string[] | null
        }
        Relationships: []
      }
      outpasses: {
        Row: {
          created_at: string | null
          deny_reason: string | null
          enrollment_number: string
          exit_date_time: string
          id: string
          mentor_id: string | null
          mentor_name: string | null
          qr_code: string | null
          reason: string
          scan_timestamp: string | null
          serial_code: string | null
          status: string
          student_id: string
          student_name: string
          student_section: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deny_reason?: string | null
          enrollment_number: string
          exit_date_time: string
          id?: string
          mentor_id?: string | null
          mentor_name?: string | null
          qr_code?: string | null
          reason: string
          scan_timestamp?: string | null
          serial_code?: string | null
          status?: string
          student_id: string
          student_name: string
          student_section?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deny_reason?: string | null
          enrollment_number?: string
          exit_date_time?: string
          id?: string
          mentor_id?: string | null
          mentor_name?: string | null
          qr_code?: string | null
          reason?: string
          scan_timestamp?: string | null
          serial_code?: string | null
          status?: string
          student_id?: string
          student_name?: string
          student_section?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outpasses_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outpasses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_code_logs: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          prefix: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          prefix: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          prefix?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          branch: string | null
          contact_number: string | null
          course: string | null
          created_at: string | null
          department: string | null
          email: string
          enrollment_number: string
          guardian_email: string | null
          id: string
          name: string
          password: string
          role: Database["public"]["Enums"]["user_role"]
          section: string | null
          semester: string | null
        }
        Insert: {
          branch?: string | null
          contact_number?: string | null
          course?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          enrollment_number: string
          guardian_email?: string | null
          id?: string
          name: string
          password: string
          role?: Database["public"]["Enums"]["user_role"]
          section?: string | null
          semester?: string | null
        }
        Update: {
          branch?: string | null
          contact_number?: string | null
          course?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          enrollment_number?: string
          guardian_email?: string | null
          id?: string
          name?: string
          password?: string
          role?: Database["public"]["Enums"]["user_role"]
          section?: string | null
          semester?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_replication_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_table_replication: {
        Args: { table_name: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "student" | "mentor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["student", "mentor", "admin"],
    },
  },
} as const
