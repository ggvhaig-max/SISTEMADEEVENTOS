import { Outlet, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Calendar, Bell, LogOut, Ticket, Settings, MessageSquare, LifeBuoy, CreditCard, Users, BarChart, AlertTriangle } from 'lucide-react';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LicenciaInactiva } from '../LicenciaInactiva';

export function TenantLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, profile } = useAuth();
  const { pendingCount } = useAdminNotifications(true);
  const { slug } = useParams<{ slug: string }>();

  const [localTenant, setLocalTenant] = useState<any>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const isSuperadmin = user?.user_metadata?.rol === 'superadmin' || profile?.rol === 'superadmin';

  useEffect(() => {
    async function fetchTenant() {
      if (!slug) return;
      const { data } = await supabase.from('tenants').select('id, estado, fecha_vencimiento').eq('slug', slug).single();
      setLocalTenant(data);
      setLoadingTenant(false);
    }
    fetchTenant();
  }, [slug]);
  
  // Use a default slug if not present (although it should always be present in tenant routes)
  const tenantPath = slug ? `/${slug}` : '/tenant';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    { path: `${tenantPath}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    { path: `${tenantPath}/rifas`, icon: Ticket, label: 'Rifas' },
    { path: `${tenantPath}/compras`, icon: CreditCard, label: 'Compras' },
    { path: `${tenantPath}/participantes`, icon: Users, label: 'Participantes' },
    { path: `${tenantPath}/reportes`, icon: BarChart, label: 'Reportes' },
    { path: `${tenantPath}/configuracion`, icon: Settings, label: 'Config' },
    { path: `${tenantPath}/mensajes`, icon: MessageSquare, label: 'Mensajes' },
    { path: `${tenantPath}/soporte`, icon: LifeBuoy, label: 'Soporte' },
  ];

  if (loadingTenant) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">Cargando área de trabajo...</div>;

  const isInactive = localTenant && ['vencido', 'suspendido', 'cancelado'].includes(localTenant.estado);
  const isBypassed = window.sessionStorage.getItem(`bypass_admin_${slug}`) === 'true';

  if (isInactive && (!isSuperadmin || !isBypassed)) {
    return <LicenciaInactiva estado={localTenant.estado} isSuperadmin={!!isSuperadmin} tenantSlug={slug || ''} />;
  }

  let daysRemaining = null;
  if (localTenant?.fecha_vencimiento) {
    const expiresDate = new Date(localTenant.fecha_vencimiento);
    const timeDiff = expiresDate.getTime() - new Date().getTime();
    daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  const showWarning = localTenant?.estado === 'activo' && daysRemaining !== null && daysRemaining <= 5 && daysRemaining >= 0;

  return (
    <div className={`min-h-screen bg-slate-50 flex ${isBypassed ? 'pt-9' : ''}`}>
      {isBypassed && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-purple-600 text-slate-900 text-center py-2 font-bold text-xs tracking-widest uppercase shadow-lg border-b border-purple-400 shadow-purple-500/20">
           ⚠️ MODO SOPORTE ACTIVO - BYPASS ADMINISTRATIVO ({slug}) ⚠️
        </div>
      )}
      {/* Sidebar (Tenant) basado en el concepto del admin layout extendido */}
      <aside className="w-64 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border-r border-white/50 hidden md:flex flex-col">
        <div className="p-4 flex items-center justify-center border-b border-white/50">
          <Link to={`${tenantPath}/dashboard`}>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">SISTEMA DE EVENTOS</span>
          </Link>
        </div>
        
        <div className="p-4 bg-purple-900/30 text-purple-400 text-xs font-bold uppercase tracking-wider text-center border-b border-white/50 flex flex-col">
          <span>Panel de Cliente</span>
          <span className="text-slate-500 lowercase mt-1 font-normal truncate">/{slug}</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-purple-600 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/50 space-y-2">
          {/* Subscriptions Access */}
          <Link
            to={`${tenantPath}/suscripcion`}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors w-full ${
              isActive(`${tenantPath}/suscripcion`)
                ? 'bg-yellow-600/20 text-yellow-500'
                : 'text-yellow-500/80 hover:bg-yellow-600/10 hover:text-yellow-400'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Mi Suscripción</span>
          </Link>

          <div className="text-xs text-slate-500 mb-4 truncate pt-2" title={user?.email}>
            {user?.email}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (similar to old AdminLayout top nav but for mobile) */}
        <header className="md:hidden bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border-b border-white/50 h-16 flex items-center justify-between px-4">
          <Link to={`${tenantPath}/dashboard`} className="flex items-center">
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">SISTEMA DE EVENTOS</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Link
              to={`${tenantPath}/compras`}
              className="relative text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-slate-900 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  {pendingCount > 9 ? '+9' : pendingCount}
                </span>
              )}
            </Link>
            <button onClick={handleSignOut} className="text-slate-600 hover:text-slate-900">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
          {showWarning && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-yellow-500 font-medium tracking-wide">Atención: Licencia por vencer</h3>
                <p className="text-yellow-400/90 text-sm mt-1">
                  Tu licencia se suspenderá en {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}. Realiza tu pago para evitar bloqueos del sistema.
                </p>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
