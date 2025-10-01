import { Button, Loader } from "@/components";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

export type TableColumn<T> = {
  key: string;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
};

type TableProps<T> = {
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
};

const Table = <T extends Record<string, any>>({
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
}: TableProps<T>) => {
  const handleToggleAll = () => {
    if (!onSelectionChange) return;
    if (selectedItems.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((item) => item[idField]));
    }
  };

  const handleToggleRow = (id: T[keyof T]) => {
    if (!onSelectionChange) return;
    if (selectedItems.includes(id)) {
      onSelectionChange(selectedItems.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedItems, id]);
    }
  };

  const handleSort = (columnKey: string) => {
    if (!onSortChange) return;

    const newOrder = sort === columnKey && order === "asc" ? "desc" : "asc";
    onSortChange(columnKey, newOrder);
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-auto relative">
        <table
          className={`min-w-full text-text-muted text-sm ${
            (loading || data.length === 0) ? 'h-full' : ''
          }`}>
          <thead className="bg-foreground sticky top-0 z-10 select-none" style={{boxShadow: '0 1px 0 0 var(--border)'}}>
            <tr>
              {selectable && (
                <th
                  scope="col"
                  className="pl-4 py-2 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    checked={selectedItems.length === data.length}
                    onChange={handleToggleAll}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-nowrap ${
                    column.header.toLowerCase() === "actions" ? "w-1" : ""
                  } ${
                    onSortChange && column.header.toLowerCase() !== "actions"
                      ? "cursor-pointer hover:bg-surface"
                      : ""
                  }`}
                  onClick={() =>
                    onSortChange &&
                    column.header.toLowerCase() !== "actions" &&
                    handleSort(column.key)
                  }>
                  <div className="flex items-center gap-1">
                    {column.header}
                    {onSortChange && column.header.toLowerCase() !== "actions" && (
                      <span className="w-3 inline-block text-center">
                        {sort === column.key ? (order === "asc" ? "↑" : "↓") : ""}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border relative h-full">
            {loading ? (
               <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="h-96">
                  <div className="flex items-center justify-center h-full">
                    <Loader />
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="h-96">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-error">{error}</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="h-96">
                  <div className="flex items-center justify-center h-full">
                    <p className="text-text-muted">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isDivider = (row as any).isPage || (row as any).isSection;

                if (isDivider) {
                  const dividerClass = (row as any).dividerClass || "bg-surface";
                  return (
                    <tr
                      key={String(row[idField])}
                      className={dividerClass}>
                      <td
                        colSpan={columns.length + (selectable ? 1 : 0)}
                        className="px-2 py-2">
                        <div className="font-semibold text-text">
                          {(row as any).title}
                          {(row as any).description && (
                            <span className="text-text-muted text-sm ml-2 font-normal">- {(row as any).description}</span>
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
                    onClick={() => onRowClick?.(row)}>
                    {selectable && (
                      <td
                        className="pl-4 py-2 whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRow(row[idField]);
                        }}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={selectedItems.includes(row[idField])}
                          onChange={() => {}}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-2 py-2 whitespace-nowrap ${
                          column.header.toLowerCase() === "actions" ? "w-1" : ""
                        } ${
                          column.className || ""
                        }`}>
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
            {data.length === 0 ? (
              <span>0 results</span>
            ) : (
              <span className="font-medium">{(currentPage - 1) * 25 + 1} to {Math.min(currentPage * 25, total)} of {total} results</span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="secondary-outline"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1 || data.length === 0}>
              <ArrowLeftIcon size={16} />
            </Button>
            <span className="text-text-muted text-sm">
              {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary-outline"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages || data.length === 0}>
              <ArrowRightIcon size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
