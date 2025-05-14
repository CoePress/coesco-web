import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/auth.context.tsx";
import { AppProvider } from "./contexts/app.context.tsx";
import { ThemeProvider } from "./contexts/theme.context.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <AppProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);

// this is a client side test 2
