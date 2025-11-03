import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { Button, Modal, StatusBadge, Table, Toolbar } from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import PageHeader from "@/components/layout/page-header";
import { Filter } from "@/components/feature/toolbar";
import { useToast } from "@/hooks/use-toast";
import { FormStatus } from "@coesco/types";

const Forms = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { get: getForms, response: forms, loading: formsLoading, error: formsError } = useApi<IApiResponse<any[]>>();
  const { post: createForm, loading: createFormLoading } = useApi<IApiResponse<any[]>>();

  const [params, setParams] = useState({
    sort: "name" as "createdAt" | "updatedAt" | "name",
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
    filter: { status: "" },
    include: [] as string[]
  });

  const queryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: params.sort,
      order: params.order,
      page: params.page.toString(),
      limit: params.limit.toString(),
    };

    const activeFilters = Object.fromEntries(
      Object.entries(params.filter).filter(([_, value]) => value)
    );
    
    if (Object.keys(activeFilters).length > 0) {
      q.filter = JSON.stringify(activeFilters);
    }

    if (params.include.length > 0) {
      q.include = JSON.stringify(params.include);
    }

    return q;
  }, [params]);

  const fetchForms = async () => {
    await getForms("/forms", queryParams);
  };
  
  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Form Name",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`${row.id}`}>{row.name || `Form ${row.id.slice(-8)}`}</Link>
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
          <span className="text-text">
            {`${row.createdBy.firstName} ${row.createdBy.lastName}`}
          </span>
        ) : (
          "-"
        ),
    },
  ];

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query)
  }

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates
    }))
  }

  const handleFilterChange = (key: string, value: string) => {
    handleParamsChange({
      filter: { ...params.filter, [key]: value }
    })
  }

  const handleExport = () => {
    console.log('Exporting forms...', forms)
  }

  const formStatuses = Object.keys(FormStatus)
  const formStatusOptions = formStatuses.map((status) =>{ return { value: status, label: status }})

  const filters: Filter[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: '', label: 'All Statuses' },
        ...formStatusOptions
      ],
      placeholder: 'Form Status'
    },
  ]

  useEffect(() => {
    fetchForms();
  }, [params]);

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Forms"
        description={`${forms?.data?.length} total forms`}
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <Toolbar
          onSearch={handleSearch}
          searchPlaceholder="Search forms..."
          filters={filters}
          onFilterChange={handleFilterChange}
          filterValues={params.filter}
          showExport={true}
          onExport={handleExport}
        />

        <Table
          columns={columns}
          data={forms?.data || []}
          total={forms?.meta?.total || 0}
          idField="id"
          pagination
          loading={formsLoading}
          error={formsError}
          currentPage={forms?.meta?.page}
          totalPages={forms?.meta?.totalPages}
          onPageChange={(page) => handleParamsChange({ page })}
          sort={params.sort}
          order={params.order}
          onSortChange={(newSort, newOrder) => {
            handleParamsChange({
              sort: newSort as any,
              order: newOrder as any
            });
          }}
          className="rounded border overflow-clip"
          emptyMessage="No forms found"
          mobileCardView={true}
        />
      </div>

      {isModalOpen && (
        <CreateFormModal
          isOpen={isModalOpen}
          onClose={toggleModal}
          onSuccess={fetchForms}
          createForm={(data) => createForm("/forms", data)}
          loading={createFormLoading}
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
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: FormStatus.DRAFT,
  })
  
  const toast = useToast();

  const handleChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }))
  }

  const handleCreateForm = async () => {
    try {
      const response = await createForm(formData);
      if (response?.success) {
        toast.success(`Form "${formData.name}" created successfully!`);
        onClose();
        onSuccess();
      } else {
        toast.error('Failed to create form. Please try again.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred while creating the form.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: FormStatus.DRAFT,
    })
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-text">Form Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange({ name: e.target.value })}
          placeholder="Enter form name"
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>


      <div className="space-y-2">
        <label className="text-sm font-medium text-text">Description (Optional)</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange({ description: e.target.value })}
          placeholder="Enter form description"
          className="w-full px-3 py-2 border rounded-md h-20 resize-none"
        />
      </div>

      <Button
        onClick={handleCreateForm}
        disabled={formData.name === ""}
        variant="primary"
        className="w-full">
        {loading ? "Creating..." : "Create Form"}
      </Button>
    </Modal>
  );
};

export default Forms;