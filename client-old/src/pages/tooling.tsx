import { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TableData {
  headers: string[];
  rows: Record<string, string>[];
}

interface SortConfig {
  column: string | null;
  direction: "asc" | "desc";
}

const ROWS_PER_PAGE = 100;

const ToolingPage = () => {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: "asc",
  });

  useEffect(() => {
    fetch("/data/tool_data_cleaned.csv")
      .then((response) => response.text())
      .then((csv) => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              setTableData({
                headers: Object.keys(results.data[0] as Record<string, string>),
                rows: results.data as Record<string, string>[],
              });
            }
          },
        });
      });
  }, []);

  const handleSort = (column: string) => {
    setSortConfig((currentSort) => ({
      column,
      direction:
        currentSort.column === column && currentSort.direction === "asc"
          ? "desc"
          : "asc",
    }));
    setPage(0); // Reset to first page when sorting
  };

  const sortedAndFilteredRows = tableData?.rows
    .filter((row) =>
      Object.values(row).some((value) =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortConfig.column) return 0;

      const aValue = a[sortConfig.column];
      const bValue = b[sortConfig.column];

      // Try to sort as numbers if possible
      const aNum = Number(aValue);
      const bNum = Number(bValue);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }

      // Fall back to string comparison
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  const paginatedRows = sortedAndFilteredRows?.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE
  );

  const totalPages = sortedAndFilteredRows
    ? Math.ceil(sortedAndFilteredRows.length / ROWS_PER_PAGE)
    : 0;

  const metrics = tableData?.rows
    ? {
        uniqueToolDescriptions: new Set(
          tableData.rows.map((row) => row.tool_description)
        ).size,
        uniqueToolDescriptionsCleaned: new Set(
          tableData.rows.map((row) => row.tool_description_cleaned)
        ).size,
      }
    : null;

  return (
    <div className="p-4">
      {metrics && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              Unique Tool Descriptions
            </div>
            <div className="text-2xl font-bold">
              {metrics.uniqueToolDescriptions}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              Unique Cleaned Descriptions
            </div>
            <div className="text-2xl font-bold">
              {metrics.uniqueToolDescriptionsCleaned}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <Input
          type="search"
          placeholder="Search table..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}>
            Previous
          </Button>
          <span className="text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}>
            Next
          </Button>
        </div>
      </div>

      {tableData && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {tableData.headers.map((header, i) => (
                  <TableHead
                    key={header}
                    className={`${
                      i === 0
                        ? "w-[10ch]"
                        : i === 1
                          ? "w-[3ch]"
                          : i === 2
                            ? "w-[2ch]"
                            : i === 3
                              ? "w-[3ch]"
                              : ""
                    } whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:bg-accent`}
                    onClick={() => handleSort(header)}>
                    <div className="flex items-center gap-1">
                      {header}
                      {sortConfig.column === header && (
                        <span className="ml-1">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows?.map((row, index) => (
                <TableRow key={index}>
                  {tableData.headers.map((header, i) => (
                    <TableCell
                      key={header}
                      className={`${
                        i === 0
                          ? "w-[10ch]"
                          : i === 1
                            ? "w-[3ch]"
                            : i === 2
                              ? "w-[2ch]"
                              : i === 3
                                ? "w-[3ch]"
                                : ""
                      } whitespace-nowrap overflow-hidden text-ellipsis`}>
                      {row[header]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ToolingPage;
