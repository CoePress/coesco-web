import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Loader } from "@/components";
import Input from "@/components/ui/input";

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
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
  error?: string | null;
  mobileCardView?: boolean;
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  total,
  className = "",
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  onRowClick,
  idField = "id",
  pagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  sort,
  order = "asc",
  onSortChange,
  loading = false,
  emptyMessage = "No records found",
  error,
  mobileCardView = false,
}: TableProps<T>) {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const page = Number.parseInt(pageInput);
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange?.(page);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [pageInput, totalPages, currentPage, onPageChange]);

  const handleToggleAll = () => {
    if (!onSelectionChange)
      return;
    if (selectedItems.length === data.length) {
      onSelectionChange([]);
    }
    else {
      onSelectionChange(data.map(item => item[idField]));
    }
  };

  const handleToggleRow = (id: T[keyof T]) => {
    if (!onSelectionChange)
      return;
    if (selectedItems.includes(id)) {
      onSelectionChange(selectedItems.filter(item => item !== id));
    }
    else {
      onSelectionChange([...selectedItems, id]);
    }
  };

  const handleSort = (columnKey: string) => {
    if (!onSortChange)
      return;

    const newOrder = sort === columnKey && order === "asc" ? "desc" : "asc";
    onSortChange(columnKey, newOrder);
  };

  const renderMobileCards = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-error">{error}</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <p className="text-text-muted">{emptyMessage}</p>
        </div>
      );
    }

    return data.map((row) => {
      const isDivider = (row as any).isPage || (row as any).isSection;

      if (isDivider) {
        const dividerClass = (row as any).dividerClass || "bg-surface";
        return (
          <div
            key={String(row[idField])}
            className={`${dividerClass} px-4 py-2 rounded-lg`}
          >
            <div className="font-semibold text-text">
              {(row as any).title}
              {(row as any).description && (
                <span className="text-text-muted text-sm ml-2 font-normal">
                  -
                  {" "}
                  {(row as any).description}
                </span>
              )}
            </div>
          </div>
        );
      }

      return (
        <div
          key={String(row[idField])}
          className={`bg-foreground rounded-lg p-4 ${
            onRowClick ? "cursor-pointer active:bg-surface" : ""
          }`}
          style={{ boxShadow: "0 1px 3px var(--shadow)" }}
          onClick={() => onRowClick?.(row)}
        >
          {selectable && (
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-border"
                checked={selectedItems.includes(row[idField])}
                onChange={(e) => {
                  e.stopPropagation();
                  handleToggleRow(row[idField]);
                }}
                onClick={e => e.stopPropagation()}
              />
              <span className="text-sm text-text-muted">Select</span>
            </div>
          )}

          <div className="space-y-2">
            {columns
              .filter(col => col.header.toLowerCase() !== "actions")
              .map(column => (
                <div key={column.key} className="flex flex-col">
                  <span className="text-xs uppercase text-text-muted font-medium mb-1">
                    {column.header}
                  </span>
                  <span className="text-sm text-text">
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key] || "-"}
                  </span>
                </div>
              ))}

            {columns.find(col => col.header.toLowerCase() === "actions") && (
              <div className="flex gap-2 pt-2 border-t border-border mt-2">
                {columns
                  .filter(col => col.header.toLowerCase() === "actions")
                  .map(column => (
                    <div key={column.key} className="flex-1">
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${className}`}>
      {mobileCardView && (
        <div className="flex-1 overflow-auto p-2 space-y-2 md:hidden">
          {renderMobileCards()}
        </div>
      )}

      <div className={`flex-1 overflow-auto relative ${mobileCardView ? "hidden md:block" : ""}`}>
        <table
          className={`min-w-full text-text-muted text-sm ${
            (loading || data.length === 0) ? "h-full" : ""
          }`}
        >
          <thead className="bg-foreground sticky top-0 z-10 select-none" style={{ boxShadow: "0 1px 0 0 var(--border)" }}>
            <tr>
              {selectable && (
                <th
                  scope="col"
                  className="pl-4 py-2 text-left"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    checked={selectedItems.length === data.length}
                    onChange={handleToggleAll}
                  />
                </th>
              )}
              {columns.map((column) => {
                const isSortable = column.sortable !== false && column.header.toLowerCase() !== "actions";
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-nowrap ${
                      column.header.toLowerCase() === "actions" ? "w-1" : ""
                    } ${
                      onSortChange && isSortable
                        ? "cursor-pointer hover:bg-surface"
                        : ""
                    } ${
                      column.width || ""
                    } ${
                      column.className || ""
                    }`}
                    onClick={() =>
                      onSortChange
                      && isSortable
                      && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {onSortChange && isSortable && (
                        <span className="w-3 inline-block text-center">
                          {sort === column.key ? (order === "asc" ? "↑" : "↓") : ""}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border relative h-full">
            {loading
              ? (
                  <tr>
                    <td colSpan={columns.length + (selectable ? 1 : 0)} className="h-96">
                      <div className="flex items-center justify-center h-full">
                        <Loader />
                      </div>
                    </td>
                  </tr>
                )
              : error
                ? (
                    <tr>
                      <td colSpan={columns.length + (selectable ? 1 : 0)} className="h-96">
                        <div className="flex items-center justify-center h-full">
                          <p className="text-error">{error}</p>
                        </div>
                      </td>
                    </tr>
                  )
                : data.length === 0
                  ? (
                      <tr>
                        <td colSpan={columns.length + (selectable ? 1 : 0)} className="h-96">
                          <div className="flex items-center justify-center h-full">
                            <p className="text-text-muted">{emptyMessage}</p>
                          </div>
                        </td>
                      </tr>
                    )
                  : (
                      data.map((row) => {
                        const isDivider = (row as any).isPage || (row as any).isSection;

                        if (isDivider) {
                          const dividerClass = (row as any).dividerClass || "bg-surface";
                          return (
                            <tr
                              key={String(row[idField])}
                              className={dividerClass}
                            >
                              <td
                                colSpan={columns.length + (selectable ? 1 : 0)}
                                className="px-2 py-2"
                              >
                                <div className="font-semibold text-text">
                                  {(row as any).title}
                                  {(row as any).description && (
                                    <span className="text-text-muted text-sm ml-2 font-normal">
                                      -
                                      {(row as any).description}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr
                            key={String(row[idField])}
                            className={`hover:bg-surface bg-foreground ${
                              onRowClick ? "cursor-pointer" : ""
                            }`}
                            onClick={() => onRowClick?.(row)}
                          >
                            {selectable && (
                              <td
                                className="pl-4 py-2 whitespace-nowrap"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleRow(row[idField]);
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-border"
                                  checked={selectedItems.includes(row[idField])}
                                  onChange={() => {}}
                                />
                              </td>
                            )}
                            {columns.map(column => (
                              <td
                                key={column.key}
                                className={`px-2 py-2 whitespace-nowrap ${
                                  column.header.toLowerCase() === "actions" ? "w-1" : ""
                                } ${
                                  column.width || ""
                                } ${
                                  column.className || ""
                                }`}
                              >
                                {column.render
                                  ? column.render(row[column.key], row)
                                  : row[column.key]}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex h-max items-center justify-between p-2 bg-foreground border-t w-full">
          <div className="text-sm text-text-muted">
            {data.length === 0
              ? (
                  <span>0 results</span>
                )
              : (
                  <span className="font-medium">
                    {(currentPage - 1) * 25 + 1}
                    {" "}
                    to
                    {" "}
                    {Math.min(currentPage * 25, total)}
                    {" "}
                    of
                    {" "}
                    {total}
                    {" "}
                    results
                  </span>
                )}
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="secondary-outline"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1 || data.length === 0}
            >
              <ArrowLeftIcon size={16} />
            </Button>
            <div className="flex items-center gap-1 text-sm text-text-muted">
              <div className="w-15">
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={e => setPageInput(e.target.value)}
                  disabled={data.length === 0}
                  className="text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <span>
                of
                {totalPages}
              </span>
            </div>
            <Button
              variant="secondary-outline"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages || data.length === 0}
            >
              <ArrowRightIcon size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
