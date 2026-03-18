import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface TicketReceiptProps {
  compraId: string;
}

interface CompraData {
  id: string;
  evento_id: string;
  cantidad_boletas: number;
  monto_total: number;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_document?: string;
  pais?: string;
  ciudad?: string;
  created_at: string;
  evento?: {
    nombre: string;
    slug: string;
  };
  entradas?: Array<{
    numero_entrada: number;
    premio_valor?: number;
  }>;
}

export function TicketReceipt({ compraId }: TicketReceiptProps) {
  const [compra, setCompra] = useState<CompraData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompra();
  }, [compraId]);

  const loadCompra = async () => {
    try {
      const { data: compraData, error: compraError } = await supabase
        .from('compras')
        .select('*')
        .eq('id', compraId)
        .maybeSingle();

      if (compraError) {
        console.error('Error loading compra:', compraError);
        return;
      }

      if (!compraData) {
        console.error('Compra not found');
        return;
      }

      console.log('Compra data loaded:', compraData);

      const { data: eventoData, error: eventoError } = await supabase
        .from('eventos')
        .select('nombre, slug')
        .eq('id', compraData.evento_id)
        .maybeSingle();

      if (eventoError) {
        console.error('Error loading evento:', eventoError);
      }

      console.log('Evento data loaded:', eventoData);

      const { data: entradasData, error: entradasError } = await supabase
        .from('entradas')
        .select('numero_entrada, premio_valor')
        .eq('compra_id', compraId)
        .order('numero_entrada');

      if (entradasError) {
        console.error('Error loading entradas:', entradasError);
      }

      console.log('Entradas data loaded:', entradasData);
      console.log('Number of entradas:', entradasData?.length);

      setCompra({
        ...compraData,
        evento: eventoData || undefined,
        entradas: entradasData || []
      });
    } catch (error) {
      console.error('Error loading compra:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!compra) {
    return (
      <div className="bg-white p-8 text-center">
        <p className="text-red-600">No se pudo cargar la información</p>
      </div>
    );
  }

  return (
    <div
      id={`ticket-${compraId}`}
      className="bg-white text-black font-mono"
      style={{
        width: '302px',
        padding: '20px',
        margin: '0 auto'
      }}
    >
      <div className="text-center mb-6">
        <div className="text-2xl font-bold mb-2">DOLARITOGANADOR.COM</div>
        <div className="text-xs mb-4">Sorteos en Vivo</div>
        <div className="border-t-2 border-b-2 border-dashed border-gray-800 py-2 my-4">
          <div className="font-bold text-lg">BOLETA DE SORTEO</div>
        </div>
      </div>

      <div className="mb-6 text-sm">
        <div className="mb-4">
          <div className="font-bold text-base mb-2 border-b border-gray-400 pb-1">
            EVENTO
          </div>
          <div className="break-words">{compra.evento?.nombre}</div>
        </div>

        {compra.buyer_name && (
          <div className="mb-4">
            <div className="font-bold text-base mb-2 border-b border-gray-400 pb-1">
              PARTICIPANTE
            </div>
            <div className="break-words">
              <div><strong>Nombre:</strong> {compra.buyer_name}</div>
              {compra.buyer_document && (
                <div><strong>Doc:</strong> {compra.buyer_document}</div>
              )}
              {compra.buyer_phone && (
                <div><strong>Tel:</strong> {compra.buyer_phone}</div>
              )}
              {compra.pais && (
                <div><strong>País:</strong> {compra.pais}</div>
              )}
              {compra.ciudad && (
                <div><strong>Ciudad:</strong> {compra.ciudad}</div>
              )}
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="font-bold text-base mb-2 border-b border-gray-400 pb-1">
            TUS NÚMEROS
          </div>
          {(!compra.entradas || compra.entradas.length === 0) ? (
            <div className="text-red-600 text-sm">No se encontraron números asignados</div>
          ) : (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {compra.entradas.map((entrada) => (
                <div
                  key={entrada.numero_entrada}
                  className="text-center font-bold text-lg bg-green-100 border-2 border-green-600 rounded py-1"
                >
                  {entrada.numero_entrada.toString().padStart(4, '0')}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="font-bold text-base mb-2 border-b border-gray-400 pb-1">
            RESUMEN
          </div>
          <div className="flex justify-between mb-1">
            <span>Cantidad:</span>
            <span className="font-bold">{compra.cantidad_boletas} boletas</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Total:</span>
            <span className="font-bold">${compra.monto_total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>Fecha:</span>
            <span>{new Date(compra.created_at).toLocaleDateString('es-ES')}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Hora:</span>
            <span>{new Date(compra.created_at).toLocaleTimeString('es-ES')}</span>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-gray-800 pt-4 text-xs text-center">
        <div className="mb-2">
          <strong>ID de Compra:</strong>
        </div>
        <div className="text-[10px] break-all mb-4">
          {compra.id}
        </div>
        <div className="mb-2">
          ¡Mucha suerte en el sorteo!
        </div>
        <div className="text-xs font-bold">
          www.dolaritoganador.com
        </div>
      </div>

      <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-800 text-center text-[10px] text-gray-600">
        <div>Esta es tu boleta oficial</div>
        <div>Guárdala hasta el día del sorteo</div>
      </div>
    </div>
  );
}
