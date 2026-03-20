import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { ArrowLeft, Check, X, ExternalLink, Ticket, Mail, MessageCircle, Download, Share2, Trash2 } from 'lucide-react';
import { TicketReceipt } from '../../components/TicketReceipt';
import { downloadTicketPDF, shareTicketWhatsApp } from '../../utils/pdfGenerator';

type Compra = Database['public']['Tables']['compras']['Row'];
type EntradaUpdate = Database['public']['Tables']['entradas']['Update'];
type EntradaNumero = Pick<Database['public']['Tables']['entradas']['Row'], 'numero_entrada'>;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function PurchasesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [filter, setFilter] = useState<'todas' | 'pendiente' | 'aprobada' | 'rechazada'>('todas');
  const [showNumbersModal, setShowNumbersModal] = useState(false);
  const [assignedNumbers, setAssignedNumbers] = useState<number[]>([]);
  const [approvedBuyer, setApprovedBuyer] = useState<{ nombre: string; correo: string; telefono: string } | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [currentCompraId, setCurrentCompraId] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [evento, setEvento] = useState<{ nombre: string } | null>(null);
  const [deletingCompraId, setDeletingCompraId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    loadCompras();
    loadEvento();
  }, [id]);

  const loadEvento = async () => {
    if (!id) return;

    try {
      const { data } = await supabase
        .from('eventos')
        .select('nombre')
        .eq('id', id)
        .single();

      if (data) {
        setEvento(data);
      }
    } catch (error) {
      console.error('Error loading evento:', error);
    }
  };

  const loadCompras = async () => {
    if (!id) return;

    try {
      const { data } = await supabase
        .from('compras')
        .select('*')
        .eq('evento_id', id)
        .order('created_at', { ascending: false });

      if (data) {
        setCompras(data);
      }
    } catch (error) {
      console.error('Error loading compras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (compraId: string) => {
    if (!confirm('¿Aprobar esta compra y asignar boletas al comprador?')) {
      return;
    }

    try {
      const compra = compras.find(c => c.id === compraId);
      if (!compra) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/approve-purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compra_id: compraId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al aprobar la compra');
      }

      const result = await response.json();

      setAssignedNumbers(result.numeros_asignados);
      setApprovedBuyer({
        nombre: compra.nombre_comprador,
        correo: compra.correo_comprador,
        telefono: compra.telefono,
      });
      setWhatsappUrl(result.whatsapp_url || null);
      setEmailSent(result.email_sent || false);
      setCurrentCompraId(compraId);
      setShowNumbersModal(true);

      setCompras(compras.map(c => c.id === compraId ? { ...c, estado: 'aprobada' } : c));
    } catch (error: unknown) {
      console.error('Error approving compra:', error);
      alert(getErrorMessage(error, 'Error al aprobar la compra'));
    }
  };

  const handleDownloadTicket = async (compraId: string) => {
    setGeneratingPDF(true);
    setCurrentCompraId(compraId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await downloadTicketPDF(`ticket-${compraId}`, `boleta-${compraId}`);
    } catch (error: unknown) {
      console.error('Error generating PDF:', error);
      alert(getErrorMessage(error, 'Error al generar el PDF'));
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleShareWhatsApp = async (compraId: string) => {
    try {
      console.log('Loading compra data for WhatsApp share:', compraId);

      const { data: compraData, error: compraError } = await supabase
        .from('compras')
        .select('telefono')
        .eq('id', compraId)
        .maybeSingle();

      if (compraError) {
        console.error('Error loading compra:', compraError);
        alert('Error al cargar la información de la compra');
        return;
      }

      if (!compraData) {
        alert('No se encontró la información de la compra');
        return;
      }

      console.log('Compra data loaded:', compraData);

      const { data: entradasData, error: entradasError } = await supabase
        .from('entradas')
        .select('numero_entrada')
        .eq('compra_id', compraId)
        .order('numero_entrada');

      if (entradasError) {
        console.error('Error loading entradas:', entradasError);
        alert('Error al cargar las entradas');
        return;
      }

      console.log('Entradas data loaded:', entradasData);
      console.log('Number of entradas:', entradasData?.length);

      if (!entradasData || entradasData.length === 0) {
        alert('No se encontraron números asignados para esta compra');
        return;
      }

      const numeros = entradasData.map((e: EntradaNumero) =>
        e.numero_entrada.toString().padStart(4, '0')
      );

      console.log('Formatted numbers:', numeros);

      shareTicketWhatsApp(
        compraData.telefono || '',
        evento?.nombre || 'Sorteo',
        numeros
      );
    } catch (error) {
      console.error('Error sharing WhatsApp:', error);
      alert('Error al compartir por WhatsApp');
    }
  };

  const handleReject = async (compraId: string) => {
    if (!confirm('¿Estás seguro de rechazar esta compra? Las boletas serán liberadas.')) {
      return;
    }

    try {
      const releasePayload: EntradaUpdate = {
        estado: 'disponible',
        correo_comprador: null,
        compra_id: null,
        nombre_comprador: null,
        telefono: null,
        documento: null,
        pais: null,
        ciudad: null,
      };

      const { error: releaseError } = await supabase
        .from('entradas')
        .update(releasePayload)
        .eq('compra_id', compraId);

      if (releaseError) {
        throw releaseError;
      }

      const { error: rejectError } = await supabase
        .from('compras')
        .update({ estado: 'rechazada' })
        .eq('id', compraId);

      if (rejectError) {
        throw rejectError;
      }

      setCompras(compras.map(c => c.id === compraId ? { ...c, estado: 'rechazada' } : c));
    } catch (error: unknown) {
      console.error('Error rejecting compra:', error);
      alert(getErrorMessage(error, 'Error al rechazar la compra'));
    }
  };

  const handleDelete = async (compraId: string) => {
    const compra = compras.find(c => c.id === compraId);
    if (!compra) return;

    if (compra.estado === 'aprobada') {
      alert('No se puede eliminar una compra aprobada. Las boletas ya fueron asignadas al comprador.');
      return;
    }

    const mensaje = compra.estado === 'pendiente'
      ? '¿Eliminar esta transacción? Se liberarán las boletas reservadas. Esta acción no se puede deshacer.'
      : '¿Eliminar definitivamente esta transacción? Esta acción no se puede deshacer.';

    if (!confirm(mensaje)) {
      return;
    }

    try {
      setDeletingCompraId(compraId);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/delete-purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ compra_id: compraId }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar la transacción');
      }

      setCompras(current => current.filter(c => c.id !== compraId));

    } catch (error: unknown) {
      console.error('Error deleting compra:', error);
      alert(getErrorMessage(error, 'Error al eliminar la transacción'));
    } finally {
      setDeletingCompraId(null);
    }
  };

  const filteredCompras = filter === 'todas'
    ? compras
    : compras.filter(c => c.estado === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const stats = {
    pendientes: compras.filter(c => c.estado === 'pendiente').length,
    aprobadas: compras.filter(c => c.estado === 'aprobada').length,
    rechazadas: compras.filter(c => c.estado === 'rechazada').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/admin/eventos/${id}/editar`)}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Compras</h1>
          <p className="text-gray-400 mt-1">Administra y aprueba las compras</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pendientes}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Aprobadas</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.aprobadas}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Rechazadas</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.rechazadas}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Compras</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('todas')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === 'todas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('pendiente')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === 'pendiente'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilter('aprobada')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === 'aprobada'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Aprobadas
            </button>
          </div>
        </div>

        {filteredCompras.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No hay compras {filter !== 'todas' && filter}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Comprador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Boletas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Comprobante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredCompras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{compra.nombre_comprador}</div>
                      <div className="text-sm text-gray-400">{compra.correo_comprador}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {compra.documento_tipo}: {compra.documento_numero}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{compra.telefono}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{compra.cantidad_entradas}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        ${compra.monto_total.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                        {compra.metodo_pago}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        compra.estado === 'pendiente'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : compra.estado === 'aprobada'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {compra.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {compra.comprobante_url ? (
                        <a
                          href={compra.comprobante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Ver</span>
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {compra.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => handleApprove(compra.id)}
                              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              title="Aprobar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(compra.id)}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                              title="Rechazar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(compra.id)}
                              disabled={deletingCompraId === compra.id}
                              className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                              title="Eliminar transacción"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {compra.estado === 'rechazada' && (
                          <button
                            onClick={() => handleDelete(compra.id)}
                            disabled={deletingCompraId === compra.id}
                            className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                            title="Eliminar transacción"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {compra.estado === 'aprobada' && (
                          <>
                            <button
                              onClick={() => handleDownloadTicket(compra.id)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              title="Descargar Boleta PDF"
                              disabled={generatingPDF}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(compra.id)}
                              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              title="Compartir por WhatsApp"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNumbersModal && approvedBuyer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Compra Aprobada</h2>
                <p className="text-sm text-gray-400 mt-1">Números asignados exitosamente</p>
              </div>
              <button
                onClick={() => setShowNumbersModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Check className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-white font-semibold">Compra aprobada exitosamente</p>
                    <p className="text-sm text-green-300 mt-1">
                      Se asignaron {assignedNumbers.length} boletas al comprador
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-3">Información del Comprador</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nombre:</span>
                    <span className="text-white font-medium">{approvedBuyer.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Correo:</span>
                    <span className="text-white">{approvedBuyer.correo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Teléfono:</span>
                    <span className="text-white">{approvedBuyer.telefono}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-2 mb-3">
                  <Ticket className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-semibold">Números Asignados ({assignedNumbers.length})</h3>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-96 overflow-y-auto">
                  {assignedNumbers.map((numero) => (
                    <div
                      key={numero}
                      className="bg-blue-600 text-white text-center py-2 rounded-lg font-semibold text-sm"
                    >
                      {numero}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <span className="font-semibold">Siguiente paso:</span> El comprador puede consultar sus números
                  en la página del evento usando su correo electrónico: <span className="font-mono">{approvedBuyer.correo}</span>
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Notificaciones al Cliente
                </h3>

                {emailSent && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium">Email enviado automáticamente</p>
                        <p className="text-sm text-green-300 mt-1">
                          Se envió un correo con todos los números y detalles a: {approvedBuyer.correo}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {whatsappUrl && approvedBuyer.telefono && (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start space-x-3">
                      <MessageCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2">Enviar notificación por WhatsApp</p>
                        <p className="text-sm text-gray-400 mb-3">
                          Haz clic para abrir WhatsApp y enviar un mensaje al cliente con el enlace para consultar sus boletas.
                        </p>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Enviar Mensaje WhatsApp</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {!whatsappUrl && approvedBuyer.telefono && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-sm text-yellow-300">
                      No se pudo generar el enlace de WhatsApp automáticamente. Puedes contactar al cliente manualmente al: {approvedBuyer.telefono}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {currentCompraId && (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-white font-semibold mb-3 flex items-center">
                      <Ticket className="w-5 h-5 mr-2" />
                      Boleta del Cliente
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Descarga la boleta en PDF o compártela directamente por WhatsApp con el cliente
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleDownloadTicket(currentCompraId)}
                        disabled={generatingPDF}
                        className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        <span>{generatingPDF ? 'Generando...' : 'Descargar PDF'}</span>
                      </button>
                      <button
                        onClick={() => handleShareWhatsApp(currentCompraId)}
                        className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                        <span>Compartir WhatsApp</span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowNumbersModal(false)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentCompraId && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <TicketReceipt compraId={currentCompraId} />
        </div>
      )}
    </div>
  );
}
