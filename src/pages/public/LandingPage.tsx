import { Link } from 'react-router-dom';
import { Ticket, Users, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-outfit selection:bg-orange-500/30">
      {/* Navbar Minimalista */}
      <nav className="fixed top-0 left-0 right-0 p-6 z-50 flex items-center justify-between bg-slate-50/80 backdrop-blur-md border-b border-white/60">
        <div className="flex items-center gap-2">
          <Ticket className="w-8 h-8 text-orange-500" />
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">
            SISTEMA DE EVENTOS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">
            Entrar
          </Link>
          <Link to="/register" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 px-5 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/25">
            Crear cuenta
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 flex items-center justify-center -z-10 overflow-hidden">
           <div className="w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[120px] absolute opacity-50"></div>
           <div className="w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] absolute -translate-x-1/2 opacity-30"></div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
          Transforma la manera en que gestionas tus rifas y sorteos
        </h1>
        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl leading-relaxed">
          Una plataforma integral B2B diseñada para negocios que desean digitalizar sus sorteos, procesar boletos automáticamente y aumentar su transparencia.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/register" className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-500 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-blue-600/20 hover:scale-105">
            Empezar ahora <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="flex items-center justify-center bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm hover:bg-slate-100 text-slate-900 border border-white/50 px-8 py-4 rounded-xl font-bold text-lg transition-colors">
            Ya tengo cuenta
          </Link>
        </div>
      </header>

      {/* Características */}
      <section className="py-24 px-6 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">¿Cómo funciona el programa?</h2>
            <p className="text-slate-500 text-lg">Todo lo que necesitas centralizado en un solo lugar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-2xl p-8 border border-white/50 hover:border-orange-500/50 transition-colors">
              <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6">
                <Ticket className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Diseña tu Rifa</h3>
              <p className="text-slate-500 leading-relaxed">
                Crea eventos personalizados, define precios, cantidad de boletos y sube increíbles imágenes de tus premios en minutos.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-2xl p-8 border border-white/50 hover:border-green-500/50 transition-colors">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Vende Autonómicamente</h3>
              <p className="text-slate-500 leading-relaxed">
                Cada evento genera una "Página de Aterrizaje Pública". Tus clientes entran, seleccionan su boleto libre y suben su comprobante de pago.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-2xl p-8 border border-white/50 hover:border-purple-500/50 transition-colors">
              <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Aprobación y Trazabilidad</h3>
              <p className="text-slate-500 leading-relaxed">
                Aprueba comprobantes centralmente desde tu Panel. El sistema bloquea boletos y libera ganancias automáticamente con alta seguridad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-24 px-6 border-t border-white/60">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" /> Innovación SaaS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Múltiples Negocios.<br/>Una misma plataforma.</h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">
              No importa si eres un organizador pequeño o un operador B2B mayorista. El sistema aisla los datos de cada cliente bajo el esquema Tenant, asegurando total soberanía sobre sus boletos.
            </p>
            <ul className="space-y-4">
              {[
                'Motor de búsqueda y asignación inteligente de números.',
                'Prevención de caducidad con licencias automatizadas.',
                'Soporte directo mediante Bandeja de Tickets integrada.'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <CheckIcon className="w-6 h-6 text-green-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full bg-gradient-to-br from-white to-slate-50 border border-white/50 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>
             <div className="space-y-4 relative z-10">
               <div className="h-4 bg-slate-100/50 rounded-full w-1/3 mb-8"></div>
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-slate-100/30"></div>
                   <div className="flex-1">
                     <div className="h-3 bg-slate-100/50 rounded-full w-full mb-2"></div>
                     <div className="h-2 bg-slate-100/30 rounded-full w-2/3"></div>
                   </div>
                   <div className="w-16 h-6 rounded-full bg-orange-500/20 border border-orange-500/30"></div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-16 px-6 bg-slate-50 border-t border-white/60 text-center">
        <h2 className="text-2xl font-bold mb-6">¿Listo para llevar tus rifas al próximo nivel?</h2>
        <Link to="/register" className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-colors">
           Crear mi cuenta gratis
        </Link>
        <p className="text-slate-400 mt-12 text-sm">
          © {new Date().getFullYear()} Sistema de Eventos. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
