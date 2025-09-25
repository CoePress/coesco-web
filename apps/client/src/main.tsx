import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/auth.context.tsx";
import { AppProvider } from "./contexts/app.context.tsx";
import { ThemeProvider } from "./contexts/theme.context.tsx";
import { SocketProvider } from "./contexts/socket.context.tsx";
import { ToastProvider } from "./contexts/toast.context.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    {/* <AuthProvider>
      <SocketProvider>
        <ThemeProvider>
          <AppProvider>
            <ToastProvider> */}
              <App />
            {/* </ToastProvider>
          </AppProvider>
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider> */}
  </BrowserRouter>
);

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/sw.js")
//       .then((reg) => console.log("Service Worker registered:", reg))
//       .catch((err) => console.error("Service Worker registration failed:", err));
//   });
// }
