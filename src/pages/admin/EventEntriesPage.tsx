import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Search, Filter, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Entrada {
  id: string;
  numero_entrada: number;
  estado: string;
  correo_comprador: string | null;
  nombre_comprador: string | null;
  documento: string | null;
  es_bendecida: boolean;
  bloqueada: boolean;
}

export function EventEntriesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [boletas, setBoletas] = useState<Entrada[]>([]);
  const [searchType, setSearchType] = useState<'numero' | 'rango' | 'email' | 'documento'>('numero');
  const [searchValue, setSearchValue] = useState('');
  const [rangoInicio, setRangoInicio] = useState('');
  const [rangoFin, setRangoFin] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [stats, setStats] = useState({
    disponibles: 0,
    reservadas: 0,
    pagadas: 0,
    premiadas: 0,
    bendecidas: 0,
  });
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadStats();
  }, [id]);

  const loadStats = async () => {
    try {
      const [{ count: disponibles }, { count: reservadas }, { count: pagadas }, { count: premiadas }, { count: bendecidas }] = await Promise.all([
        supabase
          .from('entradas')
          .select('*', { count: 'exact', head: true })
          .eq('evento_id', id)
          .eq('estado', 'disponible'),
        supabase
          .from('entradas')
          .select('*', { count: 'exact', head: true })
          .eq('evento_id', id)
          .eq('estado', 'reservada'),
        supabase
          .from('entradas')
          .select('*', { count: 'exact', head: true })
          .eq('evento_id', id)
          .eq('estado', 'pagada'),
        supabase
          .from('entradas')
          .select('*', { count: 'exact', head: true })
          .eq('evento_id', id)
          .eq('estado', 'premiada'),
        supabase
          .from('entradas')
          .select('*', { count: 'exact', head: true })
          .eq('evento_id', id)
          .eq('es_bendecida', true),
      ]);

      setStats({
        disponibles: disponibles || 0,
        reservadas: reservadas || 0,
        pagadas: pagadas || 0,
        premiadas: premiadas || 0,
        bendecidas: bendecidas || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchValue && searchType !== 'rango') return;
    if (searchType === 'rango' && (!rangoInicio || !rangoFin)) return;

    setSearching(true);
    setHasSearched(true);

    try {
      let query = supabase
        .from('entradas')
        .select('*')
        .eq('evento_id', id);

      if (searchType === 'numero') {
        const numeroEntrada = parseInt(searchValue);
        if (!isNaN(numeroEntrada)) {
          query = query.eq('numero_entrada', numeroEntrada);
        }
      } else if (searchType === 'rango') {
        const inicio = parseInt(rangoInicio);
        const fin = parseInt(rangoFin);
        if (!isNaN(inicio) && !isNaN(fin)) {
          query = query.gte('numero_entrada', inicio).lte('numero_entrada', fin);
        }
      } else if (searchType === 'email') {
        query = query.ilike('correo_comprador', `%${searchValue}%`);
      } else if (searchType === 'documento') {
        query = query.ilike('documento', `%${searchValue}%`);
      }

      if (estadoFilter !== 'todos') {
        if (estadoFilter === 'bendecida') {
          query = query.eq('es_bendecida', true);
        } else {
          query = query.eq('estado', estadoFilter);
        }
      }

      query = query.order('numero_entrada', { ascending: true }).limit(500);

      const { data, error } = await query;

      if (error) throw error;

      setBoletas(data || []);
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Error al buscar boletas');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
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
          <h1 className="text-3xl font-bold text-white">Gestión de Boletas</h1>
          <p className="text-gray-400 mt-1">Administra todas las boletas del evento</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Disponibles</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.disponibles.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Reservadas</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.reservadas.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Pagadas</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.pagadas.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Premiadas</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.premiadas.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Bendecidas</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{stats.bendecidas.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-medium mb-1">Búsqueda Inteligente</p>
          <p className="text-blue-300/80">
            Este evento tiene miles de boletas. Usa las opciones de búsqueda para encontrar boletas específicas por número, rango, email o documento.
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSearchType('numero')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchType === 'numero'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Número Específico
            </button>
            <button
              onClick={() => setSearchType('rango')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchType === 'rango'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Rango de Números
            </button>
            <button
              onClick={() => setSearchType('email')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchType === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setSearchType('documento')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchType === 'documento'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Documento
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {searchType === 'rango' ? (
              <>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={rangoInicio}
                    onChange={(e) => setRangoInicio(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Número inicial (ej: 1)"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={rangoFin}
                    onChange={(e) => setRangoFin(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Número final (ej: 1000)"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={searchType === 'numero' ? 'number' : 'text'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    searchType === 'numero'
                      ? 'Ingresa el número de entrada (ej: 12345)'
                      : searchType === 'email'
                      ? 'Ingresa el correo del comprador'
                      : 'Ingresa el documento del comprador'
                  }
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="disponible">Disponibles</option>
                <option value="reservada">Reservadas</option>
                <option value="pagada">Pagadas</option>
                <option value="premiada">Premiadas</option>
                <option value="bendecida">Bendecidas</option>
              </select>
            </div>

            <button
              onClick={handleSearch}
              disabled={searching || (!searchValue && searchType !== 'rango') || (searchType === 'rango' && (!rangoInicio || !rangoFin))}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>{searching ? 'Buscando...' : 'Buscar'}</span>
            </button>
          </div>
        </div>

        {!hasSearched && (
          <div className="mt-8 text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              Realiza una búsqueda para ver boletas específicas
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Puedes buscar por número, rango, email o documento del comprador
            </p>
          </div>
        )}

        {hasSearched && boletas.length === 0 && (
          <div className="mt-8 text-center py-12">
            <p className="text-gray-400 text-lg">No se encontraron resultados</p>
            <p className="text-gray-500 text-sm mt-2">
              Intenta con otros criterios de búsqueda
            </p>
          </div>
        )}

        {boletas.length > 0 && (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Entrada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Comprador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Bendecida
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {boletas.map((entrada) => (
                    <tr key={entrada.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-mono font-bold text-lg">
                          #{entrada.numero_entrada.toString().padStart(5, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          entrada.estado === 'disponible'
                            ? 'bg-green-500/20 text-green-400'
                            : entrada.estado === 'reservada'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : entrada.estado === 'pagada'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {entrada.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">
                          {entrada.nombre_comprador || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 text-sm">
                          {entrada.correo_comprador || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 text-sm font-mono">
                          {entrada.documento || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entrada.es_bendecida && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-500/20 text-orange-400">
                            ⭐ Bendecida
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-center text-sm text-gray-400">
              Mostrando {boletas.length.toLocaleString()} resultado{boletas.length !== 1 ? 's' : ''}
              {boletas.length >= 500 && ' (máximo 500 por búsqueda)'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
