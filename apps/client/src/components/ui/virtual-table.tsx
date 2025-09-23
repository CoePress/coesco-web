/**
 * Virtual Table Component
 * High-performance table with virtual scrolling for large datasets
 */

import React, { useMemo } from 'react';
import { useVirtualTable } from '@/hooks/use-virtual-scroll';

export interface VirtualTableColumn<T = any> {
    key: string;
    header: string;
    width?: number | string;
    render?: (value: any, row: T, index: number) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

export interface VirtualTableProps<T = any> {
    data: T[];
    columns: VirtualTableColumn<T>[];
    rowHeight?: number;
    height?: number;
    className?: string;
    headerClassName?: string;
    rowClassName?: string | ((row: T, index: number) => string);
    onRowClick?: (row: T, index: number) => void;
    loading?: boolean;
    emptyMessage?: string;
    stickyHeader?: boolean;
}

const VirtualTable = <T extends Record<string, any>>({
    data,
    columns,
    rowHeight = 40,
    height = 400,
    className = '',
    headerClassName = '',
    rowClassName = '',
    onRowClick,
    loading = false,
    emptyMessage = 'No data available',
    stickyHeader = true,
}: VirtualTableProps<T>) => {
    const { virtualItems, totalHeight, scrollElementRef, isVirtualized } = useVirtualTable(
        data,
        rowHeight,
        height
    );

    // Calculate column widths
    const columnWidths = useMemo(() => {
        const totalSpecifiedWidth = columns.reduce((acc, col) => {
            if (typeof col.width === 'number') return acc + col.width;
            if (typeof col.width === 'string' && col.width.endsWith('px')) {
                return acc + parseInt(col.width);
            }
            return acc;
        }, 0);

        const unspecifiedColumns = columns.filter(col => !col.width).length;
        const remainingWidth = unspecifiedColumns > 0 ? `calc((100% - ${totalSpecifiedWidth}px) / ${unspecifiedColumns})` : 'auto';

        return columns.map(col => {
            if (col.width) return col.width;
            return remainingWidth;
        });
    }, [columns]);

    // Loading state
    if (loading) {
        return (
            <div className={`border border-border rounded-lg overflow-hidden ${className}`}>
                <div className="animate-pulse">
                    {/* Header skeleton */}
                    <div className="bg-muted border-b border-border p-4">
                        <div className="flex">
                            {columns.map((_, index) => (
                                <div
                                    key={index}
                                    className="h-4 bg-muted-foreground/30 rounded mr-4 flex-1"
                                />
                            ))}
                        </div>
                    </div>
                    {/* Rows skeleton */}
                    {Array.from({ length: Math.min(10, Math.ceil(height / rowHeight)) }).map((_, index) => (
                        <div key={index} className="border-b border-border p-4">
                            <div className="flex">
                                {columns.map((_, colIndex) => (
                                    <div
                                        key={colIndex}
                                        className="h-4 bg-muted rounded mr-4 flex-1"
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (data.length === 0) {
        return (
            <div className={`border border-border rounded-lg overflow-hidden ${className}`}>
                {/* Header */}
                <div className={`bg-muted border-b border-border ${headerClassName}`}>
                    <div className="flex">
                        {columns.map((column, index) => (
                            <div
                                key={column.key}
                                className={`px-4 py-3 font-medium text-foreground ${column.headerClassName || ''}`}
                                style={{ width: columnWidths[index] }}
                            >
                                {column.header}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Empty message */}
                <div
                    className="flex items-center justify-center text-muted text-center"
                    style={{ height: height - 50 }}
                >
                    {emptyMessage}
                </div>
            </div>
        );
    }

    return (
        <div className={`border border-border rounded-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div
                className={`bg-muted border-b border-border ${stickyHeader ? 'sticky top-0 z-10' : ''
                    } ${headerClassName}`}
            >
                <div className="flex">
                    {columns.map((column, index) => (
                        <div
                            key={column.key}
                            className={`px-4 py-3 font-medium text-foreground ${column.headerClassName || ''}`}
                            style={{ width: columnWidths[index] }}
                        >
                            {column.header}
                        </div>
                    ))}
                </div>
            </div>

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
                    }}
                >
                    {virtualItems.map(({ index, style, data: rowData }) => {
                        const rowClass = typeof rowClassName === 'function'
                            ? rowClassName(rowData, index)
                            : rowClassName;

                        return (
                            <div
                                key={index}
                                style={style}
                                className={`flex border-b border-border hover:bg-muted ${onRowClick ? 'cursor-pointer' : ''
                                    } ${rowClass}`}
                                onClick={() => onRowClick?.(rowData, index)}
                            >
                                {columns.map((column, colIndex) => {
                                    const value = rowData?.[column.key];
                                    const cellContent = column.render
                                        ? column.render(value, rowData, index)
                                        : value?.toString() || '';

                                    return (
                                        <div
                                            key={column.key}
                                            className={`px-4 py-3 text-sm text-foreground ${column.className || ''}`}
                                            style={{ width: columnWidths[colIndex] }}
                                        >
                                            {cellContent}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Virtual scrolling indicator */}
            {isVirtualized && (
                <div className="px-4 py-2 bg-muted border-t border-border text-xs text-muted-foreground text-center">
                    Showing {virtualItems.length} of {data.length} rows (Virtual Scrolling Active)
                </div>
            )}
        </div>
    );
};

export default VirtualTable;
