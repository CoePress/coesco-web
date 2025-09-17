import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastData = {
  id: string;
  title?: string;
  message: string;
  variant?: "success" | "error" | "warning" | "info";
  duration?: number;
};

export type AddToastOptions = Omit<ToastData, "id"> & {
  id?: string;
};

interface ToastContextType {
  toasts: ToastData[];
  addToast: (options: AddToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (message: string, options?: Omit<AddToastOptions, "message" | "variant">) => string;
  error: (message: string, options?: Omit<AddToastOptions, "message" | "variant">) => string;
  warning: (message: string, options?: Omit<AddToastOptions, "message" | "variant">) => string;
  info: (message: string, options?: Omit<AddToastOptions, "message" | "variant">) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

type ToastProviderProps = {
  children: React.ReactNode;
};

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((options: AddToastOptions) => {
    const id = options.id || Math.random().toString(36).substring(7);
    const toast: ToastData = {
      id,
      variant: "info",
      duration: 5000,
      ...options,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different variants
  const success = useCallback((message: string, options?: Omit<AddToastOptions, "message" | "variant">) => {
    return addToast({ ...options, message, variant: "success" });
  }, [addToast]);

  const error = useCallback((message: string, options?: Omit<AddToastOptions, "message" | "variant">) => {
    return addToast({ ...options, message, variant: "error" });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Omit<AddToastOptions, "message" | "variant">) => {
    return addToast({ ...options, message, variant: "warning" });
  }, [addToast]);

  const info = useCallback((message: string, options?: Omit<AddToastOptions, "message" | "variant">) => {
    return addToast({ ...options, message, variant: "info" });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};