/**
 * Offline Status Component
 * Shows connection status and cache information for performance calculations
 */

import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, X } from 'lucide-react';
import { Button } from '@/components';
import { usePerformanceServiceWorker, useOfflinePerformance } from '@/hooks/usePerformanceServiceWorker';

export interface OfflineStatusProps {
    className?: string;
    showCacheInfo?: boolean;
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({
    className = '',
    showCacheInfo = true
}) => {
    const {
        isOnline,
        cacheStatus,
        isCacheLoading,
        hasUpdate,
        clearPerformanceCache,
        refreshCacheStatus,
        updateServiceWorker
    } = usePerformanceServiceWorker();

    const {
        isOffline,
        showOfflineMessage,
        dismissOfflineMessage
    } = useOfflinePerformance();

    const [showCacheDetails, setShowCacheDetails] = useState(false);

    // Don't show anything if online and no updates
    if (isOnline && !hasUpdate && !showOfflineMessage) {
        return null;
    }

    const statusColor = isOnline ? 'text-green-600' : 'text-red-600';
    const bgColor = isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

    return (
        <div className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}>
            {/* Main status bar */}
            <div className={`rounded-lg border p-3 shadow-lg ${bgColor}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <Wifi size={16} className={statusColor} />
                        ) : (
                            <WifiOff size={16} className={statusColor} />
                        )}
                        <span className={`text-sm font-medium ${statusColor}`}>
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        {showCacheInfo && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCacheDetails(!showCacheDetails)}
                                className="h-6 w-6 p-0"
                            >
                                <Database size={12} />
                            </Button>
                        )}

                        {hasUpdate && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={updateServiceWorker}
                                className="h-6 w-6 p-0"
                                title="Update available"
                            >
                                <RefreshCw size={12} />
                            </Button>
                        )}

                        {showOfflineMessage && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={dismissOfflineMessage}
                                className="h-6 w-6 p-0"
                            >
                                <X size={12} />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Offline message */}
                {isOffline && showOfflineMessage && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                        <p className="text-xs text-red-700">
                            You're offline. Cached performance calculations are still available.
                        </p>
                    </div>
                )}

                {/* Update message */}
                {hasUpdate && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                        <p className="text-xs text-green-700">
                            A new version is available.
                        </p>
                        <Button
                            variant="secondary-outline"
                            size="sm"
                            onClick={updateServiceWorker}
                            className="mt-1 h-6 text-xs"
                        >
                            Update Now
                        </Button>
                    </div>
                )}
            </div>

            {/* Cache details panel */}
            {showCacheDetails && (
                <div className="mt-2 rounded-lg border bg-white p-3 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">Cache Status</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refreshCacheStatus}
                            disabled={isCacheLoading}
                            className="h-6 w-6 p-0"
                        >
                            <RefreshCw size={12} className={isCacheLoading ? 'animate-spin' : ''} />
                        </Button>
                    </div>

                    {isCacheLoading ? (
                        <div className="text-xs text-gray-500">Loading cache status...</div>
                    ) : cacheStatus ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Performance Data:</span>
                                <span className="font-medium">{cacheStatus.performance.size} items</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Static Assets:</span>
                                <span className="font-medium">{cacheStatus.static.size} items</span>
                            </div>

                            <div className="pt-2 border-t">
                                <Button
                                    variant="secondary-outline"
                                    size="sm"
                                    onClick={clearPerformanceCache}
                                    className="h-6 text-xs w-full"
                                >
                                    Clear Performance Cache
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-500">No cache information available</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OfflineStatus;
