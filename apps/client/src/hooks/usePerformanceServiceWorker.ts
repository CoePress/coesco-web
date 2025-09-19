/**
 * Performance Service Worker Hook
 * Integrates service worker caching with performance calculations
 */

import { useEffect, useState, useCallback } from 'react';
import serviceWorkerManager, { CacheStatus, scheduleBackgroundSync } from '@/utils/serviceWorkerManager';

export interface PerformanceCache {
    isOnline: boolean;
    cacheStatus: CacheStatus | null;
    isCacheLoading: boolean;
    hasUpdate: boolean;
    cachePerformanceData: (url: string, data: any) => Promise<void>;
    clearPerformanceCache: () => Promise<void>;
    refreshCacheStatus: () => Promise<void>;
    updateServiceWorker: () => Promise<void>;
}

export const usePerformanceServiceWorker = (): PerformanceCache => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
    const [isCacheLoading, setIsCacheLoading] = useState(false);
    const [hasUpdate, setHasUpdate] = useState(false);

    // Initialize service worker
    useEffect(() => {
        const initServiceWorker = async () => {
            try {
                await serviceWorkerManager.register();
                refreshCacheStatus();
            } catch (error) {
                console.error('[PerformanceSW] Service worker initialization failed:', error);
            }
        };

        initServiceWorker();
    }, []);

    // Set up event listeners
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Schedule background sync when coming back online
            scheduleBackgroundSync('performance-sync');
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        const handleUpdateAvailable = () => {
            setHasUpdate(true);
        };

        const handleCacheUpdated = (data: any) => {
            console.log('[PerformanceSW] Cache updated:', data);
            refreshCacheStatus();
        };

        // Register event listeners
        serviceWorkerManager.addEventListener('online', handleOnline);
        serviceWorkerManager.addEventListener('offline', handleOffline);
        serviceWorkerManager.addEventListener('update-available', handleUpdateAvailable);
        serviceWorkerManager.addEventListener('cache-updated', handleCacheUpdated);

        return () => {
            serviceWorkerManager.removeEventListener('online', handleOnline);
            serviceWorkerManager.removeEventListener('offline', handleOffline);
            serviceWorkerManager.removeEventListener('update-available', handleUpdateAvailable);
            serviceWorkerManager.removeEventListener('cache-updated', handleCacheUpdated);
        };
    }, []);

    const refreshCacheStatus = useCallback(async () => {
        setIsCacheLoading(true);
        try {
            const status = await serviceWorkerManager.getCacheStatus();
            setCacheStatus(status);
        } catch (error) {
            console.error('[PerformanceSW] Failed to get cache status:', error);
        } finally {
            setIsCacheLoading(false);
        }
    }, []);

    const cachePerformanceData = useCallback(async (url: string, data: any) => {
        try {
            await serviceWorkerManager.cachePerformanceData(url, data);
            // Refresh cache status after caching
            setTimeout(refreshCacheStatus, 100);
        } catch (error) {
            console.error('[PerformanceSW] Failed to cache performance data:', error);
        }
    }, [refreshCacheStatus]);

    const clearPerformanceCache = useCallback(async () => {
        try {
            await serviceWorkerManager.clearCache('performance');
            // Refresh cache status after clearing
            setTimeout(refreshCacheStatus, 100);
        } catch (error) {
            console.error('[PerformanceSW] Failed to clear performance cache:', error);
        }
    }, [refreshCacheStatus]);

    const updateServiceWorker = useCallback(async () => {
        try {
            await serviceWorkerManager.update();
            setHasUpdate(false);
            // Refresh cache status after update
            setTimeout(refreshCacheStatus, 1000);
        } catch (error) {
            console.error('[PerformanceSW] Failed to update service worker:', error);
        }
    }, [refreshCacheStatus]);

    return {
        isOnline,
        cacheStatus,
        isCacheLoading,
        hasUpdate,
        cachePerformanceData,
        clearPerformanceCache,
        refreshCacheStatus,
        updateServiceWorker,
    };
};

// Helper hook for offline detection with performance-specific logic
export const useOfflinePerformance = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setShowOfflineMessage(false);
        };

        const handleOffline = () => {
            setIsOffline(true);
            // Show offline message after a short delay
            setTimeout(() => {
                setShowOfflineMessage(true);
            }, 2000);
        };

        serviceWorkerManager.addEventListener('online', handleOnline);
        serviceWorkerManager.addEventListener('offline', handleOffline);

        return () => {
            serviceWorkerManager.removeEventListener('online', handleOnline);
            serviceWorkerManager.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        isOffline,
        showOfflineMessage,
        dismissOfflineMessage: () => setShowOfflineMessage(false),
    };
};

// Hook for caching API responses automatically
export const useCachedPerformanceApi = () => {
    const { cachePerformanceData } = usePerformanceServiceWorker();

    const cacheApiResponse = useCallback(async (
        url: string,
        response: Response,
        data: any
    ) => {
        // Only cache successful GET requests
        if (response.ok && response.status === 200) {
            const requestUrl = new URL(url);

            // Cache performance calculations and sheets
            if (requestUrl.pathname.includes('/performance') ||
                requestUrl.pathname.includes('/calculate')) {
                try {
                    await cachePerformanceData(url, data);
                    console.log('[PerformanceSW] Auto-cached API response:', url);
                } catch (error) {
                    console.warn('[PerformanceSW] Failed to auto-cache:', error);
                }
            }
        }
    }, [cachePerformanceData]);

    return { cacheApiResponse };
};
