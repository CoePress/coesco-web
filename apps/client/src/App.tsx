import { Routes, Route } from "react-router-dom";
import { Design, Login, MainMenu, NotFound, Sandbox } from "./pages";
import { SocketProvider } from "@/contexts/socket.context";
import { MicrosoftCallback, ProtectedRoute, PublicRoute } from "./components";
import modules from "./config/modules";
import { PerformanceSheetProvider } from "@/contexts/performance.context";

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
        <Route
          path="/sandbox"
          element={<Sandbox />}
        />
        <Route
          path="/design"
          element={<Design />}
        />
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
    <PerformanceSheetProvider>
      <SocketProvider listenTo={[]}>{content}</SocketProvider>
    </PerformanceSheetProvider>
  );
};

export default App;
