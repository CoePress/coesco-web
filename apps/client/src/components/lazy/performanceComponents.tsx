/**
 * Lazy-loaded Performance Components
 * Reduces initial bundle size through code splitting
 */

import React from 'react';
import { withLazyLoading, createLazyRoute } from '@/utils/lazyLoading';

// Lazy load RFQ sections (these use named exports, so we need to handle them differently)
export const LazyBasicInfoSection = React.lazy(() =>
    import('@/components/rfq').then(module => ({ default: module.BasicInfoSection }))
);

export const LazyLineConfigSection = React.lazy(() =>
    import('@/components/rfq').then(module => ({ default: module.LineConfigSection }))
);

export const LazyCoilSpecsSection = React.lazy(() =>
    import('@/components/rfq').then(module => ({ default: module.CoilSpecsSection }))
);

export const LazyMaterialSpecsSection = React.lazy(() =>
    import('@/components/rfq').then(module => ({ default: module.MaterialSpecsSection }))
);

export const LazyPressInfoSection = React.lazy(() =>
    import('@/components/rfq').then(module => ({ default: module.PressInfoSection }))
);

export const LazyDiesInfoSection = React.lazy(() =>
    import('@/components/rfq').then(module => ({ default: module.DiesInfoSection }))
);

export const LazyFeedRequirementsSection = React.lazy(() =>
    import('@/components/rfq').then(module => ({ default: module.FeedRequirementsSection }))
);

export const LazySpaceMountingSection = React.lazy(() =>
    import('@/components/rfq').then(module => ({ default: module.SpaceMountingSection }))
);

export const LazySpecialRequirementsSection = React.lazy(() =>
    import('@/components/rfq').then(module => ({ default: module.SpecialRequirementsSection }))
);

// Lazy load performance pages (using the correct paths)
export const LazyRFQ = createLazyRoute(
    () => import('@/pages/performance/rfq'),
    'RFQ Form'
);

export const LazyMaterialSpecs = createLazyRoute(
    () => import('@/pages/performance/material-specs'),
    'Material Specifications'
);

export const LazyTDDBHD = createLazyRoute(
    () => import('@/pages/performance/tddbhd'),
    'TDDBHD Calculations'
);

export const LazyReelDrive = createLazyRoute(
    () => import('@/pages/performance/reel-drive'),
    'Reel Drive Analysis'
);

export const LazyStrUtility = createLazyRoute(
    () => import('@/pages/performance/str-utility'),
    'Straightener Utility'
);

export const LazyRollStrBackbend = createLazyRoute(
    () => import('@/pages/performance/roll-str-backbend'),
    'Roll Straightener Backbend'
);

export const LazyFeed = createLazyRoute(
    () => import('@/pages/performance/feed'),
    'Feed System'
);

export const LazyShear = createLazyRoute(
    () => import('@/pages/performance/shear'),
    'Shear Analysis'
);

export const LazySummaryReport = createLazyRoute(
    () => import('@/pages/performance/summary-report'),
    'Summary Report'
);

// Wrapped RFQ sections with lazy loading
export const BasicInfoSection = withLazyLoading(LazyBasicInfoSection, {
    name: 'Basic Info Section',
    fallbackHeight: 'h-40',
    showSkeleton: true,
});

export const LineConfigSection = withLazyLoading(LazyLineConfigSection, {
    name: 'Line Configuration',
    fallbackHeight: 'h-40',
    showSkeleton: true,
});

export const CoilSpecsSection = withLazyLoading(LazyCoilSpecsSection, {
    name: 'Coil Specifications',
    fallbackHeight: 'h-40',
    showSkeleton: true,
});

export const MaterialSpecsSection = withLazyLoading(LazyMaterialSpecsSection, {
    name: 'Material Specifications',
    fallbackHeight: 'h-40',
    showSkeleton: true,
});

export const PressInfoSection = withLazyLoading(LazyPressInfoSection, {
    name: 'Press Information',
    fallbackHeight: 'h-40',
    showSkeleton: true,
});

export const DiesInfoSection = withLazyLoading(LazyDiesInfoSection, {
    name: 'Dies Information',
    fallbackHeight: 'h-40',
    showSkeleton: true,
});

export const FeedRequirementsSection = withLazyLoading(LazyFeedRequirementsSection, {
    name: 'Feed Requirements',
    fallbackHeight: 'h-40',
    showSkeleton: true,
});

export const SpaceMountingSection = withLazyLoading(LazySpaceMountingSection, {
    name: 'Space & Mounting',
    fallbackHeight: 'h-40',
    showSkeleton: true,
});

export const SpecialRequirementsSection = withLazyLoading(LazySpecialRequirementsSection, {
    name: 'Special Requirements',
    fallbackHeight: 'h-40',
    showSkeleton: true,
});

// Performance tab configuration with lazy loading
export const LAZY_PERFORMANCE_TABS = [
    {
        label: "RFQ",
        value: "rfq",
        component: LazyRFQ,
        preload: () => import('@/pages/performance/rfq')
    },
    {
        label: "Material Specs",
        value: "material-specs",
        component: LazyMaterialSpecs,
        preload: () => import('@/pages/performance/material-specs')
    },
    {
        label: "TDDBHD",
        value: "tddbhd",
        component: LazyTDDBHD,
        preload: () => import('@/pages/performance/tddbhd')
    },
    {
        label: "Reel Drive",
        value: "reel-drive",
        component: LazyReelDrive,
        preload: () => import('@/pages/performance/reel-drive')
    },
    {
        label: "Str Utility",
        value: "str-utility",
        component: LazyStrUtility,
        preload: () => import('@/pages/performance/str-utility')
    },
    {
        label: "Roll Str Backbend",
        value: "roll-str-backbend",
        component: LazyRollStrBackbend,
        preload: () => import('@/pages/performance/roll-str-backbend')
    },
    {
        label: "Feed",
        value: "feed",
        component: LazyFeed,
        preload: () => import('@/pages/performance/feed')
    },
    {
        label: "Shear",
        value: "shear",
        component: LazyShear,
        preload: () => import('@/pages/performance/shear')
    },
    {
        label: "Summary Report",
        value: "summary-report",
        component: LazySummaryReport,
        preload: () => import('@/pages/performance/summary-report')
    },
];
