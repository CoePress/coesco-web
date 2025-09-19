/**
 * Service Worker Manager
 * Handles service worker registration, communication, and lifecycle management
 */

export interface CacheStatus {
    performance: {
        size: number;
        keys: string[];
    };
    static: {
        size: number;
        keys: string[];
    };
}

export interface ServiceWorkerManager {
    register: () => Promise<ServiceWorkerRegistration | null>;
    unregister: () => Promise<boolean>;
    update: () => Promise<void>;
    cachePerformanceData: (url: string, data: any) => Promise<void>;
    clearCache: (type: 'performance' | 'static' | 'all') => Promise<void>;
    getCacheStatus: () => Promise<CacheStatus>;
    isOnline: () => boolean;
    addEventListener: (event: string, callback: Function) => void;
    removeEventListener: (event: string, callback: Function) => void;
}

class ServiceWorkerManagerImpl implements ServiceWorkerManager {
    private registration: ServiceWorkerRegistration | null = null;
    private eventListeners: Map<string, Function[]> = new Map();

    constructor() {
        // Listen to online/offline events
        window.addEventListener('online', () => this.emit('online'));
        window.addEventListener('offline', () => this.emit('offline'));

        // Listen to service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));
        }
    }

    async register(): Promise<ServiceWorkerRegistration | null> {
        if (!('serviceWorker' in navigator)) {
            console.warn('[SWManager] Service Worker not supported');
            return null;
        }

        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });

            console.log('[SWManager] Service Worker registered:', this.registration.scope);

            // Handle updates
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration?.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.emit('update-available');
                        }
                    });
                }
            });

            // Check for updates every 30 minutes
            setInterval(() => this.update(), 30 * 60 * 1000);

            return this.registration;
        } catch (error) {
            console.error('[SWManager] Service Worker registration failed:', error);
            return null;
        }
    }

    async unregister(): Promise<boolean> {
        if (!this.registration) {
            return false;
        }

        try {
            const result = await this.registration.unregister();
            console.log('[SWManager] Service Worker unregistered:', result);
            return result;
        } catch (error) {
            console.error('[SWManager] Service Worker unregistration failed:', error);
            return false;
        }
    }

    async update(): Promise<void> {
        if (!this.registration) {
            return;
        }

        try {
            await this.registration.update();
            console.log('[SWManager] Service Worker update check completed');
        } catch (error) {
            console.error('[SWManager] Service Worker update failed:', error);
        }
    }

    async cachePerformanceData(url: string, data: any): Promise<void> {
        if (!navigator.serviceWorker.controller) {
            console.warn('[SWManager] No active service worker to cache data');
            return;
        }

        try {
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_PERFORMANCE_DATA',
                payload: { url, response: data }
            });
            console.log('[SWManager] Performance data sent for caching:', url);
        } catch (error) {
            console.error('[SWManager] Failed to cache performance data:', error);
        }
    }

    async clearCache(type: 'performance' | 'static' | 'all'): Promise<void> {
        if (!navigator.serviceWorker.controller) {
            console.warn('[SWManager] No active service worker to clear cache');
            return;
        }

        try {
            navigator.serviceWorker.controller.postMessage({
                type: 'CLEAR_CACHE',
                payload: type
            });
            console.log('[SWManager] Cache clear request sent:', type);
            this.emit('cache-cleared', type);
        } catch (error) {
            console.error('[SWManager] Failed to clear cache:', error);
        }
    }

    async getCacheStatus(): Promise<CacheStatus> {
        if (!navigator.serviceWorker.controller) {
            throw new Error('No active service worker');
        }

        return new Promise((resolve, reject) => {
            const channel = new MessageChannel();

            channel.port1.onmessage = (event) => {
                const { type, payload } = event.data;
                if (type === 'CACHE_STATUS') {
                    resolve(payload);
                } else if (type === 'ERROR') {
                    reject(new Error(payload));
                }
            };

            const controller = navigator.serviceWorker.controller;
            if (controller) {
                controller.postMessage({
                    type: 'GET_CACHE_STATUS'
                }, [channel.port2]);
            }

            // Timeout after 5 seconds
            setTimeout(() => {
                reject(new Error('Cache status request timeout'));
            }, 5000);
        });
    }

    isOnline(): boolean {
        return navigator.onLine;
    }

    addEventListener(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    removeEventListener(event: string, callback: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    private emit(event: string, data?: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('[SWManager] Event listener error:', error);
                }
            });
        }
    }

    private handleMessage(event: MessageEvent): void {
        const { type, payload } = event.data;

        switch (type) {
            case 'CACHE_UPDATED':
                this.emit('cache-updated', payload);
                break;
            case 'OFFLINE_READY':
                this.emit('offline-ready');
                break;
            default:
                console.log('[SWManager] Unknown message from SW:', type, payload);
        }
    }
}

// Singleton instance
const serviceWorkerManager = new ServiceWorkerManagerImpl();

export default serviceWorkerManager;

// Convenience hooks for React components
export const useServiceWorker = () => {
    return {
        manager: serviceWorkerManager,
        isOnline: serviceWorkerManager.isOnline(),
        register: () => serviceWorkerManager.register(),
        clearCache: (type: 'performance' | 'static' | 'all') => serviceWorkerManager.clearCache(type),
        getCacheStatus: () => serviceWorkerManager.getCacheStatus(),
    };
};

// Background sync helper
export const scheduleBackgroundSync = (tag: string) => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
            // Type assertion for background sync API
            return (registration as any).sync.register(tag);
        }).catch((error) => {
            console.error('[SWManager] Background sync registration failed:', error);
        });
    }
};
