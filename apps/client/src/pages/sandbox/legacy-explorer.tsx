import React, { useEffect, useMemo, useState } from "react";
import { Table, Toolbar, Button } from "@/components";
import type { TableColumn } from "@/components/ui/table";
import type { Filter } from "@/components";

type Row = Record<string, any>;

type TableDef = {
  label: string;
  path: string;
};

type DatabaseDef = {
  label: string;
  baseUrl: string;
  tables: TableDef[];
};

const DATABASES: Record<string, DatabaseDef> = {
  jsonplaceholder: {
    label: "JSONPlaceholder",
    baseUrl: "https://jsonplaceholder.typicode.com",
    tables: [
      { label: "Posts", path: "/posts" },
      { label: "Comments", path: "/comments" },
      { label: "Albums", path: "/albums" },
      { label: "Photos", path: "/photos" },
      { label: "Todos", path: "/todos" },
      { label: "Users", path: "/users" },
    ],
  },
  fakestore: {
    label: "Fake Store API",
    baseUrl: "https://fakestoreapi.com",
    tables: [
      { label: "Products", path: "/products" },
      { label: "Carts", path: "/carts" },
      { label: "Users", path: "/users" },
    ],
  },
};

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

function inferColumns(rows: Row[]): string[] {
  const keys = new Set<string>();
  rows.slice(0, 25).forEach((r) => {
    const flat = flattenRow(r);
    Object.keys(flat).forEach((k) => keys.add(k));
  });
  return Array.from(keys);
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

// -------------------------- Data IO --------------------------

async function fetchFromWeb(baseUrl: string, path: string): Promise<Row[]> {
  const res = await fetch(baseUrl + path);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  const data = await res.json();
  if (Array.isArray(data)) return data as Row[];
  if (isPlainObject(data)) return [data as Row];
  return [{ value: data }];
}

const _Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  label?: string;
}> = ({ value, onChange, children, label }) => (
  <label className="flex flex-col gap-1 text-sm">
    {label && <span className="text-text-muted">{label}</span>}
    <select
      className="rounded border border-border bg-surface px-3 py-2 text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  </label>
);

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
  const [dbKey, setDbKey] = useState<string>("jsonplaceholder");
  const [tablePath, setTablePath] = useState<string>(DATABASES["jsonplaceholder"].tables[0].path);

  const [rawRows, setRawRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, _setPageSize] = useState(25);

  const allColumns = useMemo(() => inferColumns(rawRows), [rawRows]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  useEffect(() => {
    if (allColumns.length && visibleColumns.length === 0) {
      setVisibleColumns(allColumns.slice(0, 8));
    } else if (!allColumns.length) {
      setVisibleColumns([]);
    }
  }, [allColumns]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      setPage(1);
      const db = DATABASES[dbKey];
      const data = await fetchFromWeb(db.baseUrl, tablePath);
      setRawRows(data);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbKey, tablePath]);

  const total = rawRows.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = Math.min(page * pageSize, total);
  const pageRows = useMemo(() => rawRows.slice(start, end), [rawRows, start, end]);

  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
  };

  const exportCSV = (scope: "page" | "all" = "all") => {
    const rows = scope === "page" ? pageRows : rawRows;
    const csv = toCSV(rows, visibleColumns.length ? visibleColumns : allColumns);
    download(`export_${scope}.csv`, csv, "text/csv");
  };
  const _exportJSON = (scope: "page" | "all" = "all") => {
    const rows = scope === "page" ? pageRows : rawRows;
    download(`export_${scope}.json`, JSON.stringify(rows, null, 2), "application/json");
  };

  useEffect(() => {
    const first = DATABASES[dbKey].tables[0]?.path ?? "";
    setTablePath(first);
  }, [dbKey]);

  const db = DATABASES[dbKey];

  // Prepare columns for Table component
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

  // Prepare data for Table component
  const tableData = useMemo(() => {
    return pageRows.map((row, index) => {
      const flatRow = flattenRow(row);
      return {
        ...flatRow,
        _id: index // Add unique identifier for table component
      };
    });
  }, [pageRows]);

  // Prepare filters for Toolbar
  const filters: Filter[] = [
    {
      key: "database",
      label: "Database",
      options: Object.entries(DATABASES).map(([key, db]) => ({
        value: key,
        label: db.label
      }))
    },
    {
      key: "table",
      label: "Table",
      options: db.tables.map((table) => ({
        value: table.path,
        label: table.label
      }))
    }
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === "database") {
      setDbKey(value);
    } else if (key === "table") {
      setTablePath(value);
    }
  };

  const filterValues = {
    database: dbKey,
    table: tablePath
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-muted">Endpoint Preview</span>
            <input
              value={db.baseUrl + tablePath}
              readOnly
              className="w-full rounded border border-border bg-surface px-3 py-2 text-text-muted"
            />
          </label>
        </div>

        <Toolbar
          filters={filters}
          onFilterChange={handleFilterChange}
          filterValues={filterValues}
          showExport
          onExport={() => exportCSV("all")}
          actions={
            <div className="flex items-center gap-2">
              <Button onClick={refresh} disabled={loading} variant="primary">
                {loading ? "Loading…" : "Run Query"}
              </Button>
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text-muted">Fields:</span>
            <div className="flex max-h-28 flex-wrap gap-2 overflow-auto">
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
        </Toolbar>

        {error && (
          <div className="rounded border border-[color:var(--error)]/30 bg-[color:var(--error)]/10 p-3 text-sm text-[color:var(--error)]">
            Error: {error}
          </div>
        )}

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
      </div>
    </div>
  );
};

export default LegacyExplorer;
