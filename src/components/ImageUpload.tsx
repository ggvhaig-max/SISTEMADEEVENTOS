import { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  recommendedSize?: string;
  description?: string;
}

export function ImageUpload({ value, onChange, disabled, recommendedSize, description }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('La imagen no puede superar los 5MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      const path = value.split('/').slice(-1)[0];
      await supabase.storage.from('event-images').remove([path]);
      onChange(null);
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-white/50 bg-slate-50">
          <img
            src={value}
            alt="Preview"
            className="w-full h-64 object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white shadow-md rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full h-64 border-2 border-dashed border-white/50 rounded-lg bg-slate-50 hover:bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm transition-colors flex flex-col items-center justify-center space-y-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
              <span className="text-slate-500">Subiendo imagen...</span>
            </>
          ) : (
            <>
              <div className="p-4 bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-full">
                <ImageIcon className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-slate-600 font-medium mb-1">
                  Haz clic para subir una imagen
                </p>
                <p className="text-sm text-slate-400">
                  PNG, JPG o WEBP (máx. 5MB)
                </p>
                {recommendedSize && (
                  <p className="text-xs text-orange-500 font-semibold mt-2">
                    Recomendado: {recommendedSize}
                  </p>
                )}
              </div>
              <Upload className="w-5 h-5 text-slate-400" />
            </>
          )}
        </button>
      )}

      {description && (
        <p className="text-xs text-slate-500 italic">
          {description}
        </p>
      )}
    </div>
  );
}
