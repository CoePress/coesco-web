import {
  Box,
  DatabaseZap,
  DoorOpen,
  Home,
  LucideIcon,
  Pen,
  Settings,
  Users,
} from "lucide-react";
import { lazy } from "react";

export interface RouteConfig {
  label: string;
  path: string;
  element: React.LazyExoticComponent<React.ComponentType<any>>;
  icon: LucideIcon;
  sidebar: boolean;
}

const LoginPage = lazy(() => import("../pages/login"));
const DashboardPage = lazy(() => import("../pages/dashboard"));
const MachinesPage = lazy(() => import("../pages/machines"));
const UsersPage = lazy(() => import("../pages/users"));
const SettingsPage = lazy(() => import("../pages/settings"));
const StateExplorerPage = lazy(() => import("../pages/states"));
const ToolingDatabasePage = lazy(() => import("../pages/tooling"));
const NewDashboard = lazy(() => import("../pages/new-dashboard"));

export const routes: Record<string, RouteConfig[]> = {
  public: [
    {
      label: "Login",
      path: "/login",
      element: LoginPage,
      icon: DoorOpen,
      sidebar: false,
    },
  ],
  protected: [
    {
      label: "Dashboard",
      path: "/dashboard",
      element: DashboardPage,
      icon: Home,
      sidebar: true,
    },
    {
      label: "States",
      path: "/states",
      element: StateExplorerPage,
      icon: DatabaseZap,
      sidebar: true,
    },
    {
      label: "Machines",
      path: "/machines",
      element: MachinesPage,
      icon: Box,
      sidebar: true,
    },
    {
      label: "Tooling",
      path: "/tooling",
      element: ToolingDatabasePage,
      icon: Pen,
      sidebar: true,
    },
  ],
  admin: [
    {
      label: "Users",
      path: "/users",
      element: UsersPage,
      icon: Users,
      sidebar: true,
    },
    {
      label: "Settings",
      path: "/settings",
      element: SettingsPage,
      icon: Settings,
      sidebar: true,
    },
  ],
};
