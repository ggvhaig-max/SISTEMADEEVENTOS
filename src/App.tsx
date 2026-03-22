import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Layouts
import { SuperAdminLayout } from './components/layouts/SuperAdminLayout';
import { VendedorLayout } from './components/layouts/VendedorLayout';
import { TenantLayout } from './components/layouts/TenantLayout';

// Admin / Tenant pages existentes
import { AdminDashboard } from './pages/admin/Dashboard';
import { EventosPage } from './pages/admin/EventosPage';
import { CreateEventPage } from './pages/admin/CreateEventPage';
import { EditEventPage } from './pages/admin/EditEventPage';
import { EventEntriesPage } from './pages/admin/EventEntriesPage';
import { PurchasesPage } from './pages/admin/PurchasesPage';
import { PrizesPage } from './pages/admin/PrizesPage';
import { WinnersPage } from './pages/admin/WinnersPage';
import { PackagesPage } from './pages/admin/PackagesPage';
import { BlessedNumbersPage } from './pages/admin/BlessedNumbersPage';

// Públicas
import { EventLanding } from './pages/public/EventLanding';
import { MyTicketPage } from './pages/public/MyTicketPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { InstallPWA } from './components/InstallPWA';

// Mocks visuales para rutas pendientes (TODO BD)
const Placeholder = ({ title, desc }: { title: string; desc?: string }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl border border-gray-700 text-center mt-10 max-w-2xl mx-auto shadow-2xl">
    <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
      <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse" />
    </div>
    <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
    <p className="text-gray-400 leading-relaxed">
      {desc || 'Módulo en fase de diseño. En la próxima actualización se conectará con la base de datos para mostrar información real.'}
    </p>
    <div className="mt-8 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
      <span className="text-xs font-mono text-yellow-500">TODO: Backend integration required</span>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <InstallPWA />
        <Routes>
          {/* ====== PUBLIC ====== */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Compatibilidad hacia atrás (rutas viejas publicadas sin tenant) */}
          <Route path="/evento/:eventSlug/mi-boleta" element={<Navigate to="../mis-boletas" replace />} />
          <Route path="/evento/:eventSlug/mis-boletas" element={<MyTicketPage />} />
          <Route path="/evento/:eventSlug" element={<EventLanding />} />

          {/* Rutas Públicas con estructura objetivo (Multi-tenant) */}
          <Route path="/:tenant/evento/:eventSlug/mis-boletas" element={<MyTicketPage />} />
          <Route path="/:tenant/evento/:eventSlug" element={<EventLanding />} />
          {/* ====== SUPERADMIN ====== */}
          <Route path="/superadmin" element={<ProtectedRoute><SuperAdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Placeholder title="SuperAdmin Dashboard" />} />
            <Route path="clientes" element={<Placeholder title="Gestión de Clientes" />} />
            <Route path="vendedores" element={<Placeholder title="Gestión de Vendedores" />} />
            <Route path="pagos" element={<Placeholder title="Control de Pagos" />} />
            <Route path="comisiones" element={<Placeholder title="Distribución de Comisiones" />} />
            <Route path="vencimientos" element={<Placeholder title="Control de Vencimientos" />} />
            <Route path="soporte" element={<Placeholder title="Soporte Plataforma" desc="Sistema de tickets para atender a los clientes de SISTEMADEEVENTOS." />} />
          </Route>

          {/* ====== VENDEDOR ====== */}
          <Route path="/vendedor" element={<ProtectedRoute><VendedorLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Placeholder title="Vendedor Dashboard" />} />
            <Route path="mis-clientes" element={<Placeholder title="Mis Clientes Asignados" />} />
            <Route path="pagos/registrar" element={<Placeholder title="Registrar Pago de Cliente" />} />
            <Route path="comisiones" element={<Placeholder title="Mis Comisiones Acumuladas" />} />
            <Route path="vencimientos" element={<Placeholder title="Vencimientos Próximos" />} />
          </Route>

          {/* ====== CLIENTE / TENANT ====== */}
          <Route path="/:slug" element={<ProtectedRoute><TenantLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            
            <Route path="rifas" element={<EventosPage />} />
            <Route path="rifas/nuevo" element={<CreateEventPage />} />
            <Route path="rifas/:id/editar" element={<EditEventPage />} />
            <Route path="rifas/:id/paquetes" element={<PackagesPage />} />
            <Route path="rifas/:id/bendecidos" element={<BlessedNumbersPage />} />
            <Route path="rifas/:id/boletas" element={<EventEntriesPage />} />
            <Route path="rifas/:id/premios" element={<PrizesPage />} />
            <Route path="rifas/:id/ganadores" element={<WinnersPage />} />
            
            <Route path="compras" element={<PurchasesPage />} />
            
            {/* Nuevos módulos preparados */}
            <Route path="participantes" element={<Placeholder title="Base de Datos de Participantes" />} />
            <Route path="reportes" element={<Placeholder title="Reportes y Estadísticas Avanzadas" />} />
            <Route path="configuracion" element={<Placeholder title="Configuración de Cuenta" />} />
            <Route path="mensajes" element={<Placeholder title="Mensajes a Compradores" desc="Módulo para enviar notificaciones masivas a los participantes de las rifas." />} />
            <Route path="soporte" element={<Placeholder title="Centro de Soporte" desc="Tickets de ayuda con el equipo de SISTEMADEEVENTOS." />} />
            <Route path="suscripcion" element={
              <Placeholder title="Estado de Suscripción" desc="Mantén tu suscripción al día para no pausar tus eventos." />
            } />

            {/* Redirección para links internos hardcodeados que apuntaban a /admin/eventos y /admin/purchases */}
            <Route path="eventos/*" element={<Navigate to="../rifas" replace />} />
            <Route path="purchases" element={<Navigate to="../compras" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
