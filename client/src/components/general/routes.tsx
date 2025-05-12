import { Navigate, Outlet } from "react-router-dom";

import Layout from "./layout";
import Loader from "./loader";
import { useAuth } from "@/contexts/auth.context";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const PublicRoute = () => {
  const { employee, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (employee) {
    if (employee.isActive === false) {
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
  const { employee, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!employee) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (employee.isActive === false) {
    return (
      <Navigate
        to="/request-access"
        replace
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(employee.role)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  return (
    <Layout employee={employee}>
      <Outlet />
    </Layout>
  );
};

export const ProtectedRouteWithoutLayout = () => {
  const { employee, isLoading } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  if (!employee) {
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
