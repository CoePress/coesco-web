import { FileTextIcon, ClipboardListIcon, PlusCircleIcon, CheckCircleIcon, UsersIcon } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { Button, Modal, StatusBadge, Table, Toolbar } from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import PageHeader from "@/components/layout/page-header";
import { Filter } from "@/components/feature/toolbar";
import Metrics, { MetricsCard } from "@/components/ui/metrics";

const Forms = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState<"createdAt" | "updatedAt" | "name">("name");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }>({ page: 1, totalPages: 1, total: 0, limit: 25 });
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  
  const { get, post } = useApi<IApiResponse<any[]>>();

  const include = useMemo(
    () => [],
    []
  );

  const fetchForms = async () => {
    setLoading(true);
    setError(null);
    const response = await get("/forms", {
      include,
      sort,
      order,
      page,
      limit,
    });
    
    if (response?.success) {
      setForms(response.data || []);
      if (response.meta) {
        setPagination({
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0,
          page: response.meta.page || 1,
          limit: response.meta.limit || 25,
        });
      }
    } else {
      setError(response?.error || "Failed to fetch forms");
    }
    setLoading(false);
  };
  
  const refresh = () => {
    fetchForms();
  };
  
  const createForm = async (params: any) => {
    setCreateLoading(true);
    const response = await post("/forms", params);
    setCreateLoading(false);
    return response?.success ? response.data : null;
  };
  
  useEffect(() => {
    fetchForms();
  }, [include, sort, order, page, limit]);

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Form Name",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/service/forms/${row.id}`}>{row.name || `Form ${row.id.slice(-8)}`}</Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge label={value as string} />,
    },
    {
      key: "submissions",
      header: "Submissions",
      render: (_, row) => row.submissions?.length || 0,
    },
    {
      key: "createdBy.name",
      header: "Created By",
      render: (_, row) =>
        row.createdBy ? (
          <Link
            to={`/service/team/${row.createdBy.id}?tab=forms`}
            className="hover:underline">
            {`${row.createdBy.firstName} ${row.createdBy.lastName}`}
          </Link>
        ) : (
          "-"
        ),
    },
  ];

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const kpis = [
    {
      title: "Total Forms",
      value: "24",
      description: "Active forms in system",
      icon: <ClipboardListIcon size={16} />,
      change: 12.5,
    },
    {
      title: "Total Submissions",
      value: "1,438",
      description: "Submissions collected this month",
      icon: <FileTextIcon size={16} />,
      change: 8.2,
    },
    {
      title: "Completion Rate",
      value: "89%",
      description: "Forms completed vs started",
      icon: <CheckCircleIcon size={16} />,
      change: -2.1,
    },
    {
      title: "Active Users",
      value: "156",
      description: "Users who filled forms this month",
      icon: <UsersIcon size={16} />,
      change: 5.3,
    },
  ];

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={toggleModal}>
          <PlusCircleIcon size={20} /> Create New
        </Button>
      </div>
    );
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleExport = () => {
    console.log('Exporting forms...', filteredForms)
    // TODO: Implement actual export functionality
  }

  const filters: Filter[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' }
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
  ]

  const filteredForms = useMemo(() => {
    // For now, just return forms as-is since filtering should be done server-side
    // TODO: Implement server-side filtering by passing filterValues to useGetEntities
    return forms || []
  }, [forms])

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Forms"
        description={`${forms?.length} total forms`}
        actions={<Actions />}
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <Metrics>
          {kpis.map((metric) => (
            <MetricsCard {...metric} />
          ))}
        </Metrics>

        <Toolbar
          onSearch={handleSearch}
          searchPlaceholder="Search forms..."
          filters={filters}
          onFilterChange={handleFilterChange}
          filterValues={filterValues}
          showExport={true}
          onExport={handleExport}
        />

        <Table
          columns={columns}
          data={filteredForms}
          total={pagination.total}
          idField="id"
          pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          sort={sort}
          order={order}
          onSortChange={(newSort, newOrder) => {
            setSort(newSort as "createdAt" | "updatedAt");
            setOrder(newOrder as "asc" | "desc");
          }}
          className="rounded border overflow-clip"
          emptyMessage="No forms found"
        />
      </div>

      {isModalOpen && (
        <CreateFormModal
          isOpen={isModalOpen}
          onClose={toggleModal}
          onSuccess={refresh}
          createForm={createForm}
          loading={createLoading}
        />
      )}
    </div>
  );
};

const CreateFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  createForm,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createForm: (params: any) => Promise<any>;
  loading: boolean;
}) => {
  const [nameValue, setNameValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [isCreateDisabledState, setIsCreateDisabledState] = useState(true);

  useEffect(() => {
    const checkDisabled = () => {
      if (loading) return true;
      return !nameValue.trim();
    };

    setIsCreateDisabledState(checkDisabled());
  }, [nameValue, loading]);

  const handleCreateForm = async () => {
    const params: any = {
      name: nameValue.trim(),
      description: descriptionValue.trim() || undefined,
      status: "draft",
    };
    
    const result = await createForm(params);
    if (result) {
      onClose();
      onSuccess();
    }
  };

  const resetForm = () => {
    setNameValue("");
    setDescriptionValue("");
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Form"
      size="xs">
      {/* Form Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text">Form Name *</label>
        <input
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          placeholder="Enter form name"
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>


      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text">Description (Optional)</label>
        <textarea
          value={descriptionValue}
          onChange={(e) => setDescriptionValue(e.target.value)}
          placeholder="Enter form description"
          className="w-full px-3 py-2 border rounded-md h-20 resize-none"
        />
      </div>

      <Button
        onClick={handleCreateForm}
        disabled={isCreateDisabledState}
        variant="primary"
        className="w-full">
        {loading ? "Creating..." : "Create Form"}
      </Button>
    </Modal>
  );
};

export default Forms;