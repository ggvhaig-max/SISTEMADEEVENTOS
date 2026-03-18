import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PurchaseRequest {
  evento_id: string;
  documento_tipo: string;
  documento_numero: string;
  correo_comprador: string;
  nombre_comprador: string;
  telefono: string;
  pais: string;
  ciudad: string;
  cantidad_entradas: number;
  metodo_pago: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: PurchaseRequest = await req.json();
    console.log('Purchase request received:', body);

    const { evento_id, documento_tipo, documento_numero, correo_comprador, nombre_comprador, telefono, pais, ciudad, cantidad_entradas, metodo_pago } = body;

    const { data: evento } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', evento_id)
      .single();

    if (!evento || !evento.activo) {
      return new Response(
        JSON.stringify({ error: 'Evento no disponible' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { count: totalDisponibles } = await supabase
      .from('entradas')
      .select('*', { count: 'exact', head: true })
      .eq('evento_id', evento_id)
      .eq('estado', 'disponible')
      .eq('bloqueada', false);

    if (!totalDisponibles || totalDisponibles < cantidad_entradas) {
      return new Response(
        JSON.stringify({ error: 'No hay suficientes entradas disponibles' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: entradasDisponibles, error: queryError } = await supabase
      .rpc('get_well_distributed_entries', {
        p_evento_id: evento_id,
        p_cantidad: cantidad_entradas
      });

    if (queryError) {
      console.error('Error en get_random_available_entries:', queryError);
      return new Response(
        JSON.stringify({ error: 'Error al seleccionar entradas aleatorias: ' + queryError.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!entradasDisponibles || entradasDisponibles.length < cantidad_entradas) {
      return new Response(
        JSON.stringify({ error: 'No se pudieron seleccionar suficientes entradas aleatorias' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const entradasSeleccionadas = entradasDisponibles;

    const monto_total = cantidad_entradas * Number(evento.precio_por_entrada);

    const { data: compra, error: compraError } = await supabase
      .from('compras')
      .insert({
        evento_id,
        documento_tipo,
        documento_numero,
        correo_comprador,
        nombre_comprador,
        telefono,
        pais,
        ciudad,
        cantidad_entradas,
        monto_total,
        metodo_pago,
        estado: 'pendiente',
      })
      .select()
      .single();

    if (compraError || !compra) {
      console.error('Error creating purchase:', compraError);
      return new Response(
        JSON.stringify({ error: 'Error al crear la compra: ' + (compraError?.message || 'Unknown error') }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const entradaIds = entradasSeleccionadas.map(e => e.id);

    await supabase
      .from('entradas')
      .update({
        estado: 'reservada',
        correo_comprador,
        compra_id: compra.id,
        pais,
        ciudad,
      })
      .in('id', entradaIds);

    const { data: entradasActualizadas } = await supabase
      .from('entradas')
      .select('id, numero_entrada, es_bendecida, premio_valor')
      .in('id', entradaIds);

    const entradasBendecidas = entradasActualizadas?.filter(e => e.es_bendecida) || [];
    const premiosGanados = [];
    let totalEntradasBonus = 0;

    for (const entradaBendecida of entradasBendecidas) {
      const cantidadBonus = Number(entradaBendecida.premio_valor);

      if (cantidadBonus > 0) {
        const { data: entradasBonus } = await supabase
          .rpc('get_well_distributed_entries', {
            p_evento_id: evento_id,
            p_cantidad: cantidadBonus
          });

        if (entradasBonus && entradasBonus.length > 0) {
          const entradasBonusSeleccionadas = entradasBonus;

          const bonusIds = entradasBonusSeleccionadas.map(e => e.id);

          await supabase
            .from('entradas')
            .update({
              estado: 'reservada',
              correo_comprador,
              compra_id: compra.id,
              pais,
              ciudad,
            })
            .in('id', bonusIds);

          totalEntradasBonus += entradasBonusSeleccionadas.length;

          premiosGanados.push({
            numero_bendecido: entradaBendecida.numero_entrada,
            entradas_bonus: entradasBonusSeleccionadas.length,
            numeros_bonus: entradasBonusSeleccionadas.map(e => e.numero_entrada),
          });
        }
      }
    }

    await supabase
      .from('compras')
      .update({
        cantidad_entradas: cantidad_entradas + totalEntradasBonus,
      })
      .eq('id', compra.id);

    return new Response(
      JSON.stringify({
        success: true,
        compra_id: compra.id,
        entradas: entradasActualizadas?.map(e => e.numero_entrada) || [],
        monto_total,
        premios_ganados: premiosGanados,
        total_entradas_bonus: totalEntradasBonus,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Purchase function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error desconocido', details: error }),
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
