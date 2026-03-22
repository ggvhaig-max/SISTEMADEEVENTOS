import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Calendar, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Evento {
  id: string;
  nombre: string;
  slug: string;
  total_entradas: number;
  precio_por_entrada: number;
  activo: boolean;
  estado: string;
  fecha_sorteo: string;
  created_at: string;
}

export function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      const { data } = await supabase
        .from('eventos')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setEventos(data);
      }
    } catch (error) {
      console.error('Error loading eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await supabase.from('eventos').delete().eq('id', id);
      setEventos(eventos.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting evento:', error);
      toast.error('Error al eliminar el evento');
    }
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      await supabase
        .from('eventos')
        .update({ activo: !activo })
        .eq('id', id);

      setEventos(eventos.map(e => e.id === id ? { ...e, activo: !activo } : e));
    } catch (error) {
      console.error('Error updating evento:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Eventos</h1>
          <p className="text-slate-500 mt-1">Gestiona todos tus eventos</p>
        </div>
        <Link
          to="/admin/eventos/nuevo"
          className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Evento</span>
        </Link>
      </div>

      {eventos.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl border border-white/50 p-12 text-center">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.map((evento) => (
            <div
              key={evento.id}
              className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl border border-white/50 overflow-hidden hover:border-gray-600 transition-colors"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {evento.nombre}
                    </h3>
                    <p className="text-sm text-slate-500">/evento/{evento.slug}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleActivo(evento.id, evento.activo)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        evento.activo ? 'bg-green-600' : 'bg-slate-200'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        evento.activo ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total Boletas:</span>
                    <span className="text-slate-900 font-medium">{evento.total_entradas.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Precio:</span>
                    <span className="text-slate-900 font-medium">${evento.precio_por_entrada.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Estado:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      evento.estado === 'activo'
                        ? 'bg-green-500/20 text-green-400'
                        : evento.estado === 'cerrado'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-slate-500'
                    }`}>
                      {evento.estado.charAt(0).toUpperCase() + evento.estado.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t border-white/50">
                  <Link
                    to={`/admin/eventos/${evento.id}/editar`}
                    className="flex-1 flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </Link>
                  <Link
                    to={`/evento/${evento.slug}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Ver</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(evento.id)}
                    className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-md px-3 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
