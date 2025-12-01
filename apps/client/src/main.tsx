import { PostHogProvider } from "posthog-js/react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import ErrorBoundary from "./components/error-boundary.tsx";
import { __dev__, env } from "./config/env.ts";
import { AppProvider } from "./contexts/app.context.tsx";
import { AuthProvider } from "./contexts/auth.context.tsx";
import { SocketProvider } from "./contexts/socket.context.tsx";
import { ThemeProvider } from "./contexts/theme.context.tsx";
import { ToastProvider } from "./contexts/toast.context.tsx";
import { initOutbox } from "./services/outbox-init.ts";

const options = {
  api_host: env.VITE_PUBLIC_POSTHOG_HOST,
};

initOutbox();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider>
            <AppProvider>
              <ToastProvider>
                {!__dev__
                  ? (
                      <PostHogProvider apiKey={env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
                        <App />
                      </PostHogProvider>
                    )
                  : (
                      <App />
                    )}
              </ToastProvider>
            </AppProvider>
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>,
);

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/sw.js")
//       .then((reg) => console.log("Service Worker registered:", reg))
//       .catch((err) => console.error("Service Worker registration failed:", err));
//   });
// }
