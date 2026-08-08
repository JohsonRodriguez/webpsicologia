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
      actas_alumno: {
        Row: {
          acuerdos: string | null
          caso_id: string
          created_at: string
          declaracion_alumno: string | null
          detalle: string
          fecha: string
          firma_alumno_data: string | null
          firma_alumno_nombre: string | null
          firma_fecha_hora: string | null
          hora: string
          id: string
          observaciones: string | null
          psicologo_id: string
        }
        Insert: {
          acuerdos?: string | null
          caso_id: string
          created_at?: string
          declaracion_alumno?: string | null
          detalle: string
          fecha: string
          firma_alumno_data?: string | null
          firma_alumno_nombre?: string | null
          firma_fecha_hora?: string | null
          hora: string
          id?: string
          observaciones?: string | null
          psicologo_id: string
        }
        Update: {
          acuerdos?: string | null
          caso_id?: string
          created_at?: string
          declaracion_alumno?: string | null
          detalle?: string
          fecha?: string
          firma_alumno_data?: string | null
          firma_alumno_nombre?: string | null
          firma_fecha_hora?: string | null
          hora?: string
          id?: string
          observaciones?: string | null
          psicologo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actas_alumno_caso_id_fkey"
            columns: ["caso_id"]
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actas_alumno_psicologo_id_fkey"
            columns: ["psicologo_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      alumnos: {
        Row: {
          apellidos: string
          codigo: string
          created_at: string
          id: string
          nombres: string
        }
        Insert: {
          apellidos: string
          codigo: string
          created_at?: string
          id?: string
          nombres: string
        }
        Update: {
          apellidos?: string
          codigo?: string
          created_at?: string
          id?: string
          nombres?: string
        }
        Relationships: []
      }
      anios_academicos: {
        Row: {
          activo: boolean
          anio: number
          id: string
        }
        Insert: {
          activo?: boolean
          anio: number
          id?: string
        }
        Update: {
          activo?: boolean
          anio?: number
          id?: string
        }
        Relationships: []
      }
      casos: {
        Row: {
          alumno_id: string
          created_at: string
          estado: string
          fecha_apertura: string
          fecha_cierre: string | null
          id: string
          incidencia_id: string | null
          psicologo_id: string
          psicologo_original_id: string | null
          tipo: string
        }
        Insert: {
          alumno_id: string
          created_at?: string
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          incidencia_id?: string | null
          psicologo_id: string
          psicologo_original_id?: string | null
          tipo: string
        }
        Update: {
          alumno_id?: string
          created_at?: string
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          incidencia_id?: string | null
          psicologo_id?: string
          psicologo_original_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "casos_alumno_id_fkey"
            columns: ["alumno_id"]
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_incidencia_id_fkey"
            columns: ["incidencia_id"]
            referencedRelation: "incidencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_psicologo_id_fkey"
            columns: ["psicologo_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_psicologo_original_id_fkey"
            columns: ["psicologo_original_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogo_motivos: {
        Row: {
          activo: boolean
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      citas_padres: {
        Row: {
          acuerdos_psicologo: string | null
          asistentes: string
          caso_id: string
          compromisos_padre: string | null
          created_at: string
          detalle: string
          fecha: string
          hora: string
          id: string
          obs_padre: string | null
          obs_psicologo: string | null
          psicologo_id: string
        }
        Insert: {
          acuerdos_psicologo?: string | null
          asistentes: string
          caso_id: string
          compromisos_padre?: string | null
          created_at?: string
          detalle: string
          fecha: string
          hora: string
          id?: string
          obs_padre?: string | null
          obs_psicologo?: string | null
          psicologo_id: string
        }
        Update: {
          acuerdos_psicologo?: string | null
          asistentes?: string
          caso_id?: string
          compromisos_padre?: string | null
          created_at?: string
          detalle?: string
          fecha?: string
          hora?: string
          id?: string
          obs_padre?: string | null
          obs_psicologo?: string | null
          psicologo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "citas_padres_caso_id_fkey"
            columns: ["caso_id"]
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_padres_psicologo_id_fkey"
            columns: ["psicologo_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      correos_cola: {
        Row: {
          asunto: string
          creado_en: string
          destinatario_email: string
          enviado_en: string | null
          estado: string
          html: string
          id: string
        }
        Insert: {
          asunto: string
          creado_en?: string
          destinatario_email: string
          enviado_en?: string | null
          estado?: string
          html: string
          id?: string
        }
        Update: {
          asunto?: string
          creado_en?: string
          destinatario_email?: string
          enviado_en?: string | null
          estado?: string
          html?: string
          id?: string
        }
        Relationships: []
      }
      evidencias: {
        Row: {
          archivo_url: string
          created_at: string
          id: string
          incidencia_id: string
        }
        Insert: {
          archivo_url: string
          created_at?: string
          id?: string
          incidencia_id: string
        }
        Update: {
          archivo_url?: string
          created_at?: string
          id?: string
          incidencia_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_incidencia_id_fkey"
            columns: ["incidencia_id"]
            referencedRelation: "incidencias"
            referencedColumns: ["id"]
          },
        ]
      }
      firmas: {
        Row: {
          cita_id: string
          fecha_hora: string
          firma_data: string
          firmante_nombre: string
          firmante_tipo: string
          id: string
        }
        Insert: {
          cita_id: string
          fecha_hora?: string
          firma_data: string
          firmante_nombre: string
          firmante_tipo: string
          id?: string
        }
        Update: {
          cita_id?: string
          fecha_hora?: string
          firma_data?: string
          firmante_nombre?: string
          firmante_tipo?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "firmas_cita_id_fkey"
            columns: ["cita_id"]
            referencedRelation: "citas_padres"
            referencedColumns: ["id"]
          },
        ]
      }
      grados: {
        Row: {
          id: string
          nivel_id: string
          nombre: string
          orden: number
        }
        Insert: {
          id?: string
          nivel_id: string
          nombre: string
          orden: number
        }
        Update: {
          id?: string
          nivel_id?: string
          nombre?: string
          orden?: number
        }
        Relationships: [
          {
            foreignKeyName: "grados_nivel_id_fkey"
            columns: ["nivel_id"]
            referencedRelation: "niveles"
            referencedColumns: ["id"]
          },
        ]
      }
      incidencias: {
        Row: {
          acciones_tomadas: string
          alumno_id: string
          created_at: string
          descripcion: string
          estado: string
          fecha_hora: string
          id: string
          involucrados: string | null
          motivo_id: string
          motivo_otro: string | null
          prioridad: string
          profesor_id: string
        }
        Insert: {
          acciones_tomadas: string
          alumno_id: string
          created_at?: string
          descripcion: string
          estado?: string
          fecha_hora?: string
          id?: string
          involucrados?: string | null
          motivo_id: string
          motivo_otro?: string | null
          prioridad: string
          profesor_id: string
        }
        Update: {
          acciones_tomadas?: string
          alumno_id?: string
          created_at?: string
          descripcion?: string
          estado?: string
          fecha_hora?: string
          id?: string
          involucrados?: string | null
          motivo_id?: string
          motivo_otro?: string | null
          prioridad?: string
          profesor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidencias_alumno_id_fkey"
            columns: ["alumno_id"]
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_motivo_id_fkey"
            columns: ["motivo_id"]
            referencedRelation: "catalogo_motivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_profesor_id_fkey"
            columns: ["profesor_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          alumno_id: string
          anio_academico_id: string
          created_at: string
          grado_id: string
          id: string
          seccion_id: string
        }
        Insert: {
          alumno_id: string
          anio_academico_id: string
          created_at?: string
          grado_id: string
          id?: string
          seccion_id: string
        }
        Update: {
          alumno_id?: string
          anio_academico_id?: string
          created_at?: string
          grado_id?: string
          id?: string
          seccion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_alumno_id_fkey"
            columns: ["alumno_id"]
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_anio_academico_id_fkey"
            columns: ["anio_academico_id"]
            referencedRelation: "anios_academicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_grado_id_fkey"
            columns: ["grado_id"]
            referencedRelation: "grados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_seccion_id_fkey"
            columns: ["seccion_id"]
            referencedRelation: "secciones"
            referencedColumns: ["id"]
          },
        ]
      }
      niveles: {
        Row: {
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          id?: string
          nombre: string
          orden: number
        }
        Update: {
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      notas_seguimiento: {
        Row: {
          autor_id: string
          caso_id: string
          contenido: string
          fecha: string
          id: string
        }
        Insert: {
          autor_id: string
          caso_id: string
          contenido: string
          fecha?: string
          id?: string
        }
        Update: {
          autor_id?: string
          caso_id?: string
          contenido?: string
          fecha?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_seguimiento_autor_id_fkey"
            columns: ["autor_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_seguimiento_caso_id_fkey"
            columns: ["caso_id"]
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          fecha: string
          id: string
          leido: boolean
          referencia_id: string | null
          texto: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          fecha?: string
          id?: string
          leido?: boolean
          referencia_id?: string | null
          texto: string
          tipo: string
          usuario_id: string
        }
        Update: {
          fecha?: string
          id?: string
          leido?: boolean
          referencia_id?: string | null
          texto?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      psicologo_grado: {
        Row: {
          grado_id: string
          id: string
          usuario_id: string
        }
        Insert: {
          grado_id: string
          id?: string
          usuario_id: string
        }
        Update: {
          grado_id?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "psicologo_grado_grado_id_fkey"
            columns: ["grado_id"]
            referencedRelation: "grados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psicologo_grado_usuario_id_fkey"
            columns: ["usuario_id"]
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      secciones: {
        Row: {
          grado_id: string
          id: string
          nombre: string
        }
        Insert: {
          grado_id: string
          id?: string
          nombre: string
        }
        Update: {
          grado_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "secciones_grado_id_fkey"
            columns: ["grado_id"]
            referencedRelation: "grados"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          firma_guardada: string | null
          id: string
          nombre: string
          rol: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email: string
          firma_guardada?: string | null
          id: string
          nombre: string
          rol?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string
          firma_guardada?: string | null
          id?: string
          nombre?: string
          rol?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anio_activo_id: { Args: never; Returns: string }
      auth_grados: { Args: never; Returns: string[] }
      auth_rol: { Args: never; Returns: string }
      grado_de_alumno: { Args: { p_alumno_id: string }; Returns: string }
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
