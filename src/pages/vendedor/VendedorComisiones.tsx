import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export function VendedorComisiones() {
  const [comisiones, setComisiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totales, setTotales] = useState({ pendientes: 0, pagadas: 0 });
  const [filterEstado, setFilterEstado] = useState('todos');

  useEffect(() => {
    fetchComisiones();
  }, []);

  const fetchComisiones = async () => {
    try {
      // RLS already filters by vendedor_id = auth.uid()
      const { data, error } = await supabase
        .from('comisiones_vendedores')
        .select(`*`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setComisiones(data || []);
      
      // Calcular métricas
      let pen = 0; let pag = 0;
      (data || []).forEach((c: any) => {
        if (c.estado === 'por_pagar') pen += Number(c.monto_comision);
        if (c.estado === 'pagado') pag += Number(c.monto_comision);
      });
      setTotales({ pendientes: pen, pagadas: pag });

    } catch (err) {
      console.error('Error fetching comisiones:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Cargando mis comisiones...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-8">
        <TrendingUp className="w-8 h-8 text-indigo-500" />
        <h1 className="text-2xl font-bold text-white">Mis Comisiones y Liquidaciones</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <p className="text-gray-400 text-sm font-medium mb-1">Por Cobrar (Pendientes)</p>
          <p className="text-3xl font-bold text-orange-400">${totales.pendientes.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <p className="text-gray-400 text-sm font-medium mb-1">Liquidado (Pagadas)</p>
          <p className="text-3xl font-bold text-green-400">${totales.pagadas.toLocaleString()}</p>
        </div>
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
                <th className="px-6 py-4">ID Liquidación</th>
                <th className="px-6 py-4">Monto Base Venta</th>
                <th className="px-6 py-4">% Acordado</th>
                <th className="px-6 py-4 text-indigo-400">Mi Comisión ($)</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha Aprobación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {comisiones.filter(c => filterEstado === 'todos' || c.estado === filterEstado).map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 font-mono text-sm">{c.id.substring(0, 8)}</td>
                  <td className="px-6 py-4">${c.monto_base}</td>
                  <td className="px-6 py-4">{c.porcentaje_aplicado}%</td>
                  <td className="px-6 py-4 font-bold text-indigo-400">${c.monto_comision}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      c.estado === 'pagado' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                      {c.estado === 'pagado' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      <span className="capitalize">{c.estado.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {comisiones.filter(c => filterEstado === 'todos' || c.estado === filterEstado).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Aún no tienes comisiones aprobadas. Las comisiones aparecen aquí cuando el Superadmin aprueba tus ventas de licencias SaaS.
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
