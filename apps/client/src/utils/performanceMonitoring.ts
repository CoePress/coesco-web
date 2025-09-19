// Performance Monitoring Utilities
import React, { useEffect, useRef, useState } from 'react';

// Performance monitoring hook for component render times
export const usePerformanceMonitor = (componentName: string) => {
    const renderStartTime = useRef<number>(Date.now());
    const renderCount = useRef<number>(0);
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        componentName,
        averageRenderTime: 0,
        totalRenders: 0,
        lastRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: Infinity
    });

    useEffect(() => {
        const renderTime = Date.now() - renderStartTime.current;
        renderCount.current += 1;

        setMetrics(prev => {
            const newTotalTime = (prev.averageRenderTime * prev.totalRenders) + renderTime;
            const newTotalRenders = prev.totalRenders + 1;

            return {
                ...prev,
                averageRenderTime: newTotalTime / newTotalRenders,
                totalRenders: newTotalRenders,
                lastRenderTime: renderTime,
                maxRenderTime: Math.max(prev.maxRenderTime, renderTime),
                minRenderTime: Math.min(prev.minRenderTime, renderTime)
            };
        });

        // Log performance in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 ${componentName} render time: ${renderTime}ms`);

            // Warn about slow renders
            if (renderTime > 100) {
                console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime}ms`);
            }
        }
    });

    // Reset timer for next render
    renderStartTime.current = Date.now();

    return metrics;
};

// Hook to monitor field update performance
export const useFieldUpdateMonitor = () => {
    const updateTimes = useRef<Map<string, number>>(new Map());

    const trackFieldUpdate = (fieldName: string, startTime: number) => {
        const updateTime = Date.now() - startTime;
        updateTimes.current.set(fieldName, updateTime);

        if (process.env.NODE_ENV === 'development' && updateTime > 50) {
            console.warn(`⚠️ Slow field update for ${fieldName}: ${updateTime}ms`);
        }
    };

    const getFieldMetrics = () => {
        const metrics: FieldUpdateMetrics[] = [];
        updateTimes.current.forEach((time, field) => {
            metrics.push({ fieldName: field, updateTime: time });
        });
        return metrics.sort((a, b) => b.updateTime - a.updateTime);
    };

    return { trackFieldUpdate, getFieldMetrics };
};

// Hook to monitor memory usage (development only)
export const useMemoryMonitor = (componentName: string) => {
    const [memoryUsage, setMemoryUsage] = useState<MemoryUsage | null>(null);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
            const checkMemory = () => {
                const memory = (performance as any).memory;
                setMemoryUsage({
                    usedJSHeapSize: memory.usedJSHeapSize,
                    totalJSHeapSize: memory.totalJSHeapSize,
                    jsHeapSizeLimit: memory.jsHeapSizeLimit
                });
            };

            checkMemory();
            const interval = setInterval(checkMemory, 5000); // Check every 5 seconds

            return () => clearInterval(interval);
        }
    }, []);

    return memoryUsage;
};

// Performance summary hook for development
export const usePerformanceSummary = () => {
    const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([]);

    const addMetrics = (metrics: PerformanceMetrics) => {
        setPerformanceData(prev => {
            const existing = prev.find(m => m.componentName === metrics.componentName);
            if (existing) {
                return prev.map(m => m.componentName === metrics.componentName ? metrics : m);
            }
            return [...prev, metrics];
        });
    };

    const getSlowestComponents = (count: number = 5) => {
        return [...performanceData]
            .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
            .slice(0, count);
    };

    const getMostRenderedComponents = (count: number = 5) => {
        return [...performanceData]
            .sort((a, b) => b.totalRenders - a.totalRenders)
            .slice(0, count);
    };

    const logPerformanceSummary = () => {
        if (process.env.NODE_ENV === 'development') {
            console.group('📊 Performance Summary');
            console.table(performanceData);
            console.log('🐌 Slowest Components:', getSlowestComponents());
            console.log('🔄 Most Rendered Components:', getMostRenderedComponents());
            console.groupEnd();
        }
    };

    return {
        addMetrics,
        getSlowestComponents,
        getMostRenderedComponents,
        logPerformanceSummary,
        performanceData
    };
};

// Types
export interface PerformanceMetrics {
    componentName: string;
    averageRenderTime: number;
    totalRenders: number;
    lastRenderTime: number;
    maxRenderTime: number;
    minRenderTime: number;
}

export interface FieldUpdateMetrics {
    fieldName: string;
    updateTime: number;
}

export interface MemoryUsage {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}
