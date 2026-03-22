import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, AlertTriangle, CheckCircle, Clock, CreditCard, DollarSign } from 'lucide-react';

export function VendedorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClientes: 0,
    activos: 0,
    vencidos: 0,
    pagosRegistrados: 0,
    comisionesPorCobrar: 0,
    comisionesCobradas: 0,
  });

  useEffect(() => {
    if (user?.id) fetchDashboardStats();
  }, [user?.id]);

  const fetchDashboardStats = async () => {
    try {
      if (!user) return;

      // Fetch Clientes Asignados
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('estado')
        .eq('vendedor_id', user.id) as any;
      if (tenantsError) throw tenantsError;

      // Fetch Pagos Registrados por este Vendedor
      const { data: pagos, error: pagosError } = await supabase
        .from('pagos_saas')
        .select('estado')
        .eq('vendedor_id', user.id) as any;
      if (pagosError) throw pagosError;

      // Fetch Comisiones
      const { data: comisiones, error: comisionesError } = await supabase
        .from('comisiones_vendedores')
        .select('estado, monto_comision')
        .eq('vendedor_id', user.id) as any;
      if (comisionesError) throw comisionesError;

      const calcStats = {
        totalClientes: tenants?.length || 0,
        activos: tenants?.filter((t: any) => t.estado === 'activo' || t.estado === 'prueba').length || 0,
        vencidos: tenants?.filter((t: any) => t.estado === 'vencido').length || 0,
        
        pagosRegistrados: pagos?.length || 0,
        
        comisionesPorCobrar: comisiones?.filter((c: any) => c.estado === 'por_pagar').reduce((acc: number, curr: any) => acc + Number(curr.monto_comision), 0) || 0,
        comisionesCobradas: comisiones?.filter((c: any) => c.estado === 'pagado').reduce((acc: number, curr: any) => acc + Number(curr.monto_comision), 0) || 0,
      };

      setStats(calcStats);
    } catch (error) {
      console.error('Error fetching seller dashboard stats:', error);
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
        <h1 className="text-2xl font-bold text-slate-900">Mi Resumen de Ventas</h1>
        <button 
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm text-sm text-slate-600 rounded-lg hover:bg-slate-100 transition"
        >
          Actualizar Datos
        </button>
      </div>

      <h2 className="text-lg font-medium text-slate-600 border-b border-white/50 pb-2 mt-8">Mis Cuentas B2B Centralizadas</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Clientes Asignados" value={stats.totalClientes} icon={<Users className="w-6 h-6 text-orange-500" />} />
        <StatCard title="Activos / En Prueba" value={stats.activos} icon={<CheckCircle className="w-6 h-6 text-green-400" />} />
        <StatCard title="Vencidos / Apagados" value={stats.vencidos} icon={<AlertTriangle className="w-6 h-6 text-red-400" />} />
        <StatCard title="Pagos Registrados" value={stats.pagosRegistrados} icon={<CreditCard className="w-6 h-6 text-purple-400" />} />
      </div>

      <h2 className="text-lg font-medium text-slate-600 border-b border-white/50 pb-2 mt-8">Estado de Mis Liquidaciones</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Comisiones Por Cobrar" value={formatCurrency(stats.comisionesPorCobrar)} icon={<Clock className="w-6 h-6 text-yellow-400" />} />
        <StatCard title="Comisiones Listas (Cobradas)" value={formatCurrency(stats.comisionesCobradas)} icon={<DollarSign className="w-6 h-6 text-green-400" />} />
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
