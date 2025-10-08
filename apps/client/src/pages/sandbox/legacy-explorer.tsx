import React, { useEffect, useMemo, useState } from "react";
import { Table, Toolbar, Button } from "@/components";
import type { TableColumn } from "@/components/ui/table";
import type { Filter } from "@/components";
import { useApi } from "@/hooks/use-api";

type Row = Record<string, any>;

type DatabaseOption = "std" | "quote" | "job";

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function flattenRow(row: Row, prefix = ""): Row {
  const flat: Row = {};
  for (const [key, val] of Object.entries(row)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(val)) {
      Object.assign(flat, flattenRow(val, newKey));
    } else if (Array.isArray(val)) {
      flat[newKey] = JSON.stringify(val);
    } else {
      flat[newKey] = val;
    }
  }
  return flat;
}

function inferColumns(fields: string[]): string[] {
  return fields;
}

function toCSV(rows: Row[], columns: string[]): string {
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const header = columns.join(",");
  const body = rows
    .map((r) => {
      const flat = flattenRow(r);
      return columns.map((c) => esc(flat[c])).join(",");
    })
    .join("");
  return `${header}
${body}`;
}

function download(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}



const ToggleChip: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={
      "select-none rounded border px-3 py-1 text-xs transition " +
      (checked
        ? "border-[var(--primary)] bg-[color:var(--primary)]/15 text-text"
        : "border-border bg-foreground text-text-muted hover:bg-surface")
    }
  >
    <span
      className="mr-1 inline-block h-2 w-2 rounded"
      style={{ background: checked ? "var(--primary)" : "var(--border)" }}
    />
    {label}
  </button>
);

const LegacyExplorer: React.FC = () => {
  const [database, setDatabase] = useState<DatabaseOption>("std");
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [fields, setFields] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Row[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize, _setPageSize] = useState(25);

  const tablesApi = useApi<string[]>();
  const fieldsApi = useApi<string[]>();
  const dataApi = useApi<{ data: Row[]; meta: { page: number; limit: number; total: number; totalPages: number } }>();

  const allColumns = useMemo(() => inferColumns(fields), [fields]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  useEffect(() => {
    if (allColumns.length && visibleColumns.length === 0) {
      setVisibleColumns(allColumns);
    } else if (!allColumns.length) {
      setVisibleColumns([]);
    }
  }, [allColumns]);

  const fetchTables = async () => {
    if (!database) return;
    const data = await tablesApi.get(`/legacy/${database}/tables`);
    if (data) {
      setTables(data);
      if (data.length > 0) {
        setSelectedTable(data[0]);
      }
    }
  };

  const fetchFields = async () => {
    if (!database || !selectedTable) return;
    const data = await fieldsApi.get(`/legacy/${database}/${selectedTable}/fields`);
    if (data) {
      setFields(data);
    }
  };

  const fetchData = async (pageNum: number = page) => {
    if (!database || !selectedTable) return;
    const result = await dataApi.get(`/legacy/${database}/${selectedTable}`, { page: pageNum, limit: pageSize });
    if (result?.data) {
      setRawRows(result.data);
    }
  };

  useEffect(() => {
    if (database) {
      setTables([]);
      setSelectedTable("");
      setFields([]);
      setRawRows([]);
      fetchTables();
    }
  }, [database]);

  useEffect(() => {
    if (selectedTable) {
      setFields([]);
      setRawRows([]);
      fetchFields();
    }
  }, [selectedTable]);

  const total = dataApi.response?.meta?.total ?? 0;
  const totalPages = dataApi.response?.meta?.totalPages ?? 0;

  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
  };

  const exportCSV = (scope: "page" | "all" = "all") => {
    const rows = rawRows;
    const csv = toCSV(rows, visibleColumns.length ? visibleColumns : allColumns);
    download(`export_${scope}.csv`, csv, "text/csv");
  };

  useEffect(() => {
    if (rawRows.length > 0) {
      fetchData(page);
    }
  }, [page]);

  const tableColumns: TableColumn<Row>[] = useMemo(() => {
    return visibleColumns.map((col) => ({
      key: col,
      header: col,
      render: (value: any) => {
        const flatValue = value ?? "";
        return (
          <span className="max-w-[28rem] truncate block" title={String(flatValue)}>
            {String(flatValue)}
          </span>
        );
      }
    }));
  }, [visibleColumns]);

  const tableData = useMemo(() => {
    return rawRows.map((row, index) => {
      const flatRow = flattenRow(row);
      return {
        ...flatRow,
        _id: index
      };
    });
  }, [rawRows]);

  const databaseOptions: Filter[] = [
    {
      key: "database",
      label: "Database",
      options: [
        { value: "std", label: "std" },
        { value: "quote", label: "quotesys" },
        { value: "job", label: "Job" }
      ]
    }
  ];

  const filters: Filter[] = [
    {
      key: "table",
      label: "Table",
      options: tables.map((table) => ({
        value: table,
        label: table
      }))
    }
  ];

  const toggleFieldSelection = () => {
    if (visibleColumns.length === 0) {
      setVisibleColumns(allColumns);
    } else {
      setVisibleColumns([]);
    }
  };

  const loading = tablesApi.loading || fieldsApi.loading || dataApi.loading;
  const error = tablesApi.error || fieldsApi.error || dataApi.error;

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <Toolbar
          filters={tables.length > 0 ? [...databaseOptions, ...filters] : databaseOptions}
          onFilterChange={(key, value) => {
            if (key === "database") {
              setDatabase(value as DatabaseOption);
            } else if (key === "table") {
              setSelectedTable(value);
            }
          }}
          filterValues={{ database, table: selectedTable }}
          showExport={rawRows.length > 0}
          onExport={() => exportCSV("all")}
          actions={
            selectedTable && (
              <Button onClick={() => fetchData()} disabled={!selectedTable || dataApi.loading} variant="primary">
                {dataApi.loading ? "Loading…" : "Load Data"}
              </Button>
            )
          }
        />

        {fields.length > 0 && (
          <div className="flex items-center justify-between gap-2 p-3 rounded border border-border bg-foreground">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <span className="text-sm font-medium text-text-muted">Fields:</span>
              <div className="flex max-h-32 flex-wrap gap-2 overflow-auto">
                {allColumns.map((c) => (
                  <ToggleChip
                    key={c}
                    label={c}
                    checked={visibleColumns.includes(c)}
                    onChange={() => toggleColumn(c)}
                  />
                ))}
              </div>
            </div>
            <Button onClick={toggleFieldSelection} variant="primary">
              {visibleColumns.length === 0 ? "Select All" : "Clear All Selections"}
            </Button>
          </div>
        )}

        {error && (
          <div className="rounded border border-[color:var(--error)]/30 bg-[color:var(--error)]/10 p-3 text-sm text-[color:var(--error)]">
            Error: {error}
          </div>
        )}

        {rawRows.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <Table
              columns={tableColumns}
              data={tableData}
              total={total}
              pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              loading={loading}
              emptyMessage="No data available"
              idField="_id"
              className="rounded border overflow-clip"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LegacyExplorer;
