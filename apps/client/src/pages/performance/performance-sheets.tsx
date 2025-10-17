import { PlusCircleIcon, Lock } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, Modal, Table, Toolbar, Input } from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import PageHeader from "@/components/layout/page-header";
import { useToast } from "@/hooks/use-toast";
import { Filter } from "@/components/feature/toolbar";
import { useSocket } from "@/contexts/socket.context";

const PerformanceSheets = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locks, setLocks] = useState<Record<string, any>>({});
  const { get: getSheets, response: sheets, loading: sheetsLoading, error: sheetsError } = useApi<IApiResponse<any[]>>();
  const { get: getVersions, response: versions } = useApi<IApiResponse<any[]>>();
  const { get: getLocks } = useApi<IApiResponse<any>>();
  const { post: createSheet, loading: createSheetLoading } = useApi<IApiResponse<any[]>>();
  const { onLockChanged } = useSocket();

  const [params, setParams] = useState({
    sort: "name" as "createdAt" | "updatedAt" | "name",
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
    filter: { versionId: "" },
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

  const fetchSheets = async () => {
    await getSheets("/sales/performance-sheets", queryParams);
  };

  const fetchVersions = async () => {
    await getVersions("/sales/performance-versions");
  };

  const fetchLocks = async () => {
    try {
      const response = await getLocks("/locks/performance-sheets");
      if (response) {
        const lockMap: Record<string, any> = {};
        ((response as any).locks || []).forEach((lock: any) => {
          if (lock.lockInfo && lock.lockInfo.recordId) {
            lockMap[lock.lockInfo.recordId] = lock.lockInfo;
          }
        });
        setLocks(lockMap);
      }
    } catch (err) {
      setLocks({});
    }
  };

  const versionOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Versions' }];
    if (versions?.data) {
      versions.data.forEach((version: any) => {
        options.push({
          value: version.id,
          label: `Version ${version.id.slice(-8)}`
        });
      });
    }
    return options;
  }, [versions]);

  const filters: Filter[] = [
    {
      key: 'versionId',
      label: 'Version',
      options: versionOptions,
      placeholder: 'Version'
    },
  ];

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Sheet Name",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/performance-sheets/${row.id}`}>{row.name || `Sheet ${row.id.slice(-8)}`}</Link>
      ),
    },
    {
      key: "locked",
      header: "",
      className: "w-fit",
      sortable: false,
      render: (_, row) =>
        locks[row.id] ? (
          <div className="flex items-center gap-1 text-error text-sm">
            <Lock
              size={16}
              aria-label="Locked"
            />
            <span>{locks[row.id]?.userName || "Locked"}</span>
          </div>
        ) : null,
    },
  ];

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

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

  useEffect(() => {
    fetchVersions();
  }, []);

  useEffect(() => {
    fetchSheets();
  }, [params]);

  useEffect(() => {
    if (sheets?.data && sheets.data.length > 0) {
      fetchLocks();
    }
  }, [sheets?.data]);

  useEffect(() => {
    const unsubscribe = onLockChanged((data: any) => {
      const { recordType, recordId, lockInfo } = data;

      if (recordType === "performance-sheets") {
        setLocks(prev => {
          const updated = { ...prev };
          if (lockInfo) {
            updated[recordId] = lockInfo;
          } else {
            delete updated[recordId];
          }
          return updated;
        });
      }
    });

    return unsubscribe;
  }, [onLockChanged]);

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Performance Sheets"
        description={`${sheets?.data?.length || 0} total performance sheets`}
        actions={<Actions />}
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <Toolbar
          onSearch={handleSearch}
          searchPlaceholder="Search performance sheets..."
          filters={filters}
          onFilterChange={handleFilterChange}
          filterValues={params.filter}
        />

        <Table
          columns={columns}
          data={sheets?.data || []}
          total={sheets?.meta?.total || 0}
          idField="id"
          pagination
          loading={sheetsLoading}
          error={sheetsError}
          currentPage={sheets?.meta?.page}
          totalPages={sheets?.meta?.totalPages}
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
          emptyMessage="No performance sheets found"
        />
      </div>

      {isModalOpen && (
        <CreateSheetModal
          isOpen={isModalOpen}
          onClose={toggleModal}
          createSheet={(data) => createSheet("/performance/sheets", data)}
          loading={createSheetLoading}
          versions={versions?.data || []}
        />
      )}
    </div>
  );
};

const CreateSheetModal = ({
  isOpen,
  onClose,
  createSheet,
  loading,
  versions,
}: {
  isOpen: boolean;
  onClose: () => void;
  createSheet: (params: any) => Promise<any>;
  loading: boolean;
  versions: any[];
  }) => {

  const [formData, setFormData] = useState({
    name: "",
    versionId: "",
  })

  const navigate = useNavigate();
  const toast = useToast();

  const versionOptions = useMemo(() => {
    return versions.map((version: any) => ({
      value: version.id,
      label: `Version ${version.id.slice(-8)}`
    }));
  }, [versions]);

  const handleChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }))
  }

  const handleCreateSheet = async () => {
    try {
      const response = await createSheet({
        ...formData,
        data: {}
      });
      if (response?.success) {
        toast.success(`Performance Sheet "${formData.name}" created successfully!`);
        onClose();
        navigate(`/sales/performance-sheets/${response.data.id}`);
      } else {
        toast.error('Failed to create performance sheet. Please try again.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred while creating the performance sheet.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      versionId: "",
    })
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const isCreateDisabled = !formData.name.trim() || !formData.versionId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Performance Sheet"
      size="xs">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text">Sheet Name *</label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange({ name: e.target.value })}
          placeholder="Enter sheet name"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text">Version *</label>
        <select
          value={formData.versionId}
          onChange={(e) => handleChange({ versionId: e.target.value })}
          className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text placeholder:text-text-muted bg-surface">
          <option value="">Select a version</option>
          {versionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-xs text-text-muted bg-surface p-3 rounded">
        {!formData.name.trim() && !formData.versionId && "Enter a sheet name and select a version to create a new performance sheet."}
        {formData.name.trim() && !formData.versionId && "Please select a version template for this performance sheet."}
        {!formData.name.trim() && formData.versionId && "Please enter a name for this performance sheet."}
        {formData.name.trim() && formData.versionId && "Performance sheet will be created with the selected version template."}
      </div>

      <Button
        onClick={handleCreateSheet}
        disabled={isCreateDisabled || loading}
        variant="primary"
        className="w-full">
        {loading ? "Creating..." : "Create Performance Sheet"}
      </Button>
    </Modal>
  );
};

export default PerformanceSheets;