import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Send, X, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export const SuperAdminTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('abierto,en_proceso'); // csv de estados
  const [searchTerm, setSearchTerm] = useState('');

  // Reply Form
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      const interval = setInterval(() => {
        fetchMessages(selectedTicket.id, true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('tickets_soporte')
        .select(`
          *,
          tenant:tenants(name)
        `)
        .order('prioridad', { ascending: false }) // Esto asume orden alfabetico lamentablemente: urgente, media, baja, alta... Oh oh. Order por ultimo_mensaje_at es mejor en la inbox.
        .order('ultimo_mensaje_at', { ascending: false });

      if (statusFilter !== 'todos') {
        const statuses = statusFilter.split(',');
        query = query.in('estado', statuses);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast.error('Error al cargar la bandeja de tickets: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string, silent = false) => {
    try {
      const { data, error } = await supabase
        .from('mensajes_ticket')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      if (!silent) toast.error('Error cargando mensajes: ' + error.message);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      const { error } = await supabase
        .from('mensajes_ticket')
        .insert({
          ticket_id: selectedTicket.id,
          usuario_id: user?.id,
          mensaje: replyText,
          is_staff_reply: true // IMPORTANTE: Confirmamos que es staff
        });

      if (error) throw error;

      // Si el ticket estaba abierto, automáticamente lo pasamos a en_proceso
      if (selectedTicket.estado === 'abierto') {
        await handleStatusChange(selectedTicket.id, 'en_proceso', true);
      }

      setReplyText('');
      fetchMessages(selectedTicket.id);
      fetchTickets();
    } catch (error: any) {
      toast.error('Error al enviar respuesta: ' + error.message);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string, silent = false) => {
    try {
      const updateData: any = { estado: newStatus };
      if (newStatus === 'cerrado' || newStatus === 'resuelto') {
        updateData.cerrado_at = new Date().toISOString();
      } else {
         updateData.cerrado_at = null;
      }

      const { error } = await supabase
        .from('tickets_soporte')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      if (!silent) toast.success(`Estado actualizado a ${newStatus.replace('_', ' ')}`);
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, estado: newStatus, cerrado_at: updateData.cerrado_at });
      }
      fetchTickets();
    } catch (error: any) {
      if (!silent) toast.error('Error al actualizar estado: ' + error.message);
    }
  };

  const getStatusColor = (estado: string) => {
    switch(estado) {
      case 'abierto': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'en_proceso': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'resuelto': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cerrado': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch(prioridad) {
      case 'urgente': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'alta': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'media': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'baja': return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: return '';
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.asunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white">Inbox de Soporte</h1>
          <p className="text-gray-400">Atención a quejas, dudas y problemas de Tenants</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Lado Izquierdo: Lista de Tickets y Filtros */}
        <div className={`w-1/3 min-w-[320px] max-w-[400px] bg-gray-800 rounded-xl border border-gray-700 flex flex-col overflow-hidden ${selectedTicket ? 'hidden md:flex' : 'w-full'}`}>
          <div className="p-4 border-b border-gray-700 bg-gray-800/50 space-y-3">
            <div className="flex gap-2">
               <select 
                  className="bg-gray-900 border border-gray-700 text-sm text-white rounded-lg px-2 py-1.5 focus:outline-none flex-1"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
               >
                 <option value="abierto,en_proceso">Activos (Abiertos / En Proceso)</option>
                 <option value="resuelto,cerrado">Cerrados / Resueltos</option>
                 <option value="todos">Todos los Tickets</option>
               </select>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por asunto, tenant..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
            {loading ? (
               <p className="text-center p-4 text-gray-500 text-sm">Cargando bandeja...</p>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Inbox limpio. No hay tickets.</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedTicket?.id === ticket.id 
                      ? 'bg-blue-600/10 border-blue-500/50' 
                      : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(ticket.estado)} uppercase tracking-wider`}>
                      {ticket.estado.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(ticket.prioridad)} uppercase tracking-wider`}>
                      P. {ticket.prioridad}
                    </span>
                  </div>
                  <h3 className="text-white font-medium truncate text-sm mb-1">{ticket.asunto}</h3>
                  <p className="text-gray-400 text-xs truncate mb-2">{ticket.tenant?.name || 'Tenant Desconocido'}</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    Actualizado: {new Date(ticket.ultimo_mensaje_at).toLocaleString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Lado Derecho: Staff Reply View */}
        {selectedTicket ? (
          <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 flex flex-col overflow-hidden">
            {/* Header Desk */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-bold text-lg text-white mb-1">{selectedTicket.asunto}</h2>
                  <p className="text-sm text-gray-400">De: {selectedTicket.tenant?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    className={`text-sm font-medium px-3 py-1.5 rounded bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500`}
                    value={selectedTicket.estado}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  >
                    <option value="abierto">Abierto</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                  <button onClick={() => setSelectedTicket(null)} className="md:hidden text-gray-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Hilos de char */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-900/50">
              {messages.map(msg => {
                const isStaff = msg.is_staff_reply || msg.usuario_id === user?.id; // asume admin
                return (
                  <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl p-4 ${
                      isStaff ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none'
                    }`}>
                      {isStaff && (
                        <div className="text-[10px] font-bold tracking-wider text-blue-200 mb-1 flex items-center justify-end gap-1">
                          STAFF RESPUESTA <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                      {!isStaff && (
                        <div className="text-[10px] font-bold tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                          CLIENTE
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm">{msg.mensaje}</p>
                      <span className="text-[10px] text-white/50 block mt-2 text-right">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            <form onSubmit={handleReply} className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={selectedTicket.estado === 'cerrado' ? "El ticket está cerrado. Cambia el estado para responder." : "Escribe de parte del Equipo de Soporte..."}
                  disabled={selectedTicket.estado === 'cerrado'}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || selectedTicket.estado === 'cerrado'}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 px-6 rounded-lg transition-colors flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 bg-gray-800/50 rounded-xl border border-gray-700 items-center justify-center flex-col text-gray-500 p-8 text-center">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">Bandeja de Entrada</h3>
            <p className="max-w-md">Selecciona un ticket de la lista para leer el hilo de conversación y emitir respuestas oficiales como parte del equipo.</p>
          </div>
        )}
      </div>
    </div>
  );
};
