import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Wallet, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function SuperAdminComisiones() {
  const [comisiones, setComisiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('todos');

  useEffect(() => {
    fetchComisiones();
  }, []);

  const fetchComisiones = async () => {
    try {
      const { data, error } = await supabase
        .from('comisiones_vendedores')
        .select(`*`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComisiones(data || []);
    } catch (err) {
      console.error('Error fetching comisiones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id: string) => {
    if (!window.confirm(`¿Marcar comisión como Pagada al vendedor?`)) return;

    try {
      const { error } = await (supabase.from('comisiones_vendedores') as any)
        .update({ estado: 'pagado', fecha_pago: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      fetchComisiones();
    } catch (err: any) {
      toast(err.message);
    }
  };

  if (loading) return <div className="p-8 text-white">Cargando comisiones...</div>;

  const filteredComisiones = comisiones.filter(c => {
    return filterEstado === 'todos' || c.estado === filterEstado;
  });

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="w-8 h-8 text-purple-500" />
        <h1 className="text-2xl font-bold text-white">Dispersión de Comisiones</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los Estados</option>
            <option value="por_pagar">Por Pagar</option>
            <option value="pagado">Pagadas</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-300">
            <thead className="bg-gray-900/50 text-xs uppercase font-semibold text-gray-400">
              <tr>
                <th className="px-6 py-4">ID Comisión</th>
                <th className="px-6 py-4">Base Pago</th>
                <th className="px-6 py-4">% Aplicado</th>
                <th className="px-6 py-4 text-green-400">A Pagar ($)</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredComisiones.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 font-mono text-sm">{c.id.substring(0, 8)}</td>
                  <td className="px-6 py-4">${c.monto_base}</td>
                  <td className="px-6 py-4">{c.porcentaje_aplicado}%</td>
                  <td className="px-6 py-4 font-bold text-green-400">${c.monto_comision}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      c.estado === 'pagado' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                      {c.estado === 'pagado' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      <span className="capitalize">{c.estado.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {c.estado !== 'pagado' && (
                      <button 
                        onClick={() => handlePay(c.id)}
                        className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors text-sm"
                      >
                        Marcar Pagada
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredComisiones.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No hay comisiones registradas. Se generan automáticamente al aprobar un pago de un Vendedor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
