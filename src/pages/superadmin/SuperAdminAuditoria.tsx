import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Search, Filter, Database, AlertCircle, Laptop, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const SuperAdminAuditoria = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [origenFilter, setOrigenFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [origenFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('auditoria_acciones')
        .select(`
          *,
          usuarios_plataforma(email, rol),
          tenants(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Para no saturar memoria

      if (origenFilter !== 'todos') {
        query = query.eq('origen', origenFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error('Error al cargar la bitácora: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearDetalles = (detalles: any, accion: string) => {
    if (!detalles) return <span className="text-gray-500 italic">No hay metadata</span>;
    // Pretty print json
    return (
      <div className="bg-gray-900 border border-gray-700 p-2 rounded-lg mt-2 text-xs font-mono text-gray-400 overflow-x-auto">
        <pre>{JSON.stringify(detalles, null, 2)}</pre>
      </div>
    );
  };

  const getSourceBadge = (origen: string) => {
    switch (origen) {
      case 'trigger': return <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border text-purple-400 bg-purple-500/10 border-purple-500/20"><Database className="w-3 h-3"/> BACKEND</span>;
      case 'frontend': return <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border text-blue-400 bg-blue-500/10 border-blue-500/20"><Laptop className="w-3 h-3"/> APP CLIENTE</span>;
      case 'cron': return <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border text-yellow-400 bg-yellow-500/10 border-yellow-500/20"><Clock className="w-3 h-3"/> TAREAS CRON</span>;
      default: return <span className="text-[10px] px-2 py-0.5 rounded border text-gray-400">{origen}</span>;
    }
  };

  const getActionColor = (accion: string) => {
    if (accion.includes('APROBADO')) return 'text-green-400';
    if (accion.includes('RECHAZADO') || accion.includes('CANCELADO')) return 'text-red-400';
    if (accion.includes('SOPORTE')) return 'text-orange-400';
    return 'text-blue-400';
  };

  const filteredLogs = logs.filter(log => 
    log.accion.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.usuarios_plataforma?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.tenants?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-outfit text-white">Auditoría Transaccional</h1>
            <p className="text-gray-400">Trazabilidad de eventos críticos y operaciones del personal</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Filtros */}
        <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={origenFilter}
              onChange={(e) => setOrigenFilter(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:border-blue-500 focus:outline-none w-full sm:w-auto"
            >
              <option value="todos">Todos los Orígenes</option>
              <option value="trigger">Motor SQL (Triggers)</option>
              <option value="frontend">Cliente Frontend</option>
              <option value="cron">Automatización (Cron)</option>
            </select>
          </div>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar acción, correo, o tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Tabla / Lista */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="animate-spin w-8 h-8 flex justify-center items-center rounded-full border-t-2 border-b-2 border-emerald-500 mb-4" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
              <p>No se encontraron registros de auditoría en la base de datos.</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-5 hover:border-gray-600 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center flex-wrap gap-2">
                         {getSourceBadge(log.origen)}
                         <span className="text-gray-500 text-xs flex items-center gap-1 border-l border-gray-700 pl-2">
                           {new Date(log.created_at).toLocaleString()}
                         </span>
                       </div>
                       
                       <h3 className={`font-bold font-mono text-sm tracking-tight ${getActionColor(log.accion)}`}>
                         [{log.accion}]
                       </h3>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3">
                         <div>
                           <span className="text-gray-500 block text-xs uppercase tracking-wider font-bold mb-1">Autor / Responsable</span>
                           {log.usuarios_plataforma ? (
                             <span className="text-gray-300 font-medium">
                               {log.usuarios_plataforma.email} 
                               <span className="ml-2 text-xs text-gray-500 capitalize">({log.usuarios_plataforma.rol})</span>
                             </span>
                           ) : (
                             <span className="text-gray-500 italic">SISTEMA INTERNO</span>
                           )}
                         </div>
                         <div>
                           <span className="text-gray-500 block text-xs uppercase tracking-wider font-bold mb-1">Entidad Afectada</span>
                           <span className="text-gray-300 font-medium border-b border-gray-700 pb-0.5 border-dashed">
                             {log.tenants ? log.tenants.name : log.entidad_tipo.toUpperCase()}
                           </span>
                           <span className="ml-2 text-xs text-gray-500 block sm:inline mt-1 sm:mt-0 font-mono truncate max-w-[150px]" title={log.entidad_id}>
                             # {log.entidad_id}
                           </span>
                         </div>
                       </div>
                    </div>
                    
                    <div className="w-full md:w-[40%] bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2 block">Payload Registrado</span>
                      {formatearDetalles(log.detalles, log.accion)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
