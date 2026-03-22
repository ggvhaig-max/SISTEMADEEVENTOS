import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, CreditCard, DollarSign, CalendarDays, LogOut } from 'lucide-react';

export function VendedorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    { path: '/vendedor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/vendedor/mis-clientes', icon: Users, label: 'Mis Clientes' },
    { path: '/vendedor/pagos/registrar', icon: CreditCard, label: 'Registrar Pago' },
    { path: '/vendedor/comisiones', icon: DollarSign, label: 'Comisiones' },
    { path: '/vendedor/vencimientos', icon: CalendarDays, label: 'Vencimientos' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar (Vendedor) */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 hidden md:flex flex-col">
        <div className="p-4 flex items-center justify-center border-b border-gray-700">
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">SISTEMA DE EVENTOS</span>
        </div>
        
        <div className="p-4 bg-green-900/30 text-green-400 text-xs font-bold uppercase tracking-wider text-center border-b border-gray-700">
          Portal de Vendedor
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-4 truncate" title={user?.email}>
            {user?.email}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 text-gray-300 hover:text-white w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-gray-800 border-b border-gray-700 h-16 flex items-center justify-between px-4">
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">SISTEMA DE EVENTOS</span>
          <div className="text-green-400 text-xs font-bold uppercase">Vendedor</div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-900 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
