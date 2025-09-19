/**
 * Memory Status Component
 * Displays memory usage information and provides cleanup controls
 */

import React, { useState } from 'react';
import { Activity, AlertTriangle, Trash2, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components';
import { useMemoryMonitor, useMemoryCache } from '@/hooks/useMemoryManagement';
import { forceGarbageCollection } from '@/utils/memoryUtils';

export interface MemoryStatusProps {
    className?: string;
    showDetailedStats?: boolean;
    enableMonitoring?: boolean;
}

const MemoryStatus: React.FC<MemoryStatusProps> = ({
    className = '',
    showDetailedStats = false,
    enableMonitoring = true
}) => {
    const { memoryStats, isHighMemory, forceUpdate, isSupported } = useMemoryMonitor(
        enableMonitoring,
        75 // Alert at 75% memory usage
    );

    const memoryCache = useMemoryCache<string, any>(100, 10 * 60 * 1000);
    const [showDetails, setShowDetails] = useState(showDetailedStats);

    if (!isSupported || !memoryStats) {
        return null;
    }

    const formatBytes = (bytes: number): string => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const handleForceGC = () => {
        const success = forceGarbageCollection();
        if (success) {
            setTimeout(forceUpdate, 100); // Update stats after GC
        } else {
            console.warn('[Memory] Garbage collection not available (enable in Chrome DevTools)');
        }
    };

    const handleClearCache = () => {
        memoryCache.clear();
        console.log('[Memory] Application cache cleared');
    };

    const getMemoryColor = (usage: number) => {
        if (usage >= 90) return 'text-red-600';
        if (usage >= 75) return 'text-orange-600';
        if (usage >= 50) return 'text-yellow-600';
        return 'text-green-600';
    };

    const getMemoryBgColor = (usage: number) => {
        if (usage >= 90) return 'bg-red-50 border-red-200';
        if (usage >= 75) return 'bg-orange-50 border-orange-200';
        if (usage >= 50) return 'bg-yellow-50 border-yellow-200';
        return 'bg-green-50 border-green-200';
    };

    return (
        <div className={`memory-status ${className}`}>
            {/* Main status indicator */}
            <div className={`rounded-lg border p-3 ${getMemoryBgColor(memoryStats.usage)}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity size={16} className={getMemoryColor(memoryStats.usage)} />
                        <span className={`text-sm font-medium ${getMemoryColor(memoryStats.usage)}`}>
                            Memory: {memoryStats.usage}%
                        </span>
                        {isHighMemory && (
                            <AlertTriangle size={14} className="text-orange-600" />
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(!showDetails)}
                            className="h-6 w-6 p-0"
                        >
                            <Info size={12} />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={forceUpdate}
                            className="h-6 w-6 p-0"
                        >
                            <RefreshCw size={12} />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearCache}
                            className="h-6 w-6 p-0"
                        >
                            <Trash2 size={12} />
                        </Button>
                    </div>
                </div>

                {/* High memory warning */}
                {isHighMemory && (
                    <div className="mt-2 pt-2 border-t border-orange-200">
                        <p className="text-xs text-orange-700">
                            High memory usage detected. Consider clearing cache or closing unused tabs.
                        </p>
                        <div className="flex gap-2 mt-1">
                            <Button
                                variant="secondary-outline"
                                size="sm"
                                onClick={handleClearCache}
                                className="h-6 text-xs"
                            >
                                Clear Cache
                            </Button>
                            {typeof (window as any).gc === 'function' && (
                                <Button
                                    variant="secondary-outline"
                                    size="sm"
                                    onClick={handleForceGC}
                                    className="h-6 text-xs"
                                >
                                    Force GC
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed stats panel */}
            {showDetails && (
                <div className="mt-2 rounded-lg border bg-white p-3 shadow-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Memory Details</h4>

                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Used:</span>
                            <span className="font-medium">
                                {formatBytes(memoryStats.usedJSHeapSize)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">
                                {formatBytes(memoryStats.totalJSHeapSize)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600">Limit:</span>
                            <span className="font-medium">
                                {formatBytes(memoryStats.jsHeapSizeLimit)}
                            </span>
                        </div>

                        {/* Cache stats */}
                        <div className="pt-2 border-t">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Cache:</span>
                                <span className="font-medium">
                                    {memoryCache.getStats().size} items
                                </span>
                            </div>
                        </div>

                        {/* Memory usage bar */}
                        <div className="pt-2 border-t">
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-600">Usage:</span>
                                <span className="font-medium">{memoryStats.usage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${memoryStats.usage >= 90 ? 'bg-red-500' :
                                            memoryStats.usage >= 75 ? 'bg-orange-500' :
                                                memoryStats.usage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                    style={{ width: `${Math.min(memoryStats.usage, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t flex gap-2">
                            <Button
                                variant="secondary-outline"
                                size="sm"
                                onClick={handleClearCache}
                                className="h-6 text-xs flex-1"
                            >
                                Clear Cache
                            </Button>
                            <Button
                                variant="secondary-outline"
                                size="sm"
                                onClick={forceUpdate}
                                className="h-6 text-xs flex-1"
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemoryStatus;
