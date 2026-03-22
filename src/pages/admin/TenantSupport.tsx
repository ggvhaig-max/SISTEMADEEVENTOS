import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, Send, X } from 'lucide-react';
import { toast } from 'sonner';

export const TenantSupport = () => {
  const { user, tenant } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // New Ticket Form
  const [asunto, setAsunto] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [primerMensaje, setPrimerMensaje] = useState('');

  // Reply Form
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (tenant) {
      fetchTickets();
    }
  }, [tenant]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      // Auto-refresh mensajes cada 10 seg si esta abierto
      const interval = setInterval(() => {
        fetchMessages(selectedTicket.id, true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets_soporte')
        .select(`
          *,
          creador:creado_por(email)
        `)
        .eq('tenant_id', tenant?.id)
        .order('ultimo_mensaje_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast.error('Error al cargar los tickets: ' + error.message);
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asunto || !primerMensaje) return toast.error('Completa los campos requeridos');

    try {
      // 1. Crear Ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets_soporte')
        .insert({
          tenant_id: tenant?.id,
          creado_por: user?.id,
          asunto,
          prioridad
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Crear Primer Mensaje
      const { error: msgError } = await supabase
        .from('mensajes_ticket')
        .insert({
          ticket_id: ticket.id,
          usuario_id: user?.id,
          mensaje: primerMensaje,
          is_staff_reply: false
        });

      if (msgError) throw msgError;

      toast.success('Ticket creado exitosamente');
      setIsModalOpen(false);
      setAsunto('');
      setPrimerMensaje('');
      fetchTickets();
    } catch (error: any) {
      toast.error('Error al crear ticket: ' + error.message);
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
          is_staff_reply: false
        });

      if (error) throw error;

      setReplyText('');
      fetchMessages(selectedTicket.id);
      fetchTickets(); // Para actualizar ultimo_mensaje_at listado
    } catch (error: any) {
      toast.error('Error al enviar respuesta: ' + error.message);
    }
  };

  const getStatusColor = (estado: string) => {
    switch(estado) {
      case 'abierto': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'en_proceso': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'resuelto': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cerrado': return 'bg-gray-500/10 text-slate-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-slate-400 border-gray-500/20';
    }
  };

  const getPriorityIcon = (prioridad: string) => {
    switch(prioridad) {
      case 'urgente': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'alta': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'media': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'baja': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Cargando tickets...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-slate-900">Centro de Soporte</h1>
          <p className="text-slate-500">Gestiona tus consultas y requerimientos técnicos</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo Ticket
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Lado Izquierdo: Lista de Tickets */}
        <div className={`w-1/3 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl border border-white/50 flex flex-col overflow-hidden ${selectedTicket ? 'hidden md:flex' : 'w-full'}`}>
          <div className="p-4 border-b border-white/50 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm/50">
            <h2 className="font-semibold text-slate-900">Mis Tickets ({tickets.length})</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
            {tickets.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No tienes tickets abiertos.</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedTicket?.id === ticket.id 
                      ? 'bg-orange-500/10 border-orange-500/50' 
                      : 'bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm/50 border-white/50/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(ticket.estado)} uppercase tracking-wider`}>
                      {ticket.estado.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.ultimo_mensaje_at).toLocaleDateString()}
                    </div>
                  </div>
                  <h3 className="text-slate-900 font-medium truncate">{ticket.asunto}</h3>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 capitalize">
                    {getPriorityIcon(ticket.prioridad)}
                    Prioridad {ticket.prioridad}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Lado Derecho: Hilo de Mensajes */}
        {selectedTicket && (
          <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl border border-white/50 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/50 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm/50 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg text-slate-900">{selectedTicket.asunto}</h2>
                <div className="flex gap-3 text-sm mt-1">
                  <span className={`px-2 rounded border ${getStatusColor(selectedTicket.estado)} uppercase text-xs font-medium`}>
                    {selectedTicket.estado.replace('_', ' ')}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1 capitalize">
                    {getPriorityIcon(selectedTicket.prioridad)} {selectedTicket.prioridad}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="md:hidden text-slate-500 hover:text-slate-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
              {messages.map(msg => {
                const isMine = msg.usuario_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl p-4 ${
                      isMine ? 'bg-orange-500 text-slate-900 rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}>
                      {!isMine && (
                        <div className="text-xs font-medium text-blue-300 mb-1 flex items-center gap-2">
                          STAFF SOPORTE
                          {msg.is_staff_reply && <CheckCircle className="w-3 h-3" />}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm">{msg.mensaje}</p>
                      <span className="text-[10px] text-slate-900/50 block mt-2 text-right">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedTicket.estado !== 'cerrado' ? (
              <form onSubmit={handleReply} className="p-4 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border-t border-white/50 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="flex-1 bg-slate-50 border border-white/50 rounded-lg px-4 py-2 text-slate-900 placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-slate-900 p-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            ) : (
              <div className="p-4 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm border-t border-white/50 text-center text-slate-400 text-sm">
                Este ticket ha sido cerrado. Si requieres más ayuda abre uno nuevo.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Nuevo Ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-xl max-w-md w-full border border-white/50 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm/50">
              <h2 className="text-xl font-bold text-slate-900">Nuevo Ticket de Soporte</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Asunto *</label>
                <input
                  type="text"
                  required
                  value={asunto}
                  onChange={e => setAsunto(e.target.value)}
                  placeholder="Ej: Problemas configurando el pago"
                  className="w-full bg-slate-50 border border-white/50 rounded-lg px-4 py-2.5 text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Prioridad</label>
                <select
                  value={prioridad}
                  onChange={e => setPrioridad(e.target.value)}
                  className="w-full bg-slate-50 border border-white/50 rounded-lg px-4 py-2.5 text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                >
                  <option value="baja">Baja - Duda general</option>
                  <option value="media">Media - Falla menor</option>
                  <option value="alta">Alta - Falla grave (afecta ventas)</option>
                  <option value="urgente">Urgente - Sistema caído o pagos rotos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Detalle del problema *</label>
                <textarea
                  required
                  value={primerMensaje}
                  onChange={e => setPrimerMensaje(e.target.value)}
                  placeholder="Describe el problema con el mayor detalle posible..."
                  rows={4}
                  className="w-full bg-slate-50 border border-white/50 rounded-lg px-4 py-2.5 text-slate-900 resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-slate-900 rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-blue-500/20 font-medium"
                >
                  Crear Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
