import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildApprovalWhatsAppMessage } from '../_shared/whatsapp-templates.ts';
import { getEventLandingUrl } from '../_shared/event-links.ts';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { compra_id } = await req.json();

    console.log('Approve purchase request:', { compra_id });

    if (!compra_id) {
      return new Response(
        JSON.stringify({ error: 'compra_id es requerido' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: compra } = await supabase
      .from('compras')
      .select('*')
      .eq('id', compra_id)
      .single();

    if (!compra) {
      return new Response(
        JSON.stringify({ error: 'Compra no encontrada' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (compra.estado !== 'pendiente') {
      return new Response(
        JSON.stringify({ error: 'La compra ya fue procesada' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: entradasReservadas, error: entradasError } = await supabase
      .from('entradas')
      .select('id, numero_entrada')
      .eq('compra_id', compra_id)
      .eq('estado', 'reservada');

    if (entradasError) {
      console.error('Error fetching reserved entries:', entradasError);
      throw new Error(`Error al obtener entradas reservadas: ${entradasError.message}`);
    }

    if (!entradasReservadas || entradasReservadas.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No se encontraron entradas reservadas para esta compra'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const entradasIds = entradasReservadas.map(e => e.id);
    const numerosAsignados = entradasReservadas.map(e => e.numero_entrada);

    console.log('Updating reserved entries to pagada:', {
      count: entradasIds.length,
      ids: entradasIds.slice(0, 5),
      numeros: numerosAsignados.slice(0, 5)
    });

    const { error: updateError } = await supabase
      .from('entradas')
      .update({
        estado: 'pagada',
        nombre_comprador: compra.nombre_comprador,
        telefono: compra.telefono,
        documento: compra.documento_numero,
      })
      .in('id', entradasIds);

    if (updateError) {
      console.error('Error updating entries:', updateError);
      throw new Error(`Error al actualizar entradas: ${updateError.message}`);
    }

    console.log('All entries updated successfully');

    const { error: compraUpdateError } = await supabase
      .from('compras')
      .update({ estado: 'aprobada' })
      .eq('id', compra_id);

    if (compraUpdateError) {
      console.error('Error updating purchase:', compraUpdateError);
      throw new Error(`Error al actualizar compra: ${compraUpdateError.message}`);
    }

    console.log('Purchase approved successfully');

    const { data: evento } = await supabase
      .from('eventos')
      .select('nombre, slug, fecha_sorteo, loteria_referencia')
      .eq('id', compra.evento_id)
      .single();

    const { data: premios } = await supabase
      .from('premios')
      .select('tipo, titulo, descripcion')
      .eq('evento_id', compra.evento_id)
      .order('orden', { ascending: true });

    const emailNotificationData = {
      compra_id: compra_id,
      email: compra.correo_comprador,
      nombre: compra.nombre_comprador,
      numeros: numerosAsignados.sort((a, b) => a - b),
      evento_nombre: evento?.nombre || 'Evento',
      evento_slug: evento?.slug || '',
      fecha_sorteo: evento?.fecha_sorteo || '',
      loteria_referencia: evento?.loteria_referencia || '',
      premios: premios || [],
      cantidad_entradas: numerosAsignados.length,
      monto_total: compra.monto_total,
    };

    const whatsappNotificationData = {
      telefono: compra.telefono || '',
      nombre: compra.nombre_comprador,
      evento_nombre: evento?.nombre || 'Evento',
      evento_slug: evento?.slug || '',
      cantidad_entradas: numerosAsignados.length,
      numeros: numerosAsignados.sort((a, b) => a - b),
    };

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-approval-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailNotificationData),
      });
      console.log('Email notification sent successfully');
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
    }

    /** Misma plantilla que send-approval-whatsapp (pago verificado). NO usar plantilla de "compartir boleta". */
    function buildApprovalWhatsAppUrl(
      telefonoRaw: string,
      payload: {
        nombre: string;
        evento_nombre: string;
        evento_slug: string;
        cantidad_entradas: number;
        numeros: number[];
      },
    ): string | null {
      const telefonoLimpio = telefonoRaw.replace(/\D/g, '');
      if (!telefonoLimpio || telefonoLimpio.length < 10) {
        return null;
      }
      const landingUrl = getEventLandingUrl(payload.evento_slug);
      const mensaje = buildApprovalWhatsAppMessage({
        nombre: payload.nombre,
        evento_nombre: payload.evento_nombre,
        cantidad_entradas: payload.cantidad_entradas,
        numeros: payload.numeros,
        landingUrl,
      });
      return `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
    }

    let whatsappUrl: string | null = null;
    if (compra.telefono) {
      try {
        const whatsappResponse = await fetch(`${supabaseUrl}/functions/v1/send-approval-whatsapp`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(whatsappNotificationData),
        });
        const whatsappResult = await whatsappResponse.json();
        if (whatsappResponse.ok && typeof whatsappResult.whatsapp_url === 'string' && whatsappResult.whatsapp_url.length > 0) {
          whatsappUrl = whatsappResult.whatsapp_url;
          console.log('WhatsApp notification URL from send-approval-whatsapp');
        } else {
          console.warn('send-approval-whatsapp no devolvió URL válida, usando fallback local', whatsappResult);
        }
      } catch (whatsappError) {
        console.error('Error calling send-approval-whatsapp:', whatsappError);
      }

      if (!whatsappUrl) {
        whatsappUrl = buildApprovalWhatsAppUrl(compra.telefono, {
          nombre: compra.nombre_comprador,
          evento_nombre: evento?.nombre || 'Evento',
          evento_slug: evento?.slug || '',
          cantidad_entradas: numerosAsignados.length,
          numeros: numerosAsignados.sort((a, b) => a - b),
        });
        if (whatsappUrl) {
          console.log('WhatsApp URL generada con fallback (plantilla compra aprobada)');
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        numeros_asignados: numerosAsignados.sort((a, b) => a - b),
        mensaje: `Se asignaron ${numerosAsignados.length} entradas exitosamente.`,
        whatsapp_url: whatsappUrl,
        email_sent: true,
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
