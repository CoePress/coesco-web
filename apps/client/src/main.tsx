import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/auth.context.tsx";
import { AppProvider } from "./contexts/app.context.tsx";
import { ThemeProvider } from "./contexts/theme.context.tsx";
import { SocketProvider } from "./contexts/socket.context.tsx";
import serviceWorkerManager from "./utils/service-worker-manager";

// Register service worker
if ('serviceWorker' in navigator) {
  serviceWorkerManager.register().then((registration) => {
    if (registration) {
      console.log('Service Worker registered successfully');
    }
  }).catch((error) => {
    console.error('Service Worker registration failed:', error);
  });
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);
