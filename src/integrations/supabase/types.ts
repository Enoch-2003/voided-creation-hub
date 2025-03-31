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
      [_ in never]: never
    }
    Enums: {
      user_role: "student" | "mentor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
