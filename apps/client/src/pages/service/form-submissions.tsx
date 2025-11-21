import { CalendarIcon, UserIcon, ClockIcon, FileText, Activity, User, Calendar, Edit, Plus, ArrowLeft, Eye } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";

import { PageHeader, StatusBadge, Table, Toolbar, Card, Button } from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import { Filter } from "@/components/feature/toolbar";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils";
import { useAuth } from "@/contexts/auth.context";

interface FormData {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string;
  createdByName?: string;
  updatedByName?: string;
  pages?: any[];
  _count?: {
    submissions: number;
  };
}

const FormSubmissions = () => {
  const { id: formId } = useParams<{ id: string }>();
  const { employee } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminContext = location.pathname.startsWith("/admin");
  const isSalesContext = location.pathname.startsWith("/sales");

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
  const [form, setForm] = useState<FormData | null>(null);
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

  const basePath = isAdminContext ? "/admin/forms" : isSalesContext ? "/sales/forms" : "/service/forms";

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

  const fetchFormDetails = async () => {
    if (!formId) {
      setError("No form ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formResponse = await get(`/forms/${formId}`, {
        include: ['pages', '_count']
      });

      if (formResponse?.success && formResponse.data) {
        setForm(formResponse.data);
      } else {
        setError(formResponse?.error || 'Failed to fetch form details');
      }
    } catch (err) {
      console.error('Error fetching form:', err);
      setError('Failed to load form details');
    }
  };

  const fetchSubmissions = async () => {
    if (!formId) {
      setError("No form ID provided");
      setLoading(false);
      return;
    }

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
      fetchFormDetails();
    }
  }, [formId]);

  useEffect(() => {
    if (formId) {
      fetchSubmissions();
    }
  }, [formId, include, filter, sort, order, page, limit]);

  const columns: TableColumn<any>[] = [
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
      key: "createdByName",
      header: "Submitted By",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <UserIcon size={14} className="text-text-muted" />
          <span className="text-sm">{row.createdByName || "Unknown"}</span>
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
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary-outline"
            onClick={() => navigate(`${basePath}/${formId}/submissions/${row.id}`)}
          >
            <Eye size={14} />
            <span>View</span>
          </Button>
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

  const handleSubmitForm = () => {
    navigate(`${basePath}/${formId}/submit`);
  };

  const handleEditForm = () => {
    navigate(`/admin/forms/${formId}`);
  };

  const Actions = () => (
    <div className="flex gap-2">
      <Button onClick={() => navigate(basePath)} variant="secondary-outline">
        <ArrowLeft size={16} />
        <span>Back</span>
      </Button>
      {!isAdminContext && (
        <Button onClick={handleSubmitForm}>
          <Plus size={16} />
          <span>Submit Form</span>
        </Button>
      )}
      {isAdminContext && (
        <Button onClick={handleEditForm}>
          <Edit size={16} />
          <span>Edit Form</span>
        </Button>
      )}
    </div>
  );

  if (loading && !form) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-lg">Loading form details...</div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title={form?.name || "Form Submissions"}
        description={form?.description || ""}
        actions={<Actions />}
      />

      <div className="p-2 gap-2 flex flex-col flex-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <FileText className="text-primary" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">
                  {form?.pages?.length || 0}
                </div>
                <div className="text-sm text-text-muted">Pages</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Activity className="text-primary" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">
                  {pagination.total}
                </div>
                <div className="text-sm text-text-muted">Submissions</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <User className="text-primary" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">
                  {form?.createdAt ? new Date(form.createdAt).toLocaleDateString() : '-'}
                </div>
                <div className="text-sm text-text-muted">
                  Created by {form?.createdByName || (form?.createdById === 'system' ? 'System' : 'Unknown')}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Calendar className="text-primary" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">
                  {form?.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : '-'}
                </div>
                <div className="text-sm text-text-muted">
                  Updated by {form?.updatedByName || (form?.updatedById === 'system' ? 'System' : 'Unknown')}
                </div>
              </div>
            </div>
          </Card>
        </div>

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