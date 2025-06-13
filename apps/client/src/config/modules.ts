import {
  LucideIcon,
  UsersIcon,
  BarChart,
  // PieChart,
  SettingsIcon,
  Factory,
  Box,
  Shield,
  Clock,
} from "lucide-react";
import { ComponentType, lazy } from "react";

import { __dev__ } from "./env";

export type Module = {
  sequence: number;
  slug: string;
  label: string;
  icon: LucideIcon;
  status: "active" | "inactive" | "development";
  pages: Page[];
};

export type Page = {
  slug: string | null;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
  children?: Page[];
};

const ProductionDashboard = lazy(() => import("@/pages/production/dashboard"));
const Machines = lazy(() => import("@/pages/production/machines"));
const MachineHistory = lazy(() => import("@/pages/production/machine-history"));
// const Reports = lazy(() => import("@/pages/production/reports"));
const Settings = lazy(() => import("@/pages/admin/settings"));
const Employees = lazy(() => import("@/pages/admin/employees"));

const productionModule: Module = {
  sequence: 1,
  slug: "production",
  label: "Production",
  icon: Factory,
  status: "active" as const,
  pages: [
    {
      slug: null,
      label: "Dashboard",
      icon: BarChart,
      component: ProductionDashboard,
    },
    {
      slug: "machines",
      label: "Machines",
      icon: Box,
      component: Machines,
    },
    {
      slug: "machine-history",
      label: "Machine History",
      icon: Clock,
      component: MachineHistory,
    },
    // {
    //   slug: "reports",
    //   label: "Reports",
    //   icon: PieChart,
    //   component: Reports,
    // },
  ],
};

const adminModule: Module = {
  sequence: 2,
  slug: "admin",
  label: "Admin",
  icon: Shield,
  status: "active" as const,
  pages: [
    {
      slug: null,
      label: "Settings",
      icon: SettingsIcon,
      component: Settings,
    },
    {
      slug: "employees",
      label: "Employees",
      icon: UsersIcon,
      component: Employees,
    },
  ],
};

const modules: Module[] = [productionModule, adminModule]
  .filter(
    (module) =>
      module.status === "active" || (__dev__ && module.status === "development")
  )
  .sort((a, b) => a.sequence - b.sequence);

export default modules;
