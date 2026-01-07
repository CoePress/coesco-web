import { CalendarIcon, UserIcon, ClockIcon } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useLocation } from "react-router-dom";

import { PageHeader, StatusBadge, Table, Toolbar } from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import { Filter } from "@/components/feature/toolbar";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils";
import { useAuth } from "@/contexts/auth.context";

const FormSubmissions = () => {
  const { id: formId } = useParams<{ id: string }>();
  const { employee } = useAuth();
  const location = useLocation();
  const isAdminContext = location.pathname.startsWith("/admin");

  const [sort, setSort] = useState<string>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    createdById: employee.id,
    status: '',
    formId: '',
    dateRange: ''
  });
  const [searchQuery, setSearchQuery] = useState("");

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [_error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }>({ page: 1, totalPages: 1, total: 0, limit: 25 });

  const { get } = useApi<IApiResponse<any[]>>();
  const toast = useToast();

  const basePath = isAdminContext ? "/admin/forms" : "/service/forms";

  const include = useMemo(
    () => ["form"],
    []
  );

  const filter = useMemo(() => {
    const filterObj = Object.fromEntries(
      Object.entries(filterValues).filter(([_, value]) => value)
    );
    return Object.keys(filterObj).length > 0 ? JSON.stringify(filterObj) : undefined;
  }, [filterValues]);

  const fetchSubmissions = async () => {
    if (!formId) {
      setError("No form ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const response = await get(`/forms/${formId}/submissions`, {
      include,
      filter,
      sort,
      order,
      page,
      limit,
    });

    if (response?.success) {
      setSubmissions(response.data || []);
      if (response.meta) {
        setPagination({
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0,
          page: response.meta.page || 1,
          limit: response.meta.limit || 25,
        });
      }
    } else {
      const errorMessage = response?.error || "Failed to fetch form submissions";
      setError(errorMessage);
      toast.error(errorMessage);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (formId) {
      fetchSubmissions();
    }
  }, [formId, include, filter, sort, order, page, limit]);

  const columns: TableColumn<any>[] = [
    {
      key: "id",
      header: "Submission ID",
      className: "text-primary hover:underline font-mono text-sm",
      render: (_, row) => (
        <Link to={`${basePath}/${formId}/submissions/${row.id}`}>#{row.id.slice(-8).toUpperCase()}</Link>
      ),
    },
    {
      key: "form.name",
      header: "Form Name",
      render: (_, row) =>
        row.form ? (
          <Link
            to={`${basePath}/${row.form.id}`}
            className="hover:underline text-primary">
            {row.form.name}
          </Link>
        ) : (
          "-"
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => {
        const statusConfig = {
          pending: { label: "Pending", variant: "warning" as const },
          reviewing: { label: "Reviewing", variant: "info" as const },
          approved: { label: "Approved", variant: "success" as const },
          rejected: { label: "Rejected", variant: "error" as const },
          completed: { label: "Completed", variant: "success" as const },
        };
        const config = statusConfig[value as keyof typeof statusConfig] || { label: value, variant: "default" as const };
        return <StatusBadge label={config.label} variant={config.variant} />;
      },
    },
    {
      key: "createdById",
      header: "Submitted By",
      render: (value) => (
        <div className="flex items-center gap-2">
          <UserIcon size={14} className="text-text-muted" />
          <span className="text-sm">{value ? value.slice(-8).toUpperCase() : "System"}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Submitted",
      render: (value) => (
        <div className="flex items-center gap-2">
          <CalendarIcon size={14} className="text-text-muted" />
          {formatDate(value)}
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Last Updated",
      render: (value) => (
        <div className="flex items-center gap-2">
          <ClockIcon size={14} className="text-text-muted" />
          {formatDate(value)}
        </div>
      ),
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExport = () => {
    console.log('Exporting form submissions...', filteredSubmissions);
  };

  const filters: Filter[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'reviewing', label: 'Reviewing' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'completed', label: 'Completed' }
      ],
      placeholder: 'Filter by status'
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      options: [
        { value: '', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last7days', label: 'Last 7 Days' },
        { value: 'last30days', label: 'Last 30 Days' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' },
        { value: 'thisQuarter', label: 'This Quarter' },
        { value: 'thisYear', label: 'This Year' }
      ],
      placeholder: 'Filter by date'
    }
  ];

  const filteredSubmissions = useMemo(() => {
    let filtered = submissions || [];

    if (searchQuery) {
      filtered = filtered.filter(submission =>
        submission.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.form?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [submissions, searchQuery]);

  return (
    <div className="w-full flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Form Submissions"
        description={`${pagination.total} total submissions`}
        goBack
        goBackTo={`${basePath}/${formId}`}
      />

      <div className="p-2 gap-2 flex flex-col flex-1 overflow-hidden">
        <Toolbar
          onSearch={handleSearch}
          searchPlaceholder="Search submissions..."
          filters={filters}
          onFilterChange={handleFilterChange}
          filterValues={filterValues}
          showExport={true}
          onExport={handleExport}
        />

        <div className="flex-1 overflow-hidden">
          <Table
            columns={columns}
            data={filteredSubmissions}
            total={pagination.total}
            idField="id"
            pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            sort={sort}
            order={order}
            onSortChange={(newSort, newOrder) => {
              setSort(newSort);
              setOrder(newOrder);
            }}
            className="rounded border overflow-clip"
            loading={loading}
            emptyMessage="No form submissions found"
          />
        </div>
      </div>
    </div>
  );
};

export default FormSubmissions