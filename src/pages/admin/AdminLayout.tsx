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
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-8 flex-1 min-w-0">
              <Link to="/admin" className="flex items-center space-x-2 flex-shrink-0">
                <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">SISTEMA DE EVENTOS</span>
              </Link>

              <div className="flex space-x-1 sm:space-x-4">
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${
                    isActive('/admin') && location.pathname === '/admin'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
                className="relative flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                title="Compras Pendientes"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
                <span className="hidden sm:inline text-sm">Notificaciones</span>
              </Link>
              <span className="text-xs sm:text-sm text-gray-400 hidden md:inline truncate max-w-[120px] lg:max-w-none">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
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
