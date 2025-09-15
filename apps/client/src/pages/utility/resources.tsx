import { useState, useEffect } from "react";
import { Button, PageHeader } from "@/components";
import { DownloadIcon, EyeIcon, FileIcon, ImageIcon, FileTextIcon, UploadIcon } from "lucide-react";
import Table, { TableColumn } from "@/components/ui/table";
import Modal from "@/components/ui/modal";
import { useApi } from "@/hooks/use-api";

type Resource = {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  tags?: string[];
  category?: string;
  uploadedBy?: string;
};

type PaginatedResponse = {
  data: Resource[];
  total: number;
  page: number;
  totalPages: number;
};

const Resources = () => {
  const api = useApi<PaginatedResponse>();
  const recentApi = useApi<Resource[]>();
  const uploadApi = useApi<Resource>();
  const deleteApi = useApi();

  const [resources, setResources] = useState<Resource[]>([]);
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [totalResources, setTotalResources] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Fetch resources on mount and when pagination/sorting changes
  useEffect(() => {
    fetchResources();
  }, [currentPage, sortBy, sortOrder]);

  // Fetch recent resources on mount
  useEffect(() => {
    fetchRecentResources();
  }, []);

  const fetchResources = async () => {
    const params = {
      page: currentPage,
      limit: 25,
      sortBy,
      sortOrder
    };

    const response = await api.get('/files/resources', params);
    if (response) {
      setResources(response.data);
      setTotalResources(response.total);
      setTotalPages(response.totalPages);
    }
  };

  const fetchRecentResources = async () => {
    const response = await recentApi.get('/files/resources/recent', { limit: 6 });
    if (response) {
      setRecentResources(response);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Convert file to ArrayBuffer then to Buffer for raw binary upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const response = await uploadApi.post('/files/upload', buffer, {
      headers: {
        'Content-Type': file.type,
        'X-File-Name': file.name
      },
      // Override the default JSON content type for this request
      transformRequest: [(data) => data]
    });

    if (response) {
      setUploadModalOpen(false);
      fetchResources();
      fetchRecentResources();
    }
  };

  const handleDelete = async (fileId: string) => {
    const response = await deleteApi.delete(`/files/resources/${fileId}`);
    if (response !== null) {
      fetchResources();
      fetchRecentResources();
    }
  };

  const columns: TableColumn<Resource>[] = [
    {
      key: "originalName",
      header: "Name",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value as string}</span>
          <div className="flex gap-1">
            {row.tags?.map(tag => (
              <span key={tag} className="px-2 py-1 bg-surface text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )
    },
    {
      key: "mimeType",
      header: "Type",
      render: (value) => (
        <span className="text-text-muted">
          {(value as string).split('/')[1] || value}
        </span>
      )
    },
    {
      key: "uploadedAt",
      header: "Uploaded",
      render: (value) => (
        <span className="text-text-muted">
          {new Date(value as string).toLocaleDateString()}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={() => setPreviewResource(row)}
          >
            <EyeIcon size={14} />
            View
          </Button>
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={() => {
              const link = document.createElement('a');
              link.href = `/files/resources/${row.id}/download`;
              link.download = row.originalName;
              link.click();
            }}
          >
            <DownloadIcon size={14} />
            Download
          </Button>
        </div>
      )
    }
  ];

  const handleSortChange = (sort: string, order: "asc" | "desc") => {
    setSortBy(sort);
    setSortOrder(order);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={24} className="text-blue-500" />;
    if (type.includes('pdf')) return <FileTextIcon size={24} className="text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FileTextIcon size={24} className="text-blue-600" />;
    return <FileIcon size={24} className="text-gray-500" />;
  };

  const RecentlyAdded = () => (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {recentResources.map((resource) => (
          <div
            key={resource.id}
            className="bg-foreground border border-border rounded-lg p-4 hover:bg-surface cursor-pointer transition-colors"
            onClick={() => setPreviewResource(resource)}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-3">
                {getFileIcon(resource.mimeType)}
              </div>
              <h3 className="font-medium text-sm mb-2 line-clamp-2">
                {resource.originalName}
              </h3>
              <div className="flex flex-wrap gap-1 mb-3">
                {resource.tags?.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-surface text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setPreviewResource(resource)}
                >
                  <EyeIcon size={12} />
                </Button>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `/files/resources/${resource.id}/download`;
                    link.download = resource.originalName;
                    link.click();
                  }}
                >
                  <DownloadIcon size={12} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreview = (resource: Resource) => {
    if (resource.mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center items-center h-full">
          <img
            src={`/files/resources/${resource.id}/preview`}
            alt={resource.originalName}
            className="max-w-full max-h-[60vh] object-contain"
          />
        </div>
      );
    } else if (resource.mimeType.includes('pdf')) {
      return (
        <iframe
          src={`/files/resources/${resource.id}/preview`}
          className="w-full h-[60vh] border-0"
          title={resource.originalName}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] gap-4">
          <div className="mb-3">
            {getFileIcon(resource.mimeType)}
          </div>
          <p className="text-text-muted">Preview not available for this file type</p>
          <Button
            variant="primary"
            onClick={() => {
              const link = document.createElement('a');
              link.href = `/files/resources/${resource.id}/download`;
              link.download = resource.originalName;
              link.click();
            }}
          >
            <DownloadIcon size={16} />
            Download File
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Resources"
        description="Manage and access your uploaded files"
        actions={
          <Button onClick={() => setUploadModalOpen(true)}>
            <UploadIcon size={16} />
            Upload File
          </Button>
        }
      />

      <div className="w-full flex flex-1 flex-col p-2 gap-2">
        {api.loading || recentApi.loading ? (
          <div className="flex justify-center items-center h-32">
            <span>Loading resources...</span>
          </div>
        ) : (
          <RecentlyAdded />
        )}
        
        <div className="flex flex-col flex-1">
          <Table<Resource>
            columns={columns}
            data={resources}
            total={totalResources}
            selectable={false}
            selectedItems={selectedResources}
            onSelectionChange={(ids) => setSelectedResources(ids as string[])}
            pagination={true}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            sort={sortBy}
            order={sortOrder}
            onSortChange={handleSortChange}
            emptyMessage="No resources found"
            className="border rounded overflow-clip"
            loading={api.loading}
          />
        </div>
      </div>

      <Modal
        isOpen={!!previewResource}
        onClose={() => setPreviewResource(null)}
        title={previewResource?.originalName || ""}
        size="lg"
      >
        {previewResource && renderPreview(previewResource)}
      </Modal>

      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload File"
        size="md"
      >
        <div className="p-4">
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
            className="w-full p-2 border border-border rounded"
          />
          {uploadApi.loading && <p className="mt-2">Uploading...</p>}
          {uploadApi.error && <p className="mt-2 text-red-500">{uploadApi.error}</p>}
        </div>
      </Modal>
    </div>
  );
};

export default Resources;
