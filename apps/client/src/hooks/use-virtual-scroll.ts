/**
 * Virtual Scrolling Hook
 * Efficient rendering for large lists and tables
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';

export interface VirtualScrollOptions {
    itemHeight: number;
    containerHeight: number;
    overscan?: number; // Number of extra items to render outside viewport
    threshold?: number; // Minimum number of items before enabling virtualization
}

export interface VirtualScrollItem {
    index: number;
    style: React.CSSProperties;
    data: any;
}

export interface VirtualScrollResult {
    virtualItems: VirtualScrollItem[];
    totalHeight: number;
    scrollElementRef: React.RefObject<HTMLDivElement>;
    isVirtualized: boolean;
    visibleRange: { start: number; end: number };
}

export const useVirtualScroll = <T = any>(
    items: T[],
    options: VirtualScrollOptions
): VirtualScrollResult => {
    const { itemHeight, containerHeight, overscan = 5, threshold = 50 } = options;

    const [scrollTop, setScrollTop] = useState(0);
    const scrollElementRef = React.useRef<HTMLDivElement>(null);

    const isVirtualized = items.length > threshold;
    const totalHeight = items.length * itemHeight;

    // Calculate visible range
    const visibleRange = useMemo(() => {
        if (!isVirtualized) {
            return { start: 0, end: items.length - 1 };
        }

        const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

        return { start, end };
    }, [scrollTop, itemHeight, containerHeight, overscan, items.length, isVirtualized]);

    // Generate virtual items
    const virtualItems = useMemo((): VirtualScrollItem[] => {
        if (!isVirtualized) {
            // Return all items if not virtualizing
            return items.map((data, index) => ({
                index,
                style: { height: itemHeight },
                data
            }));
        }

        const result: VirtualScrollItem[] = [];

        for (let i = visibleRange.start; i <= visibleRange.end; i++) {
            result.push({
                index: i,
                style: {
                    position: 'absolute',
                    top: i * itemHeight,
                    left: 0,
                    right: 0,
                    height: itemHeight,
                },
                data: items[i]
            });
        }

        return result;
    }, [items, visibleRange, itemHeight, isVirtualized]);

    // Handle scroll events
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // Set up scroll listener
    useEffect(() => {
        const element = scrollElementRef.current;
        if (!element || !isVirtualized) return;

        const handleScrollEvent = (e: Event) => {
            const target = e.target as HTMLDivElement;
            setScrollTop(target.scrollTop);
        };

        element.addEventListener('scroll', handleScrollEvent, { passive: true });

        return () => {
            element.removeEventListener('scroll', handleScrollEvent);
        };
    }, [isVirtualized]);

    return {
        virtualItems,
        totalHeight: isVirtualized ? totalHeight : items.length * itemHeight,
        scrollElementRef: scrollElementRef as React.RefObject<HTMLDivElement>,
        isVirtualized,
        visibleRange
    };
};

// Hook for virtual table rows
export const useVirtualTable = <T = any>(
    rows: T[],
    rowHeight: number = 40,
    containerHeight: number = 400,
    options?: Partial<VirtualScrollOptions>
) => {
    return useVirtualScroll(rows, {
        itemHeight: rowHeight,
        containerHeight,
        overscan: 10, // Tables benefit from more overscan
        threshold: 100, // Higher threshold for tables
        ...options
    });
};

// Hook for virtual lists
export const useVirtualList = <T = any>(
    items: T[],
    itemHeight: number = 50,
    containerHeight: number = 300,
    options?: Partial<VirtualScrollOptions>
) => {
    return useVirtualScroll(items, {
        itemHeight,
        containerHeight,
        overscan: 5,
        threshold: 50,
        ...options
    });
};
