import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Ticket, Calendar, TrendingUp, Gift, Search, Star, Minus, Plus, Trophy, FileText, Shield } from 'lucide-react';
import { PurchaseModal } from '../../components/PurchaseModal';
import { LegalModal } from '../../components/LegalModal';
import { WhatsAppPopup } from '../../components/WhatsAppPopup';
import { InstagramTestimonials } from '../../components/InstagramTestimonials';
import { PRIVACY_POLICY, TERMS_AND_CONDITIONS } from '../../constants/legalContent';

interface EventData {
  evento: {
    id: string;
    nombre: string;
    slug: string;
    imagen_url: string;
    descripcion: string;
    condiciones: string;
    fecha_cierre: string;
    fecha_sorteo: string;
    loteria_referencia: string;
    total_entradas: number;
    precio_por_entrada: number;
    activo: boolean;
    estado: string;
    video_url: string;
    banco_nombre?: string;
    banco_tipo_cuenta?: string;
    banco_numero_cuenta?: string;
    banco_titular?: string;
    banco_documento?: string;
    banco_info_adicional?: string;
    nequi_numero?: string;
    nequi_titular?: string;
    link_whatsapp?: string;
    mensaje_whatsapp?: string;
    telegram_link?: string;
    telegram_mensaje?: string;
    noticias_marquee?: string;
    testimonios?: Array<{type: 'instagram' | 'video'; url: string}>;
  };
  entradas_vendidas: number;
  entradas_restantes: number;
  porcentaje_vendido: number;
  paquetes: Array<{
    id: string;
    cantidad_entradas: number;
    precio_total: number;
    es_mas_popular: boolean;
    url_pago?: string;
  }>;
  premios: Array<{
    id: string;
    tipo: string;
    titulo: string;
    descripcion: string;
    valor: number;
    numero_ganador: number;
  }>;
  numeros_bendecidos?: {
    total: number;
    disponibles: number;
    total_en_premios: number;
    lista: Array<{
      numero_entrada: number;
      premio_valor: number;
      estado: string;
      correo_comprador: string | null;
      nombre_comprador: string | null;
      bloqueada: boolean;
      premio_especie_activo: boolean;
      premio_especie_descripcion: string | null;
      premio_especie_imagen_url: string | null;
    }>;
  };
}

