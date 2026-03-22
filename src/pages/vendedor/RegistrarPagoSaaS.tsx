import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CreditCard, Save } from 'lucide-react';
import { toast } from 'sonner';

export function RegistrarPagoSaaS() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    tenant_id: '',
    tipo: 'alta',
    plan: 'basico',
    monto_pagado: '',
    dias_a_activar: '30'
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase.from('tenants').select('id, nombre, estado').order('nombre');
      if (error) throw error;
      setTenants(data || []);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenant_id || !formData.monto_pagado) return toast.error('Completa los datos');

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('pagos_saas' as any).insert({
        tenant_id: formData.tenant_id,
        registrado_por: userData.user?.id,
        vendedor_id: userData.user?.id,
        tipo: formData.tipo,
        plan: formData.plan,
        monto_pagado: parseFloat(formData.monto_pagado),
        dias_a_activar: parseInt(formData.dias_a_activar, 10),
        estado: 'pendiente'
      } as any);

      if (error) throw error;
      toast.success('Pago registrado con éxito. Esperando aprobación del Superadmin.');
      setFormData({ ...formData, monto_pagado: '', tenant_id: '' });
    } catch (err: any) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-900">Cargando...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-8 h-8 text-orange-500" />
        <h1 className="text-2xl font-bold text-slate-900">Registrar Venta SaaS</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm p-6 rounded-xl border border-white/50 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">Cliente / Negocio</label>
          <select 
            className="w-full bg-slate-50 border border-white/50 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-orange-500"
            value={formData.tenant_id}
            onChange={e => setFormData({ ...formData, tenant_id: e.target.value })}
            required
          >
            <option value="">Selecciona un negocio...</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.nombre} ({t.estado})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Tipo de Venta</label>
            <select 
              className="w-full bg-slate-50 border border-white/50 rounded-lg px-4 py-3 text-slate-900"
              value={formData.tipo}
              onChange={e => setFormData({ ...formData, tipo: e.target.value })}
            >
              <option value="alta">Alta Nueva (Apertura)</option>
              <option value="renovacion">Renovación</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Plan Vendido</label>
            <select 
              className="w-full bg-slate-50 border border-white/50 rounded-lg px-4 py-3 text-slate-900"
              value={formData.plan}
              onChange={e => setFormData({ ...formData, plan: e.target.value })}
            >
              <option value="basico">Básico</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Monto Cobrado ($)</label>
            <input 
              type="number"
              min="0"
              step="0.01"
              className="w-full bg-slate-50 border border-white/50 rounded-lg px-4 py-3 text-slate-900"
              value={formData.monto_pagado}
              onChange={e => setFormData({ ...formData, monto_pagado: e.target.value })}
              required
              placeholder="Ej. 150000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Días a Activar</label>
            <select 
              className="w-full bg-slate-50 border border-white/50 rounded-lg px-4 py-3 text-slate-900"
              value={formData.dias_a_activar}
              onChange={e => setFormData({ ...formData, dias_a_activar: e.target.value })}
            >
              <option value="30">1 Mes (30 días)</option>
              <option value="90">3 Meses (90 días)</option>
              <option value="180">6 Meses (180 días)</option>
              <option value="365">1 Año (365 días)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-white/50">
          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? 'Registrando...' : <><Save className="w-5 h-5" /> Registrar Venta en Sistema</>}
          </button>
        </div>
      </form>
    </div>
  );
}
