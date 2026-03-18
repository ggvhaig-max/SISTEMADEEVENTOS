import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLayout } from './pages/admin/AdminLayout';
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
import { EventLanding } from './pages/public/EventLanding';
import { MyTicketPage } from './pages/public/MyTicketPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { InstallPWA } from './components/InstallPWA';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <InstallPWA />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="eventos" element={<EventosPage />} />
            <Route path="eventos/nuevo" element={<CreateEventPage />} />
            <Route path="eventos/:id/editar" element={<EditEventPage />} />
            <Route path="eventos/:id/paquetes" element={<PackagesPage />} />
            <Route path="eventos/:id/bendecidos" element={<BlessedNumbersPage />} />
            <Route path="eventos/:id/boletas" element={<EventEntriesPage />} />
            <Route path="eventos/:id/compras" element={<PurchasesPage />} />
            <Route path="eventos/:id/premios" element={<PrizesPage />} />
            <Route path="eventos/:id/ganadores" element={<WinnersPage />} />
            <Route path="purchases" element={<Navigate to="/admin" replace />} />
          </Route>

          <Route path="/evento/:slug" element={<EventLanding />} />
          <Route path="/evento/:slug/mi-boleta" element={<MyTicketPage />} />

          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
