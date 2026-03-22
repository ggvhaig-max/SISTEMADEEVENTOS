import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Trophy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Premio {
  id: string;
  tipo: 'principal' | 'interno';
  titulo: string;
  valor: number;
  numero_ganador: number | null;
  publicado: boolean;
  entrada_id: string | null;
}

export function WinnersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<string | null>(null);
  const [winnerNumber, setWinnerNumber] = useState<number>(0);

  useEffect(() => {
    loadPremios();
  }, [id]);

  const loadPremios = async () => {
    try {
      const { data } = await supabase
        .from('premios')
        .select('*')
        .eq('evento_id', id)
        .order('tipo', { ascending: false });

      if (data) {
        setPremios(data);
      }
    } catch (error) {
      console.error('Error loading premios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetWinner = async () => {
    if (!selectedPrize || !winnerNumber) {
      toast.error('Selecciona un premio y entrada ganadora');
      return;
    }

    try {
      const { data: entrada } = await supabase
        .from('entradas')
        .select('id')
        .eq('evento_id', id)
        .eq('numero_entrada', winnerNumber)
        .single();

      if (!entrada) {
        toast('Entrada no encontrada');
        return;
      }

      await supabase
        .from('entradas')
        .update({ estado: 'premiada' })
        .eq('id', entrada.id);

      await supabase
        .from('premios')
        .update({
          numero_ganador: winnerNumber,
          entrada_id: entrada.id,
        })
        .eq('id', selectedPrize);

      toast.success('Ganador establecido exitosamente');
      setSelectedPrize(null);
      setWinnerNumber(0);
      loadPremios();
    } catch (error) {
      console.error('Error setting winner:', error);
      toast.error('Error al establecer ganador');
    }
  };

  const handlePublishWinner = async (prizeId: string, publish: boolean) => {
    try {
      await supabase
        .from('premios')
        .update({ publicado: publish })
        .eq('id', prizeId);

      loadPremios();
    } catch (error) {
      console.error('Error publishing winner:', error);
      toast.error('Error al publicar ganador');
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
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/admin/eventos/${id}/editar`)}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Ganadores</h1>
          <p className="text-slate-500 mt-1">Selecciona y publica los ganadores</p>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl border border-white/50 p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Seleccionar Ganador</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Selecciona el Premio
            </label>
            <select
              value={selectedPrize || ''}
              onChange={(e) => setSelectedPrize(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Seleccionar premio...</option>
              {premios.map((premio) => (
                <option key={premio.id} value={premio.id}>
                  {premio.titulo} - ${premio.valor.toLocaleString()} {premio.numero_ganador ? '(Ya tiene ganador)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Entrada Ganadora
            </label>
            <input
              type="number"
              min="1"
              value={winnerNumber || ''}
              onChange={(e) => setWinnerNumber(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ej: 12345"
            />
          </div>

          <button
            onClick={handleSetWinner}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 py-3 px-4 rounded-lg transition-colors"
          >
            Establecer Ganador
          </button>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl border border-white/50 overflow-hidden">
        <div className="p-6 border-b border-white/50">
          <h2 className="text-xl font-semibold text-slate-900">Ganadores</h2>
        </div>

        <div className="divide-y divide-slate-200/50">
          {premios.filter(p => p.numero_ganador).map((premio) => (
            <div key={premio.id} className="p-6 hover:bg-slate-100/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-slate-900">{premio.titulo}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        premio.tipo === 'principal'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-orange-500/20 text-orange-500'
                      }`}
                    >
                      {premio.tipo}
                    </span>
                  </div>

                  <p className="text-2xl font-bold text-slate-900 mb-2">
                    ${premio.valor.toLocaleString()}
                  </p>

                  <div className="inline-flex items-center space-x-2 bg-green-600/20 px-4 py-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">
                      Ganador: #{premio.numero_ganador?.toString().padStart(5, '0')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {premio.publicado ? (
                    <button
                      onClick={() => handlePublishWinner(premio.id, false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                    >
                      Ocultar
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublishWinner(premio.id, true)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white shadow-md rounded-lg transition-colors"
                    >
                      Publicar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {premios.filter(p => p.numero_ganador).length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No hay ganadores establecidos aún
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
