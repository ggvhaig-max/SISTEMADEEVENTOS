import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, Gift, Trash2 } from 'lucide-react';

interface Premio {
  id: string;
  tipo: 'principal' | 'interno';
  titulo: string;
  descripcion: string;
  valor: number;
  numero_ganador: number | null;
  publicado: boolean;
}

export function PrizesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [showAddPrize, setShowAddPrize] = useState(false);

  const [newPrize, setNewPrize] = useState({
    tipo: 'principal' as 'principal' | 'interno',
    titulo: '',
    descripcion: '',
    valor: 0,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const { data: premiosData } = await supabase
        .from('premios')
        .select('*')
        .eq('evento_id', id)
        .order('created_at', { ascending: false });

      if (premiosData) {
        setPremios(premiosData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('premios').insert({
        evento_id: id,
        ...newPrize,
      });

      setNewPrize({
        tipo: 'interno',
        titulo: '',
        descripcion: '',
        valor: 0,
      });
      setShowAddPrize(false);
      loadData();
    } catch (error) {
      console.error('Error adding prize:', error);
      alert('Error al agregar premio');
    }
  };


  const handleDeletePrize = async (prizeId: string) => {
    if (!confirm('¿Eliminar este premio?')) return;

    try {
      await supabase.from('premios').delete().eq('id', prizeId);
      loadData();
    } catch (error) {
      console.error('Error deleting prize:', error);
      alert('Error al eliminar premio');
    }
  };

  const handleTogglePublished = async (prizeId: string, published: boolean) => {
    try {
      await supabase
        .from('premios')
        .update({ publicado: !published })
        .eq('id', prizeId);
      loadData();
    } catch (error) {
      console.error('Error updating prize:', error);
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
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/admin/eventos/${id}/editar`)}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Premios</h1>
          <p className="text-gray-400 mt-1">Administra los premios principales del sorteo</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Premios</h2>
          <button
            onClick={() => setShowAddPrize(!showAddPrize)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Agregar Premio</span>
          </button>
        </div>

        {showAddPrize && (
          <div className="p-6 bg-gray-900 border-b border-gray-700">
            <form onSubmit={handleAddPrize} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Premio
                </label>
                <select
                  value={newPrize.tipo}
                  onChange={(e) =>
                    setNewPrize({ ...newPrize, tipo: e.target.value as 'principal' | 'interno' })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="principal">Principal</option>
                  <option value="interno">Interno</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título</label>
                <input
                  type="text"
                  value={newPrize.titulo}
                  onChange={(e) => setNewPrize({ ...newPrize, titulo: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                <textarea
                  value={newPrize.descripcion}
                  onChange={(e) => setNewPrize({ ...newPrize, descripcion: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Valor</label>
                <input
                  type="number"
                  min="0"
                  value={newPrize.valor}
                  onChange={(e) => setNewPrize({ ...newPrize, valor: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddPrize(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Guardar Premio
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="divide-y divide-gray-700">
          {premios.map((premio) => (
            <div key={premio.id} className="p-6 hover:bg-gray-700/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Gift className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-white">{premio.titulo}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        premio.tipo === 'principal'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {premio.tipo}
                    </span>
                  </div>
                  {premio.descripcion && (
                    <p className="text-gray-400 text-sm mb-2">{premio.descripcion}</p>
                  )}
                  <p className="text-xl font-bold text-white">
                    ${premio.valor.toLocaleString()}
                  </p>
                  {premio.numero_ganador && (
                    <p className="text-sm text-green-400 mt-2">
                      Ganador: #{premio.numero_ganador.toString().padStart(5, '0')}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTogglePublished(premio.id, premio.publicado)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      premio.publicado
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {premio.publicado ? 'Publicado' : 'No Publicado'}
                  </button>
                  <button
                    onClick={() => handleDeletePrize(premio.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {premios.length === 0 && (
            <div className="p-12 text-center text-gray-400">No hay premios configurados</div>
          )}
        </div>
      </div>
    </div>
  );
}
