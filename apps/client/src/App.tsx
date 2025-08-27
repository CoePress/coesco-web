import { Routes, Route } from "react-router-dom";
import { SocketProvider } from "@/contexts/socket.context";
import { MicrosoftCallback, ProtectedRoute, PublicRoute } from "./components";
import modules from "./config/modules";
import MainMenu from "./pages/main-menu";
import NotFound from "./pages/not-found";
import Login from "./pages/login";
import ChatPage from "./pages/utility/chat";

const generateAllRoutes = (pages: any[], moduleSlug: string) => {
  const routes: any[] = [];

  pages.forEach((page) => {
    if (page.slug) {
      routes.push(
        <Route
          key={`${moduleSlug}-${page.slug}`}
          path={page.slug}
          element={<page.component />}
        />
      );
    } else {
      routes.push(
        <Route
          key={`${moduleSlug}-index`}
          path=""
          element={<page.component />}
        />
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
          />
        );
      });
    }
  });

  return routes;
};

const App = () => {
  const content = (
    <Routes>
      <Route
        path="/callback"
        element={<MicrosoftCallback />}
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
        <Route
          path="*"
          element={<NotFound />}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["ADMIN"]}
            withLayout={true}
          />
        }>
        <Route
          path="/chat"
          element={<ChatPage />}
        />
        <Route
          path="/chat/:id"
          element={<ChatPage />}
        />
        {modules
          .filter((module) => module.slug === "admin")
          .map((module) => (
            <Route
              key={module.slug}
              path={`/${module.slug}`}>
              {generateAllRoutes(module.pages, module.slug)}
            </Route>
          ))}
      </Route>

      <Route element={<ProtectedRoute withLayout={true} />}>
        {modules
          .filter((module) => module.slug !== "admin")
          .map((module) => (
            <Route
              key={module.slug}
              path={`/${module.slug}`}>
              {generateAllRoutes(module.pages, module.slug)}
            </Route>
          ))}
      </Route>
    </Routes>
  );

  return (
    <SocketProvider>{content}</SocketProvider>
  );
};

export default App;
