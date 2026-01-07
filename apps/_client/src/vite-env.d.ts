/// <reference types="vite/client" />

interface Window {
  Sentry?: {
    captureException: (error: Error, context?: any) => void;
  };
}
