import { Route, Routes } from "react-router-dom";

import { MicrosoftCallback, ProtectedRoute, PublicRoute } from "./components";
import { __dev__ } from "./config/env";
import modules from "./config/modules";
import { useSessionMonitor } from "./hooks/use-session-monitor";
import { RecentChats, Resources, Settings } from "./pages";
import ChangePassword from "./pages/general/change-password";
import ForgotPassword from "./pages/general/forgot-password";
import Login from "./pages/general/login";
import MainMenu from "./pages/general/main-menu";
import NotFound from "./pages/general/not-found";
import ChatPage from "./pages/utility/chat";

function generateAllRoutes(pages: any[], moduleSlug: string) {
  const routes: any[] = [];

  pages.forEach((page) => {
    if (page.slug) {
      routes.push(
        <Route
          key={`${moduleSlug}-${page.slug}`}
          path={page.slug}
          element={<page.component />}
        />,
      );
    }
    else {
      routes.push(
        <Route
          key={`${moduleSlug}-index`}
          path=""
          element={<page.component />}
        />,
      );
    }

    if (page.children) {
      page.children.forEach((child: any) => {
        const childPath = page.slug ? `${page.slug}/${child.slug}` : child.slug;
        routes.push(
          <Route
            key={`${moduleSlug}-${childPath}`}
            path={childPath}
            element={<child.component />}
          />,
        );
      });
    }
  });

  return routes;
}

function SessionMonitor() {
  useSessionMonitor();
  return null;
}

function App() {
  return (
    <>
      <SessionMonitor />
      <Routes>
        <Route
          path="/callback"
          element={<MicrosoftCallback />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route element={<PublicRoute />}>
          <Route
            path="/login"
            element={<Login />}
          />
        </Route>
        <Route element={<ProtectedRoute withLayout={false} />}>
          <Route
            path="/"
            element={<MainMenu />}
          />
        </Route>

        <Route
          element={(
            <ProtectedRoute
              allowedRoles={["ADMIN"]}
              withLayout={true}
            />
          )}
        >
          {modules
            .filter(module => module.slug === "admin")
            .map(module => (
              <Route
                key={module.slug}
                path={`/${module.slug}`}
              >
                {generateAllRoutes(module.pages, module.slug)}
              </Route>
            ))}
        </Route>

        <Route element={<ProtectedRoute withLayout={true} />}>
          {__dev__ && (
            <>
              <Route
                path="/chat"
                element={<ChatPage />}
              />
              <Route
                path="/chat/resources"
                element={<Resources />}
              />
              <Route
                path="/chat/recent"
                element={<RecentChats />}
              />
              <Route
                path="/chat/c/:id"
                element={<ChatPage />}
              />

            </>
          )}
          <Route
            path="/settings"
            element={<Settings />}
          />
          <Route
            path="/settings/change-password"
            element={<ChangePassword />}
          />
          {modules
            .filter(module => module.slug !== "admin")
            .map(module => (
              <Route
                key={module.slug}
                path={`/${module.slug}`}
              >
                {generateAllRoutes(module.pages, module.slug)}
              </Route>
            ))}
        </Route>

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </>
  );
}

export default App;
