import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./layout";
import { AdminRoutes } from "../pages/admin/routes";

export function AppRouter() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="*" element={<div>Not found</div>} />
      </Routes>
    </Layout>
  );
}
