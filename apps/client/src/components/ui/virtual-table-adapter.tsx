/**
 * Virtual Table Adapter
 * Wrapper that adds virtual scrolling to the existing Table component for large datasets
 */

import Table, { TableColumn } from './table';
import VirtualTable from './virtual-table';

interface VirtualTableAdapterProps<T> {
    columns: TableColumn<T>[];
    data: T[];
    total: number;
    className?: string;
    selectable?: boolean;
    selectedItems?: T[keyof T][];
    onSelectionChange?: (selectedIds: T[keyof T][]) => void;
    onRowClick?: (row: T) => void;
    idField?: keyof T;
    pagination?: boolean;
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    sort?: string;
    order?: "asc" | "desc";
    onSortChange?: (sort: string, order: "asc" | "desc") => void;
    loading?: boolean;
    emptyMessage?: string;

    // Virtual scrolling options
    enableVirtualScrolling?: boolean;
    virtualScrollThreshold?: number;
    rowHeight?: number;
    containerHeight?: number;
    overscan?: number;
}

const VirtualTableAdapter = <T extends Record<string, any>>({
    enableVirtualScrolling = true,
    virtualScrollThreshold = 100,
    rowHeight = 50,
    containerHeight = 400,
    overscan = 10,
    data,
    ...tableProps
}: VirtualTableAdapterProps<T>) => {

    // Use virtual scrolling for large datasets
    const shouldUseVirtualScrolling = enableVirtualScrolling &&
        data.length >= virtualScrollThreshold;

    if (shouldUseVirtualScrolling) {
        // Map TableColumn to VirtualTableColumn
        const virtualColumns = tableProps.columns.map(col => ({
            key: col.key,
            header: col.header,
            render: col.render,
            className: col.className,
        }));

        return (
            <VirtualTable
                data={data}
                columns={virtualColumns}
                rowHeight={rowHeight}
                height={containerHeight}
                onRowClick={tableProps.onRowClick}
                loading={tableProps.loading}
                emptyMessage={tableProps.emptyMessage}
                className={tableProps.className}
            />
        );
    }

    // Use regular table for smaller datasets
    return (
        <Table
            {...tableProps}
            data={data}
        />
    );
};

export default VirtualTableAdapter;
