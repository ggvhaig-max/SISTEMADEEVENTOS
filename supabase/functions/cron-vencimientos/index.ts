import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // PROTECCIÓN FIRME: Esta función solo puede ser invocada si se envía el CRON_SECRET como Bearer token.
  // Esto evita exponer la Service Role Key al servicio de cron externo.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized - Missing Token', { status: 401 })
  }

  const cronSecret = Deno.env.get('CRON_SECRET') ?? ''
  const token = authHeader.replace('Bearer ', '')
  
  if (token !== cronSecret || !cronSecret) {
     return new Response('Forbidden - Invalid CRON Secret', { status: 403 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  // Client administrador maestro para ejecutar la rutina del sistema
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

  try {
    // Invoca la función PL/pgSQL
    const { error } = await supabaseAdmin.rpc('check_expirations')

    if (error) throw error

    return new Response(JSON.stringify({ success: true, message: 'Rotación de licencias caducadas ejecutada exitosamente' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

/**
 * =========================================================
 * MANUAL DE INVOCACIÓN (CRON / GITHUB ACTIONS)
 * =========================================================
 *
 * Endpoint: POST https://[tu-id-proyecto].supabase.co/functions/v1/cron-vencimientos
 * Headers Requeridos:
 *   - Authorization: Bearer [TU_CRON_SECRET]
 * Payload Esperado: Vacío (No requiere body).
 * 
 * Ejemplo Curl:
 * curl -X POST https://[tu-id-proyecto].supabase.co/functions/v1/cron-vencimientos \
 *   -H "Authorization: Bearer [TU_CRON_SECRET]"
 * 
 * NOTA: Esta función es idempotente. Se puede llamar cada 10 minutos o cada 24 horas. 
 * Solo mutará Tenants que cruzaron su fecha de expiración y su estado sea 'activo' o 'prueba'.
 */
