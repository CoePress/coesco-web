import { Button } from "@/components";

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

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table
          className={`min-w-full divide-y divide-border text-text-muted text-sm ${className}`}>
          <thead className="bg-foreground">
            <tr>
              {selectable && (
                <th
                  scope="col"
                  className="pl-4 py-3 text-left">
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
                  className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-nowrap`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-foreground divide-y divide-border">
            {data.map((row) => {
              return (
                <tr
                  key={String(row[idField])}
                  className={`hover:bg-surface ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(row)}>
                  {selectable && (
                    <td
                      className="pl-4 py-3 whitespace-nowrap"
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
                      className={`px-3 py-3 whitespace-nowrap ${
                        column.className || ""
                      }`}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex h-max items-center justify-between p-2 bg-foreground border-t w-full">
          <div className="text-sm text-text-muted">
            Showing{" "}
            <span className="font-medium">{(currentPage - 1) * 25 + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(currentPage * 25, total)}
            </span>{" "}
            of <span className="font-medium">{total}</span> results
          </div>
          <div className="flex gap-1">
            <Button
              variant="secondary-outline"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}>
              Previous
            </Button>
            <Button
              variant="secondary-outline"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
