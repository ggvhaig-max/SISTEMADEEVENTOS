import { useState } from 'react';
import { X, ChevronLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: {
    id: string;
    nombre: string;
    fecha_sorteo: string;
    precio_por_entrada: number;
    banco_nombre?: string;
    banco_tipo_cuenta?: string;
    banco_numero_cuenta?: string;
    banco_titular?: string;
    banco_documento?: string;
    banco_info_adicional?: string;
    nequi_numero?: string;
    nequi_titular?: string;
    url_pasarela?: string;
    instrucciones_pago?: string;
  };
  quantity: number;
  packageData?: {
    id: string;
    cantidad_entradas: number;
    precio_total: number;
    url_pago?: string;
  } | null;
}

type Step = 1 | 2 | 3 | 4;

export function PurchaseModal({ isOpen, onClose, eventData, quantity, packageData }: PurchaseModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    documento_tipo: 'CC',
    documento_numero: '',
    nombre_comprador: '',
    correo_comprador: '',
    codigo_pais: '+593',
    telefono: '',
    pais: '',
    ciudad: '',
    metodo_pago: 'transferencia',
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const total = quantity * eventData.precio_por_entrada;

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitCustomerInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const telefonoCompleto = `${formData.codigo_pais}${formData.telefono}`;

      const response = await fetch(`${supabaseUrl}/functions/v1/purchase-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evento_id: eventData.id,
          cantidad_entradas: quantity,
          documento_tipo: formData.documento_tipo,
          documento_numero: formData.documento_numero,
          nombre_comprador: formData.nombre_comprador,
          correo_comprador: formData.correo_comprador,
          telefono: telefonoCompleto,
          pais: formData.pais,
          ciudad: formData.ciudad,
          metodo_pago: formData.metodo_pago,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la compra');
      }

      const result = await response.json();
      setPurchaseId(result.compra_id);
      setStep(2);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceipt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiptFile || !purchaseId) {
      toast.error('Debes seleccionar un comprobante');
      return;
    }

    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const formDataUpload = new FormData();
      formDataUpload.append('compra_id', purchaseId);
      formDataUpload.append('file', receiptFile);

      const response = await fetch(`${supabaseUrl}/functions/v1/upload-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
        },
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir comprobante');
      }

      setStep(4);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      documento_tipo: 'CC',
      documento_numero: '',
      nombre_comprador: '',
      correo_comprador: '',
      codigo_pais: '+57',
      telefono: '',
      metodo_pago: 'transferencia',
    });
    setReceiptFile(null);
    setReceiptPreview(null);
    setPurchaseId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep((prev) => (prev - 1) as Step)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                {step === 1 && 'Datos del Comprador'}
                {step === 2 && 'Confirmar Pedido'}
                {step === 3 && 'Comprobante de Pago'}
                {step === 4 && 'Compra Registrada'}
              </h2>
              <p className="text-sm text-gray-400">Paso {step} de 4</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleSubmitCustomerInfo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Documento
                  </label>
                  <select
                    value={formData.documento_tipo}
                    onChange={(e) => setFormData({ ...formData, documento_tipo: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="NIT">NIT</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    value={formData.documento_numero}
                    onChange={(e) => setFormData({ ...formData, documento_numero: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre_comprador}
                  onChange={(e) => setFormData({ ...formData, nombre_comprador: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={formData.correo_comprador}
                  onChange={(e) => setFormData({ ...formData, correo_comprador: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usarás este correo para consultar tus boletas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Teléfono / WhatsApp *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.codigo_pais}
                    onChange={(e) => setFormData({ ...formData, codigo_pais: e.target.value })}
                    className="w-24 px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                    placeholder="+593"
                  />
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '') })}
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3001234567"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ejemplo: 3001234567 (sin espacios ni guiones)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    País *
                  </label>
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Ecuador"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Quito"
                    required
                  />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-2">Resumen</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Cantidad de boletas:</span>
                    <span className="text-white font-semibold">{quantity}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Precio unitario:</span>
                    <span className="text-white">${eventData.precio_por_entrada.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
                    <span className="text-white font-semibold">Total a pagar:</span>
                    <span className="text-blue-400 font-bold text-lg">
                      ${total.toLocaleString()} USD
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Procesando...' : 'Continuar'}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-semibold mb-1">Importante</p>
                    <p>
                      Realiza la transferencia, toma una captura del comprobante de pago y adjúntalo en el siguiente paso.
                      Sin el comprobante, tus boletas no serán enviadas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-3">Detalle de la Compra</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Evento:</span>
                    <span className="text-white font-medium">{eventData.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fecha sorteo:</span>
                    <span className="text-white text-sm">
                      El sorteo se realizará una vez se haya completado la venta total de números
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cantidad:</span>
                    <span className="text-white font-semibold">{quantity} boletas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valor unitario:</span>
                    <span className="text-white">${eventData.precio_por_entrada.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
                    <span className="text-white font-semibold">Total a pagar:</span>
                    <span className="text-blue-400 font-bold text-lg">
                      ${total.toLocaleString()} USD
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Método de Pago
                </label>
                <div className="space-y-3">
                  {eventData.banco_numero_cuenta && (
                    <label className="flex items-start space-x-3 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <input
                        type="radio"
                        name="metodo_pago"
                        value="transferencia"
                        checked={formData.metodo_pago === 'transferencia'}
                        onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-white mb-2">Transferencia Bancaria</div>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p><span className="font-medium text-gray-300">Banco:</span> {eventData.banco_nombre}</p>
                          <p><span className="font-medium text-gray-300">Tipo:</span> {eventData.banco_tipo_cuenta}</p>
                          <p><span className="font-medium text-gray-300">Cuenta:</span> {eventData.banco_numero_cuenta}</p>
                          <p><span className="font-medium text-gray-300">Titular:</span> {eventData.banco_titular}</p>
                          {eventData.banco_documento && (
                            <p><span className="font-medium text-gray-300">Documento:</span> {eventData.banco_documento}</p>
                          )}
                          {eventData.banco_info_adicional && (
                            <p className="text-blue-400 mt-2">{eventData.banco_info_adicional}</p>
                          )}
                        </div>
                      </div>
                    </label>
                  )}

                  {eventData.nequi_numero && (
                    <label className="flex items-start space-x-3 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <input
                        type="radio"
                        name="metodo_pago"
                        value="nequi"
                        checked={formData.metodo_pago === 'nequi'}
                        onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-white mb-2">Nequi</div>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p><span className="font-medium text-gray-300">Número:</span> {eventData.nequi_numero}</p>
                          <p><span className="font-medium text-gray-300">Titular:</span> {eventData.nequi_titular}</p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {(packageData?.url_pago || eventData.url_pasarela) && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-5 border-2 border-blue-400 shadow-lg">
                  <h4 className="text-white font-bold mb-2 text-lg flex items-center">
                    <span className="mr-2">💳</span> Pagar con PayPal
                  </h4>
                  <p className="text-sm text-blue-100 mb-4">
                    Realiza tu pago de forma segura. Después de pagar, sube el comprobante en el siguiente paso.
                  </p>
                  <a
                    href={packageData?.url_pago || eventData.url_pasarela}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 rounded-lg transition-all transform hover:scale-105 shadow-md"
                  >
                    🔒 Pagar Ahora - ${total.toLocaleString()} USD
                  </a>
                </div>
              )}

              {eventData.instrucciones_pago && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-sm text-yellow-200">
                    <span className="font-semibold">Instrucciones:</span> {eventData.instrucciones_pago}
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep(3)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Continuar al Comprobante
              </button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleUploadReceipt} className="space-y-6">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-300">
                    <p className="font-semibold mb-1">Adjunta tu comprobante de pago</p>
                    <p>
                      Realiza la transferencia y toma una captura del comprobante. Adjúntalo aquí para que podamos verificar tu pago.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Comprobante de Pago *
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="receipt-upload"
                    required
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    {receiptPreview ? (
                      <div className="space-y-3">
                        <img
                          src={receiptPreview}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg"
                        />
                        <p className="text-sm text-gray-400">Click para cambiar imagen</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-white font-medium">Selecciona una imagen</p>
                          <p className="text-sm text-gray-400">PNG, JPG, PDF - Max 10MB</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos permitidos: .JPEG, .JPG, .PNG, .PDF
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-white font-semibold mb-2">Total pagado</h3>
                <p className="text-3xl font-bold text-blue-400">
                  ${total.toLocaleString()} USD
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !receiptFile}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Enviando...' : 'Enviar Comprobante de Pago'}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Compra Registrada Exitosamente
                </h3>
                <p className="text-gray-400">
                  Tu comprobante ha sido enviado y está en proceso de revisión
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 text-left border border-gray-700">
                <h4 className="font-semibold text-white mb-3">¿Qué sigue?</h4>
                <ol className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start space-x-2">
                    <span className="font-bold text-blue-400">1.</span>
                    <span>Nuestro equipo revisará tu comprobante de pago</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold text-blue-400">2.</span>
                    <span>Una vez aprobado, recibirás un correo con tus números</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold text-blue-400">3.</span>
                    <span>Podrás consultar tus boletas con tu correo o documento</span>
                  </li>
                </ol>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <span className="font-semibold">Recuerda:</span> Guarda tu correo <span className="font-mono bg-gray-800 px-2 py-1 rounded">{formData.correo_comprador}</span> y documento para consultar tus boletas. También recibirás notificaciones por WhatsApp al <span className="font-mono">{formData.codigo_pais}{formData.telefono}</span>.
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
