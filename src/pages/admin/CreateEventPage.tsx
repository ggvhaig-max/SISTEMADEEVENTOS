import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ImageUpload } from '../../components/ImageUpload';
import { toast } from 'sonner';

export function CreateEventPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usarFechaSorteo, setUsarFechaSorteo] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    condiciones: '',
    imagen_url: '',
    fecha_cierre: '',
    fecha_sorteo: '',
    loteria_referencia: '',
    total_entradas: 10000,
    precio_por_entrada: 0,
    activo: true,
    banco_nombre: '',
    banco_tipo_cuenta: '',
    banco_numero_cuenta: '',
    banco_titular: '',
    banco_documento: '',
    banco_info_adicional: '',
    nequi_numero: '',
    nequi_titular: '',
    mensaje_whatsapp: '',
    link_whatsapp: '',
    telegram_mensaje: '',
    telegram_link: '',
    noticias_marquee: '',
    url_pasarela: '',
    instrucciones_pago: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const slug = formData.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data: evento, error: eventoError } = await supabase
        .from('eventos')
        .insert([{
          ...formData,
          fecha_cierre: formData.fecha_cierre || null,
          fecha_sorteo: usarFechaSorteo && formData.fecha_sorteo ? formData.fecha_sorteo : null,
          slug,
          estado: 'activo',
        }])
        .select()
        .single();

      if (eventoError) throw eventoError;

      const boletas = [];
      const batchSize = 1000;

      for (let i = 1; i <= formData.total_entradas; i++) {
        boletas.push({
          evento_id: evento.id,
          numero_entrada: i,
          estado: 'disponible',
          es_bendecida: false,
          bloqueada: false,
        });

        if (boletas.length === batchSize || i === formData.total_entradas) {
          await supabase.from('entradas').insert(boletas);
          boletas.length = 0;
        }
      }

      navigate('/admin/eventos');
    } catch (error) {
      console.error('Error creating evento:', error);
      toast.error('Error al crear el evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/eventos')}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Crear Evento</h1>
          <p className="text-slate-500 mt-1">Configura un nuevo evento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl border border-white/50 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Nombre del Evento *
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ej: Gana 2 Millones"
            required
          />
          <p className="text-sm text-slate-400 mt-1">
            La URL se generará automáticamente: /evento/{formData.nombre
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') || 'nombre-evento'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Imagen del Evento *
          </label>
          <ImageUpload
            value={formData.imagen_url}
            onChange={(url) => setFormData({ ...formData, imagen_url: url || '' })}
            disabled={loading}
            recommendedSize="1920 x 600 píxeles"
            description="Esta imagen se mostrará como banner principal en la página del evento. Tamaño recomendado: 1920x600px (formato panorámico)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Descripción
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 h-32 resize-none"
            placeholder="Describe el evento..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Condiciones e Instrucciones
          </label>
          <textarea
            value={formData.condiciones}
            onChange={(e) => setFormData({ ...formData, condiciones: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 h-40 resize-none"
            placeholder="Ej: ¿Cómo participar? 1. Selecciona el paquete de números que desees... 2. Serás redirigido a una página donde seleccionarás tu forma de pago..."
          />
          <p className="text-sm text-slate-500 mt-2">
            Este texto se mostrará en la página del evento explicando cómo participar y las condiciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Fecha de Cierre
            </label>
            <input
              type="datetime-local"
              value={formData.fecha_cierre}
              onChange={(e) => setFormData({ ...formData, fecha_cierre: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-sm text-slate-500 mt-2">
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
                    setFormData({ ...formData, fecha_sorteo: '' });
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-slate-50 border-white/50 rounded focus:ring-orange-500"
              />
              <label htmlFor="usar_fecha_sorteo" className="text-sm font-medium text-slate-600">
                Establecer fecha específica del sorteo
              </label>
            </div>
            {usarFechaSorteo ? (
              <>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Fecha del Sorteo
                </label>
                <input
                  type="datetime-local"
                  value={formData.fecha_sorteo}
                  onChange={(e) => setFormData({ ...formData, fecha_sorteo: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </>
            ) : (
              <p className="text-sm text-slate-500 bg-slate-50/50 border border-white/50 rounded-lg p-3">
                El sorteo se realizará una vez se haya completado la venta total de números
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Canal de Transmisión del Sorteo
          </label>
          <input
            type="text"
            value={formData.loteria_referencia}
            onChange={(e) => setFormData({ ...formData, loteria_referencia: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ej: https://kick.com/misorteo"
          />
          <p className="text-sm text-slate-400 mt-1">
            El ganador será determinado en sorteo en vivo por este canal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Total de Boletas *
            </label>
            <select
              value={formData.total_entradas}
              onChange={(e) => setFormData({ ...formData, total_entradas: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value={1000}>1,000 boletas</option>
              <option value={5000}>5,000 boletas</option>
              <option value={10000}>10,000 boletas</option>
              <option value={20000}>20,000 boletas</option>
              <option value={50000}>50,000 boletas</option>
              <option value={99999}>99,999 boletas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Precio por Entrada *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.precio_por_entrada}
              onChange={(e) => setFormData({ ...formData, precio_por_entrada: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="activo"
            checked={formData.activo}
            onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-slate-50 border-white/50 rounded focus:ring-orange-500"
          />
          <label htmlFor="activo" className="text-sm font-medium text-slate-600">
            Activar evento inmediatamente
          </label>
        </div>

        <div className="pt-6 border-t border-white/50 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Marketing y Promoción</h3>
          <p className="text-sm text-slate-500">Configura elementos para hacer tu landing más atractiva</p>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Noticias en Movimiento (Marquee)
            </label>
            <input
              type="text"
              value={formData.noticias_marquee}
              onChange={(e) => setFormData({ ...formData, noticias_marquee: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ej: ¡Quedan pocas boletas! | ¡No te quedes sin tu número! | ¡Gana hasta 2 millones!"
            />
            <p className="text-sm text-slate-400 mt-1">
              Separa múltiples mensajes con | (barra vertical). Se mostrarán deslizándose arriba de la imagen.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Mensaje de WhatsApp
            </label>
            <textarea
              value={formData.mensaje_whatsapp}
              onChange={(e) => setFormData({ ...formData, mensaje_whatsapp: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
              placeholder="Ej: Premios extras, eventos gratis y mucho más. Actualizaciones exclusivas!"
            />
            <p className="text-sm text-slate-400 mt-1">
              Mensaje que invita a los usuarios a unirse al grupo de WhatsApp.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Link de WhatsApp
            </label>
            <input
              type="url"
              value={formData.link_whatsapp}
              onChange={(e) => setFormData({ ...formData, link_whatsapp: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://chat.whatsapp.com/..."
            />
            <p className="text-sm text-slate-400 mt-1">
              Link de invitación al grupo de WhatsApp. Deja vacío para no mostrar la sección.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Telegram (Opcional)</h3>
          <p className="text-sm text-slate-500">
            Si prefieres usar Telegram en lugar de WhatsApp, completa estos campos. Se mostrará solo si ambos campos están llenos.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Mensaje de Telegram
            </label>
            <textarea
              value={formData.telegram_mensaje}
              onChange={(e) => setFormData({ ...formData, telegram_mensaje: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
              placeholder="Ej: Únete a nuestro grupo de Telegram para actualizaciones exclusivas y premios especiales!"
            />
            <p className="text-sm text-slate-400 mt-1">
              Mensaje que invita a los usuarios a unirse al grupo de Telegram.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Link de Telegram
            </label>
            <input
              type="url"
              value={formData.telegram_link}
              onChange={(e) => setFormData({ ...formData, telegram_link: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://t.me/..."
            />
            <p className="text-sm text-slate-400 mt-1">
              Link de invitación al grupo de Telegram. Deja vacío para no mostrar la sección.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/50 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Métodos de Pago</h3>
          <p className="text-sm text-slate-500">Configura las cuentas donde los clientes pueden realizar pagos</p>

          <div className="bg-slate-50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-slate-900">Transferencia Bancaria</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Banco
                </label>
                <input
                  type="text"
                  value={formData.banco_nombre}
                  onChange={(e) => setFormData({ ...formData, banco_nombre: e.target.value })}
                  className="w-full px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900"
                  placeholder="Ej: Bancolombia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Tipo de Cuenta
                </label>
                <select
                  value={formData.banco_tipo_cuenta}
                  onChange={(e) => setFormData({ ...formData, banco_tipo_cuenta: e.target.value })}
                  className="w-full px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  value={formData.banco_numero_cuenta}
                  onChange={(e) => setFormData({ ...formData, banco_numero_cuenta: e.target.value })}
                  className="w-full px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900"
                  placeholder="Ej: 12345678900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={formData.banco_titular}
                  onChange={(e) => setFormData({ ...formData, banco_titular: e.target.value })}
                  className="w-full px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Documento del Titular
                </label>
                <input
                  type="text"
                  value={formData.banco_documento}
                  onChange={(e) => setFormData({ ...formData, banco_documento: e.target.value })}
                  className="w-full px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900"
                  placeholder="Ej: 1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Información Adicional
                </label>
                <input
                  type="text"
                  value={formData.banco_info_adicional}
                  onChange={(e) => setFormData({ ...formData, banco_info_adicional: e.target.value })}
                  className="w-full px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900"
                  placeholder="Ej: Por favor incluir referencia"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-slate-900">Nequi</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Número de Nequi
                </label>
                <input
                  type="text"
                  value={formData.nequi_numero}
                  onChange={(e) => setFormData({ ...formData, nequi_numero: e.target.value })}
                  className="w-full px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900"
                  placeholder="Ej: 3001234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Titular de Nequi
                </label>
                <input
                  type="text"
                  value={formData.nequi_titular}
                  onChange={(e) => setFormData({ ...formData, nequi_titular: e.target.value })}
                  className="w-full px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-slate-900">Pasarela de Pago</h4>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                URL de Pasarela de Pago
              </label>
              <input
                type="url"
                value={formData.url_pasarela}
                onChange={(e) => setFormData({ ...formData, url_pasarela: e.target.value })}
                className="w-full px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border border-white/50 rounded-lg text-slate-900"
                placeholder="Ej: https://checkout.wompi.co/..."
              />
              <p className="text-sm text-slate-400 mt-1">
                Si proporcionas una URL, se mostrará un botón para que los usuarios paguen directamente en la pasarela.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Instrucciones de Pago Adicionales
            </label>
            <textarea
              value={formData.instrucciones_pago}
              onChange={(e) => setFormData({ ...formData, instrucciones_pago: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-white/50 rounded-lg text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
              placeholder="Ej: Por favor incluye tu número de boleta en la descripción de la transferencia."
            />
            <p className="text-sm text-slate-400 mt-1">
              Instrucciones adicionales que verán los compradores al momento de realizar el pago.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 pt-6 border-t border-white/50">
          <button
            type="button"
            onClick={() => navigate('/admin/eventos')}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creando evento y generando boletas...</span>
              </>
            ) : (
              <span>Crear Evento</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
