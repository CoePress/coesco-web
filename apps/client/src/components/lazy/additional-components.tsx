/**
 * Additional Lazy Components
 * Other components that benefit from code splitting
 */

import { createLazyRoute } from '@/utils/lazy-loading';

// Dashboard components (often large with charts/visualizations)
export const LazyProductionDashboard = createLazyRoute(
    () => import('@/pages/production/dashboard'),
    'Production Dashboard'
);

export const LazySalesDashboard = createLazyRoute(
    () => import('@/pages/sales/dashboard'),
    'Sales Dashboard'
);

export const LazyAdminDashboard = createLazyRoute(
    () => import('@/pages/admin/dashboard'),
    'Admin Dashboard'
);

// Performance sheets (main listing page)
export const LazyPerformanceSheets = createLazyRoute(
    () => import('@/pages/performance/performance-sheets'),
    'Performance Sheets'
);

// Sales journey components (can be large with complex logic)
export const LazyPipeline = createLazyRoute(
    () => import('@/pages/sales/pipeline'),
    'Sales Pipeline'
);

export const LazyJourneyDetails = createLazyRoute(
    () => import('@/pages/sales/journey-details'),
    'Journey Details'
);

// Configuration builder (complex form)
export const LazyConfigurationBuilder = createLazyRoute(
    () => import('@/pages/sales/configuration-builder'),
    'Configuration Builder'
);

// Machine-related components (often have real-time data)
export const LazyMachines = createLazyRoute(
    () => import('@/pages/production/machines'),
    'Machines'
);

export const LazyMachineStatuses = createLazyRoute(
    () => import('@/pages/production/machine-statuses'),
    'Machine Statuses'
);

// Admin components (complex tables and data)
export const LazyEmployees = createLazyRoute(
    () => import('@/pages/admin/employees'),
    'Employees'
);

export const LazyReports = createLazyRoute(
    () => import('@/pages/admin/reports'),
    'Reports'
);

export const LazyLogs = createLazyRoute(
    () => import('@/pages/admin/logs'),
    'System Logs'
);

// Chat component (can be heavy with message history)
export const LazyChat = createLazyRoute(
    () => import('@/pages/utility/chat'),
    'Chat'
);

// Map of components that can be lazily loaded
export const LAZY_COMPONENT_MAP = {
    // Admin
    'admin/dashboard': LazyAdminDashboard,
    'admin/employees': LazyEmployees,
    'admin/reports': LazyReports,
    'admin/logs': LazyLogs,

    // Production
    'production/dashboard': LazyProductionDashboard,
    'production/machines': LazyMachines,
    'production/machine-statuses': LazyMachineStatuses,

    // Sales
    'sales/dashboard': LazySalesDashboard,
    'sales/pipeline': LazyPipeline,
    'sales/journey-details': LazyJourneyDetails,
    'sales/configuration-builder': LazyConfigurationBuilder,

    // Performance
    'performance/performance-sheets': LazyPerformanceSheets,

    // Utility
    'utility/chat': LazyChat,
} as const;

export type LazyComponentKey = keyof typeof LAZY_COMPONENT_MAP;
