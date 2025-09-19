/**
 * Memory Management React Hooks
 * Provides React hooks for efficient memory usage and cleanup
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
    getMemoryStats,
    MemoryStats,
    createDataPaginator,
    MemoryCache,
    performanceResultPool,
    createMemoryMonitor
} from '@/utils/memoryUtils';

// Hook for monitoring memory usage
export const useMemoryMonitor = (
    enabled: boolean = true,
    thresholdPercent: number = 80
) => {
    const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
    const [isHighMemory, setIsHighMemory] = useState(false);
    const monitorRef = useRef<ReturnType<typeof createMemoryMonitor> | null>(null);

    useEffect(() => {
        if (!enabled) return;

        // Initial memory check
        const initialStats = getMemoryStats();
        if (initialStats) {
            setMemoryStats(initialStats);
            setIsHighMemory(initialStats.usage > thresholdPercent);
        }

        // Set up continuous monitoring
        monitorRef.current = createMemoryMonitor(thresholdPercent);

        const handleHighMemory = (stats: MemoryStats) => {
            setMemoryStats(stats);
            setIsHighMemory(true);
            console.warn('[Memory] High memory usage detected:', stats);
        };

        monitorRef.current.addListener(handleHighMemory);
        monitorRef.current.start();

        // Periodic updates every 10 seconds
        const interval = setInterval(() => {
            const currentStats = getMemoryStats();
            if (currentStats) {
                setMemoryStats(currentStats);
                setIsHighMemory(currentStats.usage > thresholdPercent);
            }
        }, 10000);

        return () => {
            if (monitorRef.current) {
                monitorRef.current.stop();
                monitorRef.current.removeListener(handleHighMemory);
            }
            clearInterval(interval);
        };
    }, [enabled, thresholdPercent]);

    const forceUpdate = useCallback(() => {
        const stats = getMemoryStats();
        if (stats) {
            setMemoryStats(stats);
            setIsHighMemory(stats.usage > thresholdPercent);
        }
    }, [thresholdPercent]);

    return {
        memoryStats,
        isHighMemory,
        forceUpdate,
        isSupported: getMemoryStats() !== null
    };
};

// Hook for efficient data pagination with memory management
export const useMemoryEfficientPagination = <T>(
    data: T[],
    pageSize: number = 50,
    maxCachedPages: number = 3
) => {
    const [currentPage, setCurrentPage] = useState(0);
    const paginatorRef = useRef<ReturnType<typeof createDataPaginator<T>> | null>(null);

    // Create paginator when data changes
    const paginator = useMemo(() => {
        if (paginatorRef.current) {
            paginatorRef.current.clearCache();
        }
        paginatorRef.current = createDataPaginator(data, pageSize, maxCachedPages);
        return paginatorRef.current;
    }, [data, pageSize, maxCachedPages]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (paginatorRef.current) {
                paginatorRef.current.clearCache();
            }
        };
    }, []);

    const currentData = useMemo(() => {
        return paginator.getPage(currentPage);
    }, [paginator, currentPage]);

    const goToPage = useCallback((page: number) => {
        if (page >= 0 && page < paginator.totalPages) {
            setCurrentPage(page);
        }
    }, [paginator.totalPages]);

    const nextPage = useCallback(() => {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);

    const prevPage = useCallback(() => {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);

    const clearCache = useCallback(() => {
        paginator.clearCache();
    }, [paginator]);

    return {
        currentData,
        currentPage,
        totalPages: paginator.totalPages,
        pageSize: paginator.pageSize,
        goToPage,
        nextPage,
        prevPage,
        clearCache,
        cacheStats: paginator.getCacheStats(),
        hasNextPage: currentPage < paginator.totalPages - 1,
        hasPrevPage: currentPage > 0
    };
};

// Hook for memory-aware caching
export const useMemoryCache = <K, V>(
    maxSize: number = 100,
    ttl: number = 5 * 60 * 1000
) => {
    const cacheRef = useRef<MemoryCache<K, V>>(new MemoryCache<K, V>(maxSize, ttl));

    // Clean up on unmount
    useEffect(() => {
        return () => {
            cacheRef.current.clear();
        };
    }, []);

    const set = useCallback((key: K, value: V) => {
        cacheRef.current.set(key, value);
    }, []);

    const get = useCallback((key: K): V | undefined => {
        return cacheRef.current.get(key);
    }, []);

    const has = useCallback((key: K): boolean => {
        return cacheRef.current.has(key);
    }, []);

    const remove = useCallback((key: K): boolean => {
        return cacheRef.current.delete(key);
    }, []);

    const clear = useCallback(() => {
        cacheRef.current.clear();
    }, []);

    const getStats = useCallback(() => {
        return cacheRef.current.getStats();
    }, []);

    return {
        set,
        get,
        has,
        remove,
        clear,
        getStats
    };
};

// Hook for object pooling (performance calculation results)
export const usePerformanceResultPool = () => {
    const acquireResult = useCallback(() => {
        return performanceResultPool.acquire();
    }, []);

    const releaseResult = useCallback((result: any) => {
        performanceResultPool.release(result);
    }, []);

    const getPoolStats = useCallback(() => {
        return performanceResultPool.getStats();
    }, []);

    // Clean up pool on unmount
    useEffect(() => {
        return () => {
            performanceResultPool.clear();
        };
    }, []);

    return {
        acquireResult,
        releaseResult,
        getPoolStats
    };
};

// Hook for automatic cleanup of large datasets
export const useDatasetCleanup = <T>(
    data: T[],
    maxSize: number = 1000,
    cleanupThreshold: number = 0.8
) => {
    const [processedData, setProcessedData] = useState<T[]>(data);
    const [isOverLimit, setIsOverLimit] = useState(false);

    useEffect(() => {
        const dataSize = data.length;
        const isOver = dataSize > maxSize * cleanupThreshold;
        setIsOverLimit(isOver);

        if (isOver) {
            // Keep only the most recent items
            const trimmedData = data.slice(-maxSize);
            setProcessedData(trimmedData);

            console.warn(`[Memory] Dataset trimmed from ${dataSize} to ${trimmedData.length} items`);
        } else {
            setProcessedData(data);
        }
    }, [data, maxSize, cleanupThreshold]);

    const forceCleanup = useCallback(() => {
        const trimmedData = data.slice(-Math.floor(maxSize * 0.7)); // Keep 70% of max
        setProcessedData(trimmedData);
        console.log(`[Memory] Manual cleanup: ${data.length} -> ${trimmedData.length} items`);
    }, [data, maxSize]);

    return {
        data: processedData,
        isOverLimit,
        originalSize: data.length,
        processedSize: processedData.length,
        forceCleanup
    };
};

// Hook for performance-aware rendering with memory management
export const useMemoryAwareRendering = <T>(
    items: T[],
    renderThreshold: number = 100,
    batchSize: number = 50
) => {
    const [renderedItems, setRenderedItems] = useState<T[]>([]);
    const [isRendering, setIsRendering] = useState(false);
    const renderIndexRef = useRef(0);

    // Reset when items change
    useEffect(() => {
        renderIndexRef.current = 0;
        if (items.length <= renderThreshold) {
            setRenderedItems(items);
        } else {
            setRenderedItems([]);
            setIsRendering(true);
        }
    }, [items, renderThreshold]);

    // Batch rendering for large datasets
    useEffect(() => {
        if (!isRendering || renderIndexRef.current >= items.length) {
            setIsRendering(false);
            return;
        }

        const timer = setTimeout(() => {
            const nextBatch = items.slice(
                renderIndexRef.current,
                renderIndexRef.current + batchSize
            );

            setRenderedItems(prev => [...prev, ...nextBatch]);
            renderIndexRef.current += batchSize;

            if (renderIndexRef.current >= items.length) {
                setIsRendering(false);
            }
        }, 16); // ~60fps

        return () => clearTimeout(timer);
    }, [items, batchSize, isRendering]);

    const forceComplete = useCallback(() => {
        setRenderedItems(items);
        setIsRendering(false);
        renderIndexRef.current = items.length;
    }, [items]);

    return {
        renderedItems,
        isRendering,
        progress: items.length > 0 ? (renderedItems.length / items.length) * 100 : 100,
        forceComplete,
        totalItems: items.length,
        renderedCount: renderedItems.length
    };
};

// Hook for component memory cleanup
export const useComponentCleanup = (onCleanup?: () => void) => {
    const cleanupFnsRef = useRef<(() => void)[]>([]);

    const addCleanup = useCallback((cleanupFn: () => void) => {
        cleanupFnsRef.current.push(cleanupFn);
    }, []);

    const runCleanup = useCallback(() => {
        cleanupFnsRef.current.forEach(fn => {
            try {
                fn();
            } catch (error) {
                console.error('[Memory] Cleanup function failed:', error);
            }
        });
        cleanupFnsRef.current = [];
        onCleanup?.();
    }, [onCleanup]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            runCleanup();
        };
    }, [runCleanup]);

    return {
        addCleanup,
        runCleanup
    };
};
