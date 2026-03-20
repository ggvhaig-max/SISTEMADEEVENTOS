import { getEventLandingUrl, getEventLookupUrl } from '../_shared/event-links.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailData {
  compra_id: string;
  email: string;
  nombre: string;
  numeros: number[];
  evento_nombre: string;
  evento_slug: string;
  fecha_sorteo: string;
  loteria_referencia: string;
  premios: Array<{
    tipo: string;
    titulo: string;
    descripcion: string;
  }>;
  cantidad_entradas: number;
  monto_total: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: EmailData = await req.json();

    const {
      email,
      nombre,
      numeros,
      evento_nombre,
      evento_slug,
      fecha_sorteo,
      loteria_referencia,
      premios,
      cantidad_entradas,
      monto_total,
    } = data;

    const landingUrl = getEventLandingUrl(evento_slug);
    const consultarUrl = getEventLookupUrl(evento_slug);

    const formatoFecha = new Date(fecha_sorteo).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const numerosOrdenados = numeros.sort((a, b) => a - b);
    const numerosHTML = numerosOrdenados
      .map((num) => `<span style="display: inline-block; background: #3b82f6; color: white; padding: 8px 12px; margin: 4px; border-radius: 8px; font-weight: bold;">${num}</span>`)
      .join('');

    const premiosHTML = premios
      .map((premio) => `
        <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
          <strong style="color: #1f2937;">${premio.tipo}: ${premio.titulo}</strong>
          <p style="color: #4b5563; margin: 4px 0 0 0;">${premio.descripcion}</p>
        </div>
      `)
      .join('');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compra Aprobada</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🎉 ¡Compra Aprobada!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">Tu participación en ${evento_nombre} ha sido confirmada</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
      <p style="margin: 0; color: #059669; font-weight: bold;">✅ Tu pago ha sido verificado y aprobado exitosamente</p>
    </div>

    <h2 style="color: #1f2937; margin-bottom: 15px;">Hola ${nombre},</h2>

    <p style="color: #4b5563; margin-bottom: 20px;">
      ¡Felicitaciones! Tu compra de <strong>${cantidad_entradas} entrada${cantidad_entradas > 1 ? 's' : ''}</strong>
      por un valor de <strong>$${monto_total.toLocaleString()} COP</strong> ha sido aprobada exitosamente.
    </p>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #1f2937; margin-top: 0;">📋 Detalles de tu Compra</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Evento:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${evento_nombre}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Fecha del Sorteo:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${formatoFecha}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Lotería de Referencia:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${loteria_referencia}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Cantidad de Entradas:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${cantidad_entradas}</td>
        </tr>
      </table>
    </div>

    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 25px; border-radius: 10px; margin: 25px 0;">
      <h3 style="margin-top: 0; text-align: center;">🎟️ Tus Números de la Suerte</h3>
      <div style="text-align: center; padding: 10px 0;">
        ${numerosHTML}
      </div>
    </div>

    <div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #92400e; margin-top: 0;">🏆 Premios del Evento</h3>
      ${premiosHTML}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${consultarUrl}"
         style="display: inline-block; background: #3b82f6; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        🔍 Consultar Mis Entradas
      </a>
      <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">
        Landing del evento: <a href="${landingUrl}" style="color: #10b981; text-decoration: none;">${landingUrl}</a>
      </p>
    </div>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #1f2937; margin-top: 0;">📱 Importante</h3>
      <ul style="color: #4b5563; margin: 10px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Guarda este correo como comprobante de tu compra</li>
        <li style="margin-bottom: 8px;">Puedes consultar tus entradas en cualquier momento usando tu correo electrónico</li>
        <li style="margin-bottom: 8px;">El sorteo se realizará el ${formatoFecha} según la lotería ${loteria_referencia}</li>
        <li style="margin-bottom: 8px;">Si tienes alguna pregunta, contáctanos a través de nuestro sitio web</li>
      </ul>
    </div>

    <div style="text-align: center; padding: 20px 0; border-top: 2px solid #e5e7eb;">
      <p style="color: #6b7280; margin: 10px 0;">
        <strong>¡Mucha suerte en el sorteo!</strong> 🍀
      </p>
      <p style="color: #9ca3af; font-size: 14px; margin: 10px 0;">
        Dolarito Ganador - Sistema de Rifas y Eventos
      </p>
      <p style="color: #9ca3af; font-size: 14px; margin: 5px 0;">
        <a href="https://dolaritoganador.com" style="color: #10b981; text-decoration: none;">dolaritoganador.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
¡COMPRA APROBADA!

Hola ${nombre},

Tu compra de ${cantidad_entradas} entrada${cantidad_entradas > 1 ? 's' : ''} por un valor de $${monto_total.toLocaleString()} COP ha sido aprobada exitosamente.

DETALLES DE TU COMPRA:
- Evento: ${evento_nombre}
- Fecha del Sorteo: ${formatoFecha}
- Lotería de Referencia: ${loteria_referencia}
- Cantidad de Entradas: ${cantidad_entradas}

TUS NÚMEROS DE LA SUERTE:
${numerosOrdenados.join(', ')}

PREMIOS DEL EVENTO:
${premios.map(p => `- ${p.tipo}: ${p.titulo}\n  ${p.descripcion}`).join('\n')}

Consulta tus entradas en: ${consultarUrl}
Landing del evento: ${landingUrl}

IMPORTANTE:
- Guarda este correo como comprobante de tu compra
- Puedes consultar tus entradas en cualquier momento usando tu correo electrónico
- El sorteo se realizará el ${formatoFecha} según la lotería ${loteria_referencia}

¡Mucha suerte en el sorteo! 🍀
    `;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.log('RESEND_API_KEY no configurada, mostrando email en consola');
      console.log('Para:', email);
      console.log('Asunto: ¡Compra Aprobada! - ' + evento_nombre);
      console.log('Contenido HTML:', htmlContent);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email generado (RESEND_API_KEY no configurada)',
          email_preview: {
            to: email,
            subject: `¡Compra Aprobada! - ${evento_nombre}`,
            preview: textContent.substring(0, 200),
          },
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Dolarito Ganador <confirmacion@dolaritoganador.com>',
        to: [email],
        subject: `🎉 ¡Compra Aprobada! - ${evento_nombre}`,
        html: htmlContent,
        text: textContent,
        reply_to: 'confirmacion@dolaritoganador.com',
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Error al enviar email: ${JSON.stringify(emailResult)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email enviado exitosamente',
        email_id: emailResult.id,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
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
