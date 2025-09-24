import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/auth.context.tsx";
import { AppProvider } from "./contexts/app.context.tsx";
import { ThemeProvider } from "./contexts/theme.context.tsx";
import { SocketProvider } from "./contexts/socket.context.tsx";

// Unregister any existing service workers during development
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('Service Worker unregistered');
    }
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
