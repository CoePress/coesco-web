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
  GanttChart,
  Calendar,
  MapPin,
} from "lucide-react";
import { ComponentType } from "react";

import {
  Addresses,
  Companies,
  CompanyDetails,
  ContactDetails,
  Contacts,
  Employees,
  Gantt,
  MachineHistory,
  Machines,
  ProductionDashboard,
  ProductRules,
  Reports,
  SalesCatalog,
  SalesCompanies,
  SalesCompanyDetails,
  SalesConfigBuilder,
  SalesDashboard,
  SalesJourneyDetails,
  SalesJourneys,
  SalesPipeline,
  SalesQuoteDetails,
  SalesQuotes,
  Settings,
  WarehouseMap,
} from "@/pages";

import PopupWindow from "@/components/shared/popup-window";
import { __dev__ } from "./env";
import Company from "@/pages/company";

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
      path: "/journeys",
      label: "Journeys",
      icon: Calendar,
      component: SalesJourneys,
      children: [
        {
          path: "/:id",
          label: "Journey Details",
          icon: Calendar,
          component: SalesJourneyDetails,
        },
      ],
    },
    {
      path: "/companies",
      label: "Companies",
      icon: UsersIcon,
      component: SalesCompanies,
      children: [
        {
          path: "/:id",
          label: "Company Details",
          icon: User,
          component: SalesCompanyDetails,
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
      path: "/company",
      label: "Company",
      icon: UsersIcon,
      component: Company,
    },
  ],
  popups: [
    {
      path: "/popup",
      component: PopupWindow,
    },
  ],
};

const crmModule: Module = {
  sequence: 2,
  path: "/crm",
  label: "CRM",
  icon: UsersIcon,
  status: "development",
  pages: [
    {
      path: "/companies",
      label: "Companies",
      icon: UsersIcon,
      component: SalesCompanies,
      children: [
        {
          path: "/:id",
          label: "Company Details",
          icon: User,
          component: CompanyDetails,
        },
      ],
    },
    {
      path: "/contacts",
      label: "Contacts",
      icon: UsersIcon,
      component: Contacts,
      children: [
        {
          path: "/:id",
          label: "Contact Details",
          icon: User,
          component: ContactDetails,
        },
      ],
    },
    {
      path: "/addresses",
      label: "Addresses",
      icon: MapPin,
      component: Addresses,
    },
  ],
  popups: [],
};

export const warehouseModule: Module = {
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
    {
      path: "/gantt",
      label: "Gantt",
      icon: GanttChart,
      component: Gantt,
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
  productionModule,
  adminModule,
  warehouseModule,
  crmModule,
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
