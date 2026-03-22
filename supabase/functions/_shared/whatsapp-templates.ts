interface ApprovalWhatsAppMessageInput {
  nombre: string;
  evento_nombre: string;
  cantidad_entradas: number;
  numeros: number[];
  landingUrl: string;
}

function formatNumerosTexto(numeros: number[]): string {
  const numerosOrdenados = [...numeros].sort((a, b) => a - b);

  if (numerosOrdenados.length <= 50) {
    return numerosOrdenados.join(', ');
  }

  const primerosNumeros = numerosOrdenados.slice(0, 25);
  const ultimosNumeros = numerosOrdenados.slice(-25);

  return `${primerosNumeros.join(', ')} ... ${ultimosNumeros.join(', ')}`;
}

export function buildApprovalWhatsAppMessage({
  nombre,
  evento_nombre,
  cantidad_entradas,
  numeros,
  landingUrl,
}: ApprovalWhatsAppMessageInput): string {
  const numerosTexto = formatNumerosTexto(numeros);

  return `🎉 ¡Tu Compra ha sido Aprobada!

Hola *${nombre}*,

✅ Tu pago ha sido verificado exitosamente.

🎟️ Detalles:
* Evento: ${evento_nombre}
* Cantidad de entradas: ${cantidad_entradas}
* Números: ${numerosTexto}

🔎 Consulta tus números:
${landingUrl}
Busca: CONSULTA TUS NÚMEROS

📧 También recibirás un correo electrónico con todos los detalles.

🍀 ¡Mucha suerte en el sorteo!`;
}
