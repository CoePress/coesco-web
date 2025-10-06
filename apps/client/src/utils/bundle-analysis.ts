import React from 'react';

/**
 * Bundle Analysis Utilities
 * Tools for monitoring and analyzing bundle sizes and performance
 */

// Types for bundle analysis
export interface BundleChunk {
    name: string;
    size: number;
    gzipSize?: number;
    modules: string[];
    isAsync: boolean;
    loadTime?: number;
}

export interface BundleAnalysis {
    totalSize: number;
    chunks: BundleChunk[];
    duplicatedModules: string[];
    unusedModules: string[];
    performance: {
        loadTime: number;
        renderTime: number;
        interactionTime: number;
    };
}

// Performance monitoring for lazy loaded components
export class LazyLoadingMonitor {
    private static instance: LazyLoadingMonitor;
    private loadTimes: Map<string, number> = new Map();
    private loadStats: Map<string, { count: number; totalTime: number }> = new Map();

    static getInstance(): LazyLoadingMonitor {
        if (!LazyLoadingMonitor.instance) {
            LazyLoadingMonitor.instance = new LazyLoadingMonitor();
        }
        return LazyLoadingMonitor.instance;
    }

    startLoading(componentName: string): () => void {
        const startTime = performance.now();

        return () => {
            const loadTime = performance.now() - startTime;
            this.recordLoadTime(componentName, loadTime);
        };
    }

    private recordLoadTime(componentName: string, loadTime: number): void {
        this.loadTimes.set(componentName, loadTime);

        const stats = this.loadStats.get(componentName) || { count: 0, totalTime: 0 };
        stats.count++;
        stats.totalTime += loadTime;
        this.loadStats.set(componentName, stats);

        // Log performance in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`Lazy load: ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
        }
    }

    getLoadStats(): Record<string, { averageLoadTime: number; loadCount: number }> {
        const stats: Record<string, { averageLoadTime: number; loadCount: number }> = {};

        this.loadStats.forEach((stat, componentName) => {
            stats[componentName] = {
                averageLoadTime: stat.totalTime / stat.count,
                loadCount: stat.count
            };
        });

        return stats;
    }

    getPerformanceReport(): {
        components: Array<{
            name: string;
            averageLoadTime: number;
            loadCount: number;
            efficiency: 'excellent' | 'good' | 'fair' | 'poor';
        }>;
        recommendations: string[];
    } {
        const stats = this.getLoadStats();
        const components = Object.entries(stats).map(([name, stat]) => {
            let efficiency: 'excellent' | 'good' | 'fair' | 'poor';

            if (stat.averageLoadTime < 100) efficiency = 'excellent';
            else if (stat.averageLoadTime < 300) efficiency = 'good';
            else if (stat.averageLoadTime < 500) efficiency = 'fair';
            else efficiency = 'poor';

            return {
                name,
                averageLoadTime: stat.averageLoadTime,
                loadCount: stat.loadCount,
                efficiency
            };
        });

        const recommendations: string[] = [];

        // Generate recommendations
        const slowComponents = components.filter(c => c.efficiency === 'poor');
        if (slowComponents.length > 0) {
            recommendations.push(
                `Consider further splitting these slow components: ${slowComponents.map(c => c.name).join(', ')}`
            );
        }

        const frequentComponents = components.filter(c => c.loadCount > 10);
        if (frequentComponents.length > 0) {
            recommendations.push(
                `Consider preloading these frequently accessed components: ${frequentComponents.map(c => c.name).join(', ')}`
            );
        }

        if (components.length === 0) {
            recommendations.push('No lazy loading data collected yet. Use the application to gather performance metrics.');
        }

        return { components, recommendations };
    }

    exportPerformanceData(): string {
        const report = this.getPerformanceReport();
        const exportData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            report,
            rawStats: this.getLoadStats()
        };

        return JSON.stringify(exportData, null, 2);
    }

    clearStats(): void {
        this.loadTimes.clear();
        this.loadStats.clear();
    }
}

// Global monitor instance
export const lazyLoadingMonitor = LazyLoadingMonitor.getInstance();

// Hook for monitoring component load times
export const useLoadTimeMonitor = (componentName: string) => {
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        setIsLoading(true);
        const endLoading = lazyLoadingMonitor.startLoading(componentName);

        return () => {
            endLoading();
            setIsLoading(false);
        };
    }, [componentName]);

    return isLoading;
};

// Bundle size estimation utilities
export const estimateBundleSize = async (componentPath: string): Promise<number> => {
    try {
        // This is a rough estimation - in production you'd use webpack stats
        const startTime = performance.now();
        await import(componentPath);
        const loadTime = performance.now() - startTime;

        // Rough size estimation based on load time (not accurate, just for monitoring)
        return Math.round(loadTime * 10); // Very rough approximation
    } catch (error) {
        console.warn(`Could not estimate bundle size for ${componentPath}:`, error);
        return 0;
    }
};

// Development helper for analyzing bundle impact
export const analyzeLazyLoadingImpact = () => {
    if (process.env.NODE_ENV !== 'development') {
        console.warn('Bundle analysis is only available in development mode');
        return;
    }

    console.group('📦 Lazy Loading Analysis');

    const report = lazyLoadingMonitor.getPerformanceReport();

    console.log('Component Performance:');
    console.table(report.components);

    console.log('Recommendations:');
    report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
    });

    console.log('\nTo export detailed data:');
    console.log('lazyLoadingMonitor.exportPerformanceData()');

    console.groupEnd();
};

// Make analyzer available globally in development
if (process.env.NODE_ENV === 'development') {
    (window as any).analyzeLazyLoading = analyzeLazyLoadingImpact;
    (window as any).lazyLoadingMonitor = lazyLoadingMonitor;
}
