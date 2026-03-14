import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const styles = {
  success: 'bg-white dark:bg-gray-900 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
  error: 'bg-white dark:bg-gray-900 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  info: 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
};

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => {
          const IconComp = icons[toast.type] || icons.info;
          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl shadow-gray-300/30 border text-sm font-medium animate-slide-up ${styles[toast.type] || styles.info}`}
            >
              <IconComp className={`h-5 w-5 flex-shrink-0 ${iconStyles[toast.type]}`} />
              <span className="flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
