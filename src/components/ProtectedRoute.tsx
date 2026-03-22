import { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<'superadmin' | 'vendedor' | 'cliente'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, tenant, loading } = useAuth();
  const { slug } = useParams();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.rol)) {
    if (profile.rol === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />;
    if (profile.rol === 'vendedor') return <Navigate to="/vendedor/dashboard" replace />;
    if (profile.rol === 'cliente' && tenant) return <Navigate to={`/${tenant.slug}/dashboard`} replace />;
    return <Navigate to="/login" replace />;
  }

  // Tenant access verification (Clients cannot visit other tenants, but Superadmins can for support)
  if (profile.rol === 'cliente' && slug && tenant && tenant.slug !== slug) {
    return <Navigate to={`/${tenant.slug}/dashboard`} replace />;
  }

  return <>{children}</>;
}
