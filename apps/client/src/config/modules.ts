import {
  LucideIcon,
  UsersIcon,
  BarChart,
  SettingsIcon,
  Factory,
  Box,
  Shield,
  Clock,
  PcCase,
  ScrollText,
  Boxes,
  LandPlot,
  CogIcon,
  DollarSign,
  Route,
  FileText,
  Wrench,
} from "lucide-react";
import { ComponentType, lazy } from "react";

import { __dev__ } from "./env";
import ReelDrive from "@/pages/performance/reel-drive";

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
const RFQ = lazy(() => import("@/pages/performance/rfq"));
const MaterialSpecs = lazy(() => import("@/pages/performance/material-specs"));
const TDDBHD = lazy(() => import("@/pages/performance/tddbhd"));
const SalesDashboard = lazy(() => import("@/pages/sales/dashboard"));
const Catalog = lazy(() => import("@/pages/sales/catalog"));
const MachineBuilder = lazy(() => import("@/pages/sales/config-builder"));
const Quotes = lazy(() => import("@/pages/sales/quotes"));
const QuoteDetails = lazy(() => import("@/pages/sales/quote-details"));
const Journeys = lazy(() => import("@/pages/sales/journeys"));
const JourneyDetails = lazy(() => import("@/pages/sales/journey-details"));
const OptionRules = lazy(() => import("@/pages/admin/option-rules"));
const Options = lazy(() => import("@/pages/sales/options"));

const Companies = lazy(() => import("@/pages/sales/companies"));
const CompanyDetails = lazy(() => import("@/pages/sales/company-details"));
const Pipeline = lazy(() => import("@/pages/sales/pipeline"));

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
          component: JourneyDetails,
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
          component: MachineBuilder,
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
    {
      slug: "option-rules",
      label: "Option Rules",
      icon: Box,
      component: OptionRules,
    },
  ],
};

const performanceModule: Module = {
  sequence: 2,
  slug: "performance",
  label: "Performance",
  icon: PcCase,
  status: "active" as const,
  pages: [
    {
      slug: null,
      label: "RFQ",
      icon: ScrollText,
      component: RFQ,
    },
    {
      slug: "material-specs",
      label: "Material Specs",
      icon: Boxes,
      component: MaterialSpecs,
    },
    {
      slug: "tddbhd",
      label: "TD/DB/HD Report",
      icon: LandPlot,
      component: TDDBHD,
    },
    {
      slug: "reel-drive",
      label: "Reel Drive",
      icon: CogIcon,
      component: ReelDrive,
    },
  ],
};

const modules: Module[] = [
  productionModule,
  salesModule,
  adminModule,
  performanceModule,
]
  .filter(
    (module) =>
      module.status === "active" || (__dev__ && module.status === "development")
  )
  .sort((a, b) => a.sequence - b.sequence);

export default modules;
