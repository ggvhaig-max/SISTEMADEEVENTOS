import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function SuperAdminPagos() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async () => {
    try {
      // In a real app we would join tenants and usuarios_plataforma, but ambiguous relationships require specific FK notation.
      // For simplicity in MVP, we fetch basic info.
      const { data, error } = await supabase
        .from('pagos_saas')
        .select(`
          *,
          tenant:tenants(nombre)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPagos(data || []);
    } catch (err) {
      console.error('Error fetching pagos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!window.confirm(`¿Estás seguro de marcar este pago como ${newStatus}?`)) return;

    try {
      const { error } = await (supabase.from('pagos_saas') as any)
        .update({ estado: newStatus })
        .eq('id', id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Pago actualizado exitosamente. Los Triggers de licenciamiento se ejecutarán automáticamente si fue aprobado.');
        fetchPagos();
      }
    } catch (err: any) {
      toast(err.message);
    }
  };

  if (loading) return <div className="p-8 text-slate-900">Cargando pagos...</div>;

  const filteredPagos = pagos.filter(p => {
    const matchesEstado = filterEstado === 'todos' || p.estado === filterEstado;
    const matchesSearch = !searchTerm || p.tenant?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEstado && matchesSearch;
  });

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-8 h-8 text-green-500" />
        <h1 className="text-2xl font-bold text-slate-900">Solicitudes de Pagos SaaS</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por cliente/tenant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900 appearance-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="todos">Todos los Estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl overflow-hidden border border-white/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50/50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">ID Pago</th>
                <th className="px-6 py-4">Negocio (Tenant)</th>
                <th className="px-6 py-4">Tipo / Plan</th>
                <th className="px-6 py-4">Monto</th>
                <th className="px-6 py-4">Días a Añadir</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50/50">
              {filteredPagos.map((pago) => (
                <tr key={pago.id} className="hover:bg-slate-100/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">{pago.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{pago.tenant?.nombre || 'Desconocido'}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-orange-500">{pago.tipo}</span> - {pago.plan}
                  </td>
                  <td className="px-6 py-4">${pago.monto_pagado}</td>
                  <td className="px-6 py-4">{pago.dias_a_activar} días</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      pago.estado === 'aprobado' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      pago.estado === 'rechazado' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {pago.estado === 'aprobado' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {pago.estado === 'rechazado' && <XCircle className="w-3.5 h-3.5" />}
                      {pago.estado === 'pendiente' && <Clock className="w-3.5 h-3.5" />}
                      <span className="capitalize">{pago.estado}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {pago.estado !== 'aprobado' && (
                      <button 
                        onClick={() => handleStatusChange(pago.id, 'aprobado')}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-sm"
                      >
                        Aprobar
                      </button>
                    )}
                    {pago.estado === 'pendiente' && (
                      <button 
                         onClick={() => handleStatusChange(pago.id, 'rechazado')}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                      >
                        Rechazar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPagos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No hay pagos registrados.
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
