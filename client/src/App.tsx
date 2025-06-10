import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import modules from "./config/modules";
import {
  ChatPLK,
  Design,
  Login,
  MainMenu,
  NotFound,
  Performance,
} from "./pages";
import { SocketProvider } from "@/contexts/socket.context";
import { PublicRoute, ProtectedRoute, MicrosoftCallback } from "./components";
import { ProtectedRouteWithoutLayout } from "./components/general/routes";
import { __dev__ } from "./config/env";

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
    routes: RouteItem[]
  ): React.ReactNode[] => {
    return routes
      .map((route) => {
        const fullPath = `${basePath}${route.path}`;
        const element = <route.component />;

        return [
          <Route
            key={fullPath}
            path={fullPath}
            element={element}
          />,
          ...(route.children ? generateRoutes(fullPath, route.children) : []),
        ];
      })
      .flat();
  };

  const moduleRoutes = Object.values(modules)
    .filter((module: Module) => module.status !== "inactive")
    .map((module: Module) => [
      <Route
        key={module.path}
        path={module.path}
        element={<Outlet />}
      />,
      ...(module.pages ? generateRoutes(module.path, module.pages) : []),
      ...(module.popups ? generateRoutes(module.path, module.popups) : []),
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
        <Route
          path="/callback"
          element={<MicrosoftCallback />}
        />
      </Route>

      <Route element={<ProtectedRouteWithoutLayout />}>
        <Route
          path="/"
          element={<MainMenu />}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        {moduleRoutes}

        {__dev__ && (
          <>
            <Route
              path="/chat"
              element={<ChatPLK />}
            />
            <Route
              path="/design"
              element={<Design />}
            />
            <Route
              path="/sandbox"
              element={<Performance />}
            />
          </>
        )}
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
