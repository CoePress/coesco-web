/**
 * Code Splitting Configuration
 * Centralized configuration for lazy loading and code splitting
 */

import { LazyComponentKey, LAZY_COMPONENT_MAP } from '@/components/lazy';

// Configuration for different types of components
export interface CodeSplitConfig {
    // Performance critical components - load immediately
    critical: string[];
    // Common components - preload after initial load
    preload: string[];
    // Large components - load on demand
    onDemand: string[];
    // Rarely used - load only when needed
    rare: string[];
}

export const CODE_SPLIT_CONFIG: CodeSplitConfig = {
    critical: [
        // Core navigation and authentication
        'layout',
        'auth',
        'error-boundaries'
    ],

    preload: [
        // Commonly accessed after login
        'performance/performance-sheets',
        'sales/dashboard',
        'production/dashboard'
    ],

    onDemand: [
        // Performance pages (loaded per tab)
        'performance/rfq',
        'performance/material-specs',
        'performance/tddbhd',
        'performance/reel-drive',
        'performance/str-utility',
        'performance/feed',
        'performance/shear',

        // Sales workflows
        'sales/pipeline',
        'sales/configuration-builder',
        'sales/journey-details'
    ],

    rare: [
        // Admin tools
        'admin/logs',
        'admin/reports',
        'admin/employees',

        // Utility features
        'utility/chat'
    ]
};

// Route-based preloading strategies
export const PRELOAD_STRATEGIES = {
    // Preload on route hover (for navigation)
    onHover: {
        delay: 100, // ms
        routes: [
            '/performance',
            '/sales',
            '/production',
            '/admin'
        ]
    },

    // Preload on user interaction patterns
    onInteraction: {
        // Preload next likely tabs in performance sheets
        performanceTabs: {
            'rfq': ['material-specs', 'tddbhd'],
            'material-specs': ['tddbhd', 'reel-drive'],
            'tddbhd': ['reel-drive', 'str-utility'],
            'reel-drive': ['str-utility', 'feed'],
            'str-utility': ['feed', 'shear'],
            'feed': ['shear', 'summary-report'],
            'shear': ['summary-report'],
        }
    },

    // Time-based preloading
    timed: {
        // After 2 seconds of inactivity, preload common components
        idleTime: 2000,
        components: ['sales/dashboard', 'production/dashboard']
    }
};

// Utility functions for code splitting

/**
 * Get lazy component by key
 */
export const getLazyComponent = (key: LazyComponentKey) => {
    return LAZY_COMPONENT_MAP[key];
};

/**
 * Preload components based on strategy
 */
export const preloadByStrategy = (strategy: keyof typeof PRELOAD_STRATEGIES, context?: { currentTab?: string }) => {
    switch (strategy) {
        case 'onHover':
            // Implement hover-based preloading
            break;
        case 'onInteraction':
            // Implement interaction-based preloading
            if (context?.currentTab) {
                const tabMap = PRELOAD_STRATEGIES.onInteraction.performanceTabs as Record<string, string[]>;
                const nextTabs = tabMap[context.currentTab];
                if (nextTabs) {
                    nextTabs.forEach((tab: string) => {
                        // Preload next likely tabs
                        import(`@/pages/performance/${tab}`).catch(console.warn);
                    });
                }
            }
            break;
        case 'timed':
            // Implement time-based preloading
            setTimeout(() => {
                PRELOAD_STRATEGIES.timed.components.forEach(component => {
                    const lazyComponent = getLazyComponent(component as LazyComponentKey);
                    if (lazyComponent) {
                        // Trigger preload
                        try {
                            (lazyComponent as any)._payload?.();
                        } catch (error) {
                            console.warn(`Failed to preload ${component}:`, error);
                        }
                    }
                });
            }, PRELOAD_STRATEGIES.timed.idleTime);
            break;
    }
};

/**
 * Bundle splitting recommendations based on usage patterns
 */
export const getBundleSplitRecommendations = (usageStats: Record<string, number>) => {
    const recommendations: string[] = [];

    // Analyze usage patterns
    const sortedComponents = Object.entries(usageStats)
        .sort(([, a], [, b]) => b - a);

    const highUsage = sortedComponents.slice(0, 3);
    const lowUsage = sortedComponents.slice(-3);

    if (highUsage.length > 0) {
        recommendations.push(
            `Consider preloading high-usage components: ${highUsage.map(([name]) => name).join(', ')}`
        );
    }

    if (lowUsage.length > 0) {
        recommendations.push(
            `Consider further splitting low-usage components: ${lowUsage.map(([name]) => name).join(', ')}`
        );
    }

    return recommendations;
};

/**
 * Check if component should be code split based on config
 */
export const shouldCodeSplit = (componentPath: string): boolean => {
    const { critical, preload, onDemand, rare } = CODE_SPLIT_CONFIG;

    // Don't split critical components
    if (critical.some(path => componentPath.includes(path))) {
        return false;
    }

    // Split everything else
    return [...preload, ...onDemand, ...rare].some(path =>
        componentPath.includes(path)
    );
};

/**
 * Get loading priority for component
 */
export const getLoadingPriority = (componentPath: string): 'high' | 'medium' | 'low' | 'lazy' => {
    const { critical, preload, onDemand, rare } = CODE_SPLIT_CONFIG;

    if (critical.some(path => componentPath.includes(path))) {
        return 'high';
    }

    if (preload.some(path => componentPath.includes(path))) {
        return 'medium';
    }

    if (onDemand.some(path => componentPath.includes(path))) {
        return 'low';
    }

    if (rare.some(path => componentPath.includes(path))) {
        return 'lazy';
    }

    return 'medium'; // Default
};

// Export configuration for webpack or build tools
export const WEBPACK_SPLIT_CONFIG = {
    chunks: {
        vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
        },
        common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
        },
        performance: {
            test: /[\\/]pages[\\/]performance[\\/]/,
            name: 'performance',
            chunks: 'all',
        },
        sales: {
            test: /[\\/]pages[\\/]sales[\\/]/,
            name: 'sales',
            chunks: 'all',
        },
        admin: {
            test: /[\\/]pages[\\/]admin[\\/]/,
            name: 'admin',
            chunks: 'all',
        },
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
};
