import type {
  LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";

import {
  ActivityIcon,
  BoxIcon,
  Building2,
  ChartNoAxesCombined,
  CloudIcon,
  CodeIcon,
  Database,
  DollarSignIcon,
  FactoryIcon,
  FileCheck2Icon,
  FileClockIcon,
  FileCogIcon,
  FileIcon,
  FileTextIcon,
  FolderSyncIcon,
  LayoutDashboardIcon,
  LogsIcon,
  PaintBucketIcon,
  SearchIcon,
  ShieldIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";

import { AdminDashboard, AssetManager, Companies, CompanyDetails, ConfigurationBuilder, ContactDetails, Contacts, DataPipeline, DeletedRecords, EmployeeDetails, Employees, FormBuilder, FormDetails, Forms, FormSubmit, JourneyDetails, Logs, Machines, MachineStatuses, PerformanceSheet, PerformanceSheets, PerformanceSheetVersionBuilder, PerformanceSheetVersions, Pipeline, ProductDetails, ProductionDashboard, Products, QuoteDetails, Quotes, SalesDashboard, Sessions, Timezone } from "@/pages";
import Design from "@/pages/sandbox/design";
import ImageManager from "@/pages/sandbox/image-manager";
import LegacyExplorer from "@/pages/sandbox/legacy-explorer";
import Sandbox from "@/pages/sandbox/sandbox";
import FormSubmission from "@/pages/service/form-submission";
import FormSubmissions from "@/pages/service/form-submissions";
import SyncTest from "@/pages/service/sync-test";

import { __dev__ } from "./env";

export interface Module {
  sequence: number;
  slug: string;
  label: string;
  icon: LucideIcon;
  status: "active" | "inactive" | "development";
  pages: Page[];
}

export interface Page {
  slug: string | null;
  label: string;
  icon?: LucideIcon;
  component: ComponentType;
  children?: Page[];
}

const productionModule: Module = {
  sequence: 2,
  slug: "production",
  label: "Production",
  icon: FactoryIcon,
  status: "active",
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
  status: "active",
  pages: [
    {
      slug: null,
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      component: SalesDashboard,
    },
    {
      slug: "pipeline",
      label: "Projects",
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
      icon: Building2,
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
      slug: "contacts",
      label: "Contacts",
      icon: UsersIcon,
      component: Contacts,
      children: [
        {
          slug: ":id",
          label: "Contact Details",
          component: ContactDetails,
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
      label: "Products",
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
          component: PerformanceSheet,
        },
      ],
    },
    {
      slug: "forms",
      label: "Forms",
      icon: FileIcon,
      component: Forms,
      children: [
        {
          slug: ":id",
          label: "Form Detail",
          icon: FileIcon,
          component: FormSubmissions,
        },
        {
          slug: ":id/submit",
          label: "Form Submit",
          icon: FileCheck2Icon,
          component: FormSubmit,
        },
        {
          slug: ":id/submissions/:submissionId",
          label: "Submission View",
          icon: FileTextIcon,
          component: FormSubmission,
        },
      ],
    },
  ],
};

const adminModule: Module = {
  sequence: 9998,
  slug: "admin",
  label: "Admin",
  icon: ShieldIcon,
  status: "active",
  pages: [
    {
      slug: null,
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      component: AdminDashboard,
    },
    {
      slug: "assets",
      label: "Asset Manager",
      icon: CloudIcon,
      component: AssetManager,
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
          component: EmployeeDetails,
        },
      ],
    },
    {
      slug: "performance-sheets",
      label: "Performance Sheets",
      icon: FileCogIcon,
      component: PerformanceSheetVersions,
      children: [
        {
          slug: ":id/build",
          label: "Version Builder",
          component: PerformanceSheetVersionBuilder,
        },
      ],
    },
    {
      slug: "sessions",
      label: "Sessions",
      icon: FileClockIcon,
      component: Sessions,
    },
    {
      slug: "deleted-records",
      label: "Deleted Records",
      icon: Trash2Icon,
      component: DeletedRecords,
    },
    {
      slug: "logs",
      label: "Logs",
      icon: LogsIcon,
      component: Logs,
    },
    {
      slug: "data-pipeline",
      label: "Data Pipeline",
      icon: Database,
      component: DataPipeline,
    },
    {
      slug: "forms",
      label: "Form Management",
      icon: FileCogIcon,
      component: Forms,
      children: [
        {
          slug: ":id",
          label: "Form Details",
          icon: FileCogIcon,
          component: FormSubmissions,
        },
        {
          slug: ":id/build",
          label: "Form Builder",
          icon: FileCogIcon,
          component: FormBuilder,
        },
        {
          slug: ":id/submissions/:submissionId",
          label: "Submission View",
          icon: FileTextIcon,
          component: FormSubmission,
        },
      ],
    },
  ],
};

const sandboxModule: Module = {
  sequence: 9999,
  slug: "sandbox",
  label: "Sandbox",
  icon: CodeIcon,
  status: "development",
  pages: [
    {
      slug: null,
      label: "Sandbox",
      icon: CodeIcon,
      component: Sandbox,
    },
    {
      slug: "timezone",
      label: "Timezone",
      icon: PaintBucketIcon,
      component: Timezone,
    },
    {
      slug: "design-elements",
      label: "Design Elements",
      icon: PaintBucketIcon,
      component: Design,
    },
    {
      slug: "image-manager",
      label: "Image Manager",
      icon: FileIcon,
      component: ImageManager,
    },
    {
      slug: "legacy-explorer",
      label: "Legacy Explorer",
      icon: SearchIcon,
      component: LegacyExplorer,
    },
    {
      slug: "sync",
      label: "Sync",
      icon: FolderSyncIcon,
      component: SyncTest,
    },
  ],
};

const modules: Module[] = [
  salesModule,
  productionModule,
  adminModule,
  sandboxModule,
]
  .filter(
    module =>
      module.status === "active" || (__dev__ && module.status === "development"),
  )
  .sort((a, b) => a.sequence - b.sequence);

export default modules;
