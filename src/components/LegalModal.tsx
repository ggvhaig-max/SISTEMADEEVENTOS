import { X } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function LegalModal({ isOpen, onClose, title, content }: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/50 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/50">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="text-slate-600 prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        <div className="p-6 border-t border-white/50">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 font-semibold py-3 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
