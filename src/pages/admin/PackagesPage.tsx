import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, Trash2, Star, CreditCard as Edit2 } from 'lucide-react';

interface Package {
  id: string;
  cantidad_entradas: number;
  precio_total: number;
  es_mas_popular: boolean;
  activo: boolean;
  orden: number;
  url_pago?: string;
}

export function PackagesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<Package[]>([]);
  const [evento, setEvento] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cantidad_entradas: 100,
    precio_total: 0,
    es_mas_popular: false,
    activo: true,
    url_pago: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [{ data: eventoData }, { data: packagesData }] = await Promise.all([
        supabase.from('eventos').select('*').eq('id', id).single(),
        supabase.from('paquetes').select('*').eq('evento_id', id).order('orden'),
      ]);

      setEvento(eventoData);
      setPackages(packagesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await supabase
          .from('paquetes')
          .update(formData)
          .eq('id', editingId);
      } else {
        const maxOrden = packages.length > 0 ? Math.max(...packages.map(p => p.orden)) : -1;

        await supabase.from('paquetes').insert([{
          evento_id: id,
          ...formData,
          orden: maxOrden + 1,
        }]);
      }

      setFormData({
        cantidad_entradas: 100,
        precio_total: 0,
        es_mas_popular: false,
        activo: true,
        url_pago: '',
      });
      setShowForm(false);
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Error al guardar el paquete');
    }
  };

  const handleEdit = (pkg: Package) => {
    setFormData({
      cantidad_entradas: pkg.cantidad_entradas,
      precio_total: pkg.precio_total,
      es_mas_popular: pkg.es_mas_popular,
      activo: pkg.activo,
      url_pago: pkg.url_pago || '',
    });
    setEditingId(pkg.id);
    setShowForm(true);
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm('¿Estás seguro de eliminar este paquete?')) return;

    try {
      await supabase.from('paquetes').delete().eq('id', packageId);
      loadData();
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  const toggleActive = async (pkg: Package) => {
    try {
      await supabase
        .from('paquetes')
        .update({ activo: !pkg.activo })
        .eq('id', pkg.id);
      loadData();
    } catch (error) {
      console.error('Error updating package:', error);
    }
  };

  const togglePopular = async (pkg: Package) => {
    try {
      if (!pkg.es_mas_popular) {
        await supabase
          .from('paquetes')
          .update({ es_mas_popular: false })
          .eq('evento_id', id);
      }

      await supabase
        .from('paquetes')
        .update({ es_mas_popular: !pkg.es_mas_popular })
        .eq('id', pkg.id);

      loadData();
    } catch (error) {
      console.error('Error updating package:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/admin/eventos/${id}/editar`)}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Paquetes de Boletas</h1>
            <p className="text-gray-400 mt-1">{evento?.nombre}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              cantidad_entradas: 100,
              precio_total: 0,
              es_mas_popular: false,
              activo: true,
              url_pago: '',
            });
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Paquete</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {editingId ? 'Editar Paquete' : 'Nuevo Paquete'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cantidad de Boletas *
              </label>
              <input
                type="number"
                min="1"
                value={formData.cantidad_entradas}
                onChange={(e) => setFormData({ ...formData, cantidad_entradas: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Precio Total *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.precio_total}
                onChange={(e) => setFormData({ ...formData, precio_total: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL de Pago (PayPal u otro)
            </label>
            <input
              type="url"
              value={formData.url_pago}
              onChange={(e) => setFormData({ ...formData, url_pago: e.target.value })}
              placeholder="https://www.paypal.com/ncp/payment/..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-400 mt-1">
              URL del enlace de pago específico para este paquete
            </p>
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.es_mas_popular}
                onChange={(e) => setFormData({ ...formData, es_mas_popular: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Marcar como más popular</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Activo</span>
            </label>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {editingId ? 'Guardar Cambios' : 'Crear Paquete'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {packages.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
            <p className="text-gray-400">No hay paquetes configurados</p>
            <p className="text-sm text-gray-500 mt-2">Crea paquetes para que los usuarios puedan comprar boletas</p>
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-gray-800 rounded-xl border ${
                pkg.activo ? 'border-gray-700' : 'border-gray-800 opacity-60'
              } p-6 flex items-center justify-between`}
            >
              <div className="flex items-center space-x-4">
                {pkg.es_mas_popular && (
                  <div className="bg-orange-600/20 text-orange-500 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Más Popular</span>
                  </div>
                )}
                <div>
                  <p className="text-xl font-bold text-white">
                    {pkg.cantidad_entradas} Boletas
                  </p>
                  <p className="text-2xl font-bold text-blue-500 mt-1">
                    ${pkg.precio_total.toLocaleString()} USD
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ${(pkg.precio_total / pkg.cantidad_entradas).toFixed(2)} por entrada
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => togglePopular(pkg)}
                  className={`p-2 rounded-lg transition-colors ${
                    pkg.es_mas_popular
                      ? 'bg-orange-600/20 text-orange-500'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                  title="Marcar como popular"
                >
                  <Star className={`w-5 h-5 ${pkg.es_mas_popular ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => toggleActive(pkg)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pkg.activo
                      ? 'bg-green-600/20 text-green-500 hover:bg-green-600/30'
                      : 'bg-red-600/20 text-red-500 hover:bg-red-600/30'
                  }`}
                >
                  {pkg.activo ? 'Activo' : 'Inactivo'}
                </button>

                <button
                  onClick={() => handleEdit(pkg)}
                  className="p-2 bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
