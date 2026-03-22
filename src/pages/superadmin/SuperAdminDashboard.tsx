import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, AlertTriangle, CheckCircle, Clock, CreditCard, DollarSign, XCircle, Shield } from 'lucide-react';

export function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activos: 0,
    prueba: 0,
    vencidos: 0,
    suspendidos: 0,
    pagosPendientes: 0,
    pagosAprobados: 0,
    comisionesPorPagar: 0,
    comisionesPagadas: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch Tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('estado') as any;
      if (tenantsError) throw tenantsError;

      // Fetch Pagos
      const { data: pagos, error: pagosError } = await supabase
        .from('pagos_saas')
        .select('estado, monto') as any;
      if (pagosError) throw pagosError;

      // Fetch Comisiones
      const { data: comisiones, error: comisionesError } = await supabase
        .from('comisiones_vendedores')
        .select('estado, monto_comision') as any;
      if (comisionesError) throw comisionesError;

      // Calcular
      const calcStats = {
        totalTenants: tenants?.length || 0,
        activos: tenants?.filter((t: any) => t.estado === 'activo').length || 0,
        prueba: tenants?.filter((t: any) => t.estado === 'prueba').length || 0,
        vencidos: tenants?.filter((t: any) => t.estado === 'vencido').length || 0,
        suspendidos: tenants?.filter((t: any) => t.estado === 'suspendido').length || 0,
        cancelados: tenants?.filter((t: any) => t.estado === 'cancelado').length || 0,
        
        pagosPendientes: pagos?.filter((p: any) => p.estado === 'pendiente').length || 0,
        pagosAprobados: pagos?.filter((p: any) => p.estado === 'aprobado').length || 0,
        
        comisionesPorPagar: comisiones?.filter((c: any) => c.estado === 'por_pagar').reduce((acc: number, curr: any) => acc + Number(curr.monto_comision), 0) || 0,
        comisionesPagadas: comisiones?.filter((c: any) => c.estado === 'pagado').reduce((acc: number, curr: any) => acc + Number(curr.monto_comision), 0) || 0,
      };

      setStats(calcStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">SuperAdmin Dashboard</h1>
        <button 
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm text-sm text-slate-600 rounded-lg hover:bg-slate-100 transition"
        >
          Actualizar Datos
        </button>
      </div>

      {/* Tenants Stats */}
      <h2 className="text-lg font-medium text-slate-600 border-b border-white/50 pb-2 mt-8">Licencias y Clientes</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Clientes" value={stats.totalTenants} icon={<Users className="w-6 h-6 text-orange-500" />} />
        <StatCard title="En Prueba" value={stats.prueba} icon={<Clock className="w-6 h-6 text-purple-400" />} />
        <StatCard title="Activos" value={stats.activos} icon={<CheckCircle className="w-6 h-6 text-green-400" />} />
        <StatCard title="Vencidos" value={stats.vencidos} icon={<AlertTriangle className="w-6 h-6 text-yellow-400" />} />
        <StatCard title="Suspendidos" value={stats.suspendidos} icon={<XCircle className="w-6 h-6 text-red-400" />} />
      </div>

      {/* Pagos Stats */}
      <h2 className="text-lg font-medium text-slate-600 border-b border-white/50 pb-2 mt-8">Operativa Financiera</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pagos Pendientes" value={stats.pagosPendientes} icon={<CreditCard className="w-6 h-6 text-yellow-400" />} />
        <StatCard title="Pagos Aprobados" value={stats.pagosAprobados} icon={<Shield className="w-6 h-6 text-green-400" />} />
        <StatCard title="Comisiones Por Pagar" value={formatCurrency(stats.comisionesPorPagar)} icon={<DollarSign className="w-6 h-6 text-orange-400" />} />
        <StatCard title="Comisiones Pagadas" value={formatCurrency(stats.comisionesPagadas)} icon={<DollarSign className="w-6 h-6 text-orange-500" />} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm overflow-hidden shadow rounded-lg border border-white/50 relative group hover:border-gray-500 transition-colors">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-slate-50 rounded-md p-3">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-500 truncate">{title}</dt>
              <dd className="text-2xl font-semibold text-slate-900 mt-1">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
