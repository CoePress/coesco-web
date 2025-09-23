/**
 * Virtual List Component
 * High-performance list with virtual scrolling for large datasets
 */

import React from 'react';
import { useVirtualList } from '@/hooks/use-virtual-scroll';

export interface VirtualListProps<T = any> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    itemHeight?: number;
    height?: number;
    className?: string;
    itemClassName?: string | ((item: T, index: number) => string);
    loading?: boolean;
    emptyMessage?: string;
    gap?: number;
    overscan?: number;
    threshold?: number;
}

const VirtualList = <T,>({
    items,
    renderItem,
    itemHeight = 50,
    height = 400,
    className = '',
    itemClassName = '',
    loading = false,
    emptyMessage = 'No items available',
    gap = 0,
    overscan = 5,
    threshold = 50,
}: VirtualListProps<T>) => {
    const { virtualItems, totalHeight, scrollElementRef, isVirtualized } = useVirtualList(
        items,
        itemHeight + gap,
        height,
        { overscan, threshold }
    );

    // Loading state
    if (loading) {
        return (
            <div
                className={`overflow-hidden ${className}`}
                style={{ height }}
            >
                <div className="animate-pulse space-y-2 p-4">
                    {Array.from({ length: Math.min(10, Math.ceil(height / (itemHeight + gap))) }).map((_, index) => (
                        <div
                            key={index}
                            className="bg-muted rounded"
                            style={{ height: itemHeight }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (items.length === 0) {
        return (
            <div
                className={`flex items-center justify-center text-muted text-center ${className}`}
                style={{ height }}
            >
                {emptyMessage}
            </div>
        );
    } return (
        <div className={className}>
            {/* Virtual scroll container */}
            <div
                ref={scrollElementRef}
                className="overflow-auto"
                style={{ height }}
            >
                <div
                    style={{
                        height: totalHeight,
                        position: 'relative',
                        paddingBottom: gap,
                    }}
                >
                    {virtualItems.map(({ index, style, data: item }) => {
                        const itemClass = typeof itemClassName === 'function'
                            ? itemClassName(item, index)
                            : itemClassName;

                        return (
                            <div
                                key={index}
                                style={{
                                    ...style,
                                    height: itemHeight,
                                    marginBottom: gap,
                                }}
                                className={itemClass}
                            >
                                {renderItem(item, index)}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Virtual scrolling indicator */}
            {isVirtualized && (
                <div className="px-4 py-2 bg-muted border-t border-border text-xs text-muted-foreground text-center">
                    Showing {virtualItems.length} of {items.length} items (Virtual Scrolling Active)
                </div>
            )}
        </div>
    );
};

export default VirtualList;
