import {
  DollarSign,
  FileText,
  Kanban,
  LucideIcon,
  Package,
  UsersIcon,
  BarChart,
  User,
  PieChart,
  Folders,
  Settings as SettingsIcon,
  Wrench,
  Factory,
  Box,
  Warehouse,
  Shield,
} from "lucide-react";
import { ComponentType } from "react";

import {
  Employees,
  MachineStates,
  ProductionDashboard,
  ProductRules,
  SalesCatalog,
  SalesConfigBuilder,
  SalesCustomerDetails,
  SalesCustomers,
  SalesDashboard,
  SalesPipeline,
  SalesQuoteDetails,
  SalesQuotes,
  SalesReports,
  Settings,
} from "@/pages";

import PopupWindow from "@/components/shared/popup-window";

export type Module = {
  path: string;
  label: string;
  icon: LucideIcon;
  status: "active" | "inactive";
  pages: Page[];
  popups: Popup[];
};

export type Page = {
  path: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
  children?: Page[];
};

export type Popup = {
  path: string;
  component: ComponentType;
};

const salesModule: Module = {
  path: "/sales",
  label: "Sales",
  icon: DollarSign,
  status: "active",
  pages: [
    {
      path: "/",
      label: "Dashboard",
      icon: BarChart,
      component: SalesDashboard,
    },
    {
      path: "/pipeline",
      label: "Pipeline",
      icon: Kanban,
      component: SalesPipeline,
    },
    {
      path: "/quotes",
      label: "Quotes",
      icon: FileText,
      component: SalesQuotes,
      children: [
        {
          path: "/:id",
          label: "Quote Details",
          icon: FileText,
          component: SalesQuoteDetails,
        },
      ],
    },
    {
      path: "/customers",
      label: "Customers",
      icon: UsersIcon,
      component: SalesCustomers,
      children: [
        {
          path: "/:id",
          label: "Customer Details",
          icon: User,
          component: SalesCustomerDetails,
        },
      ],
    },
    {
      path: "/catalog",
      label: "Catalog",
      icon: Package,
      component: SalesCatalog,
      children: [
        {
          path: "/builder",
          label: "Builder",
          icon: Folders,
          component: SalesConfigBuilder,
        },
      ],
    },
    {
      path: "/reports",
      label: "Reports",
      icon: PieChart,
      component: SalesReports,
      children: [],
    },
  ],
  popups: [
    {
      path: "/popup",
      component: PopupWindow,
    },
  ],
};

const warehouseModule: Module = {
  path: "/warehouse",
  label: "Warehouse",
  icon: Warehouse,
  status: "inactive",
  pages: [],
  popups: [],
};
const serviceModule: Module = {
  path: "/service",
  label: "Service",
  icon: Wrench,
  status: "inactive",
  pages: [],
  popups: [],
};

const productionModule: Module = {
  path: "/production",
  label: "Production",
  icon: Factory,
  status: "active",
  pages: [
    {
      path: "/",
      label: "Dashboard",
      icon: BarChart,
      component: ProductionDashboard,
    },
    {
      path: "/machine-states",
      label: "Machine States",
      icon: Box,
      component: MachineStates,
    },
  ],
  popups: [],
};

const adminModule: Module = {
  path: "/admin",
  label: "Admin",
  icon: Shield,
  status: "active",
  pages: [
    {
      path: "/",
      label: "Settings",
      icon: SettingsIcon,
      component: Settings,
    },
    {
      path: "/employees",
      label: "Employees",
      icon: UsersIcon,
      component: Employees,
    },
    {
      path: "/product-rules",
      label: "Product Rules",
      icon: FileText,
      component: ProductRules,
    },
  ],
  popups: [],
};

const modules = {
  salesModule,
  productionModule,
  serviceModule,
  adminModule,
};

export default modules;
