import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Save, Edit2, ExternalLink, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TenantJoined {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  fecha_vencimiento: string | null;
  created_at: string;
  vendedor_id: string | null;
  vendedor: { nombre: string } | null;
  propietario: { email: string } | null;
}

export function SuperAdminTenants() {
  const [tenants, setTenants] = useState<TenantJoined[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  // Relacionado con edición de un Tenant individual
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEstado, setEditEstado] = useState('');
  const [editFecha, setEditFecha] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('tenants')
        .select(`
          id, nombre, slug, estado, fecha_vencimiento, created_at, vendedor_id,
          vendedor:usuarios_plataforma!tenants_vendedor_id_fkey(nombre),
          propietario:auth_users_extract(email) 
        `)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST204') {
        // Ignoramos error de relación falsa auth_users_extract si llegase a saltar
      }
      
      // auth_users_extract es un mock o necesitas extraer info, lo cambiaremos por un join manual si no existe relation.
      // Como no podemos joinear facil a auth.users, traemos owner_id y luego resolvemos emails (simplificado si no existe acceso a auth.users).
      // Por practicidad asumimos que usuarios_plataforma guarda nombre/email:
      
      const { data: realData, error: realError } = await supabase
        .from('tenants')
        .select(`
          id, owner_id, nombre, slug, estado, fecha_vencimiento, created_at, vendedor_id,
          vendedor:usuarios_plataforma!tenants_vendedor_id_fkey(nombre),
          owner:usuarios_plataforma!tenants_owner_id_fkey(nombre)
        `)
        .order('created_at', { ascending: false });
        
      if (realError) throw realError;

      setTenants(realData as any);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (tenant: TenantJoined) => {
    setEditingId(tenant.id);
    setEditEstado(tenant.estado);
    setEditFecha(tenant.fecha_vencimiento ? tenant.fecha_vencimiento.split('T')[0] : '');
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const updates: any = { estado: editEstado };
      if (editFecha) {
        updates.fecha_vencimiento = new Date(editFecha).toISOString();
      } else {
        updates.fecha_vencimiento = null;
      }

      const { error } = await supabase.from('tenants').update(updates).eq('id', id);
      if (error) throw error;
      
      setEditingId(null);
      fetchTenants();
    } catch (error) {
      console.error(error);
      toast.error('Error guardando cambios');
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
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Clientes (Agencias)</h1>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Resp. Ventas</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm divide-y divide-slate-200/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                      Cargando base de datos de clientes...
                    </div>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron clientes con esos filtros.
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
                      {editingId === t.id ? (
                        <select
                          value={editEstado}
                          onChange={(e) => setEditEstado(e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-gray-600 rounded text-sm text-slate-900 focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="prueba">Prueba</option>
                          <option value="activo">Activo</option>
                          <option value="vencido">Vencido</option>
                          <option value="suspendido">Suspendido</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(t.estado)}`}>
                          {t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {editingId === t.id ? (
                        <input
                          type="date"
                          value={editFecha}
                          onChange={(e) => setEditFecha(e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-gray-600 rounded text-sm text-slate-900 focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        t.fecha_vencimiento 
                          ? new Date(t.fecha_vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                          : <span className="text-slate-400 italic">Sin límite</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {t.vendedor?.nombre || <span className="text-gray-600 italic">No asignado</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {editingId === t.id ? (
                        <>
                          <button onClick={() => handleSaveEdit(t.id)} className="text-green-400 hover:text-green-300 p-1">
                            <Save className="w-5 h-5 inline" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-600 p-1">
                            <XCircle className="w-5 h-5 inline" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditClick(t)} className="text-orange-500 hover:text-blue-300 p-1" title="Editar Licencia">
                            <Edit2 className="w-4 h-4 inline" />
                          </button>
                          <a 
                            href={`/${t.slug}/dashboard`}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="text-purple-400 hover:text-purple-300 p-1 cursor-pointer" 
                            title="Bypass Lector / Entrar como Soporte"
                            onClick={async () => {
                               window.sessionStorage.setItem(`bypass_admin_${t.slug}`, 'true');
                               await supabase.from('auditoria_acciones').insert({
                                 accion: 'BYPASS_SOPORTE_ACTIVADO',
                                 origen: 'frontend',
                                 entidad_tipo: 'tenant',
                                 entidad_id: t.id,
                                 detalles: { slug: t.slug },
                                 tenant_id: t.id
                               });
                            }}
                          >
                            <ExternalLink className="w-4 h-4 inline" />
                          </a>
                        </>
                      )}
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
