import {
  LucideIcon,
  UsersIcon,
  BarChart,
  SettingsIcon,
  Factory,
  Box,
  Shield,
  Clock,
  DollarSign,
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
const Settings = lazy(() => import("@/pages/admin/settings"));
const Employees = lazy(() => import("@/pages/admin/employees"));
const SalesDashboard = lazy(() => import("@/pages/sales/dashboard"));
const Company = lazy(() => import("@/pages/company"));
const Catalog = lazy(() => import("@/pages/sales/catalog"));
const ConfigBuilder = lazy(() => import("@/pages/sales/config-builder"));

const salesModule: Module = {
  sequence: 1,
  slug: "sales",
  label: "Sales",
  icon: DollarSign,
  status: "active" as const,
  pages: [
    {
      slug: null,
      label: "Dashboard",
      icon: BarChart,
      component: SalesDashboard,
    },
    {
      slug: "company",
      label: "Company",
      icon: UsersIcon,
      component: Company,
    },
    {
      slug: "catalog",
      label: "Catalog",
      icon: Box,
      component: Catalog,
    },
    {
      slug: "config-builder",
      label: "Config Builder",
      icon: Box,
      component: ConfigBuilder,
    },
  ],
};

const productionModule: Module = {
  sequence: 2,
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
  ],
};

const adminModule: Module = {
  sequence: 3,
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

const modules: Module[] = [productionModule, salesModule, adminModule]
  .filter(
    (module) =>
      module.status === "active" || (__dev__ && module.status === "development")
  )
  .sort((a, b) => a.sequence - b.sequence);

export default modules;
