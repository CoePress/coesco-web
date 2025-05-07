import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { Layout } from "./components";
import modules from "./config/modules";
import { ChatPLK, Login, MainMenu, NotFound } from "./pages";
import Home from "./pages/website/home";
import Example from "./pages/website/example";
import Design from "./pages/design";
import { SocketProvider } from "@/contexts/socket.context";
import { PublicRoute, ProtectedRoute } from "./components";

interface RouteItem {
  path: string;
  component: React.ComponentType;
  children?: RouteItem[];
}

interface Module {
  path: string;
  status: string;
  pages?: RouteItem[];
  popups?: RouteItem[];
}

const App = () => {
  const location = useLocation();

  const generateRoutes = (
    basePath: string,
    routes: RouteItem[],
    withLayout: boolean = false
  ): React.ReactNode[] => {
    return routes
      .map((route) => {
        const fullPath = `${basePath}${route.path}`;
        const element = withLayout ? (
          <Layout>
            <route.component />
          </Layout>
        ) : (
          <route.component />
        );

        return [
          <Route
            key={fullPath}
            path={fullPath}
            element={element}
          />,
          ...(route.children
            ? generateRoutes(fullPath, route.children, true)
            : []),
        ];
      })
      .flat();
  };

  const moduleRoutes = Object.values(modules)
    .filter((module: Module) => module.status === "active")
    .map((module: Module) => [
      <Route
        key={module.path}
        path={module.path}
        element={<Outlet />}
      />,
      ...(module.pages ? generateRoutes(module.path, module.pages, true) : []),
      ...(module.popups
        ? generateRoutes(module.path, module.popups, false)
        : []),
    ])
    .flat();

  const getSocketEvents = (pathname: string, search: string) => {
    if (pathname === "/production") {
      const params = new URLSearchParams(search);
      if (params.has("startDate") || params.has("endDate")) {
        return ["machine_states"];
      }
      return ["machine_states", "production_overview"];
    }
    return [];
  };

  const listenTo = getSocketEvents(location.pathname, location.search);

  const content = (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route
          path="/login"
          element={<Login />}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          path="/"
          element={<MainMenu />}
        />
        <Route
          path="/chat"
          element={<ChatPLK />}
        />
        <Route
          path="/website"
          element={<Home />}
        />
        <Route
          path="/website/example"
          element={<Example />}
        />
        <Route
          path="/design"
          element={<Design />}
        />
        {moduleRoutes}
      </Route>

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );

  return <SocketProvider listenTo={listenTo}>{content}</SocketProvider>;
};

export default App;
