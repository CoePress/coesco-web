import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { AuthProvider } from "./contexts/auth-context.tsx";
import { AppProvider } from "./contexts/app-context.tsx";
import { ThemeProvider } from "./contexts/theme-context.tsx";
import { SocketProvider } from "./contexts/socket-context.tsx";
import "./index.css";

const Root = () => {
  return (
    <StrictMode>
      <AuthProvider>
        <AppProvider>
          <ThemeProvider>
            <SocketProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </SocketProvider>
          </ThemeProvider>
        </AppProvider>
      </AuthProvider>
    </StrictMode>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
