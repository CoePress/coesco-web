import { Routes, Route, Navigate } from "react-router-dom";
import useTheme from "./hooks/context/use-theme";
import { Suspense, useEffect } from "react";
import Loader from "./components/shared/loader";
import NotFoundPage from "./pages/not-found";

import { routes } from "./lib/config";
import {
  AdminRoute,
  ProtectedRoute,
  PublicRoute,
} from "./components/general/routes";

const App = () => {
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !document.activeElement?.matches("input") &&
        (event.key === "t" || event.key === "T")
      ) {
        event.preventDefault();
        toggleTheme();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<PublicRoute />}>
          {routes.public.map(({ path, element: Element }) => (
            <Route
              key={path}
              path={path}
              element={<Element />}
            />
          ))}
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          {routes.protected.map(({ path, element: Element }) => (
            <Route
              key={path}
              path={path}
              element={<Element />}
            />
          ))}
        </Route>

        <Route element={<AdminRoute />}>
          {routes.admin.map(({ path, element: Element }) => (
            <Route
              key={path}
              path={path}
              element={<Element />}
            />
          ))}
        </Route>

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </Suspense>
  );
};

export default App;
