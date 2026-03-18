import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { requestNotificationPermission, showNotification } from '../utils/pwa';

export const useAdminNotifications = (isAdmin: boolean) => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    requestNotificationPermission();

    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('entradas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente');

      if (!error && count !== null) {
        setPendingCount(count);
      }
    };

    fetchPendingCount();

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'entradas',
          filter: 'estado=eq.pendiente'
        },
        async (payload) => {
          console.log('Nueva compra pendiente:', payload);

          setPendingCount((prev) => prev + 1);

          const hasPermission = await requestNotificationPermission();

          if (hasPermission) {
            showNotification('Nueva Compra Pendiente', {
              body: `Se ha recibido una nueva compra que requiere confirmación`,
              tag: 'pending-purchase',
              requireInteraction: true,
              data: {
                url: '/admin/purchases',
                type: 'pending-purchase'
              }
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'entradas',
          filter: 'estado=eq.confirmada'
        },
        () => {
          setPendingCount((prev) => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  return { pendingCount };
};
