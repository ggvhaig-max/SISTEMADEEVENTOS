import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Toaster } from 'sonner';

// Layouts
import { SuperAdminLayout } from './components/layouts/SuperAdminLayout';
import { VendedorLayout } from './components/layouts/VendedorLayout';
import { TenantLayout } from './components/layouts/TenantLayout';

// Admin / Tenant pages
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
import { TenantSupport } from './pages/admin/TenantSupport';

// Públicas
import { LandingPage } from './pages/public/LandingPage';
import { EventLanding } from './pages/public/EventLanding';
import { MyTicketPage } from './pages/public/MyTicketPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { InstallPWA } from './components/InstallPWA';

// Vistas Fase 3 SaaS & Vendedor
import { SuperAdminPagos } from './pages/superadmin/SuperAdminPagos';
import { SuperAdminComisiones } from './pages/superadmin/SuperAdminComisiones';
import { VendedorTenants } from './pages/vendedor/VendedorTenants';
import { RegistrarPagoSaaS } from './pages/vendedor/RegistrarPagoSaaS';
import { VendedorComisiones } from './pages/vendedor/VendedorComisiones';
import { VendedorDashboard } from './pages/vendedor/VendedorDashboard';

// Vistas SuperAdmin
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { SuperAdminTenants } from './pages/superadmin/SuperAdminTenants';
import { SuperAdminTickets } from './pages/superadmin/SuperAdminTickets';
import { SuperAdminAuditoria } from './pages/superadmin/SuperAdminAuditoria';

// Mocks visuales
const Placeholder = ({ title, desc }: { title: string; desc?: string }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-xl border border-gray-700 text-center mt-10 max-w-2xl mx-auto shadow-2xl">
    <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
      <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse" />
    </div>
    <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
    <p className="text-gray-400 leading-relaxed">
      {desc || 'Módulo bajo construcción.'}
    </p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <InstallPWA />
        <Toaster position="top-right" richColors />
        <Routes>
          {/* ====== PUBLIC ====== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/evento/:eventSlug/mi-boleta" element={<Navigate to="../mis-boletas" replace />} />
          <Route path="/evento/:eventSlug/mis-boletas" element={<MyTicketPage />} />
          <Route path="/evento/:eventSlug" element={<EventLanding />} />
          
          <Route path="/:tenant/evento/:eventSlug/mis-boletas" element={<MyTicketPage />} />
          <Route path="/:tenant/evento/:eventSlug" element={<EventLanding />} />

          {/* ====== SUPERADMIN ====== */}
          <Route path="/superadmin" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="clientes" element={<SuperAdminTenants />} />
            <Route path="pagos" element={<SuperAdminPagos />} />
            <Route path="comisiones" element={<SuperAdminComisiones />} />
            <Route path="vendedores" element={<Placeholder title="Gestión de Vendedores" desc="Módulo en construcción" />} />
            <Route path="vencimientos" element={<Placeholder title="Control de Vencimientos" desc="Módulo en construcción" />} />
            <Route path="soporte" element={<SuperAdminTickets />} />
            <Route path="auditoria" element={<SuperAdminAuditoria />} />
          </Route>

          {/* ====== VENDEDOR ====== */}
          <Route path="/vendedor" element={<ProtectedRoute allowedRoles={['vendedor']}><VendedorLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<VendedorDashboard />} />
            <Route path="mis-clientes" element={<VendedorTenants />} />
            <Route path="pagos/registrar" element={<RegistrarPagoSaaS />} />
            <Route path="comisiones" element={<VendedorComisiones />} />
            <Route path="vencimientos" element={<Placeholder title="Vencimientos Próximos" />} />
          </Route>

          {/* ====== CLIENTE / TENANT ====== */}
          <Route path="/:slug" element={<ProtectedRoute allowedRoles={['cliente', 'superadmin']}><TenantLayout /></ProtectedRoute>}>
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
            
            <Route path="participantes" element={<Placeholder title="Base de Datos de Participantes" />} />
            <Route path="reportes" element={<Placeholder title="Reportes y Estadísticas Avanzadas" />} />
            <Route path="configuracion" element={<Placeholder title="Configuración de Cuenta" />} />
            <Route path="mensajes" element={<Placeholder title="Mensajes a Compradores" />} />
            <Route path="soporte" element={<TenantSupport />} />
            <Route path="suscripcion" element={<Placeholder title="Estado de Suscripción" />} />

            <Route path="eventos/*" element={<Navigate to="../rifas" replace />} />
            <Route path="purchases" element={<Navigate to="../compras" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
