import { Routes, Route } from "react-router-dom";
import {
  Design,
  Login,
  MainMenu,
  NotFound,
  Performance,
  Sandbox,
} from "./pages";
import { SocketProvider } from "@/contexts/socket.context";
import { MicrosoftCallback, ProtectedRoute, PublicRoute } from "./components";
import modules from "./config/modules";

const App = () => {
  const content = (
    <Routes>
      <Route
        path="/sample"
        element={<div>Sample</div>}
      />
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
              {module.pages.map((page) => (
                <Route
                  key={page.slug || "index"}
                  path={page.slug || ""}
                  element={<page.component />}
                />
              ))}
            </Route>
          ))}
      </Route>
      <Route element={<ProtectedRoute withLayout={true} />}>
        <Route
          path="/sandbox"
          element={<Sandbox />}
        />
        <Route
          path="/performance"
          element={<Performance />}
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
              {module.pages.map((page) => (
                <Route
                  key={page.slug || "index"}
                  path={page.slug || ""}
                  element={<page.component />}
                />
              ))}
            </Route>
          ))}
      </Route>
    </Routes>
  );

  return <SocketProvider listenTo={[]}>{content}</SocketProvider>;
};

export default App;
