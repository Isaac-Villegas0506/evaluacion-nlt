export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      estudiantes: {
        Row: {
          id: string
          nombres: string
          dni: string
          correo: string
          celular: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          nombres: string
          dni: string
          correo: string
          celular?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nombres?: string
          dni?: string
          correo?: string
          celular?: string | null
          created_at?: string | null
        }
      }
      examenes: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          duracion_minutos: number
          nota_minima: number
          created_at: string | null
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          duracion_minutos?: number
          nota_minima?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          duracion_minutos?: number
          nota_minima?: number
          created_at?: string | null
        }
      }
      preguntas: {
        Row: {
          id: string
          examen_id: string | null
          tipo: 'multiple' | 'verdadero_falso' | 'corta' | 'desarrollo'
          pregunta: string
          imagen_url: string | null
          puntaje: number
          orden: number
        }
        Insert: {
          id?: string
          examen_id?: string | null
          tipo: 'multiple' | 'verdadero_falso' | 'corta' | 'desarrollo'
          pregunta: string
          imagen_url?: string | null
          puntaje?: number
          orden?: number
        }
        Update: {
          id?: string
          examen_id?: string | null
          tipo?: 'multiple' | 'verdadero_falso' | 'corta' | 'desarrollo'
          pregunta?: string
          imagen_url?: string | null
          puntaje?: number
          orden?: number
        }
      }
      opciones: {
        Row: {
          id: string
          pregunta_id: string | null
          texto: string
          es_correcta: boolean
        }
        Insert: {
          id?: string
          pregunta_id?: string | null
          texto: string
          es_correcta?: boolean
        }
        Update: {
          id?: string
          pregunta_id?: string | null
          texto?: string
          es_correcta?: boolean
        }
      }
      asignaciones: {
        Row: {
          id: string
          estudiante_id: string | null
          examen_id: string | null
          token_unico: string
          estado: 'pendiente' | 'en_progreso' | 'pendiente_revision' | 'aprobado' | 'desaprobado'
          fecha_asignacion: string | null
        }
        Insert: {
          id?: string
          estudiante_id?: string | null
          examen_id?: string | null
          token_unico?: string
          estado?: 'pendiente' | 'en_progreso' | 'pendiente_revision' | 'aprobado' | 'desaprobado'
          fecha_asignacion?: string | null
        }
        Update: {
          id?: string
          estudiante_id?: string | null
          examen_id?: string | null
          token_unico?: string
          estado?: 'pendiente' | 'en_progreso' | 'pendiente_revision' | 'aprobado' | 'desaprobado'
          fecha_asignacion?: string | null
        }
      }
      intentos: {
        Row: {
          id: string
          asignacion_id: string | null
          fecha_inicio: string | null
          fecha_fin: string | null
          nota_final: number | null
        }
        Insert: {
          id?: string
          asignacion_id?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          nota_final?: number | null
        }
        Update: {
          id?: string
          asignacion_id?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          nota_final?: number | null
        }
      }
      respuestas: {
        Row: {
          id: string
          intento_id: string | null
          pregunta_id: string | null
          respuesta: string | null
          puntaje_obtenido: number | null
          observacion: string | null
        }
        Insert: {
          id?: string
          intento_id?: string | null
          pregunta_id?: string | null
          respuesta?: string | null
          puntaje_obtenido?: number | null
          observacion?: string | null
        }
        Update: {
          id?: string
          intento_id?: string | null
          pregunta_id?: string | null
          respuesta?: string | null
          puntaje_obtenido?: number | null
          observacion?: string | null
        }
      }
      certificados: {
        Row: {
          id: string
          estudiante_id: string | null
          examen_id: string | null
          intento_id: string | null
          codigo_verificacion: string
          pdf_url: string | null
          fecha_emision: string | null
        }
        Insert: {
          id?: string
          estudiante_id?: string | null
          examen_id?: string | null
          intento_id?: string | null
          codigo_verificacion: string
          pdf_url?: string | null
          fecha_emision?: string | null
        }
        Update: {
          id?: string
          estudiante_id?: string | null
          examen_id?: string | null
          intento_id?: string | null
          codigo_verificacion?: string
          pdf_url?: string | null
          fecha_emision?: string | null
        }
      }
    }
  }
}
