/**
 * Memory Management Utilities
 * Provides tools for efficient memory usage and cleanup in large dataset applications
 */

// Memory usage tracking
export interface MemoryStats {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    usage: number; // percentage
}

export interface DatasetStats {
    size: number;
    estimatedMemory: number; // in bytes
    itemCount: number;
    type: string;
}

// Get current memory usage (Chrome DevTools API)
export const getMemoryStats = (): MemoryStats | null => {
    if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
        };
    }
    return null;
};

// Estimate memory usage of data structures
export const estimateDatasetMemory = (data: any, type: string = 'unknown'): DatasetStats => {
    const jsonString = JSON.stringify(data);
    const sizeInBytes = new Blob([jsonString]).size;

    let itemCount = 0;
    if (Array.isArray(data)) {
        itemCount = data.length;
    } else if (typeof data === 'object' && data !== null) {
        itemCount = Object.keys(data).length;
    } else {
        itemCount = 1;
    }

    return {
        size: sizeInBytes,
        estimatedMemory: sizeInBytes * 2, // Account for object overhead
        itemCount,
        type
    };
};

// Memory-efficient data pagination
export const createDataPaginator = <T>(
    data: T[],
    pageSize: number = 50,
    maxCachedPages: number = 3
) => {
    const cache = new Map<number, T[]>();
    const totalPages = Math.ceil(data.length / pageSize);

    const getPage = (pageIndex: number): T[] => {
        if (pageIndex < 0 || pageIndex >= totalPages) {
            return [];
        }

        // Check cache first
        if (cache.has(pageIndex)) {
            return cache.get(pageIndex)!;
        }

        // Calculate page data
        const startIndex = pageIndex * pageSize;
        const endIndex = Math.min(startIndex + pageSize, data.length);
        const pageData = data.slice(startIndex, endIndex);

        // Add to cache and manage cache size
        cache.set(pageIndex, pageData);

        // Remove oldest pages if cache is too large
        if (cache.size > maxCachedPages) {
            const keys = Array.from(cache.keys());
            const firstKey = keys[0];
            if (firstKey !== undefined) {
                cache.delete(firstKey);
            }
        }

        return pageData;
    };

    const clearCache = () => {
        cache.clear();
    };

    const getCacheStats = () => ({
        cachedPages: cache.size,
        maxCachedPages,
        totalPages,
        cacheKeys: Array.from(cache.keys())
    });

    return {
        getPage,
        clearCache,
        getCacheStats,
        totalPages,
        pageSize
    };
};

// Debounced data processing to prevent memory spikes
export const createDebouncedProcessor = <T, R>(
    processor: (data: T) => R,
    delay: number = 300,
    maxBatchSize: number = 1000
) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let pendingData: T[] = [];

    const process = (data: T): Promise<R[]> => {
        return new Promise((resolve) => {
            pendingData.push(data);

            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                // Process in batches to prevent memory spikes
                const results: R[] = [];
                const batches = Math.ceil(pendingData.length / maxBatchSize);

                for (let i = 0; i < batches; i++) {
                    const start = i * maxBatchSize;
                    const end = Math.min(start + maxBatchSize, pendingData.length);
                    const batch = pendingData.slice(start, end);

                    batch.forEach(item => {
                        results.push(processor(item));
                    });

                    // Allow garbage collection between batches
                    if (i < batches - 1) {
                        setTimeout(() => { }, 0);
                    }
                }

                // Clear processed data
                pendingData = [];
                timeoutId = null;
                resolve(results);
            }, delay);
        });
    };

    const cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        pendingData = [];
    };

    return { process, cancel };
};

// Simple memory-aware cache with TTL-based cleanup
export class MemoryCache<K, V> {
    private cache = new Map<K, { value: V; timestamp: number }>();
    private maxSize: number;
    private ttl: number; // Time to live in milliseconds

    constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
        this.maxSize = maxSize;
        this.ttl = ttl;
    }

    set(key: K, value: V): void {
        // Clean up expired entries before adding new ones
        this.cleanup();

        // If at max size, remove oldest entry
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key: K): V | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        // Check if entry has expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value;
    }

    has(key: K): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        // Check if entry has expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: K[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttl) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    getStats() {
        this.cleanup(); // Clean up before getting stats
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            utilization: (this.cache.size / this.maxSize) * 100,
            ttl: this.ttl
        };
    }
}

// Memory-efficient object pooling
export class ObjectPool<T> {
    private pool: T[] = [];
    private createFn: () => T;
    private resetFn: (obj: T) => T;
    private maxSize: number;

    constructor(
        createFn: () => T,
        resetFn: (obj: T) => T,
        maxSize: number = 100
    ) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
    }

    acquire(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.createFn();
    }

    release(obj: T): void {
        if (this.pool.length < this.maxSize) {
            this.pool.push(this.resetFn(obj));
        }
        // If pool is full, let object be garbage collected
    }

    clear(): void {
        this.pool = [];
    }

    getStats() {
        return {
            poolSize: this.pool.length,
            maxSize: this.maxSize,
            utilization: (this.pool.length / this.maxSize) * 100
        };
    }
}

// Performance calculation result pool
export const performanceResultPool = new ObjectPool(
    () => ({
        length: 0,
        spm_at_fa1: 0,
        fpm_fa1: 0,
        spm_at_fa2: 0,
        fpm_fa2: 0,
        rms_torque_fa1: 0,
        rms_torque_fa2: 0,
        index_time_fa1: 0,
        index_time_fa2: 0
    }),
    (obj) => {
        // Reset all properties to default values
        Object.keys(obj).forEach(key => {
            (obj as any)[key] = 0;
        });
        return obj;
    },
    50 // Max 50 cached objects
);

// Memory monitoring and alerts
export const createMemoryMonitor = (
    thresholdPercent: number = 80,
    checkInterval: number = 30000 // 30 seconds
) => {
    let intervalId: NodeJS.Timeout | null = null;
    const listeners: ((stats: MemoryStats) => void)[] = [];

    const start = () => {
        if (intervalId) return;

        intervalId = setInterval(() => {
            const stats = getMemoryStats();
            if (stats && stats.usage > thresholdPercent) {
                listeners.forEach(listener => listener(stats));
            }
        }, checkInterval);
    };

    const stop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    const addListener = (listener: (stats: MemoryStats) => void) => {
        listeners.push(listener);
    };

    const removeListener = (listener: (stats: MemoryStats) => void) => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };

    return {
        start,
        stop,
        addListener,
        removeListener
    };
};

// Force garbage collection (Chrome DevTools)
export const forceGarbageCollection = (): boolean => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
        return true;
    }
    return false;
};
