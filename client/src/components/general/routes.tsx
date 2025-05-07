import { Navigate, Outlet } from "react-router-dom";

import Layout from "./layout";
import Loader from "./loader";
import { useAuth } from "@/contexts/auth.context";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const PublicRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (user) {
    if (user.isActive === false) {
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
      <div className="h-screen w-screen flex items-center justify-center">
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

  if (user.isActive === false) {
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
    return <Loader />;
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
