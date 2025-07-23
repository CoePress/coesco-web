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
  Route,
  FileText,
} from "lucide-react";
import { ComponentType, lazy } from "react";

import { __dev__ } from "./env";
import PerformanceDetails from "@/pages/performance/performance-details";

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
const Employees = lazy(() => import("@/pages/admin/employees"));
const SalesDashboard = lazy(() => import("@/pages/sales/dashboard"));
const Catalog = lazy(() => import("@/pages/sales/catalog"));
const MachineBuilder = lazy(() => import("@/pages/sales/config-builder"));
const Quotes = lazy(() => import("@/pages/sales/quotes"));
const QuoteDetails = lazy(() => import("@/pages/sales/quote-details"));
const Journeys = lazy(() => import("@/pages/sales/journeys"));
const JourneyDetails = lazy(() => import("@/pages/sales/journey-details"));
const OptionRules = lazy(() => import("@/pages/admin/option-rules"));
const Options = lazy(() => import("@/pages/sales/options"));
const AuditLogs = lazy(() => import("@/pages/admin/audit-logs"));
const AuditConfig = lazy(() => import("@/pages/admin/audit-config"));
const Companies = lazy(() => import("@/pages/sales/companies"));
const CompanyDetails = lazy(() => import("@/pages/sales/company-details"));
const Pipeline = lazy(() => import("@/pages/sales/pipeline"));
const PerformanceSheets = lazy(
  () => import("@/pages/performance/performance-sheets")
);
const DocumentDiff = lazy(() => import("@/pages/_test/document-diff"));

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
    {
      slug: "performance",
      label: "Performance Sheets",
      icon: FileText,
      component: PerformanceSheets,
      children: [
        {
          slug: ":id",
          label: "Performance Details",
          icon: FileText,
          component: PerformanceDetails,
        },
      ],
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
    },
    {
      slug: "audit-config",
      label: "Audit Config",
      icon: FileText,
      component: AuditConfig,
    },
    {
      slug: "diff",
      label: "Document Diff",
      icon: FileText,
      component: DocumentDiff,
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
