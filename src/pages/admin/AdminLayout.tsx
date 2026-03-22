import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Ticket, LayoutDashboard, Calendar, LogOut, Bell } from 'lucide-react';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { pendingCount } = useAdminNotifications(true);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border-b border-white/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-8 flex-1 min-w-0">
              <Link to="/admin" className="flex items-center space-x-2 flex-shrink-0">
                <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">SISTEMA DE EVENTOS</span>
              </Link>

              <div className="flex space-x-1 sm:space-x-4">
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${
                    isActive('/admin') && location.pathname === '/admin'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Dashboard</span>
                </Link>

                <Link
                  to="/admin/eventos"
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${
                    isActive('/admin/eventos')
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Eventos"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Eventos</span>
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Link
                to="/admin/purchases"
                className="relative flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Compras Pendientes"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
                <span className="hidden sm:inline text-sm">Notificaciones</span>
              </Link>
              <span className="text-xs sm:text-sm text-slate-500 hidden md:inline truncate max-w-[120px] lg:max-w-none">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Salir"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
