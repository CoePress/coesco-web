import {
  LucideIcon,
  UsersIcon,
  ComputerIcon,
  SearchIcon,
  PaintBucketIcon,
  CodeIcon,
  DollarSignIcon,
  BarChartIcon,
  RouteIcon,
  FileTextIcon,
  BoxIcon,
  FactoryIcon,
  ClockIcon,
  ShieldIcon,
} from "lucide-react";
import { ComponentType } from "react";

import { __dev__ } from "./env";
import { AuditLogs, Companies, CompanyDetails, Devices, Employees, JourneyDetails, Machines, MachineStatuses, PerformanceSheetDetails, Pipeline, ProductDetails, ProductionDashboard, Products, QuoteDetails, Quotes, SalesDashboard } from "@/pages";
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
  icon: LucideIcon;
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
      slug: "employees",
      label: "Employees",
      icon: UsersIcon,
      component: Employees,
    },
    {
      slug: "devices",
      label: "Devices",
      icon: ComputerIcon,
      component: Devices,
    },
    {
      slug: "audit-logs",
      label: "Audit Logs",
      icon: FileTextIcon,
      component: AuditLogs,
    }
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
      icon: BarChartIcon,
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
      icon: ClockIcon,
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
      icon: BarChartIcon,
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
          icon: RouteIcon,
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
          icon: UsersIcon,
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
          icon: FileTextIcon,
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
          slug: ":id",
          label: "Product Details",
          icon: FileTextIcon,
          component: ProductDetails,
        },
      ],
    },
    {
      slug: "performance-sheets",
      label: "Performance Sheets",
      icon: BoxIcon,
      component: Products,
      children: [
        {
          slug: ":id",
          label: "Performance Sheet Details",
          icon: FileTextIcon,
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
