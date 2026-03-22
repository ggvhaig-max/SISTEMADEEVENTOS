import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateTicketPDF(
  ticketElementId: string,
  fileName: string
): Promise<Blob> {
  const element = document.getElementById(ticketElementId);

  if (!element) {
    throw new Error('Ticket element not found');
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 302,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      imageTimeout: 0,
      removeContainer: true,
    });

    const imgWidth = 80;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, imgHeight + 10],
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, imgHeight);

    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Error al generar el PDF. Por favor intenta de nuevo.');
  }
}

export async function downloadTicketPDF(
  ticketElementId: string,
  fileName: string
): Promise<void> {
  const blob = await generateTicketPDF(ticketElementId, fileName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Plantilla SOLO para "compartir mi boleta" (usuario o admin reenvía números en formato corto).
 * NO usar para notificación de compra aprobada / pago verificado.
 * Esa usa la plantilla del backend: buildApprovalWhatsAppMessage (Edge Function + fallback en approve-purchase).
 */
function buildShareTicketWhatsAppMessage(
  eventoNombre: string,
  numerosBoletas: string[]
): string {
  return `¡Mi boleta para el sorteo "${eventoNombre}"!\n\n` +
    `Mis números de la suerte:\n${numerosBoletas.map(n => `🎫 ${n}`).join('\n')}\n\n` +
    `¡Deséame suerte! 🍀\n\n` +
    `www.sistemadeeventos.com`;
}

/** Abre WhatsApp con texto corto tipo "Mi boleta…" — distinto al mensaje oficial de compra aprobada. */
export function shareTicketWhatsApp(
  phoneNumber: string,
  eventoNombre: string,
  numerosBoletas: string[]
): void {
  const message = buildShareTicketWhatsAppMessage(eventoNombre, numerosBoletas);

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
}
