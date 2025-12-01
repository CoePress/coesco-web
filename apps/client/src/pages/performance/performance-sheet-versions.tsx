import { Edit2, PlusCircleIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import type { TableColumn } from "@/components/ui/table";
import type { IApiResponse } from "@/utils/types";

import { Button, Modal, Table, Toolbar } from "@/components";
import PageHeader from "@/components/layout/page-header";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

function PerformanceSheetVersions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { get: getVersions, response: versions, loading: versionsLoading, error: versionsError } = useApi<IApiResponse<any[]>>();
  const { post: createVersion, loading: createVersionLoading, error: createVersionError } = useApi<IApiResponse<any[]>>();

  const [params, setParams] = useState({
    sort: "createdAt" as "createdAt" | "updatedAt",
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
    filter: {},
    include: [] as string[],
    search: "",
  });

  const queryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: params.sort,
      order: params.order,
      page: params.page.toString(),
      limit: params.limit.toString(),
    };

    const activeFilters = Object.fromEntries(
      Object.entries(params.filter).filter(([_, value]) => value),
    );

    if (Object.keys(activeFilters).length > 0) {
      q.filter = JSON.stringify(activeFilters);
    }

    if (params.include.length > 0) {
      q.include = JSON.stringify(params.include);
    }

    if (params.search) {
      q.search = params.search;
    }

    return q;
  }, [params]);

  const fetchVersions = async () => {
    await getVersions("/sales/performance-versions", queryParams);
  };

  const columns: TableColumn<any>[] = [
    {
      key: "id",
      header: "Version ID",
      className: "font-mono text-sm",
      render: (_, row) => row.id.slice(0, 8),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (_, row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: "sections",
      header: "Sections",
      sortable: false,
      render: (_, row) => {
        const sections = row.sections || [];
        return `${sections.length} section${sections.length !== 1 ? "s" : ""}`;
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-fit",
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/performance-sheets/${row.id}/build`}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
          >
            <Edit2 size={14} />
            Edit
          </Link>
        </div>
      ),
    },
  ];

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={toggleModal}>
          <PlusCircleIcon size={20} />
          {" "}
          Create New Version
        </Button>
      </div>
    );
  };

  const handleSearch = (query: string) => {
    handleParamsChange({
      search: query,
      page: 1,
    });
  };

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates,
    }));
  };

  useEffect(() => {
    fetchVersions();
  }, [params]);

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Performance Sheet Versions"
        description={`${versions?.data?.length || 0} total versions`}
        actions={<Actions />}
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <Toolbar
          onSearch={handleSearch}
          searchPlaceholder="Search versions..."
        />

        <Table
          columns={columns}
          data={versions?.data || []}
          total={versions?.meta?.total || 0}
          idField="id"
          pagination
          loading={versionsLoading}
          error={versionsError}
          currentPage={versions?.meta?.page}
          totalPages={versions?.meta?.totalPages}
          onPageChange={page => handleParamsChange({ page })}
          sort={params.sort}
          order={params.order}
          onSortChange={(newSort, newOrder) => {
            handleParamsChange({
              sort: newSort as any,
              order: newOrder as any,
            });
          }}
          className="rounded border overflow-clip"
          emptyMessage="No versions found"
        />
      </div>

      {isModalOpen && (
        <CreateVersionModal
          isOpen={isModalOpen}
          onClose={toggleModal}
          onSuccess={fetchVersions}
          createVersion={data => createVersion("/sales/performance-versions", data)}
          loading={createVersionLoading}
          error={createVersionError}
        />
      )}
    </div>
  );
}

function CreateVersionModal({
  isOpen,
  onClose,
  onSuccess,
  createVersion,
  loading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createVersion: (params: any) => Promise<any>;
  loading: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState({
    sections: [] as any[],
  });

  const navigate = useNavigate();
  const toast = useToast();

  const handleCreateVersion = async () => {
    try {
      const response = await createVersion({
        sections: formData.sections,
      });
      if (response?.success) {
        toast.success("Performance Sheet Version created successfully!");
        onClose();
        onSuccess();
        navigate(`/admin/performance-sheet-versions/${response.data.id}/build`);
      }
      else {
        toast.error("Failed to create version. Please try again.");
      }
    }
    catch (error) {
      toast.error("An unexpected error occurred while creating the version.");
    }
  };

  const resetForm = () => {
    setFormData({
      sections: [],
    });
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
      title="Create New Performance Sheet Version"
      size="xs"
    >
      <div className="space-y-4">
        <div className="text-sm text-text-muted bg-surface p-3 rounded">
          A new blank version will be created. You can configure sections and fields in the version builder.
        </div>

        {error && (
          <div className="text-xs text-error bg-error/10 p-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onClose}
            disabled={loading}
            variant="secondary-outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateVersion}
            disabled={loading}
            variant="primary"
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Version"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PerformanceSheetVersions;
