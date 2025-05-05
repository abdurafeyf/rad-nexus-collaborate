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
      appointments: {
        Row: {
          appointment_date: string
          cancellation_reason: string | null
          created_at: string
          description: string | null
          doctor_id: string
          duration_minutes: number
          id: string
          location: string | null
          patient_id: string
          reminder_sent: boolean
          rescheduling_link_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          cancellation_reason?: string | null
          created_at?: string
          description?: string | null
          doctor_id: string
          duration_minutes?: number
          id?: string
          location?: string | null
          patient_id: string
          reminder_sent?: boolean
          rescheduling_link_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          cancellation_reason?: string | null
          created_at?: string
          description?: string | null
          doctor_id?: string
          duration_minutes?: number
          id?: string
          location?: string | null
          patient_id?: string
          reminder_sent?: boolean
          rescheduling_link_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorized_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          file_path: string | null
          file_type: string | null
          id: string
          is_voice_note: boolean | null
          message: string | null
          patient_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          is_voice_note?: boolean | null
          message?: string | null
          patient_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          is_voice_note?: boolean | null
          message?: string | null
          patient_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_available?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          organization_id: string
          specialization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id: string
          last_name: string
          organization_id: string
          specialization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string
          specialization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          patient_id: string
          read: boolean
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          patient_id: string
          read?: boolean
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          patient_id?: string
          read?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          admin_email: string
          admin_name: string
          created_at: string
          id: string
          institute_name: string
          plan: string
          updated_at: string
        }
        Insert: {
          admin_email: string
          admin_name: string
          created_at?: string
          id?: string
          institute_name: string
          plan: string
          updated_at?: string
        }
        Update: {
          admin_email?: string
          admin_name?: string
          created_at?: string
          id?: string
          institute_name?: string
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          created_at: string
          date_of_birth: string | null
          doctor_id: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          id: string
          is_typing: boolean | null
          last_visit: string
          name: string
          notes: string | null
          phone_number: string | null
          status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          doctor_id?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          is_typing?: boolean | null
          last_visit?: string
          name: string
          notes?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          doctor_id?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          is_typing?: boolean | null
          last_visit?: string
          name?: string
          notes?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content: string
          created_at: string
          generated_at: string | null
          hospital_name: string | null
          id: string
          patient_id: string
          published_at: string | null
          report_text: string | null
          scan_record_id: string
          status: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          generated_at?: string | null
          hospital_name?: string | null
          id?: string
          patient_id: string
          published_at?: string | null
          report_text?: string | null
          scan_record_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          generated_at?: string | null
          hospital_name?: string | null
          id?: string
          patient_id?: string
          published_at?: string | null
          report_text?: string | null
          scan_record_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_scan_record_id_fkey"
            columns: ["scan_record_id"]
            isOneToOne: false
            referencedRelation: "scan_records"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_records: {
        Row: {
          created_at: string | null
          date_taken: string
          doctor_id: string | null
          file_url: string | null
          id: string
          notes: string | null
          patient_id: string
          scan_type: string
          uploaded_by: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          date_taken: string
          doctor_id?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          scan_type: string
          uploaded_by?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          date_taken?: string
          doctor_id?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          scan_type?: string
          uploaded_by?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_time_slot_available: {
        Args: {
          p_doctor_id: string
          p_start_time: string
          p_duration_minutes: number
        }
        Returns: boolean
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
    Enums: {},
  },
} as const
