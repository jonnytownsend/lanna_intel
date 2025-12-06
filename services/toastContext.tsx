
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    
    // Auto remove after 5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`
              pointer-events-auto min-w-[300px] max-w-sm rounded-lg shadow-2xl p-4 border flex items-start gap-3 animate-in slide-in-from-right-full transition-all
              ${toast.type === 'success' ? 'bg-slate-900 border-green-500 text-green-500' : ''}
              ${toast.type === 'error' ? 'bg-slate-900 border-red-500 text-red-500' : ''}
              ${toast.type === 'warning' ? 'bg-slate-900 border-yellow-500 text-yellow-500' : ''}
              ${toast.type === 'info' ? 'bg-slate-900 border-blue-500 text-blue-500' : ''}
            `}
          >
            <div className="mt-1">
               {toast.type === 'success' && <CheckCircle size={18}/>}
               {toast.type === 'error' && <AlertCircle size={18}/>}
               {toast.type === 'warning' && <AlertTriangle size={18}/>}
               {toast.type === 'info' && <Info size={18}/>}
            </div>
            <div className="flex-1">
               <h4 className="font-bold text-sm text-slate-200">{toast.title}</h4>
               <p className="text-xs text-slate-400 mt-1">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-white">
               <X size={14}/>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
