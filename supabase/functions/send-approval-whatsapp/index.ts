/**
 * Genera wa.me con plantilla "compra aprobada / pago verificado".
 * Debe coincidir con el fallback en approve-purchase (mismos helpers _shared).
 */
import { getEventLandingUrl } from '../_shared/event-links.ts';
import { buildApprovalWhatsAppMessage } from '../_shared/whatsapp-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WhatsAppData {
  telefono: string;
  nombre: string;
  evento_nombre: string;
  evento_slug: string;
  cantidad_entradas: number;
  numeros: number[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: WhatsAppData = await req.json();

    const {
      telefono,
      nombre,
      evento_nombre,
      evento_slug,
      cantidad_entradas,
      numeros,
    } = data;

    const landingUrl = getEventLandingUrl(evento_slug);

    const mensaje = buildApprovalWhatsAppMessage({
      nombre,
      evento_nombre,
      cantidad_entradas,
      numeros,
      landingUrl,
    });

    const telefonoLimpio = telefono.replace(/\D/g, '');

    if (!telefonoLimpio || telefonoLimpio.length < 10) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El número de teléfono no es válido',
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

    const whatsappUrl = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;

    return new Response(
      JSON.stringify({
        success: true,
        whatsapp_url: whatsappUrl,
        mensaje: mensaje,
        telefono: telefonoLimpio,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating WhatsApp message:', error);
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
