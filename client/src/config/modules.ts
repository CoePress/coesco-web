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
  Factory,
  Box,
  Warehouse,
  Shield,
  Map,
  Clock,
} from "lucide-react";
import { ComponentType } from "react";

import {
  Employees,
  MachineHistory,
  Machines,
  ProductionDashboard,
  ProductRules,
  Reports,
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
  WarehouseMap,
} from "@/pages";

import PopupWindow from "@/components/shared/popup-window";
import { __dev__ } from "./env";

export type Module = {
  sequence: number;
  path: string;
  label: string;
  icon: LucideIcon;
  status: "active" | "inactive" | "development";
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
  sequence: 1,
  path: "/sales",
  label: "Sales",
  icon: DollarSign,
  status: "development",
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
  sequence: 2,
  path: "/warehouse",
  label: "Warehouse",
  icon: Warehouse,
  status: "development",
  pages: [
    {
      path: "/",
      label: "Map",
      icon: Map,
      component: WarehouseMap,
    },
  ],
  popups: [],
};

const productionModule: Module = {
  sequence: 3,
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
      path: "/machines",
      label: "Machines",
      icon: Box,
      component: Machines,
    },
    {
      path: "/machine-history",
      label: "Machine History",
      icon: Clock,
      component: MachineHistory,
    },
    {
      path: "/reports",
      label: "Reports",
      icon: PieChart,
      component: Reports,
    },
  ],
  popups: [],
};

const adminModule: Module = {
  sequence: 4,
  path: "/admin",
  label: "Admin",
  icon: Shield,
  status: "active",
  pages: [
    {
      path: "/",
      label: "Employees",
      icon: UsersIcon,
      component: Employees,
    },
    {
      path: "/settings",
      label: "Settings",
      icon: SettingsIcon,
      component: Settings,
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

const allModules = [
  salesModule,
  warehouseModule,
  productionModule,
  adminModule,
];

const devModules = allModules.filter(
  (module) => module.status === "development"
);

const activeModules = allModules.filter((module) => module.status === "active");

const unorderedModules = [...(__dev__ ? devModules : []), ...activeModules];

const modules: Module[] = unorderedModules.sort(
  (a, b) => a.sequence - b.sequence
);

export default modules;
