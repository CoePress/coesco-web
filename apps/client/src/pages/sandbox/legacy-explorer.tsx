import React, { useEffect, useMemo, useState } from "react";

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

const Select: React.FC<{
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

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = "",
  ...props
}) => (
  <button
    {...props}
    className={
      "rounded border border-border bg-foreground px-3 py-2 text-sm hover:bg-surface disabled:opacity-50 " +
      className
    }
  />
);

const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = "",
  ...props
}) => (
  <button
    {...props}
    className={
      "rounded bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-black shadow-sm hover:brightness-95 disabled:opacity-50 " +
      className
    }
  />
);

const Pagination: React.FC<{
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}> = ({ page, pageSize, total, onPage, onPageSize }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pages;

  const window = 5;
  const start = Math.max(1, page - Math.floor(window / 2));
  const end = Math.min(pages, start + window - 1);
  const nums = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <IconButton onClick={() => onPage(1)} disabled={!canPrev}>⏮ First</IconButton>
      <IconButton onClick={() => onPage(page - 1)} disabled={!canPrev}>◀ Prev</IconButton>
      {nums.map((n) => (
        <button
          key={n}
          onClick={() => onPage(n)}
          className={
            "rounded-lg border px-3 py-2 text-sm " +
            (n === page
              ? "border-[var(--primary)] bg-[color:var(--primary)]/15"
              : "border-border bg-foreground hover:bg-surface")
          }
        >
          {n}
        </button>
      ))}
      <IconButton onClick={() => onPage(page + 1)} disabled={!canNext}>Next ▶</IconButton>
      <IconButton onClick={() => onPage(pages)} disabled={!canNext}>Last ⏭</IconButton>
      <div className="ml-2 flex items-center gap-2 text-sm text-text-muted">
        <span>Rows/page</span>
        <select
          className="rounded-lg border border-border bg-surface px-2 py-1"
          value={pageSize}
          onChange={(e) => onPageSize(parseInt(e.target.value, 10))}
        >
          {[10, 20, 50, 100].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span>
          {total === 0 ? 0 : (page - 1) * pageSize + 1}–
          {Math.min(page * pageSize, total)} of {total}
        </span>
      </div>
    </div>
  );
};

const Toolbar: React.FC<{
  visibleColumns: string[];
  allColumns: string[];
  onToggle: (col: string) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  refresh: () => void;
  loading: boolean;
}> = ({ visibleColumns, allColumns, onToggle, onExportCsv, onExportJson, refresh, loading }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-foreground p-3 shadow-[0_1px_2px_var(--shadow)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-text-muted">Fields:</span>
        <div className="flex max-h-28 flex-wrap gap-2 overflow-auto">
          {allColumns.map((c) => (
            <ToggleChip key={c} label={c} checked={visibleColumns.includes(c)} onChange={() => onToggle(c)} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <IconButton onClick={refresh} disabled={loading}>⟳ Refresh</IconButton>
        <IconButton onClick={onExportCsv}>⭳ Export CSV</IconButton>
        <IconButton onClick={onExportJson}>⭳ Export JSON</IconButton>
      </div>
    </div>
  );
};

const DataTable: React.FC<{
  rows: Row[];
  visibleColumns: string[];
}> = ({ rows, visibleColumns }) => {
  const columns = visibleColumns;

  return (
    <div className="overflow-auto rounded border border-border bg-foreground shadow-[0_1px_2px_var(--shadow)]">
      <table className="min-w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-surface/60 backdrop-blur">
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted"
                title={c}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-sm text-text-muted" colSpan={columns.length}>
                No data
              </td>
            </tr>
          ) : (
            rows.map((r, i) => {
              const flat = flattenRow(r);
              return (
                <tr key={i} className={i % 2 ? "bg-surface/40" : "bg-foreground"}>
                  {columns.map((c) => (
                    <td key={c} className="max-w-[28rem] truncate border-b border-border px-3 py-2 text-sm text-text" title={String(flat[c])}>
                      {String(flat[c] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

const LegacyExplorer: React.FC = () => {
  const [dbKey, setDbKey] = useState<string>("jsonplaceholder");
  const [tablePath, setTablePath] = useState<string>(DATABASES["jsonplaceholder"].tables[0].path);

  const [rawRows, setRawRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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
  const start = (page - 1) * pageSize;
  const end = Math.min(page * pageSize, total);
  const pageRows = useMemo(() => rawRows.slice(start, end), [rawRows, start, end]);

  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
  };

  const exportCSV = (scope: "page" | "all" = "page") => {
    const rows = scope === "page" ? pageRows : rawRows;
    const csv = toCSV(rows, visibleColumns.length ? visibleColumns : allColumns);
    download(`export_${scope}.csv`, csv, "text/csv");
  };
  const exportJSON = (scope: "page" | "all" = "page") => {
    const rows = scope === "page" ? pageRows : rawRows;
    download(`export_${scope}.json`, JSON.stringify(rows, null, 2), "application/json");
  };

  useEffect(() => {
    const first = DATABASES[dbKey].tables[0]?.path ?? "";
    setTablePath(first);
  }, [dbKey]);

  const db = DATABASES[dbKey];

  return (
    <div className="p-2 flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Select value={dbKey} onChange={setDbKey} label="Database">
          {Object.entries(DATABASES).map(([key, d]) => (
            <option key={key} value={key}>
              {d.label}
            </option>
          ))}
        </Select>
        <Select value={tablePath} onChange={setTablePath} label="Table">
          {db.tables.map((t) => (
            <option key={t.path} value={t.path}>
              {t.label}
            </option>
          ))}
        </Select>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-muted">Endpoint Preview</span>
          <input
            value={db.baseUrl + tablePath}
            readOnly
            className="w-full rounded border border-border bg-surface px-3 py-2 text-text-muted"
          />
        </label>
        <div className="flex items-end">
          <PrimaryButton onClick={refresh} disabled={loading} className="w-full">
            {loading ? "Loading…" : "Run Query"}
          </PrimaryButton>
        </div>
      </div>

      <Toolbar
        visibleColumns={visibleColumns}
        allColumns={allColumns}
        onToggle={toggleColumn}
        onExportCsv={() => exportCSV("page")}
        onExportJson={() => exportJSON("page")}
        refresh={refresh}
        loading={loading}
      />

      {error && (
        <div className="rounded border border-[color:var(--error)]/30 bg-[color:var(--error)]/10 p-3 text-sm text-[color:var(--error)]">
          Error: {error}
        </div>
      )}

      <DataTable rows={pageRows} visibleColumns={visibleColumns} />

      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={setPage}
          onPageSize={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Export scope:</span>
          <IconButton onClick={() => exportCSV("page")}>Page CSV</IconButton>
          <IconButton onClick={() => exportJSON("page")}>Page JSON</IconButton>
          <IconButton onClick={() => exportCSV("all")}>All CSV</IconButton>
          <IconButton onClick={() => exportJSON("all")}>All JSON</IconButton>
        </div>
      </div>
    </div>
  );
};

export default LegacyExplorer;
