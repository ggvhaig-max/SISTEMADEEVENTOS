import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Share2, ArrowLeft, Ticket } from 'lucide-react';
import { TicketReceipt } from '../../components/TicketReceipt';
import { downloadTicketPDF, shareTicketWhatsApp } from '../../utils/pdfGenerator';
import { toast } from 'sonner';

interface CompraData {
  id: string;
  buyer_email?: string;
  buyer_phone?: string;
  evento?: {
    nombre: string;
  };
  entradas?: Array<{
    numero_entrada: number;
    estado?: string;
  }>;
}

export function MyTicketPage() {
  const { tenant, eventSlug } = useParams<{ tenant?: string; eventSlug: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [compra, setCompra] = useState<CompraData | null>(null);
  const [error, setError] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!eventSlug) {
        setError('Evento no especificado en la URL');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const eventRes = await fetch(`${supabaseUrl}/functions/v1/get-event-public?slug=${eventSlug}`);
      const eventJson = await eventRes.json();
      const eventoData = eventJson.evento;

      if (!eventoData || !eventoData.id) {
        setError(eventJson.error || 'Evento no encontrado');
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/lookup-entries?evento_id=${eventoData.id}&email=${encodeURIComponent(email.toLowerCase().trim())}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);

      // Find the approved one directly from edge function results
      const data = result.compras?.find((c: any) => c.estado === 'aprobada' || c.estado === 'completada');

      if (!data) {
        setError('No se encontró ninguna compra aprobada con ese correo electrónico');
        return;
      }

      setCompra(data);
    } catch (err: any) {
      console.error('Error searching:', err);
      setError('Error al buscar tu boleta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!compra) return;
    setGeneratingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await downloadTicketPDF(`ticket-${compra.id}`, `mi-boleta-${compra.id}`);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(error.message || 'Error al generar el PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleShare = () => {
    if (!compra) return;

    const numeros = compra.entradas?.map((e) =>
      e.numero_entrada.toString().padStart(4, '0')
    ) || [];

    shareTicketWhatsApp(
      compra.buyer_phone || '',
      compra.evento?.nombre || 'Sorteo',
      numeros
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <button
            onClick={() => navigate(tenant ? `/${tenant}/evento/${eventSlug}` : `/evento/${eventSlug}`)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al evento</span>
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <Ticket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Mi Boleta
            </h1>
            <p className="text-gray-400">
              Consulta y descarga tu boleta de sorteo
            </p>
          </div>
        </div>

        {!compra ? (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Buscar mi boleta
            </h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Ingresa el correo electrónico que usaste al comprar tus boletas
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Buscando...' : 'Buscar mi boleta'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-300 text-center">
                ¡Boleta encontrada! Aquí está tu información
              </p>
            </div>

            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">Tu Boleta</h2>
                <p className="text-gray-400 mt-1">
                  {compra.evento?.nombre}
                </p>
              </div>

              <div className="p-6 bg-white">
                <TicketReceipt compraId={compra.id} />
              </div>

              <div className="p-6 space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={generatingPDF}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>{generatingPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Compartir por WhatsApp</span>
                </button>

                <button
                  onClick={() => setCompra(null)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Buscar otra boleta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {compra && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <TicketReceipt compraId={compra.id} />
        </div>
      )}
    </div>
  );
}
