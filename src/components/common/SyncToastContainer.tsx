import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X, ExternalLink, RefreshCw } from 'lucide-react';
import { subscribeToSyncToasts, SyncToastEvent } from '../../services/googleSheetsSync';

interface SyncToastContainerProps {
  onOpenSheetsModal: () => void;
}

export const SyncToastContainer: React.FC<SyncToastContainerProps> = ({ onOpenSheetsModal }) => {
  const [toasts, setToasts] = useState<SyncToastEvent[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToSyncToasts((toast) => {
      setToasts((prev) => [...prev.slice(-3), toast]); // keep at most 4 toasts

      if (toast.duration !== 0) {
        const timeout = setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== toast.id));
        }, toast.duration || (toast.type === 'success' ? 2000 : 6000));
        return () => clearTimeout(timeout);
      }
    });

    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error' || toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all transform translate-y-0 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              isSuccess
                ? 'bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/40 text-white'
                : isError
                ? 'bg-rose-950/95 border-rose-500/50 text-white'
                : 'bg-slate-900/90 border-slate-700 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
              {isError && <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
              <div className="text-xs font-medium leading-relaxed">
                {toast.message}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {toast.actionLabel && (
                <button
                  type="button"
                  onClick={() => {
                    removeToast(toast.id);
                    onOpenSheetsModal();
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-slate-950 hover:bg-slate-100 shadow-xs transition-colors cursor-pointer"
                >
                  {toast.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="ปิด"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