export function EventLanding() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EventData | null>(null);
  const [error, setError] = useState('');

  const tabFromUrl = searchParams.get('tab');
  const initialTab = (tabFromUrl === 'consultar' ? 'consultar' : 'comprar') as 'comprar' | 'consultar';
  const [activeTab, setActiveTab] = useState<'comprar' | 'consultar'>(initialTab);

  const [quantity, setQuantity] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<{id: string; cantidad_entradas: number; precio_total: number; url_pago?: string} | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const [lookupType, setLookupType] = useState<'email' | 'documento'>('email');
  const [lookupValue, setLookupValue] = useState('');
  const [lookupResults, setLookupResults] = useState<any>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [slug]);

  const loadEventData = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-event-public?slug=${slug}`
      );

      if (!response.ok) {
        throw new Error('Evento no encontrado');
      }

      const eventData = await response.json();
      console.log('Event Data:', eventData);
      console.log('Numeros Bendecidos:', eventData.numeros_bendecidos);
      setData(eventData);
    } catch (err) {
      setError('Evento no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookingUp(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const params = new URLSearchParams({
        evento_id: data!.evento.id,
        [lookupType]: lookupValue,
      });

      const response = await fetch(
        `${supabaseUrl}/functions/v1/lookup-entries?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${anonKey}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setLookupResults(result);
      } else {
        alert(result.error || 'No se encontraron boletas');
      }
    } catch (err) {
      alert('Error al buscar boletas');
    } finally {
      setLookingUp(false);
    }
  };

  const handlePackageSelect = (paquete: {id: string; cantidad_entradas: number; precio_total: number; url_pago?: string}) => {
    setQuantity(paquete.cantidad_entradas);
    setSelectedPackage(paquete);
    setShowPurchaseModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Evento no encontrado</h1>
          <p className="text-gray-400">El evento que buscas no existe o no está disponible</p>
        </div>
      </div>
    );
  }

  const { evento, entradas_vendidas, entradas_restantes, porcentaje_vendido, paquetes, premios, numeros_bendecidos } = data;

  const marqueeMessages = evento.noticias_marquee ? evento.noticias_marquee.split('|').map(m => m.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          {/* Mobile Layout */}
          <div className="sm:hidden">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-green-400 via-green-300 to-green-500 p-3 rounded-3xl shadow-[0_0_20px_rgba(34,197,94,0.6)]">
                <img
                  src="/Diseno_sin_titulo.png"
                  alt="DolaritoGanador.com"
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">{evento.nombre}</h1>
              <button
                onClick={() => navigate(`/evento/${slug}/mi-boleta`)}
                className="inline-flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors text-sm font-medium"
              >
                <Ticket className="w-4 h-4" />
                <span>Ver mi boleta</span>
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-start justify-between mb-6">
            <div className="flex-shrink-0 bg-gradient-to-br from-green-400 via-green-300 to-green-500 p-3 rounded-3xl shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:shadow-[0_0_30px_rgba(34,197,94,0.8)] transition-shadow">
              <img
                src="/Diseno_sin_titulo.png"
                alt="DolaritoGanador.com"
                className="h-24 w-auto object-contain"
              />
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">{evento.nombre}</h1>
              <button
                onClick={() => navigate(`/evento/${slug}/mi-boleta`)}
                className="inline-flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors text-sm font-medium"
              >
                <Ticket className="w-4 h-4" />
                <span>Ver mi boleta</span>
              </button>
            </div>
            <div className="flex-shrink-0 w-24"></div>
          </div>

          {marqueeMessages.length > 0 && (
            <div className="mb-4 bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg overflow-hidden relative">
              <div className="animate-marquee whitespace-nowrap inline-block">
                {marqueeMessages.map((msg, i) => (
                  <span key={i} className="mx-8">{msg}</span>
                ))}
                {marqueeMessages.map((msg, i) => (
                  <span key={`repeat-${i}`} className="mx-8">{msg}</span>
                ))}
              </div>
            </div>
          )}

          <img
            src={evento.imagen_url}
            alt={evento.nombre}
            className="w-full h-64 sm:h-96 object-cover rounded-2xl shadow-2xl"
          />

          {evento.descripcion && (
            <div className="mt-6 bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed text-center">
                {evento.descripcion}
              </p>
            </div>
          )}
        </div>

        <div className="mb-8 flex justify-center">
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700 w-full max-w-md">
            <div className="flex items-center justify-center mb-2">
              <span className="text-gray-300 font-semibold text-lg">% de Boletas Vendidas</span>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${porcentaje_vendido}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mb-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border-2 border-blue-500/30 text-center">
          <p className="text-gray-300 text-lg font-semibold mb-2">VALOR</p>
          <p className="text-5xl sm:text-6xl font-bold text-white mb-3">
            ${evento.precio_por_entrada.toLocaleString()} <span className="text-2xl text-gray-400">USD</span>
          </p>
          {evento.loteria_referencia && (
            <p className="text-gray-400 text-sm">
              Sorteo en vivo por: {evento.loteria_referencia}
            </p>
          )}
        </div>

        <div className="mb-8 text-center">
          <div className="flex justify-center text-gray-300">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span>
                  {evento.fecha_sorteo ? (
                    <>Sorteo: {new Date(evento.fecha_sorteo).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}</>
                  ) : (
                    <>El sorteo se realizará una vez se haya completado la venta total de números</>
                  )}
                </span>
              </div>
              {!evento.fecha_sorteo && porcentaje_vendido < 100 && (
                <p className="text-sm text-gray-400 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2">
                  El sorteo se realizará cuando la barra de progreso llegue al 100%
                </p>
              )}
            </div>
          </div>
        </div>

        {evento.link_whatsapp && (
          <div className="mb-8 bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 rounded-2xl p-8 shadow-2xl animate-pulse-subtle border-4 border-green-300/50">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white rounded-full p-4 shadow-xl">
                <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 text-center drop-shadow-lg">
              🎁 ¡Únete al Grupo Exclusivo! 🎉
            </h2>
            <p className="text-xl text-white font-semibold text-center mb-6 drop-shadow">
              {evento.mensaje_whatsapp || '⭐ Premios extras, eventos gratis y mucho más. ¡Actualizaciones exclusivas!'}
            </p>
            <div className="flex justify-center">
              <a
                href={evento.link_whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-100 text-green-600 font-black py-4 px-6 sm:px-10 rounded-full transition-all inline-flex items-center space-x-2 shadow-2xl text-base sm:text-lg transform hover:scale-105 whitespace-nowrap"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-sm sm:text-base">¡Entrar al Grupo Ahora! 🚀</span>
              </a>
            </div>
          </div>
        )}

        {evento.telegram_link && evento.telegram_mensaje && (
          <div className="mb-8 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-8 shadow-2xl animate-pulse-subtle border-4 border-blue-300/50">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white rounded-full p-4 shadow-xl">
                <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 text-center drop-shadow-lg">
              🎁 ¡Únete al Canal de Telegram! 🎉
            </h2>
            <p className="text-xl text-white font-semibold text-center mb-6 drop-shadow">
              {evento.telegram_mensaje}
            </p>
            <div className="flex justify-center">
              <a
                href={evento.telegram_link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-100 text-blue-600 font-black py-4 px-6 sm:px-10 rounded-full transition-all inline-flex items-center space-x-2 shadow-2xl text-base sm:text-lg transform hover:scale-105 whitespace-nowrap"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-sm sm:text-base">¡Unirme al Canal Ahora! 🚀</span>
              </a>
            </div>
          </div>
        )}

        {numeros_bendecidos && numeros_bendecidos.lista && numeros_bendecidos.lista.length > 0 && (
          <div className="mb-8 bg-gray-800/40 backdrop-blur-sm border-2 border-gray-700/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
              <Trophy className="w-7 h-7 mr-2 text-yellow-400" />
              Entradas Premiadas
            </h2>
            <p className="text-gray-300 mb-6 text-center text-sm">
              ¡Obtén boletas adicionales gratis! Compra ahora y podrías ganar
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {numeros_bendecidos.lista.map((numero) => {
                const isVendido = numero.correo_comprador !== null;

                return (
                  <div
                    key={numero.numero_entrada}
                    className="relative bg-white rounded-2xl overflow-hidden shadow-lg"
                  >
                    <div className="absolute top-3 left-3 bg-red-500 text-white rounded-full w-14 h-14 flex items-center justify-center z-10 shadow-lg">
                      <span className="text-xs font-bold leading-tight text-center">
                        #{numero.numero_entrada}
                      </span>
                    </div>

                    {!isVendido && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                        DISPONIBLE
                      </div>
                    )}

                    <div className="pt-8 pb-4 flex items-center justify-center bg-white" style={{ minHeight: '200px' }}>
                      <img
                        src="/WhatsApp_Image_2026-02-15_at_9.22.41_PM.jpeg"
                        alt="Bolsa de dinero"
                        className="w-40 h-40 object-contain drop-shadow-2xl"
                      />
                    </div>

                    <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-4 border-t-2 border-gray-200">
                      <p className="text-center font-bold text-gray-800 text-sm mb-1">
                        {Math.floor(numero.premio_valor)} {Math.floor(numero.premio_valor) === 1 ? 'NÚMERO' : 'NÚMEROS'}
                      </p>

                      {numero.premio_especie_activo && numero.premio_especie_descripcion && (
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Gift className="w-3 h-3 text-purple-600" />
                            <p className="text-xs font-semibold text-purple-600">
                              PREMIO ADICIONAL
                            </p>
                          </div>
                          <p className="text-xs text-gray-700 font-medium text-center">
                            {numero.premio_especie_descripcion}
                          </p>
                        </div>
                      )}

                      {isVendido ? (
                        <div className="text-center mt-2">
                          <p className="text-xs text-yellow-600 font-semibold flex items-center justify-center gap-1">
                            <span>🏆</span> GANADOR
                          </p>
                          <p className="text-xs text-gray-600 mt-1 font-medium truncate">
                            {numero.nombre_comprador || 'Anónimo'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-center text-xs text-green-600 font-semibold mt-2">
                          ¡Puede ser tuyo!
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('comprar')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'comprar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Comprar Boletas
          </button>
          <button
            onClick={() => setActiveTab('consultar')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'consultar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Consultar Mis Boletas
          </button>
        </div>

        {activeTab === 'comprar' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-8 sm:p-12 border-4 border-blue-400/50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="inline-block bg-yellow-400 text-gray-900 px-6 py-2 rounded-full font-black text-sm mb-4 animate-bounce">
                    🔥 OFERTA LIMITADA
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 drop-shadow-lg">
                    💰 ¡Asegura Tu Suerte Ahora! 🎯
                  </h2>
                  <p className="text-xl text-blue-200 font-semibold">
                    Cuantas más boletas, más oportunidades de ganar
                  </p>
                </div>

                {paquetes && paquetes.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                      <Gift className="w-8 h-8 text-yellow-400" />
                      Paquetes Especiales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {paquetes.map((paquete) => (
                        <div
                          key={paquete.id}
                          className={`bg-white rounded-2xl p-6 border-4 ${
                            paquete.es_mas_popular ? 'border-yellow-400 shadow-2xl transform scale-105' : 'border-blue-200'
                          } hover:border-yellow-300 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer relative`}
                          onClick={() => handlePackageSelect(paquete)}
                        >
                          {paquete.es_mas_popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs sm:text-sm font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg whitespace-nowrap">
                              ⭐ MÁS POPULAR
                            </div>
                          )}
                          <div className="text-center">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-4 mb-4">
                              <p className="text-5xl font-black mb-1">
                                {paquete.cantidad_entradas}
                              </p>
                              <p className="text-sm font-semibold uppercase tracking-wide">Boletas</p>
                            </div>
                            <p className="text-4xl font-black text-gray-900 mb-2">
                              ${paquete.precio_total.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                              ${(paquete.precio_total / paquete.cantidad_entradas).toLocaleString()} por entrada
                            </p>
                            <div className="bg-green-100 text-green-800 font-bold py-2 px-4 rounded-lg text-sm">
                              ¡Comprar Ahora!
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {evento.condiciones && (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border-2 border-white/20">
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">
                      ¿Cómo Participar?
                    </h3>
                    <div className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap">
                      {evento.condiciones}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {activeTab === 'consultar' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Search className="w-6 h-6 mr-2" />
              Consultar Mis Boletas
            </h2>
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buscar por
                </label>
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={lookupType === 'email'}
                      onChange={() => setLookupType('email')}
                      className="text-blue-600"
                    />
                    <span className="text-gray-300">Correo Electrónico</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={lookupType === 'documento'}
                      onChange={() => setLookupType('documento')}
                      className="text-blue-600"
                    />
                    <span className="text-gray-300">Número de Documento</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {lookupType === 'email' ? 'Correo Electrónico' : 'Número de Documento'}
                </label>
                <input
                  type={lookupType === 'email' ? 'email' : 'text'}
                  value={lookupValue}
                  onChange={(e) => setLookupValue(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={lookupType === 'email' ? 'tu@correo.com' : '1234567890'}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={lookingUp}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {lookingUp ? 'Buscando...' : 'Buscar Mis Entradas'}
              </button>
            </form>

            {lookupResults && (
              <div className="mt-6 space-y-4">
                {lookupResults.compras && lookupResults.compras.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Tus Compras ({lookupResults.compras.length})
                    </h3>
                    {lookupResults.compras.map((compra: any) => (
                      <div
                        key={compra.id}
                        className="bg-gray-900 rounded-lg p-4 border border-gray-700 mb-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              compra.estado === 'aprobada'
                                ? 'bg-green-500/20 text-green-400'
                                : compra.estado === 'pendiente'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {compra.estado === 'aprobada'
                              ? 'Aprobada'
                              : compra.estado === 'pendiente'
                              ? 'Pendiente'
                              : 'Rechazada'}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {new Date(compra.created_at).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-400">
                            <span>Cantidad de boletas:</span>
                            <span className="text-white font-semibold">
                              {compra.cantidad_entradas}
                            </span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Total pagado:</span>
                            <span className="text-white font-semibold">
                              ${compra.monto_total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {compra.boletas && compra.boletas.length > 0 && (
                          <div className="mt-4">
                            <p className="text-gray-400 text-sm mb-2">Tus números:</p>
                            <div className="flex flex-wrap gap-2">
                              {compra.boletas.map((entrada: any) => (
                                <span
                                  key={entrada.id}
                                  className={`px-3 py-1 rounded-lg font-mono text-sm font-semibold ${
                                    entrada.es_bendecida
                                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                      : 'bg-blue-500/20 text-blue-400'
                                  }`}
                                >
                                  #{entrada.numero_entrada.toString().padStart(5, '0')}
                                  {entrada.es_bendecida && ' ⭐'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>No se encontraron compras</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {evento?.testimonios && evento.testimonios.length > 0 && (
        <InstagramTestimonials testimonios={evento.testimonios} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setShowPrivacyPolicy(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
            >
              <Shield className="w-5 h-5" />
              <span>Política de Privacidad</span>
            </button>
            <button
              onClick={() => setShowTermsAndConditions(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
            >
              <FileText className="w-5 h-5" />
              <span>Términos y Condiciones</span>
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <div className="flex justify-center mb-4">
              <img
                src="/Diseno_sin_titulo.png"
                alt="DolaritoGanador.com"
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} <span className="font-semibold text-gray-400">DOLARITOGANADOR.COM</span>
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false);
          loadEventData();
        }}
        eventData={evento}
        quantity={quantity}
        packageData={selectedPackage}
      />

      <LegalModal
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
        title="Política de Privacidad"
        content={PRIVACY_POLICY}
      />

      <LegalModal
        isOpen={showTermsAndConditions}
        onClose={() => setShowTermsAndConditions(false)}
        title="Términos y Condiciones de Uso"
        content={TERMS_AND_CONDITIONS}
      />

      <WhatsAppPopup
        phoneNumber="+593983172871"
        eventName={evento.nombre}
      />
    </div>
  );
}
