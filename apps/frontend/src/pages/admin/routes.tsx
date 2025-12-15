import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const UsersPage = lazy(() => import("./users"));

export function AdminRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="users" element={<UsersPage />} />
      </Routes>
    </Suspense>
  );
}
