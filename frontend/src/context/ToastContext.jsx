import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: 'bi-check-circle-fill',
  danger: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const showToast = useCallback(
    (message, variant = 'success', duration = 4000) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      timers.current[id] = setTimeout(() => removeToast(id), duration);
      return id;
    },
    [removeToast]
  );

  const value = {
    showToast,
    removeToast,
    success: (message) => showToast(message, 'success'),
    error: (message) => showToast(message, 'danger'),
    info: (message) => showToast(message, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="dhms-toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`dhms-toast dhms-toast-${toast.variant}`} role="status">
            <i className={`bi ${ICONS[toast.variant] || ICONS.info}`} />
            <span className="flex-grow-1">{toast.message}</span>
            <button
              type="button"
              className="btn-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
