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
      eventos: {
        Row: {
          id: string
          nombre: string
          slug: string
          imagen_url: string | null
          descripcion: string | null
          fecha_cierre: string
          fecha_sorteo: string
          loteria_referencia: string | null
          total_entradas: number
          precio_por_entrada: number
          activo: boolean
          estado: 'activo' | 'cerrado' | 'finalizado'
          video_url: string | null
          mensaje_whatsapp: string | null
          link_whatsapp: string | null
          noticias_marquee: string | null
          banco_nombre: string | null
          banco_tipo_cuenta: string | null
          banco_numero_cuenta: string | null
          banco_titular: string | null
          banco_documento: string | null
          banco_info_adicional: string | null
          nequi_numero: string | null
          nequi_titular: string | null
          metodo_pago: string | null
          banco: string | null
          tipo_cuenta: string | null
          numero_cuenta: string | null
          titular_cuenta: string | null
          identificacion_titular: string | null
          url_pasarela: string | null
          instrucciones_pago: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          slug: string
          imagen_url?: string | null
          descripcion?: string | null
          fecha_cierre: string
          fecha_sorteo: string
          loteria_referencia?: string | null
          total_entradas: number
          precio_por_entrada: number
          activo?: boolean
          estado?: 'activo' | 'cerrado' | 'finalizado'
          video_url?: string | null
          mensaje_whatsapp?: string | null
          link_whatsapp?: string | null
          noticias_marquee?: string | null
          banco_nombre?: string | null
          banco_tipo_cuenta?: string | null
          banco_numero_cuenta?: string | null
          banco_titular?: string | null
          banco_documento?: string | null
          banco_info_adicional?: string | null
          nequi_numero?: string | null
          nequi_titular?: string | null
          metodo_pago?: string | null
          banco?: string | null
          tipo_cuenta?: string | null
          numero_cuenta?: string | null
          titular_cuenta?: string | null
          identificacion_titular?: string | null
          url_pasarela?: string | null
          instrucciones_pago?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          slug?: string
          imagen_url?: string | null
          descripcion?: string | null
          fecha_cierre?: string
          fecha_sorteo?: string
          loteria_referencia?: string | null
          total_entradas?: number
          precio_por_entrada?: number
          activo?: boolean
          estado?: 'activo' | 'cerrado' | 'finalizado'
          video_url?: string | null
          mensaje_whatsapp?: string | null
          link_whatsapp?: string | null
          noticias_marquee?: string | null
          banco_nombre?: string | null
          banco_tipo_cuenta?: string | null
          banco_numero_cuenta?: string | null
          banco_titular?: string | null
          banco_documento?: string | null
          banco_info_adicional?: string | null
          nequi_numero?: string | null
          nequi_titular?: string | null
          metodo_pago?: string | null
          banco?: string | null
          tipo_cuenta?: string | null
          numero_cuenta?: string | null
          titular_cuenta?: string | null
          identificacion_titular?: string | null
          url_pasarela?: string | null
          instrucciones_pago?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      paquetes: {
        Row: {
          id: string
          evento_id: string
          cantidad_entradas: number
          precio_total: number
          es_mas_popular: boolean
          activo: boolean
          orden: number
          url_pago: string | null
          created_at: string
        }
        Insert: {
          id?: string
          evento_id: string
          cantidad_entradas: number
          precio_total: number
          es_mas_popular?: boolean
          activo?: boolean
          orden?: number
          url_pago?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          evento_id?: string
          cantidad_entradas?: number
          precio_total?: number
          es_mas_popular?: boolean
          activo?: boolean
          orden?: number
          url_pago?: string | null
          created_at?: string
        }
      }
      entradas: {
        Row: {
          id: string
          evento_id: string
          numero_entrada: number
          estado: 'disponible' | 'reservada' | 'pagada' | 'premiada'
          correo_comprador: string | null
          compra_id: string | null
          es_bendecida: boolean
          premio_id: string | null
          bloqueada: boolean
          premio_especie_activo: boolean
          premio_especie_descripcion: string | null
          premio_especie_imagen_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          evento_id: string
          numero_entrada: number
          estado?: 'disponible' | 'reservada' | 'pagada' | 'premiada'
          correo_comprador?: string | null
          compra_id?: string | null
          es_bendecida?: boolean
          premio_id?: string | null
          bloqueada?: boolean
          premio_especie_activo?: boolean
          premio_especie_descripcion?: string | null
          premio_especie_imagen_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          evento_id?: string
          numero_entrada?: number
          estado?: 'disponible' | 'reservada' | 'pagada' | 'premiada'
          correo_comprador?: string | null
          compra_id?: string | null
          es_bendecida?: boolean
          premio_id?: string | null
          bloqueada?: boolean
          premio_especie_activo?: boolean
          premio_especie_descripcion?: string | null
          premio_especie_imagen_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      compras: {
        Row: {
          id: string
          evento_id: string
          correo_comprador: string
          nombre_comprador: string
          telefono: string
          cantidad_entradas: number
          monto_total: number
          estado: 'pendiente' | 'aprobada' | 'rechazada'
          comprobante_url: string | null
          metodo_pago: 'transferencia' | 'nequi'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          evento_id: string
          correo_comprador: string
          nombre_comprador: string
          telefono: string
          cantidad_entradas: number
          monto_total: number
          estado?: 'pendiente' | 'aprobada' | 'rechazada'
          comprobante_url?: string | null
          metodo_pago: 'transferencia' | 'nequi'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          evento_id?: string
          correo_comprador?: string
          nombre_comprador?: string
          telefono?: string
          cantidad_entradas?: number
          monto_total?: number
          estado?: 'pendiente' | 'aprobada' | 'rechazada'
          comprobante_url?: string | null
          metodo_pago?: 'transferencia' | 'nequi'
          created_at?: string
          updated_at?: string
        }
      }
      premios: {
        Row: {
          id: string
          evento_id: string
          tipo: 'principal' | 'interno'
          titulo: string
          descripcion: string | null
          imagen_url: string | null
          valor: number
          numero_ganador: number | null
          entrada_id: string | null
          publicado: boolean
          created_at: string
        }
        Insert: {
          id?: string
          evento_id: string
          tipo: 'principal' | 'interno'
          titulo: string
          descripcion?: string | null
          imagen_url?: string | null
          valor: number
          numero_ganador?: number | null
          entrada_id?: string | null
          publicado?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          evento_id?: string
          tipo?: 'principal' | 'interno'
          titulo?: string
          descripcion?: string | null
          imagen_url?: string | null
          valor?: number
          numero_ganador?: number | null
          entrada_id?: string | null
          publicado?: boolean
          created_at?: string
        }
      }
      premios_bendecidos_config: {
        Row: {
          id: string
          evento_id: string
          entrada_id: string
          premio_id: string
          activacion_tipo: 'manual' | 'porcentaje' | 'inmediata'
          activacion_porcentaje: number | null
          activada: boolean
          activada_en: string | null
          created_at: string
        }
        Insert: {
          id?: string
          evento_id: string
          entrada_id: string
          premio_id: string
          activacion_tipo: 'manual' | 'porcentaje' | 'inmediata'
          activacion_porcentaje?: number | null
          activada?: boolean
          activada_en?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          evento_id?: string
          entrada_id?: string
          premio_id?: string
          activacion_tipo?: 'manual' | 'porcentaje' | 'inmediata'
          activacion_porcentaje?: number | null
          activada?: boolean
          activada_en?: string | null
          created_at?: string
        }
      }
    }
  }
}
