import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Loader2, Gift, CreditCard, Ticket, Trophy, Package, Plus, X, Instagram, Video, Upload } from 'lucide-react';
import { ImageUpload } from '../../components/ImageUpload';
import { toast } from 'sonner';

interface Evento {
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
  mensaje_whatsapp: string;
  link_whatsapp: string;
  noticias_marquee: string;
  testimonios: Array<{type: 'instagram' | 'video'; url: string}>;
  banco_nombre: string;
  banco_tipo_cuenta: string;
  banco_numero_cuenta: string;
  banco_titular: string;
  banco_documento: string;
  banco_info_adicional: string;
  nequi_numero: string;
  nequi_titular: string;
  url_pasarela: string;
  instrucciones_pago: string;
  telegram_link: string;
  telegram_mensaje: string;
}

export function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [usarFechaSorteo, setUsarFechaSorteo] = useState(false);
  const [newTestimonioUrl, setNewTestimonioUrl] = useState('');
  const [testimonioType, setTestimonioType] = useState<'instagram' | 'video'>('instagram');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvento();
    }
  }, [id]);

  const loadEvento = async () => {
    try {
      const { data } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setEvento({
          ...data,
          fecha_cierre: data.fecha_cierre ? data.fecha_cierre.slice(0, 16) : '',
          fecha_sorteo: data.fecha_sorteo ? data.fecha_sorteo.slice(0, 16) : '',
          condiciones: data.condiciones || '',
          telegram_link: data.telegram_link || '',
          telegram_mensaje: data.telegram_mensaje || '',
        });
        setUsarFechaSorteo(!!data.fecha_sorteo);
      }
    } catch (error) {
      console.error('Error loading evento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestimonio = () => {
    if (!newTestimonioUrl.trim() || !evento) return;

    const currentTestimonios = evento.testimonios || [];
    setEvento({
      ...evento,
      testimonios: [...currentTestimonios, { type: testimonioType, url: newTestimonioUrl.trim() }]
    });
    setNewTestimonioUrl('');
  };

  const handleRemoveTestimonio = (index: number) => {
    if (!evento) return;

    const currentTestimonios = evento.testimonios || [];
    setEvento({
      ...evento,
      testimonios: currentTestimonios.filter((_, i) => i !== index)
    });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !evento) return;

    if (file.size > 50 * 1024 * 1024) {
      toast('El archivo es muy grande. Máximo 50MB.');
      return;
    }

    setUploadingVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${evento.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('testimonials-videos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('testimonials-videos')
        .getPublicUrl(data.path);

      const currentTestimonios = evento.testimonios || [];
      setEvento({
        ...evento,
        testimonios: [...currentTestimonios, { type: 'video', url: publicUrl }]
      });

      e.target.value = '';
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Error al subir el video. Intenta de nuevo.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evento) return;

    setSaving(true);
    try {
      const { data: currentEvento } = await supabase
        .from('eventos')
        .select('total_entradas')
        .eq('id', id)
        .single();

      const oldTotal = currentEvento?.total_entradas || 0;
      const newTotal = evento.total_entradas;

      if (newTotal > oldTotal) {
        const boletas = [];
        const batchSize = 1000;

        for (let i = oldTotal + 1; i <= newTotal; i++) {
          boletas.push({
            evento_id: id,
            numero_entrada: i,
            estado: 'disponible',
            es_bendecida: false,
            bloqueada: false,
          });

          if (boletas.length === batchSize || i === newTotal) {
            await supabase.from('entradas').insert(boletas);
            boletas.length = 0;
          }
        }
      } else if (newTotal < oldTotal) {
        const { data: boletasOcupadas } = await supabase
          .from('entradas')
          .select('numero_entrada')
          .eq('evento_id', id)
          .gt('numero_entrada', newTotal)
          .neq('estado', 'disponible');

        if (boletasOcupadas && boletasOcupadas.length > 0) {
          toast.error(`No se puede reducir el total. Hay ${boletasOcupadas.length} boletas vendidas/reservadas con números mayores a ${newTotal}`);
          setSaving(false);
          return;
        }

        await supabase
          .from('entradas')
          .delete()
          .eq('evento_id', id)
          .gt('numero_entrada', newTotal);
      }

      await supabase
        .from('eventos')
        .update({
          nombre: evento.nombre,
          imagen_url: evento.imagen_url,
          descripcion: evento.descripcion,
          condiciones: evento.condiciones,
          fecha_cierre: evento.fecha_cierre || null,
          fecha_sorteo: usarFechaSorteo && evento.fecha_sorteo ? evento.fecha_sorteo : null,
          loteria_referencia: evento.loteria_referencia,
          total_entradas: evento.total_entradas,
          precio_por_entrada: evento.precio_por_entrada,
          activo: evento.activo,
          estado: evento.estado,
          video_url: evento.video_url,
          mensaje_whatsapp: evento.mensaje_whatsapp,
          link_whatsapp: evento.link_whatsapp,
          telegram_link: evento.telegram_link,
          telegram_mensaje: evento.telegram_mensaje,
          noticias_marquee: evento.noticias_marquee,
          testimonios: evento.testimonios || [],
          banco_nombre: evento.banco_nombre,
          banco_tipo_cuenta: evento.banco_tipo_cuenta,
          banco_numero_cuenta: evento.banco_numero_cuenta,
          banco_titular: evento.banco_titular,
          banco_documento: evento.banco_documento,
          banco_info_adicional: evento.banco_info_adicional,
          nequi_numero: evento.nequi_numero,
          nequi_titular: evento.nequi_titular,
          url_pasarela: evento.url_pasarela,
          instrucciones_pago: evento.instrucciones_pago,
        })
        .eq('id', id);

      navigate('/admin/eventos');
    } catch (error) {
      console.error('Error updating evento:', error);
      toast.error('Error al actualizar el evento');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !evento) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/eventos')}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">{evento.nombre}</h1>
          <p className="text-gray-400 mt-1">/evento/{evento.slug}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={`/admin/eventos/${id}/paquetes`}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Configurar</p>
              <p className="text-lg font-semibold text-white">Paquetes</p>
            </div>
          </div>
        </Link>

        <Link
          to={`/admin/eventos/${id}/bendecidos`}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Números</p>
              <p className="text-lg font-semibold text-white">Bendecidos</p>
            </div>
          </div>
        </Link>

        <Link
          to={`/admin/eventos/${id}/boletas`}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Gestionar</p>
              <p className="text-lg font-semibold text-white">Boletas</p>
            </div>
          </div>
        </Link>

        <Link
          to={`/admin/eventos/${id}/compras`}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Gestionar</p>
              <p className="text-lg font-semibold text-white">Compras</p>
            </div>
          </div>
        </Link>

        <Link
          to={`/admin/eventos/${id}/premios`}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Gestionar</p>
              <p className="text-lg font-semibold text-white">Premios</p>
            </div>
          </div>
        </Link>

        <Link
          to={`/admin/eventos/${id}/ganadores`}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Gestionar</p>
              <p className="text-lg font-semibold text-white">Ganadores</p>
            </div>
          </div>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-8 space-y-6">
        <h2 className="text-xl font-semibold text-white">Configuración del Evento</h2>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nombre del Evento *
          </label>
          <input
            type="text"
            value={evento.nombre}
            onChange={(e) => setEvento({ ...evento, nombre: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Imagen del Evento
          </label>
          <ImageUpload
            value={evento.imagen_url}
            onChange={(url) => setEvento({ ...evento, imagen_url: url || '' })}
            disabled={saving}
            recommendedSize="1920 x 600 píxeles"
            description="Esta imagen se mostrará como banner principal en la página del evento. Tamaño recomendado: 1920x600px (formato panorámico)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descripción
          </label>
          <textarea
            value={evento.descripcion || ''}
            onChange={(e) => setEvento({ ...evento, descripcion: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Condiciones e Instrucciones
          </label>
          <textarea
            value={evento.condiciones || ''}
            onChange={(e) => setEvento({ ...evento, condiciones: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none"
            placeholder="Ej: ¿Cómo participar? 1. Selecciona el paquete de números que desees... 2. Serás redirigido a una página donde seleccionarás tu forma de pago..."
          />
          <p className="text-sm text-gray-400 mt-2">
            Este texto se mostrará en la página del evento explicando cómo participar y las condiciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha de Cierre
            </label>
            <input
              type="datetime-local"
              value={evento.fecha_cierre || ''}
              onChange={(e) => setEvento({ ...evento, fecha_cierre: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-400 mt-2">
              Opcional. Si no se establece, el evento estará activo hasta que se complete la venta.
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                id="usar_fecha_sorteo"
                checked={usarFechaSorteo}
                onChange={(e) => {
                  setUsarFechaSorteo(e.target.checked);
                  if (!e.target.checked) {
                    setEvento({ ...evento, fecha_sorteo: '' });
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
              />
              <label htmlFor="usar_fecha_sorteo" className="text-sm font-medium text-gray-300">
                Establecer fecha específica del sorteo
              </label>
            </div>
            {usarFechaSorteo ? (
              <>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha del Sorteo
                </label>
                <input
                  type="datetime-local"
                  value={evento.fecha_sorteo || ''}
                  onChange={(e) => setEvento({ ...evento, fecha_sorteo: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            ) : (
              <p className="text-sm text-gray-400 bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                El sorteo se realizará una vez se haya completado la venta total de números
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Canal de Transmisión del Sorteo
          </label>
          <input
            type="text"
            value={evento.loteria_referencia || ''}
            onChange={(e) => setEvento({ ...evento, loteria_referencia: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: https://kick.com/misorteo"
          />
          <p className="text-sm text-gray-500 mt-1">
            El ganador será determinado en sorteo en vivo por este canal
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            URL del Video (YouTube, Vimeo, etc)
          </label>
          <input
            type="url"
            value={evento.video_url || ''}
            onChange={(e) => setEvento({ ...evento, video_url: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://youtube.com/..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total de Boletas *
            </label>
            <select
              value={evento.total_entradas}
              onChange={(e) => setEvento({ ...evento, total_entradas: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={1000}>1,000 boletas</option>
              <option value={5000}>5,000 boletas</option>
              <option value={10000}>10,000 boletas</option>
              <option value={20000}>20,000 boletas</option>
              <option value={50000}>50,000 boletas</option>
              <option value={99999}>99,999 boletas</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Al aumentar: se generarán nuevas boletas. Al reducir: se eliminarán boletas disponibles
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Precio por Entrada *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={evento.precio_por_entrada}
              onChange={(e) => setEvento({ ...evento, precio_por_entrada: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estado *
            </label>
            <select
              value={evento.estado}
              onChange={(e) => setEvento({ ...evento, estado: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="activo">Activo</option>
              <option value="cerrado">Cerrado</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={evento.activo}
                onChange={(e) => setEvento({ ...evento, activo: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-300">
                Evento activo (visible públicamente)
              </span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-white">Marketing y Promoción</h3>
          <p className="text-sm text-gray-400">Configura elementos para hacer tu landing más atractiva</p>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Noticias en Movimiento (Marquee)
            </label>
            <input
              type="text"
              value={evento.noticias_marquee || ''}
              onChange={(e) => setEvento({ ...evento, noticias_marquee: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: ¡Quedan pocas boletas! | ¡No te quedes sin tu número! | ¡Gana hasta 2 millones!"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separa múltiples mensajes con | (barra vertical). Se mostrarán deslizándose arriba de la imagen.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mensaje de WhatsApp
            </label>
            <textarea
              value={evento.mensaje_whatsapp || ''}
              onChange={(e) => setEvento({ ...evento, mensaje_whatsapp: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="Ej: Premios extras, eventos gratis y mucho más. Actualizaciones exclusivas!"
            />
            <p className="text-sm text-gray-500 mt-1">
              Mensaje que invita a los usuarios a unirse al grupo de WhatsApp.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Link de WhatsApp
            </label>
            <input
              type="url"
              value={evento.link_whatsapp || ''}
              onChange={(e) => setEvento({ ...evento, link_whatsapp: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://chat.whatsapp.com/..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Link de invitación al grupo de WhatsApp. Deja vacío para no mostrar la sección.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Telegram (Opcional)</h3>
          <p className="text-sm text-gray-400">
            Si prefieres usar Telegram en lugar de WhatsApp, completa estos campos. Se mostrará solo si ambos campos están llenos.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mensaje de Telegram
            </label>
            <textarea
              value={evento.telegram_mensaje || ''}
              onChange={(e) => setEvento({ ...evento, telegram_mensaje: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="Ej: Únete a nuestro grupo de Telegram para actualizaciones exclusivas y premios especiales!"
            />
            <p className="text-sm text-gray-500 mt-1">
              Mensaje que invita a los usuarios a unirse al grupo de Telegram.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Link de Telegram
            </label>
            <input
              type="url"
              value={evento.telegram_link || ''}
              onChange={(e) => setEvento({ ...evento, telegram_link: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://t.me/..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Link de invitación al grupo de Telegram. Deja vacío para no mostrar la sección.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Testimonios y Redes Sociales</h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Video className="w-5 h-5" />
              Testimonios (Videos & Instagram)
            </label>
            <p className="text-sm text-gray-400 mb-3">
              Sube videos directamente o agrega URLs de Instagram. Los videos se reproducen en la página sin sacar al usuario. ¡Ideal para generar confianza!
            </p>

            <div className="space-y-3">
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setTestimonioType('video')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    testimonioType === 'video'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Video className="w-5 h-5" />
                  Subir Video
                </button>
                <button
                  type="button"
                  onClick={() => setTestimonioType('instagram')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    testimonioType === 'instagram'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Instagram className="w-5 h-5" />
                  URL Instagram
                </button>
              </div>

              {testimonioType === 'video' ? (
                <div>
                  <label className="block w-full">
                    <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      uploadingVideo
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-900'
                    }`}>
                      {uploadingVideo ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          <p className="text-sm text-gray-400">Subiendo video...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-gray-500" />
                          <p className="text-sm text-gray-300 font-medium">Haz clic para subir un video</p>
                          <p className="text-xs text-gray-500">MP4, WebM o MOV • Máximo 50MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newTestimonioUrl}
                    onChange={(e) => setNewTestimonioUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTestimonio())}
                    className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="https://www.instagram.com/p/ABC123/"
                  />
                  <button
                    type="button"
                    onClick={handleAddTestimonio}
                    className="px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Agregar
                  </button>
                </div>
              )}

              {evento.testimonios && evento.testimonios.length > 0 && (
                <div className="space-y-2">
                  {evento.testimonios.map((testimonio, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-gray-900 border border-gray-700 rounded-lg"
                    >
                      {testimonio.type === 'video' ? (
                        <Video className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      ) : (
                        <Instagram className="w-4 h-4 text-pink-400 flex-shrink-0" />
                      )}
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-800 rounded">
                        {testimonio.type}
                      </span>
                      <span className="text-sm text-gray-300 flex-1 truncate">{testimonio.url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTestimonio(index)}
                        className="p-1 hover:bg-gray-800 rounded text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500">
                {testimonioType === 'video'
                  ? 'Los videos se reproducen directamente en el landing sin enlaces externos'
                  : 'Ejemplo: https://www.instagram.com/p/ABC123/ o https://www.instagram.com/reel/XYZ789/'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-white">Métodos de Pago</h3>
          <p className="text-sm text-gray-400">Configura las cuentas donde los clientes pueden realizar pagos</p>

          <div className="bg-gray-900 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-white">Transferencia Bancaria</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Banco
                </label>
                <input
                  type="text"
                  value={evento.banco_nombre || ''}
                  onChange={(e) => setEvento({ ...evento, banco_nombre: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Ej: Bancolombia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Cuenta
                </label>
                <select
                  value={evento.banco_tipo_cuenta || ''}
                  onChange={(e) => setEvento({ ...evento, banco_tipo_cuenta: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  value={evento.banco_numero_cuenta || ''}
                  onChange={(e) => setEvento({ ...evento, banco_numero_cuenta: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Ej: 12345678900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={evento.banco_titular || ''}
                  onChange={(e) => setEvento({ ...evento, banco_titular: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Documento del Titular
                </label>
                <input
                  type="text"
                  value={evento.banco_documento || ''}
                  onChange={(e) => setEvento({ ...evento, banco_documento: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Ej: 1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Información Adicional
                </label>
                <input
                  type="text"
                  value={evento.banco_info_adicional || ''}
                  onChange={(e) => setEvento({ ...evento, banco_info_adicional: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Ej: Por favor incluir referencia"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-white">Nequi</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Número de Nequi
                </label>
                <input
                  type="text"
                  value={evento.nequi_numero || ''}
                  onChange={(e) => setEvento({ ...evento, nequi_numero: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Ej: 3001234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titular de Nequi
                </label>
                <input
                  type="text"
                  value={evento.nequi_titular || ''}
                  onChange={(e) => setEvento({ ...evento, nequi_titular: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-white">Pasarela de Pago</h4>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL de Pasarela de Pago
              </label>
              <input
                type="url"
                value={evento.url_pasarela || ''}
                onChange={(e) => setEvento({ ...evento, url_pasarela: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Ej: https://checkout.wompi.co/..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Si proporcionas una URL, se mostrará un botón para que los usuarios paguen directamente en la pasarela.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Instrucciones de Pago Adicionales
            </label>
            <textarea
              value={evento.instrucciones_pago || ''}
              onChange={(e) => setEvento({ ...evento, instrucciones_pago: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="Ej: Por favor incluye tu número de boleta en la descripción de la transferencia."
            />
            <p className="text-sm text-gray-500 mt-1">
              Instrucciones adicionales que verán los compradores al momento de realizar el pago.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/admin/eventos')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Cambios</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
