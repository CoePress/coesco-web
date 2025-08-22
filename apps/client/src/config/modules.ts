import {
  LucideIcon,
  UsersIcon,
  ComputerIcon,
  SearchIcon,
  PaintBucketIcon,
  CodeIcon,
  DollarSignIcon,
  FileTextIcon,
  BoxIcon,
  FactoryIcon,
  ShieldIcon,
  LayoutDashboardIcon,
  LockIcon,
  LogsIcon,
  ChartNoAxesCombined,
  ActivityIcon,
  FileClockIcon,
} from "lucide-react";
import { ComponentType } from "react";

import { __dev__ } from "./env";
import { AdminDashboard, Companies, CompanyDetails, ConfigurationBuilder, Devices, Employees, JourneyDetails, Logs, Machines, MachineStatuses, PerformanceSheetDetails, PerformanceSheets, Permissions, Pipeline, ProductDetails, ProductionDashboard, Products, QuoteDetails, Quotes, Reports, SalesDashboard, Sessions } from "@/pages";
import Sandbox from "@/pages/sandbox/sandbox";
import Design from "@/pages/sandbox/design";
import LegacyExplorer from "@/pages/sandbox/legacy-explorer";


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
  icon?: LucideIcon;
  component: ComponentType;
  children?: Page[];
};

const adminModule: Module = {
  sequence: 3,
  slug: "admin",
  label: "Admin",
  icon: ShieldIcon,
  status: "active" as const,
  pages: [
    {
      slug: null,
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      component: AdminDashboard,
    },
    {
      slug: "employees",
      label: "Employees",
      icon: UsersIcon,
      component: Employees,
      children: [
        {
          slug: ":id",
          label: "Employee Details",
          component: JourneyDetails,
          children: [
            {
              slug: "permissions",
              label: "Employee Permissions",
              component: JourneyDetails,
            },
          ],
        },
      ],
    },
    {
      slug: "permissions",
      label: "Permissions",
      icon: LockIcon,
      component: Permissions,
    },
    {
      slug: "sessions",
      label: "Sessions",
      icon: FileClockIcon,
      component: Sessions,
    },
    
    {
      slug: "devices",
      label: "Devices",
      icon: ComputerIcon,
      component: Devices,
    },
    {
      slug: "reports",
      label: "Reports",
      icon: FileTextIcon,
      component: Reports,
    },
    {
      slug: "logs",
      label: "Logs",
      icon: LogsIcon,
      component: Logs,
    },
  ],
};

const productionModule: Module = {
  sequence: 2,
  slug: "production",
  label: "Production",
  icon: FactoryIcon,
  status: "active" as const,
  pages: [
    {
      slug: null,
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      component: ProductionDashboard,
    },
    {
      slug: "machines",
      label: "Machines",
      icon: BoxIcon,
      component: Machines,
    },
    {
      slug: "machine-states",
      label: "Machine States",
      icon: ActivityIcon,
      component: MachineStatuses,
    },
  ],
};

const salesModule: Module = {
  sequence: 1,
  slug: "sales",
  label: "Sales",
  icon: DollarSignIcon,
  status: "development" as const,
  pages: [
    {
      slug: null,
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      component: SalesDashboard,
    },
    {
      slug: "pipeline",
      label: "Pipeline",
      icon: DollarSignIcon,
      component: Pipeline,
      children: [
        {
          slug: ":id",
          label: "Journey Details",
          component: JourneyDetails,
        },
      ],
    },
    {
      slug: "companies",
      label: "Companies",
      icon: UsersIcon,
      component: Companies,
      children: [
        {
          slug: ":id",
          label: "Company Details",
          component: CompanyDetails,
        },
      ],
    },
    {
      slug: "quotes",
      label: "Quotes",
      icon: FileTextIcon,
      component: Quotes,
      children: [
        {
          slug: ":id",
          label: "Quote Details",
          component: QuoteDetails,
        },
      ],
    },
    {
      slug: "products",
      label: "Product Catalog",
      icon: BoxIcon,
      component: Products,
      children: [
        {
          slug: "configuration-builder",
          label: "Configuration Builder",
          component: ConfigurationBuilder,
        },
        {
          slug: "p/:id",
          label: "Product Details",
          component: ProductDetails,
        },
      ],
    },
    {
      slug: "performance-sheets",
      label: "Performance Sheets",
      icon: ChartNoAxesCombined,
      component: PerformanceSheets,
      children: [
        {
          slug: ":id",
          label: "Performance Sheet Details",
          component: PerformanceSheetDetails,
        },
      ],
    },
  ],
};

const sandboxModule: Module = {
  sequence: 4,
  slug: "sandbox",
  label: "Sandbox",
  icon: CodeIcon,
  status: "development" as const,
  pages: [
    {
      slug: null,
      label: "Sandbox",
      icon: CodeIcon,
      component: Sandbox,
    },
    {
      slug: "design-elements",
      label: "Design Elements",
      icon: PaintBucketIcon,
      component: Design,
    },
    {
      slug: "legacy-explorer",
      label: "Legacy Explorer",
      icon: SearchIcon,
      component: LegacyExplorer,
    },
  ],
};

const modules: Module[] = [
  adminModule,
  productionModule,
  salesModule,
  sandboxModule,
]
  .filter(
    (module) =>
      module.status === "active" || (__dev__ && module.status === "development")
  )
  .sort((a, b) => a.sequence - b.sequence);

export default modules;
