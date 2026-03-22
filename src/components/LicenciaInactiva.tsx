import { ShieldAlert, CreditCard, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface LicenciaInactivaProps {
  estado: string;
  isSuperadmin: boolean;
  tenantSlug: string;
}

export function LicenciaInactiva({ estado, isSuperadmin, tenantSlug }: LicenciaInactivaProps) {

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className={`p-4 rounded-full ${estado === 'suspendido' || estado === 'cancelado' ? 'bg-red-100' : 'bg-orange-100'}`}>
            <ShieldAlert className={`w-12 h-12 ${estado === 'suspendido' || estado === 'cancelado' ? 'text-red-600' : 'text-orange-600'}`} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Licencia {estado.charAt(0).toUpperCase() + estado.slice(1)}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {estado === 'vencido' 
            ? 'El período de servicio contratado ha concluido. Por favor, regulariza tu suscripción para restablecer el acceso total a las herramientas de venta.'
            : 'El acceso a esta área de trabajo ha sido revocado. Contacta al equipo de soporte.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          <div className="space-y-6">
            {!isSuperadmin && (
              <button
                onClick={() => {
                  // Lógica para enviar al Checkout o mostrar la info del comercial
                  toast('Contacta a tu asesor de ventas o realiza el pago.');
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-slate-900 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Renovar Licencia Ahora
              </button>
            )}

            {isSuperadmin && (
              <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ShieldAlert className="h-5 w-5 text-orange-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Modo Soporte (Bypass Activo)</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Esta agencia está suspendida. Como SuperAdmin, tienes autorización para evadir esta pantalla y auditar sus datos, pero las políticas RLS te impedirán crear eventos en su nombre.
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          onClick={() => {
                            // Se inyecta un estado temporal o flag para saltar el muro en la vista actual
                            window.sessionStorage.setItem(`bypass_admin_${tenantSlug}`, 'true');
                            window.location.reload();
                          }}
                          className="px-3 py-2 bg-blue-100 text-blue-800 text-xs font-semibold rounded hover:bg-blue-200 transition-colors flex items-center"
                        >
                          Entrar en Modo Lectura <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
