import { createClient } from 'npm:@supabase/supabase-js@2';

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

    const baseUrl = (Deno.env.get('APP_URL') || 'https://dolaritoganador.com').replace(/\/$/, '');
    const landingUrl = evento_slug ? `${baseUrl}/evento/${evento_slug}` : baseUrl;

    const numerosOrdenados = numeros.sort((a, b) => a - b);

    let numerosTexto = '';
    if (numerosOrdenados.length <= 50) {
      numerosTexto = numerosOrdenados.join(', ');
    } else {
      const primerosNumeros = numerosOrdenados.slice(0, 25);
      const ultimosNumeros = numerosOrdenados.slice(-25);
      numerosTexto = `${primerosNumeros.join(', ')} ... ${ultimosNumeros.join(', ')}`;
    }

    const mensaje = `🎉 *¡Tu Compra ha sido Aprobada!*

Hola *${nombre}*,

✅ Tu pago ha sido verificado exitosamente.

📋 *Detalles:*
• Evento: ${evento_nombre}
• Cantidad de entradas: ${cantidad_entradas}
• Números: ${numerosTexto}

🎟️ *Consulta tus números:*
${landingUrl}
Busca: *CONSULTA TUS NÚMEROS*

📧 También recibirás un correo electrónico con todos los detalles.

🍀 *¡Mucha suerte en el sorteo!*`;

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
