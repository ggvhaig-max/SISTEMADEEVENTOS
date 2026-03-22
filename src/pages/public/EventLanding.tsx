import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Facebook, FileText, Gift, Instagram, MessageCircle, Search, Shield, Star, Ticket, Trophy, Truck } from 'lucide-react';
import { PurchaseModal } from '../../components/PurchaseModal';
import { LegalModal } from '../../components/LegalModal';
import { WhatsAppPopup } from '../../components/WhatsAppPopup';
import { InstagramTestimonials } from '../../components/InstagramTestimonials';
import { PRIVACY_POLICY, TERMS_AND_CONDITIONS } from '../../constants/legalContent';
import { toast } from 'sonner';

const DEFAULT_WHATSAPP_LINK = 'https://chat.whatsapp.com/FuJjgGkmLSk9cMrZgcfbxc';
const LOGO_URL = 'https://e-contacto.net/wp-content/uploads/2026/03/Logos-HIHHN-4.png';
const SUPPORT_PHONE = '+593983172871';
const fontCondensed = { fontFamily: '"Barlow Condensed", sans-serif' } as const;
const fontOswald = { fontFamily: '"Oswald", sans-serif' } as const;

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat('es-CO');

interface EventData {
  evento: {
    id: string;
    nombre: string;
    slug: string;
    imagen_url: string | null;
    descripcion: string | null;
    condiciones: string | null;
    fecha_cierre: string | null;
    fecha_sorteo: string | null;
    loteria_referencia: string | null;
    total_entradas: number;
    precio_por_entrada: number;
    activo: boolean;
    estado: string;
    video_url: string | null;
    link_whatsapp?: string | null;
    mensaje_whatsapp?: string | null;
    noticias_marquee?: string | null;
    testimonios?: Array<{ type: 'instagram' | 'video'; url: string }>;
    instrucciones_pago?: string | null;
  };
  entradas_vendidas: number;
  entradas_restantes: number;
  porcentaje_vendido: number;
  paquetes: Array<{
    id: string;
    cantidad_entradas: number;
    precio_total: number;
    es_mas_popular: boolean;
    url_pago?: string | null;
  }>;
  premios: Array<{
    id: string;
    tipo: string;
    titulo: string;
    descripcion: string | null;
    imagen_url?: string | null;
    valor: number;
    numero_ganador: number | null;
    publicado: boolean;
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

type CountdownParts = { days: string; hours: string; minutes: string; seconds: string };

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value?: string | null) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date(value))
    .replace(/de ([a-záéíóúñ]+)/i, (_, month: string) => `de ${month.charAt(0).toUpperCase()}${month.slice(1)}`);
}

function formatDateShort(value?: string | null) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(value))
    .replace(/de ([a-záéíóúñ]+)/i, (_, month: string) => `de ${month.charAt(0).toUpperCase()}${month.slice(1)}`);
}

function getCountdownParts(targetDate?: string | null, now = Date.now()): CountdownParts {
  if (!targetDate) return { days: '00', hours: '00', minutes: '00', seconds: '00' };
  const diff = new Date(targetDate).getTime() - now;
  if (Number.isNaN(diff) || diff <= 0) return { days: '00', hours: '00', minutes: '00', seconds: '00' };
  return {
    days: String(Math.floor(diff / 86400000)).padStart(2, '0'),
    hours: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
    minutes: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
    seconds: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
  };
}

function purchaseStatusLabel(status: string) {
  if (status === 'aprobada') return 'Aprobada';
  if (status === 'rechazada') return 'Rechazada';
  return 'Pendiente';
}

function purchaseStatusClass(status: string) {
  if (status === 'aprobada') return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300';
  if (status === 'rechazada') return 'border-red-500/30 bg-red-500/15 text-red-300';
  return 'border-amber-500/30 bg-amber-500/15 text-amber-300';
}

function numberStatusClass(entry: { estado: string; bloqueada: boolean; correo_comprador: string | null }) {
  const sold = entry.bloqueada || entry.correo_comprador !== null || entry.estado === 'pagada' || entry.estado === 'premiada';
  if (sold) return 'border-red-500/35 bg-red-500/10 text-red-200';
  if (entry.estado === 'reservada') return 'border-amber-500/35 bg-amber-500/10 text-amber-200';
  return 'border-orange-500/35 bg-orange-500/10 text-blue-200';
}

function numberStatusLabel(entry: { estado: string; bloqueada: boolean; correo_comprador: string | null }) {
  const sold = entry.bloqueada || entry.correo_comprador !== null || entry.estado === 'pagada' || entry.estado === 'premiada';
  if (sold) return 'Vendido';
  if (entry.estado === 'reservada') return 'Reservado';
  return 'Disponible';
}

