import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Calendar, TrendingUp, DollarSign, Users, Plus } from 'lucide-react';

interface EventStats {
  id: string;
  nombre: string;
  slug: string;
  total_entradas: number;
  precio_por_entrada: number;
  entradas_vendidas: number;
  total_recaudado: number;
  porcentaje_vendido: number;
  estado: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalGeneral, setTotalGeneral] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: eventos } = await supabase
        .from('eventos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!eventos) return;

      const statsPromises = eventos.map(async (evento) => {
        const { count: entradas_vendidas } = await supabase
          .from('entradas')
          .select('*', { count: 'exact', head: true })
          .eq('evento_id', evento.id)
          .eq('estado', 'pagada');

        const { data: compras } = await supabase
          .from('compras')
          .select('monto_total')
          .eq('evento_id', evento.id)
          .eq('estado', 'aprobada');

        const total_recaudado = compras?.reduce((sum, c) => sum + Number(c.monto_total), 0) || 0;
        const porcentaje_vendido = ((entradas_vendidas || 0) / evento.total_entradas) * 100;

        return {
          id: evento.id,
          nombre: evento.nombre,
          slug: evento.slug,
          total_entradas: evento.total_entradas,
          precio_por_entrada: evento.precio_por_entrada,
          entradas_vendidas: entradas_vendidas || 0,
          total_recaudado,
          porcentaje_vendido,
          estado: evento.estado,
        };
      });

      const statsData = await Promise.all(statsPromises);
      setStats(statsData);

      const total = statsData.reduce((sum, s) => sum + s.total_recaudado, 0);
      setTotalGeneral(total);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const eventosActivos = stats.filter(s => s.estado === 'activo').length;
  const boletasVendidas = stats.reduce((sum, s) => sum + s.entradas_vendidas, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Vista general del sistema</p>
        </div>
        <Link
          to="/admin/eventos/nuevo"
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Evento</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl p-4 sm:p-6 border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">Eventos Activos</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2">{eventosActivos}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl p-4 sm:p-6 border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs sm:text-sm">Total Eventos</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2">{stats.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl p-4 sm:p-6 border border-white/50">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-500 text-xs sm:text-sm">Boletas Vendidas</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2 truncate">{boletasVendidas.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl p-4 sm:p-6 border border-white/50">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-slate-500 text-xs sm:text-sm">Total Recaudado</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2 truncate">
                ${totalGeneral.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl border border-white/50 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/50">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Eventos Recientes</h2>
        </div>

        {stats.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No hay eventos</h3>
            <p className="text-slate-400 mb-6">Crea tu primer evento para comenzar</p>
            <Link
              to="/admin/eventos/nuevo"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Evento</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Vendidas
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Recaudado
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {stats.map((evento) => (
                  <tr key={evento.id} className="hover:bg-slate-100/50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-slate-900">{evento.nombre}</div>
                      <div className="text-xs text-slate-500">/evento/{evento.slug}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        evento.estado === 'activo'
                          ? 'bg-green-500/20 text-green-400'
                          : evento.estado === 'cerrado'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-slate-500'
                      }`}>
                        {evento.estado.charAt(0).toUpperCase() + evento.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[80px] sm:max-w-[100px]">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(evento.porcentaje_vendido, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm text-slate-600 w-10 sm:w-12">
                          {evento.porcentaje_vendido.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-slate-900">
                        {evento.entradas_vendidas.toLocaleString()} / {evento.total_entradas.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-slate-900">
                        ${evento.total_recaudado.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                      <Link
                        to={`/admin/eventos/${evento.id}/editar`}
                        className="text-orange-500 hover:text-blue-300 mr-3 sm:mr-4"
                      >
                        Ver
                      </Link>
                      <Link
                        to={`/evento/${evento.slug}`}
                        target="_blank"
                        className="text-green-400 hover:text-green-300"
                      >
                        Landing
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
