import type {
  LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";

import {
  ActivityIcon,
  BoxIcon,
  Building2,
  CodeIcon,
  DollarSignIcon,
  FactoryIcon,
  FileCheck2Icon,
  FileCogIcon,
  FileIcon,
  FileTextIcon,
  FolderSyncIcon,
  LayoutDashboardIcon,
  LogsIcon,
  PaintBucketIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

import { Companies, CompanyDetails, ConfigurationBuilder, ContactDetails, Contacts, Employees, FormBuilder, FormDetails, Forms, FormSubmission, JourneyDetails, Logs, Machines, MachineStatuses, Pipeline, ProductDetails, ProductionDashboard, Products, QuoteDetails, Quotes, SalesDashboard, Timezone } from "@/pages";
import Design from "@/pages/sandbox/design";
import LegacyExplorer from "@/pages/sandbox/legacy-explorer";
import Sandbox from "@/pages/sandbox/sandbox";
import FormSubmissions from "@/pages/service/form-submissions";
import FormSubmissionView from "@/pages/service/form-submission-view";
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

const adminModule: Module = {
  sequence: 4,
  slug: "admin",
  label: "Admin",
  icon: ShieldIcon,
  status: "active",
  pages: [
    {
      slug: null,
      label: "Employees",
      icon: UsersIcon,
      component: Employees,
      children: [
        {
          slug: ":id",
          label: "Employee Details",
          component: JourneyDetails,
        },
      ],
    },
    // {
    //   slug: "permissions",
    //   label: "Permissions",
    //   icon: LockIcon,
    //   component: Permissions,
    // },
    // {
    //   slug: "sessions",
    //   label: "Sessions",
    //   icon: FileClockIcon,
    //   component: Sessions,
    // },
    // {
    //   slug: "devices",
    //   label: "Devices",
    //   icon: ComputerIcon,
    //   component: Devices,
    // },
    // {
    //   slug: "reports",
    //   label: "Reports",
    //   icon: FileTextIcon,
    //   component: Reports,
    // },
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
    // {
    //   slug: "performance-sheets",
    //   label: "Performance Sheets",
    //   icon: ChartNoAxesCombined,
    //   component: PerformanceSheets,
    //   children: [
    //     {
    //       slug: ":id",
    //       label: "Performance Sheet Details",
    //       component: PerformanceSheet,
    //     },
    //   ],
    // },
  ],
};

const serviceModule: Module = {
  sequence: 3,
  slug: "service",
  label: "Service",
  icon: WrenchIcon,
  status: "active",
  pages: [
    {
      slug: null,
      label: "Forms",
      icon: FileIcon,
      component: Forms,
      children: [
        {
          slug: "forms/:id",
          label: "Form Details",
          icon: FileCogIcon,
          component: FormDetails,
        },
        {
          slug: "forms/:id/build",
          label: "Form Details",
          icon: FileCogIcon,
          component: FormBuilder,
        },
        {
          slug: "forms/:id/submissions",
          label: "Form Submissions",
          icon: FileCheck2Icon,
          component: FormSubmissions,
        },
        {
          slug: "forms/:id/submit",
          label: "Form Submit",
          icon: FileCheck2Icon,
          component: FormSubmission,
        },
        {
          slug: "forms/:formId/submissions/:id",
          label: "Submission View",
          icon: FileTextIcon,
          component: FormSubmissionView,
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
  adminModule,
  productionModule,
  salesModule,
  sandboxModule,
  serviceModule,
]
  .filter(
    module =>
      module.status === "active" || (__dev__ && module.status === "development"),
  )
  .sort((a, b) => a.sequence - b.sequence);

export default modules;
