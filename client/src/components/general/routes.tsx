import { Navigate, Outlet } from "react-router-dom";

import Layout from "./layout";
import Loader from "../shared/loader";
import { useAuth } from "@/contexts/auth.context";
import { EmployeeRole } from "@/utils/types";
interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const PublicRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <Loader />
      </div>
    );
  }

  if (user) {
    if (user.role === EmployeeRole.INACTIVE) {
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
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
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

  if (user.role === EmployeeRole.INACTIVE) {
    return (
      <Navigate
        to="/request-access"
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

  return (
    <Layout user={user}>
      <Outlet />
    </Layout>
  );
};

export const ProtectedRouteWithoutLayout = () => {
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
};

export const AdminRoute = () => {
  return <ProtectedRoute allowedRoles={["admin"]} />;
};
