import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, ExternalLink } from 'lucide-react';

interface TenantJoined {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  fecha_vencimiento: string | null;
  created_at: string;
}

export function VendedorTenants() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantJoined[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  useEffect(() => {
    if (user?.id) fetchTenants();
  }, [user?.id]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tenants')
        .select(`id, nombre, slug, estado, fecha_vencimiento, created_at`)
        .eq('vendedor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data as any);
    } catch (error) {
      console.error('Error fetching seller tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'prueba': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'vencido': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'suspendido': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'cancelado': return 'bg-gray-500/10 text-slate-400 border-gray-500/20';
      default: return 'bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm text-slate-600';
    }
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || t.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'todos' || t.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mis Cuentas de Cliente</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900 appearance-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="todos">Todos los Estados</option>
            <option value="prueba">En Prueba</option>
            <option value="activo">Activos</option>
            <option value="vencido">Vencidos</option>
            <option value="suspendido">Suspendidos</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm shadow-xl rounded-xl border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/50">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Comercio</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vencimiento</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acceso</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm divide-y divide-slate-200/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                      Cargando tus clientes...
                    </div>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron agencias asociadas a tu perfil.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{t.nombre}</div>
                          <div className="text-sm text-slate-500">/{t.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(t.estado)}`}>
                        {t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {t.fecha_vencimiento 
                        ? new Date(t.fecha_vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                        : <span className="text-slate-400 italic">Sin límite</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a 
                        href={`/${t.slug}/`}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-purple-400 hover:text-purple-300 p-1 flex items-center justify-end" 
                        title="Ver Landing del Cliente"
                      >
                         <span className="mr-2 hidden sm:inline">Visitar</span> <ExternalLink className="w-4 h-4 inline" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
