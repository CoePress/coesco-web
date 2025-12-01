import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/contexts/auth.context";

import Loader from "../ui/loader";
import Layout from "./layout";

interface ProtectedRouteProps {
  allowedRoles?: string[];
  withLayout?: boolean;
}

export function PublicRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <Loader />
      </div>
    );
  }

  if (user) {
    if (user.role === "INACTIVE") {
      return (
        <Navigate
          to="/request-access"
          replace
        />
      );
    }
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}

export function ProtectedRoute({
  allowedRoles,
  withLayout = true,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  if (!withLayout) {
    return <Outlet />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export function ProtectedRouteWithoutLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}

export function AdminRoute() {
  return <ProtectedRoute allowedRoles={["ADMIN"]} />;
}
