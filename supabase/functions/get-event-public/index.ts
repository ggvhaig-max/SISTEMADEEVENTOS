import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .select('*, tenant:tenants(estado)')
      .eq('slug', slug)
      .maybeSingle();

    if (evento && evento.tenant) {
      const estadoTenant = Array.isArray(evento.tenant) ? evento.tenant[0].estado : evento.tenant.estado;
      if (!['prueba', 'activo'].includes(estadoTenant)) {
        return new Response(
          JSON.stringify({ error: 'La licencia de este negocio se encuentra inactiva o suspendida.' }),
          {
            status: 403,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      delete evento.tenant; // Remove extra data before serving to client
    }

    if (eventoError) {
      console.error('Error fetching evento:', eventoError);
      return new Response(
        JSON.stringify({ error: 'Error al buscar evento', details: eventoError.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!evento) {
      return new Response(
        JSON.stringify({ error: 'Evento no encontrado' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { count: entradas_vendidas } = await supabase
      .from('entradas')
      .select('*', { count: 'exact', head: true })
      .eq('evento_id', evento.id)
      .eq('estado', 'pagada');

    const { data: paquetes } = await supabase
      .from('paquetes')
      .select('*')
      .eq('evento_id', evento.id)
      .eq('activo', true)
      .order('orden', { ascending: true });

    const { data: premios } = await supabase
      .from('premios')
      .select('*')
      .eq('evento_id', evento.id)
      .eq('publicado', true);

    const { data: numerosBendecidos } = await supabase
      .from('entradas')
      .select('numero_entrada, premio_valor, estado, correo_comprador, nombre_comprador, bloqueada, premio_especie_activo, premio_especie_descripcion, premio_especie_imagen_url')
      .eq('evento_id', evento.id)
      .eq('es_bendecida', true)
      .order('numero_entrada');

    const totalNumerosBendecidos = numerosBendecidos?.length || 0;
    const numerosBendecidosDisponibles = numerosBendecidos?.filter(n => n.estado === 'disponible' && !n.bloqueada).length || 0;
    const totalPremiosBendecidos = numerosBendecidos?.reduce((sum, n) => sum + Number(n.premio_valor), 0) || 0;

    const entradas_restantes = evento.total_entradas - (entradas_vendidas || 0);
    const porcentaje_vendido = ((entradas_vendidas || 0) / evento.total_entradas) * 100;

    return new Response(
      JSON.stringify({
        evento,
        entradas_vendidas: entradas_vendidas || 0,
        entradas_restantes,
        porcentaje_vendido,
        paquetes: paquetes || [],
        premios: premios || [],
        numeros_bendecidos: {
          total: totalNumerosBendecidos,
          disponibles: numerosBendecidosDisponibles,
          total_en_premios: totalPremiosBendecidos,
          lista: numerosBendecidos || [],
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