function SectionTitle({
  eyebrow,
  title,
  accent,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] uppercase tracking-[0.45em] text-red-300" style={fontCondensed}>
        {eyebrow}
      </div>
      <h2 className="mt-5 text-4xl uppercase leading-none tracking-[0.08em] text-slate-900 sm:text-6xl" style={fontCondensed}>
        {title}{' '}
        {accent ? <span className="bg-gradient-to-r from-red-500 via-red-400 to-blue-500 bg-clip-text text-transparent">{accent}</span> : null}
      </h2>
      {subtitle ? <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-300 sm:text-base">{subtitle}</p> : null}
    </div>
  );
}

export function EventLanding() {
  const { tenant, eventSlug } = useParams<{ tenant?: string; eventSlug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EventData | null>(null);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<EventData['paquetes'][number] | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [lookupType, setLookupType] = useState<'email' | 'documento'>('email');
  const [lookupValue, setLookupValue] = useState('');
  const [lookupResults, setLookupResults] = useState<any>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false);
  const [now, setNow] = useState(Date.now());

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError('');
      if (!eventSlug) throw new Error('Evento no encontrado');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/get-event-public?slug=${eventSlug}`);

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Evento no encontrado');
      }

      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evento no encontrado');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEventData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (data?.evento?.nombre) {
      document.title = `${data.evento.nombre} · Toyo Turbos RH`;
    }
  }, [data]);

  useEffect(() => {
    if (!data || loading) return;
    const tab = searchParams.get('tab');
    const target = tab === 'consultar' ? 'consulta' : tab === 'comprar' ? 'paquetes' : null;
    if (!target) return;
    const timer = window.setTimeout(() => scrollToSection(target), 150);
    return () => window.clearTimeout(timer);
  }, [data, loading, searchParams]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.evento?.id) return;

    setLookingUp(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const params = new URLSearchParams({
        evento_id: data.evento.id,
        [lookupType]: lookupValue.trim(),
      });

      const response = await fetch(`${supabaseUrl}/functions/v1/lookup-entries?${params}`, {
        headers: { Authorization: `Bearer ${anonKey}` },
      });

      const result = await response.json();
      if (response.ok) {
        setLookupResults(result);
      } else {
        toast.error(result.error || 'No se encontraron boletas');
      }
    } catch {
      toast.error('Error al buscar boletas');
    } finally {
      setLookingUp(false);
    }
  };

  const handlePackageSelect = (paquete: EventData['paquetes'][number]) => {
    setQuantity(paquete.cantidad_entradas);
    setSelectedPackage(paquete);
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
    setSelectedPackage(null);
    void loadEventData();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-slate-100">
        <div className="text-center">
          <img src={LOGO_URL} alt="Toyo Turbos RH" className="mx-auto h-20 w-auto object-contain animate-pulse" />
          <div className="mx-auto mt-6 h-14 w-14 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-slate-400" style={fontCondensed}>
            Cargando evento...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-slate-100">
        <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
            <Shield className="h-8 w-8 text-red-300" />
          </div>
          <h1 className="text-4xl uppercase tracking-[0.08em] text-slate-900" style={fontCondensed}>
            Evento no encontrado
          </h1>
          <p className="mt-3 text-slate-300">
            {error || 'El evento que buscas no existe o no está disponible.'}
          </p>
          <button
            type="button"
            onClick={() => void loadEventData()}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-red-200 transition hover:-translate-y-0.5 hover:bg-red-500/20"
            style={fontCondensed}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { evento, entradas_vendidas, entradas_restantes, porcentaje_vendido, paquetes, premios, numeros_bendecidos } = data;
  const whatsappLink = evento.link_whatsapp || DEFAULT_WHATSAPP_LINK;
  const marqueeMessages = (() => {
    const messages = evento.noticias_marquee
      ? evento.noticias_marquee.split('|').map((message) => message.trim()).filter(Boolean)
      : [];
    return messages.length > 0
      ? messages
      : [
          evento.nombre,
          `Boleta por ${formatCurrency(evento.precio_por_entrada)}`,
          `Quedan ${formatNumber(entradas_restantes)} disponibles`,
          `Sorteo ${formatDate(evento.fecha_sorteo || evento.fecha_cierre)}`,
        ];
  })();

  const previewNumbers = numeros_bendecidos?.lista?.slice(0, 8) || [];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-slate-100">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-red-500/30 bg-black/95 backdrop-blur-2xl">
        <div className="mx-auto flex h-[58px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img src={LOGO_URL} alt="Toyo Turbos RH" className="h-8 w-auto flex-shrink-0 object-contain sm:h-9" />
            <div className="min-w-0">
              <div className="text-[14px] font-black uppercase tracking-[0.18em] text-slate-900" style={fontCondensed}>
                TOYO TURBOS <span className="text-red-400">RH</span>
              </div>
              <div className="text-[9px] uppercase tracking-[0.32em] text-slate-500 sm:text-[10px]" style={fontCondensed}>
                La rifa del siglo · 2026
              </div>
            </div>
          </div>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 shadow-[0_8px_24px_rgba(192,21,42,0.35)] transition hover:-translate-y-0.5 hover:bg-red-600"
            style={fontCondensed}
          >
            <MessageCircle className="h-4 w-4" />
            Comprar boleta
          </a>
        </div>
      </header>

      <div className="pt-[58px]">
        <div className="overflow-hidden border-y border-red-500/20 bg-zinc-950/90">
          <div className="mx-auto flex w-[200%] animate-marquee whitespace-nowrap">
            {marqueeMessages.map((message, index) => (
              <span key={`a-${index}`} className="inline-flex items-center gap-4 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.35em] text-slate-300 sm:text-[13px]" style={fontCondensed}>
                {message}
                <span className="text-red-400">▶</span>
              </span>
            ))}
            {marqueeMessages.map((message, index) => (
              <span key={`b-${index}`} className="inline-flex items-center gap-4 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.35em] text-slate-300 sm:text-[13px]" style={fontCondensed}>
                {message}
                <span className="text-red-400">▶</span>
              </span>
            ))}
          </div>
        </div>

        <main>
          <section className="relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative space-y-6 text-center lg:text-left">
                <div className="relative mx-auto w-fit lg:mx-0">
                  <div className="absolute inset-0 -z-10 rounded-full bg-red-500/20 blur-3xl" />
                  <img src={LOGO_URL} alt="Toyo Turbos RH" className="mx-auto h-24 w-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.45)] sm:h-32 lg:mx-0 lg:h-36" />
                </div>

                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] uppercase tracking-[0.4em] text-red-300 lg:mx-0" style={fontCondensed}>
                  <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  Rifa activa · {evento.estado === 'activo' ? 'Disponible ahora' : `Estado: ${evento.estado}`}
                </div>

                <div className="text-[11px] uppercase tracking-[0.45em] text-slate-400" style={fontCondensed}>
                  La familia Toyo Turbo presenta
                </div>

                <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[0.05em] text-slate-900 sm:text-7xl lg:text-8xl" style={fontCondensed}>
                  <span className="block">{evento.nombre}</span>
                  <span className="block bg-gradient-to-r from-red-500 via-red-400 to-blue-500 bg-clip-text text-transparent">La Rifa del Siglo</span>
                </h1>

                <div className="mx-auto flex max-w-2xl items-center gap-4 lg:mx-0">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                  <div className="text-xl text-red-400">🚛</div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                </div>

                <p className="text-lg font-light italic text-slate-300 sm:text-xl" style={fontOswald}>
                  <strong className="font-normal text-amber-400">"Una decisión hoy puede cambiar tu camino para siempre."</strong>
                </p>

                {evento.descripcion ? <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-300 lg:mx-0 sm:text-base">{evento.descripcion}</p> : null}

                <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  <button
                    type="button"
                    onClick={() => scrollToSection('paquetes')}
                    className="relative inline-flex items-center gap-2 overflow-hidden rounded-md border border-white/10 bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 text-sm font-bold uppercase tracking-[0.24em] text-slate-900 shadow-[0_12px_32px_rgba(192,21,42,0.45)] transition hover:-translate-y-1"
                    style={fontCondensed}
                  >
                    <Ticket className="h-4 w-4" />
                    Quiero mi boleta — {formatCurrency(evento.precio_por_entrada)}
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('premios')}
                    className="inline-flex items-center gap-2 rounded-md border-2 border-orange-500/60 px-6 py-4 text-sm font-bold uppercase tracking-[0.24em] text-blue-300 transition hover:-translate-y-1 hover:bg-orange-500/10 hover:text-slate-900"
                    style={fontCondensed}
                  >
                    <Trophy className="h-4 w-4" />
                    Ver premios
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(tenant ? `/${tenant}/evento/${eventSlug}/mis-boletas` : `/evento/${eventSlug}/mis-boletas`)}
                    className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold uppercase tracking-[0.24em] text-slate-200 transition hover:-translate-y-1 hover:bg-white/10"
                    style={fontCondensed}
                  >
                    <Search className="h-4 w-4" />
                    Ver mi boleta
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: formatNumber(entradas_vendidas), label: 'Vendidas', icon: '🔥' },
                    { value: formatNumber(entradas_restantes), label: 'Restantes', icon: '⏳' },
                    { value: formatDateShort(evento.fecha_sorteo || evento.fecha_cierre), label: 'Sorteo', icon: '📅' },
                  ].map((fact) => (
                    <div key={fact.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center shadow-[0_12px_24px_rgba(0,0,0,0.2)]">
                      <div className="mb-1 text-lg">{fact.icon}</div>
                      <div className="text-2xl font-black text-slate-900" style={fontCondensed}>{fact.value}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-slate-500" style={fontCondensed}>{fact.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-red-500/15 blur-3xl" />
                <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
                  <div className="absolute left-4 top-4 z-10 rounded-md bg-red-500/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-900 backdrop-blur" style={fontCondensed}>
                    🎥 Presentación oficial
                  </div>
                  <div className="aspect-[4/3] overflow-hidden bg-zinc-950">
                    {evento.video_url ? (
                      <video autoPlay muted loop playsInline className="h-full w-full object-cover">
                        <source src={evento.video_url} type="video/mp4" />
                      </video>
                    ) : (
                      <img src={evento.imagen_url || LOGO_URL} alt={evento.nombre} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="border-t border-white/10 bg-black/70 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.35em] text-slate-400" style={fontCondensed}>Precio boleta</div>
                        <div className="text-4xl font-black leading-none text-slate-900" style={fontCondensed}>{formatCurrency(evento.precio_por_entrada)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] uppercase tracking-[0.35em] text-slate-400" style={fontCondensed}>Sorteo</div>
                        <div className="text-lg font-bold uppercase tracking-[0.12em] text-slate-200" style={fontCondensed}>{formatDateShort(evento.fecha_sorteo || evento.fecha_cierre)}</div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center">
                        <div className="text-2xl font-black text-slate-900" style={fontCondensed}>{formatNumber(entradas_vendidas)}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-slate-500" style={fontCondensed}>Vendidas</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center">
                        <div className="text-2xl font-black text-slate-900" style={fontCondensed}>{formatNumber(entradas_restantes)}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-slate-500" style={fontCondensed}>Restan</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center">
                        <div className="text-2xl font-black text-slate-900" style={fontCondensed}>{porcentaje_vendido.toFixed(1)}%</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-slate-500" style={fontCondensed}>Progreso</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-red-500/20 bg-zinc-950/90 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 text-center text-[11px] uppercase tracking-[0.45em] text-red-300" style={fontCondensed}>
                ⏰ Tiempo restante para los sorteos
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                {[
                  { label: `🗓️ Cierre de ventas — ${formatDate(evento.fecha_cierre)}`, target: evento.fecha_cierre, subtitle: 'Cierre oficial del evento' },
                  { label: `🏆 Sorteo principal — ${formatDate(evento.fecha_sorteo)}`, target: evento.fecha_sorteo, subtitle: evento.loteria_referencia || 'Sorteo principal del evento' },
                ].map((panel) => {
                  const parts = getCountdownParts(panel.target, now);
                  return (
                    <div key={panel.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
                      <div className="mb-4 text-center text-[11px] uppercase tracking-[0.35em] text-red-300" style={fontCondensed}>{panel.label}</div>
                      <div className="flex justify-center gap-2 sm:gap-3">
                        {[
                          { value: parts.days, label: 'Días' },
                          { value: parts.hours, label: 'Horas' },
                          { value: parts.minutes, label: 'Min' },
                          { value: parts.seconds, label: 'Seg' },
                        ].map((unit) => (
                          <div key={unit.label} className="min-w-[62px] rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-3 text-center sm:min-w-[76px]">
                            <div className="text-3xl font-black leading-none text-slate-900 sm:text-4xl" style={fontCondensed}>{unit.value}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500" style={fontCondensed}>{unit.label}</div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-center text-xs uppercase tracking-[0.22em] text-slate-500" style={fontCondensed}>{panel.subtitle}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section id="premios" className="scroll-mt-24 border-t border-white/5 bg-gradient-to-b from-[#0d0d0d] to-[#080808] px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <SectionTitle eyebrow="Lo que puedes ganar" title="PREMIOS" accent="ÉPICOS" subtitle="Dos máquinas, mucho dinero y un solo propósito: hacerte cumplir tus sueños." />

              {evento.video_url ? (
                <div className="relative mt-10 overflow-hidden rounded-[24px] border border-red-500/20 shadow-[0_25px_60px_rgba(0,0,0,0.65)]">
                  <div className="absolute left-4 top-4 z-10 rounded-md bg-red-500/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-900 backdrop-blur" style={fontCondensed}>
                    🎥 Presentación oficial
                  </div>
                  <video autoPlay muted loop playsInline className="max-h-[420px] w-full object-cover">
                    <source src={evento.video_url} type="video/mp4" />
                  </video>
                </div>
              ) : null}

              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(premios.length > 0 ? premios : [{
                  id: 'fallback-1',
                  tipo: 'principal',
                  titulo: 'Premio principal',
                  descripcion: evento.descripcion || 'Premio principal del sorteo.',
                  imagen_url: null,
                  valor: evento.precio_por_entrada,
                  numero_ganador: null,
                  publicado: true,
                }]).map((premio, index) => (
                  <article
                    key={premio.id}
                    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-red-500/30 ${index === 0 ? 'bg-gradient-to-br from-red-500/10 to-white/5' : ''}`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-red-300" style={fontCondensed}>
                          <Gift className="h-3.5 w-3.5" />
                          {premio.tipo}
                        </div>
                        <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.04em] text-slate-900" style={fontCondensed}>{premio.titulo}</h3>
                      </div>
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-right">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-amber-300" style={fontCondensed}>Valor</div>
                        <div className="text-2xl font-black text-amber-200" style={fontCondensed}>{formatCurrency(Number(premio.valor || 0))}</div>
                      </div>
                    </div>
                    {premio.imagen_url ? <img src={premio.imagen_url} alt={premio.titulo} className="mb-4 h-48 w-full rounded-xl object-cover" /> : null}
                    <p className="text-sm leading-6 text-slate-300">{premio.descripcion || 'Premio publicado oficialmente para este evento.'}</p>
                    {premio.numero_ganador ? (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-blue-200" style={fontCondensed}>
                        <Trophy className="h-3.5 w-3.5" />
                        Número ganador #{premio.numero_ganador}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="talonario" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-slate-300" style={fontCondensed}>
                  <Truck className="h-4 w-4 text-red-300" />
                  Panel oficial en vivo
                </div>
                <h2 className="mt-5 text-4xl uppercase leading-none tracking-[0.08em] text-slate-900 sm:text-6xl" style={fontCondensed}>
                  ELIGE TU <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">NÚMERO</span>
                </h2>
                <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-300 sm:text-base">
                  Selecciona tu paquete, confirma tu compra y recibe tus números oficiales.
                </p>
              </div>

              <div className="mt-8 overflow-hidden rounded-[24px] border border-white/10 bg-white/5 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                    <div className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse [animation-delay:200ms]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/70 animate-pulse [animation-delay:400ms]" />
                    <span className="text-xs uppercase tracking-[0.35em] text-slate-400" style={fontCondensed}>
                      Tablero de boletas · {evento.fecha_sorteo ? formatDateShort(evento.fecha_sorteo) : 'En vivo'}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-red-200" style={fontCondensed}>
                    <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                    En vivo
                  </div>
                </div>

                <div className="grid gap-4 p-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.35em] text-slate-500" style={fontCondensed}>Números bendecidos</div>
                        <div className="mt-1 text-2xl font-black uppercase tracking-[0.04em] text-slate-900" style={fontCondensed}>
                          {formatNumber(numeros_bendecidos?.total || 0)} activos
                        </div>
                      </div>
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-right">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-amber-300" style={fontCondensed}>Total premios</div>
                        <div className="text-2xl font-black text-amber-200" style={fontCondensed}>{formatCurrency(numeros_bendecidos?.total_en_premios || 0)}</div>
                      </div>
                    </div>

                    {previewNumbers.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {previewNumbers.map((entry) => (
                          <div key={entry.numero_entrada} className={`rounded-2xl border p-4 shadow-[0_12px_26px_rgba(0,0,0,0.22)] ${numberStatusClass(entry)}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400" style={fontCondensed}>Número</div>
                                <div className="mt-1 text-3xl font-black leading-none" style={fontCondensed}>#{String(entry.numero_entrada).padStart(4, '0')}</div>
                              </div>
                              <div className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em]" style={fontCondensed}>
                                {numberStatusLabel(entry)}
                              </div>
                            </div>
                            <div className="mt-4 text-sm leading-6 text-slate-200">
                              {entry.correo_comprador ? (
                                <>
                                  <span className="font-semibold">Comprador:</span> {entry.nombre_comprador || 'Anónimo'}
                                </>
                              ) : (
                                <>Disponible para compra</>
                              )}
                            </div>
                            <div className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-400" style={fontCondensed}>
                              Premio base {formatCurrency(Number(entry.premio_valor || 0))}
                            </div>
                            {entry.premio_especie_activo && entry.premio_especie_descripcion ? (
                              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-100">
                                <div className="mb-1 font-semibold uppercase tracking-[0.2em] text-amber-200" style={fontCondensed}>Premio adicional</div>
                                {entry.premio_especie_descripcion}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-300">
                        No hay números bendecidos publicados todavía.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <div className="text-xs uppercase tracking-[0.35em] text-slate-500" style={fontCondensed}>Cómo participar</div>
                      <h3 className="mt-2 text-3xl font-black uppercase tracking-[0.04em] text-slate-900" style={fontCondensed}>4 pasos rápidos</h3>
                      <div className="mt-5 space-y-3">
                        {[
                          ['💬', 'Escríbenos', 'Entra al grupo o contáctanos por WhatsApp para arrancar.'],
                          ['🎫', 'Elige tu boleta', 'Selecciona el paquete que mejor se ajuste a tu compra.'],
                          ['💳', 'Realiza el pago', 'Paga por el medio disponible y guarda tu comprobante.'],
                          ['🏆', 'Recibe tus números', 'Tu boleta queda activa y podrás consultar tu estado aquí.'],
                        ].map(([icon, title, text], index) => (
                          <div key={String(index)} className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-xl">{icon}</div>
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.3em] text-red-300" style={fontCondensed}>Paso {index + 1}</div>
                              <div className="mt-1 text-lg font-bold uppercase tracking-[0.04em] text-slate-900" style={fontCondensed}>{title}</div>
                              <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/10 to-blue-500/10 p-6">
                      <div className="text-xs uppercase tracking-[0.35em] text-red-200" style={fontCondensed}>Consulta rápida</div>
                      <h3 className="mt-2 text-3xl font-black uppercase tracking-[0.04em] text-slate-900" style={fontCondensed}>
                        Busca: CONSULTA TUS NÚMEROS
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        Ingresa con tu correo electrónico o número de documento y revisa tus compras, números y estado.
                      </p>
                      <button
                        type="button"
                        onClick={() => scrollToSection('consulta')}
                        className="mt-5 inline-flex items-center gap-2 rounded-md border border-orange-500/40 bg-orange-500/10 px-5 py-3 text-sm uppercase tracking-[0.2em] text-blue-200 transition hover:-translate-y-0.5 hover:bg-orange-500/20 hover:text-slate-900"
                        style={fontCondensed}
                      >
                        <Search className="h-4 w-4" />
                        Ir a consulta
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-slate-300">Los números mostrados arriba son el tablero dinámico de referencia del evento.</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500 px-5 py-3 text-xs uppercase tracking-[0.2em] text-slate-900 transition hover:-translate-y-0.5 hover:bg-red-600" style={fontCondensed}>
                      <MessageCircle className="h-4 w-4" />
                      Reservar por WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => scrollToSection('consulta')}
                      className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-5 py-3 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/10"
                      style={fontCondensed}
                    >
                      <Search className="h-4 w-4" />
                      Consultar mis números
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="border-y border-emerald-500/20 bg-gradient-to-r from-[#07140a] via-[#0b2213] to-[#07140a] px-4 py-14 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h3 className="text-3xl font-black uppercase tracking-[0.16em] text-slate-900 sm:text-5xl" style={fontCondensed}>
                🚛 Asegura tu boleta ahora
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-900/65 sm:text-base">
                Los cupos son limitados. No dejes pasar esta oportunidad de cambiar tu vida.
              </p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-3 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-8 py-4 text-sm font-bold uppercase tracking-[0.3em] text-emerald-300 transition hover:-translate-y-1 hover:bg-emerald-400/20 hover:text-slate-900" style={fontCondensed}>
                <MessageCircle className="h-5 w-5" />
                Comprar mi boleta por WhatsApp
              </a>
            </div>
          </div>

          <section id="paquetes" className="scroll-mt-24 border-t border-white/5 bg-gradient-to-b from-[#0a0a0a] to-[#050505] px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <SectionTitle
                eyebrow="Por solo el precio de una boleta"
                title="TODO ESTO"
                accent="ES TUYO"
                subtitle="Cuantas más boletas compres, más oportunidades tendrás de ganar."
              />

              <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
                  <div className="text-[11px] uppercase tracking-[0.35em] text-slate-500" style={fontCondensed}>
                    Boleta oficial · {evento.nombre}
                  </div>
                  <div className="mt-4 text-6xl font-black leading-none text-slate-900 sm:text-7xl" style={fontCondensed}>
                    {formatCurrency(evento.precio_por_entrada)}
                  </div>
                  <div className="mt-2 text-sm uppercase tracking-[0.24em] text-slate-400" style={fontCondensed}>
                    Precio por boleta
                  </div>

                  <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <ul className="space-y-3">
                    {(premios.length > 0 ? premios.slice(0, 4).map((premio) => premio.titulo) : [
                      'Participación en el sorteo principal',
                      'Consulta de números en esta misma página',
                      'Confirmación por correo electrónico',
                      'Seguimiento de tu compra en línea',
                    ]).map((item) => (
                      <li key={item} className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-sm text-slate-200">
                        <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
                    <div className="text-[11px] uppercase tracking-[0.35em] text-amber-200" style={fontCondensed}>Información</div>
                    <p className="mt-2 text-sm leading-6 text-amber-50/90">
                      {evento.instrucciones_pago || evento.condiciones || 'Compra tu boleta, recibe tus números y luego consúltalos aquí.'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {paquetes.length > 0 ? (
                    paquetes.map((paquete) => (
                      <button
                        key={paquete.id}
                        type="button"
                        onClick={() => handlePackageSelect(paquete)}
                        className={`group relative overflow-hidden rounded-2xl border p-6 text-left shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(0,0,0,0.5)] ${paquete.es_mas_popular ? 'border-amber-400/60 bg-gradient-to-br from-amber-500/15 to-white/5' : 'border-white/10 bg-white/5'}`}
                      >
                        {paquete.es_mas_popular ? (
                          <div className="absolute -right-8 top-5 rotate-12 bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-900 shadow-lg" style={fontCondensed}>
                            ⭐ Más popular
                          </div>
                        ) : null}

                        <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
                          <div className="text-5xl font-black leading-none text-slate-900" style={fontCondensed}>{formatNumber(paquete.cantidad_entradas)}</div>
                          <div className="mt-2 text-[11px] uppercase tracking-[0.3em] text-slate-500" style={fontCondensed}>Boletas</div>
                        </div>

                        <div className="text-4xl font-black text-slate-900" style={fontCondensed}>{formatCurrency(paquete.precio_total)}</div>
                        <div className="mt-2 text-sm text-slate-400">{formatCurrency(paquete.precio_total / paquete.cantidad_entradas)} por entrada</div>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-emerald-200 transition group-hover:bg-emerald-400/20" style={fontCondensed}>
                          <Star className="h-3.5 w-3.5" />
                          Comprar ahora
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300 sm:col-span-2">
                      No hay paquetes configurados todavía.
                    </div>
                  )}
                </div>
              </div>

              {evento.condiciones ? (
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-2xl font-black uppercase tracking-[0.04em] text-slate-900" style={fontCondensed}>¿Cómo participar?</h3>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{evento.condiciones}</div>
                </div>
              ) : null}
            </div>
          </section>

          <section id="consulta" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="rounded-[28px] border border-orange-500/20 bg-white/5 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-8">
                <SectionTitle
                  eyebrow="Consulta de boletas"
                  title="CONSULTA"
                  accent="TUS NÚMEROS"
                  subtitle="Busca por correo electrónico o documento y revisa tus compras, números y estado."
                />

                <form onSubmit={handleLookup} className="mt-8 space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${lookupType === 'email' ? 'border-orange-500/40 bg-orange-500/10 text-slate-900' : 'border-white/10 bg-black/20 text-slate-300'}`}>
                      <input type="radio" checked={lookupType === 'email'} onChange={() => setLookupType('email')} className="accent-blue-500" />
                      <span className="text-sm uppercase tracking-[0.24em]" style={fontCondensed}>Correo electrónico</span>
                    </label>
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${lookupType === 'documento' ? 'border-orange-500/40 bg-orange-500/10 text-slate-900' : 'border-white/10 bg-black/20 text-slate-300'}`}>
                      <input type="radio" checked={lookupType === 'documento'} onChange={() => setLookupType('documento')} className="accent-blue-500" />
                      <span className="text-sm uppercase tracking-[0.24em]" style={fontCondensed}>Número de documento</span>
                    </label>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      {lookupType === 'email' ? 'Correo electrónico' : 'Número de documento'}
                    </label>
                    <input
                      type={lookupType === 'email' ? 'email' : 'text'}
                      inputMode={lookupType === 'email' ? 'email' : 'numeric'}
                      value={lookupValue}
                      onChange={(e) => setLookupValue(e.target.value)}
                      required
                      placeholder={lookupType === 'email' ? 'tu@correo.com' : '1234567890'}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-slate-900 placeholder:text-slate-500 focus:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={lookingUp}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-gradient-to-r from-orange-500 to-blue-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.26em] text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    style={fontCondensed}
                  >
                    <Search className="h-4 w-4" />
                    {lookingUp ? 'Buscando...' : 'Buscar mis boletas'}
                  </button>
                </form>

                {lookupResults ? (
                  <div className="mt-8 space-y-4">
                    {lookupResults.compras && lookupResults.compras.length > 0 ? (
                      lookupResults.compras.map((compra: any) => (
                        <article key={compra.id} className="rounded-2xl border border-white/10 bg-black/25 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${purchaseStatusClass(compra.estado)}`} style={fontCondensed}>
                                {purchaseStatusLabel(compra.estado)}
                              </div>
                              <div className="text-sm text-slate-400">{new Date(compra.created_at).toLocaleDateString('es-CO')}</div>
                            </div>
                            <div className="text-sm text-slate-400">{compra.eventos?.nombre || evento.nombre}</div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                              <div className="text-xs uppercase tracking-[0.24em] text-slate-500" style={fontCondensed}>Cantidad de boletas</div>
                              <div className="mt-2 text-3xl font-black text-slate-900" style={fontCondensed}>{formatNumber(compra.cantidad_entradas)}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                              <div className="text-xs uppercase tracking-[0.24em] text-slate-500" style={fontCondensed}>Total pagado</div>
                              <div className="mt-2 text-3xl font-black text-slate-900" style={fontCondensed}>{formatCurrency(compra.monto_total)}</div>
                            </div>
                          </div>

                          {Array.isArray(compra.entradas) && compra.entradas.length > 0 ? (
                            <div className="mt-4">
                              <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500" style={fontCondensed}>Tus números</div>
                              <div className="flex flex-wrap gap-2">
                                {compra.entradas.map((entrada: any) => (
                                  <span
                                    key={entrada.id}
                                    className={`inline-flex items-center rounded-lg border px-3 py-1.5 font-mono text-sm font-semibold ${entrada.es_bendecida ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-orange-500/30 bg-orange-500/10 text-blue-200'}`}
                                  >
                                    #{String(entrada.numero_entrada).padStart(4, '0')}
                                    {entrada.es_bendecida ? ' ⭐' : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </article>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center text-slate-400">No se encontraron compras con ese dato.</div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="border-y border-white/5 bg-gradient-to-br from-[#0b0b0b] via-[#121212] to-[#0b0b0b] px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <SectionTitle
                eyebrow="Por qué confiar"
                title="TOYO TURBOS"
                accent="CUMPLE"
                subtitle="Una rifa bien presentada, con evidencia visible y un flujo de compra claro."
              />

              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ['🔒', 'Rifa verificada', 'Sorteos transparentes con trazabilidad y validación de pagos.'],
                  ['📹', 'Evidencia en video', 'Los premios se muestran en video para reforzar la confianza.'],
                  ['💳', 'Pagos seguros', 'Nequi, Daviplata, transferencia o pasarela, según el evento.'],
                  ['🇨🇴', '100% colombiano', 'Una experiencia pensada para rifas y sorteos en Colombia.'],
                ].map(([icon, title, text]) => (
                  <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/10">
                    <div className="text-2xl">{icon}</div>
                    <div className="mt-3 text-xl font-black uppercase tracking-[0.04em] text-slate-900" style={fontCondensed}>{title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {evento.testimonios && evento.testimonios.length > 0 ? (
            <InstagramTestimonials testimonios={evento.testimonios} />
          ) : null}

          <div className="border-y border-emerald-500/20 bg-gradient-to-r from-[#0a1f0f] via-[#0d2a18] to-[#0a1f0f] px-4 py-14 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h3 className="text-3xl font-black uppercase tracking-[0.16em] text-slate-900 sm:text-5xl" style={fontCondensed}>🏆 No te quedes sin la tuya</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-900/65 sm:text-base">Los cupos se agotan. Cada boleta que no compras es una oportunidad que se pierde.</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-8 py-4 text-sm font-bold uppercase tracking-[0.3em] text-emerald-300 transition hover:-translate-y-1 hover:bg-emerald-400/20 hover:text-slate-900" style={fontCondensed}>
                  <MessageCircle className="h-5 w-5" />
                  Comprar boleta — {formatCurrency(evento.precio_por_entrada)}
                </a>
                <button
                  type="button"
                  onClick={() => scrollToSection('consulta')}
                  className="inline-flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-[0.3em] text-slate-200 transition hover:-translate-y-1 hover:bg-white/10"
                  style={fontCondensed}
                >
                  <Search className="h-5 w-5" />
                  Consultar mis números
                </button>
              </div>
            </div>
          </div>

          <section className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-5xl font-black uppercase leading-none tracking-[0.12em] text-slate-900 sm:text-7xl" style={fontCondensed}>
                <span className="block">TU MOMENTO</span>
                <span className="block bg-gradient-to-r from-red-500 via-red-400 to-blue-500 bg-clip-text text-transparent">ES AHORA</span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg font-light italic text-slate-300 sm:text-xl" style={fontOswald}>
                Dos máquinas, premios visibles y una sola decisión.
                <br />
                <span className="text-amber-400">Todo por {formatCurrency(evento.precio_por_entrada)}.</span>
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-3 rounded-md border border-red-500/30 bg-gradient-to-r from-red-600 to-red-500 px-8 py-5 text-sm font-bold uppercase tracking-[0.3em] text-slate-900 shadow-[0_12px_40px_rgba(192,21,42,0.45)] transition hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(192,21,42,0.65)]"
                style={fontCondensed}
              >
                <MessageCircle className="h-5 w-5" />
                Comprar mi boleta ahora
              </a>
              <div className="mt-6 text-sm font-light text-slate-500" style={fontOswald}>
                🙏 Gracias por confiar en Toyo Turbos RH · Dios los bendiga y mucha suerte 🇨🇴
              </div>
            </div>
          </section>

          <footer className="border-t-2 border-red-500 bg-black px-4 pb-8 pt-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl text-center">
              <img src={LOGO_URL} alt="Toyo Turbos RH" className="mx-auto h-14 w-auto object-contain" />
              <div className="mt-4 text-lg font-black uppercase tracking-[0.2em] text-slate-900" style={fontCondensed}>TOYO TURBOS RH</div>
              <div className="mt-1 text-xs uppercase tracking-[0.4em] text-slate-500" style={fontCondensed}>
                La Rifa del Siglo · {formatDateShort(evento.fecha_sorteo || evento.fecha_cierre)}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button type="button" onClick={() => setShowPrivacyPolicy(true)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:bg-white/10">
                  <Shield className="h-4 w-4" />
                  Política de Privacidad
                </button>
                <button type="button" onClick={() => setShowTermsAndConditions(true)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:bg-white/10">
                  <FileText className="h-4 w-4" />
                  Términos y Condiciones
                </button>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-500 text-slate-900 transition hover:-translate-y-1" aria-label="WhatsApp">
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a href="https://www.facebook.com/ToyoTurbosRH" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-md bg-orange-500 text-slate-900 transition hover:-translate-y-1" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://www.instagram.com/toyoturbosrh25/" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 via-red-500 to-yellow-500 text-slate-900 transition hover:-translate-y-1" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>

              <div className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-600">© {new Date().getFullYear()} Toyo Turbos RH · Todos los derechos reservados</div>
            </div>
          </footer>
        </main>
      </div>

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={closePurchaseModal}
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

      <WhatsAppPopup phoneNumber={SUPPORT_PHONE} eventName={evento.nombre} />
    </div>
  );
}
