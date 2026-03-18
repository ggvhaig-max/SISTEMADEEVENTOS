import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, Trash2, Star, Lock, Unlock } from 'lucide-react';

interface BlessedEntry {
  id: string;
  numero_entrada: number;
  premio_valor: number;
  estado: string;
  correo_comprador: string | null;
  bloqueada: boolean;
  premio_especie_activo: boolean;
  premio_especie_descripcion: string | null;
  premio_especie_imagen_url: string | null;
}

export function BlessedNumbersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [blessedEntries, setBlessedEntries] = useState<BlessedEntry[]>([]);
  const [evento, setEvento] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    numeros: '',
    premio_valor: 0,
    premio_especie_activo: false,
    premio_especie_descripcion: '',
    premio_especie_imagen_url: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [{ data: eventoData }, { data: entriesData }] = await Promise.all([
        supabase.from('eventos').select('*').eq('id', id).single(),
        supabase
          .from('entradas')
          .select('*')
          .eq('evento_id', id)
          .eq('es_bendecida', true)
          .order('numero_entrada'),
      ]);

      setEvento(eventoData);
      setBlessedEntries(entriesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const numerosArray = formData.numeros
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n)
        .map((n) => parseInt(n));

      if (numerosArray.length === 0) {
        alert('Debes ingresar al menos un número');
        return;
      }

      const invalidNumbers = numerosArray.filter(
        (n) => isNaN(n) || n < 1 || n > evento.total_entradas
      );

      if (invalidNumbers.length > 0) {
        alert(`Números inválidos: ${invalidNumbers.join(', ')}`);
        return;
      }

      const { data: existingEntries } = await supabase
        .from('entradas')
        .select('numero_entrada')
        .eq('evento_id', id)
        .in('numero_entrada', numerosArray);

      const existingNumbers = existingEntries?.map((e) => e.numero_entrada) || [];

      const updates = existingNumbers.map((num) =>
        supabase
          .from('entradas')
          .update({
            es_bendecida: true,
            premio_valor: formData.premio_valor,
            bloqueada: true,
            premio_especie_activo: formData.premio_especie_activo,
            premio_especie_descripcion: formData.premio_especie_activo ? formData.premio_especie_descripcion : null,
            premio_especie_imagen_url: formData.premio_especie_activo ? formData.premio_especie_imagen_url : null,
          })
          .eq('evento_id', id)
          .eq('numero_entrada', num)
      );

      await Promise.all(updates);

      setFormData({
        numeros: '',
        premio_valor: 0,
        premio_especie_activo: false,
        premio_especie_descripcion: '',
        premio_especie_imagen_url: '',
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error blessing numbers:', error);
      alert('Error al bendecir números');
    }
  };

  const handleRemoveBlessing = async (entryId: string) => {
    if (!confirm('¿Estás seguro de quitar la bendición de este número?')) return;

    try {
      await supabase
        .from('entradas')
        .update({
          es_bendecida: false,
          premio_valor: 0,
          bloqueada: false,
        })
        .eq('id', entryId);

      loadData();
    } catch (error) {
      console.error('Error removing blessing:', error);
    }
  };

  const handleToggleBlock = async (entryId: string, currentBlocked: boolean) => {
    const action = currentBlocked ? 'liberar' : 'bloquear';
    if (!confirm(`¿Estás seguro de ${action} este número? ${currentBlocked ? 'Esto permitirá que se asigne en las compras.' : 'Esto evitará que se asigne automáticamente.'}`)) {
      return;
    }

    try {
      await supabase
        .from('entradas')
        .update({ bloqueada: !currentBlocked })
        .eq('id', entryId);

      loadData();
    } catch (error) {
      console.error('Error toggling block status:', error);
      alert(`Error al ${action} el número`);
    }
  };

  const handleReleaseBlocked = async () => {
    const bloqueados = blessedEntries.filter(e => e.bloqueada && e.estado === 'disponible');

    if (bloqueados.length === 0) {
      alert('No hay números bendecidos bloqueados para liberar');
      return;
    }

    if (!confirm(`¿Liberar ${bloqueados.length} números bendecidos bloqueados? Esto permitirá que se asignen en las compras.`)) {
      return;
    }

    try {
      const updates = bloqueados.map((entry) =>
        supabase
          .from('entradas')
          .update({ bloqueada: false })
          .eq('id', entry.id)
      );

      await Promise.all(updates);
      loadData();
    } catch (error) {
      console.error('Error releasing blessed numbers:', error);
      alert('Error al liberar números');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalPremios = blessedEntries.reduce((sum, e) => sum + Number(e.premio_valor), 0);
  const ganados = blessedEntries.filter((e) => e.estado === 'pagada' || e.estado === 'premiada');
  const bloqueados = blessedEntries.filter((e) => e.bloqueada && e.estado === 'disponible');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/admin/eventos/${id}/editar`)}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Números Bendecidos</h1>
            <p className="text-gray-400 mt-1">{evento?.nombre}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {bloqueados.length > 0 && (
            <button
              onClick={handleReleaseBlocked}
              className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <span>Liberar Bloqueados ({bloqueados.length})</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Bendecir Números</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <p className="text-sm text-gray-400">Números Bendecidos</p>
          </div>
          <p className="text-3xl font-bold text-white">{blessedEntries.length}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Bloqueados</p>
          <p className="text-3xl font-bold text-yellow-400">{bloqueados.length}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Total Boletas Adicionales</p>
          <p className="text-3xl font-bold text-green-400">+{totalPremios.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Premios Ganados</p>
          <p className="text-3xl font-bold text-orange-400">{ganados.length}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Bendecir Números</h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Números a Bendecir (separados por coma) *
            </label>
            <input
              type="text"
              value={formData.numeros}
              onChange={(e) => setFormData({ ...formData, numeros: e.target.value })}
              placeholder="Ej: 1234, 5678, 9999"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingresa los números separados por comas. Rango: 1 - {evento?.total_entradas.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cantidad de Boletas Adicionales *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.premio_valor}
              onChange={(e) => setFormData({ ...formData, premio_valor: Number(e.target.value) })}
              placeholder="Ej: 100, 200, 500"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              El cliente que obtenga este número recibirá boletas adicionales gratis al azar (ej: 100, 200, 500)
            </p>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.premio_especie_activo}
                onChange={(e) => setFormData({ ...formData, premio_especie_activo: e.target.checked })}
                className="w-5 h-5 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-300">
                Agregar Premio en Especie Adicional (opcional)
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-8">
              Agrega un premio extra como efectivo, productos, bonos, etc. que se mostrará en la landing page
            </p>
          </div>

          {formData.premio_especie_activo && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción del Premio *
                </label>
                <input
                  type="text"
                  value={formData.premio_especie_descripcion}
                  onChange={(e) => setFormData({ ...formData, premio_especie_descripcion: e.target.value })}
                  placeholder="Ej: $50.000 en efectivo, Camiseta oficial, Entrada VIP"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={formData.premio_especie_activo}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL de la Imagen del Premio
                </label>
                <input
                  type="url"
                  value={formData.premio_especie_imagen_url}
                  onChange={(e) => setFormData({ ...formData, premio_especie_imagen_url: e.target.value })}
                  placeholder="https://ejemplo.com/imagen-premio.jpg"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si se deja vacío, se mostrará un ícono de regalo por defecto
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Bendecir Números
            </button>
          </div>
        </form>
      )}

      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Números Bendecidos</h2>
        </div>

        {blessedEntries.length === 0 ? (
          <div className="p-12 text-center">
            <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No hay números bendecidos</p>
            <p className="text-sm text-gray-500 mt-2">
              Los números bendecidos son premios especiales que ganan los clientes al obtener esos números
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Boletas Adicionales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Disponibilidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Ganador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {blessedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-xl font-bold text-white font-mono">
                          #{entry.numero_entrada.toString().padStart(5, '0')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-400">
                        +{Number(entry.premio_valor).toLocaleString()} Boletas
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleBlock(entry.id, entry.bloqueada)}
                        className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          entry.bloqueada
                            ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                            : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        }`}
                        title={entry.bloqueada ? 'Click para liberar' : 'Click para bloquear'}
                      >
                        {entry.bloqueada ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Bloqueado</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>Liberado</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          entry.estado === 'disponible'
                            ? 'bg-gray-600/20 text-gray-400'
                            : entry.estado === 'reservada'
                            ? 'bg-yellow-600/20 text-yellow-400'
                            : entry.estado === 'pagada' || entry.estado === 'premiada'
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-gray-600/20 text-gray-400'
                        }`}
                      >
                        {entry.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {entry.correo_comprador ? (
                        <span className="text-sm text-white">{entry.correo_comprador}</span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRemoveBlessing(entry.id)}
                        className="p-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded-lg transition-colors"
                        title="Quitar bendición"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
