import {
  LucideIcon,
  UsersIcon,
  BarChart,
  Factory,
  Box,
  Shield,
  Clock,
  DollarSign,
  Route,
  FileText,
  Code,
  PaintBucket,
  MessageCircle,
  Map,
  ComputerIcon,
} from "lucide-react";
import { ComponentType } from "react";

import { __dev__ } from "./env";
import Sandbox from "@/pages/_sandbox/sandbox";
import SalesDashboard from "@/pages/sales/dashboard";
import Design from "@/pages/_sandbox/design";
import ChatPLK from "@/pages/_sandbox/chat-plk";
import WarehouseMap from "@/pages/_sandbox/warehouse-map";
import Pipeline from "@/pages/sales/pipeline";
import Companies from "@/pages/sales/companies";
import CompanyDetails from "@/pages/sales/company-details";
import Journeys from "@/pages/sales/journeys";
import JourneyDetailsPage from "@/pages/sales/journey-details";
import Quotes from "@/pages/sales/quotes";
import QuoteDetails from "@/pages/sales/quote-details";
import Catalog from "@/pages/sales/catalog";
import Options from "@/pages/sales/options";
import ProductionDashboard from "@/pages/production/dashboard";
import Machines from "@/pages/production/machines";
import MachineHistory from "@/pages/production/machine-history";
import Employees from "@/pages/admin/employees";
import OptionRules from "@/pages/admin/option-rules";
import AuditLogs from "@/pages/admin/audit-logs";
import ConfigBuilder from "@/pages/sales/config-builder";
import Devices from "@/pages/admin/devices";

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

const salesModule: Module = {
  sequence: 1,
  slug: "sales",
  label: "Sales",
  icon: DollarSign,
  status: "development" as const,
  pages: [
    {
      slug: null,
      label: "Dashboard",
      icon: BarChart,
      component: SalesDashboard,
    },
    {
      slug: "pipeline",
      label: "Pipeline",
      icon: DollarSign,
      component: Pipeline,
    },
    {
      slug: "companies",
      label: "Companies",
      icon: UsersIcon,
      component: Companies,
      children: [
        {
          slug: ":id",
          label: "Company",
          icon: UsersIcon,
          component: CompanyDetails,
        },
      ],
    },
    {
      slug: "journeys",
      label: "Journeys",
      icon: Route,
      component: Journeys,
      children: [
        {
          slug: ":id",
          label: "Journey",
          icon: Route,
          component: JourneyDetailsPage,
        },
      ],
    },
    {
      slug: "quotes",
      label: "Quotes",
      icon: FileText,
      component: Quotes,
      children: [
        {
          slug: ":id",
          label: "Quote",
          icon: FileText,
          component: QuoteDetails,
        },
      ],
    },
    {
      slug: "catalog",
      label: "Catalog",
      icon: Box,
      component: Catalog,
      children: [
        {
          slug: "builder",
          label: "Builder",
          icon: Box,
          component: ConfigBuilder,
        },
      ],
    },
    {
      slug: "options",
      label: "Options",
      icon: Box,
      component: Options,
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
      slug: "option-rules",
      label: "Option Rules",
      icon: Box,
      component: OptionRules,
    },
    {
      slug: "audit-logs",
      label: "Audit Logs",
      icon: FileText,
      component: AuditLogs,
    }
  ],
};

const sandboxModule: Module = {
  sequence: 4,
  slug: "sandbox",
  label: "Sandbox",
  icon: Code,
  status: "development" as const,
  pages: [
    {
      slug: null,
      label: "Sandbox",
      icon: Code,
      component: Sandbox,
    },
    {
      slug: "design-elements",
      label: "Design Elements",
      icon: PaintBucket,
      component: Design,
    },
    {
      slug: "chat-plk",
      label: "Chat PLK",
      icon: MessageCircle,
      component: ChatPLK,
    },
    {
      slug: "warehouse-map",
      label: "Warehouse Map",
      icon: Map,
      component: WarehouseMap,
    },
  ],
};

const modules: Module[] = [
  productionModule,
  salesModule,
  adminModule,
  sandboxModule,
]
  .filter(
    (module) =>
      module.status === "active" || (__dev__ && module.status === "development")
  )
  .sort((a, b) => a.sequence - b.sequence);

export default modules;
