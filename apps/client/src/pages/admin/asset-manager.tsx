import { CheckCircle2, Download, Edit2, FileIcon, Loader2, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button, PageHeader, Toolbar } from "@/components";
import { Filter } from "@/components/feature/toolbar";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { IApiResponse } from "@/utils/types";

interface Asset {
  id: string;
  key: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: "IMAGE" | "DOCUMENT" | "VIDEO" | "AUDIO" | "ARCHIVE" | "OTHER";
  status: "UPLOADING" | "READY" | "PROCESSING" | "FAILED" | "DELETED";
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  isPublic: boolean;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const AssetManager = () => {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState({ originalName: "", tags: "", isPublic: false });

  const { get, response: assets, loading } = useApi<IApiResponse<Asset[]>>();
  const { post: uploadSingle } = useApi<Asset>();
  const { post: uploadMultiple } = useApi<{ assets: Asset[] }>();
  const { delete: deleteAsset } = useApi();
  const { get: getDownloadUrl } = useApi<{ url: string }>();
  const { patch: updateAsset } = useApi<Asset>();

  const [params, setParams] = useState({
    sort: "createdAt" as string,
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 50,
    filter: { status: "READY" },
    include: [] as string[],
    search: ""
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

    if (params.search) {
      q.search = params.search;
    }

    return q;
  }, [params]);

  const fetchAssets = async () => {
    await get("/core/assets", queryParams);
  };

  const refresh = () => {
    fetchAssets();
  };

  useEffect(() => {
    fetchAssets();
  }, [params]);

  const handleSearch = (query: string) => {
    handleParamsChange({
      search: query,
      page: 1
    });
  };

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    handleParamsChange({
      filter: { ...params.filter, [key]: value }
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    try {
      if (files.length === 1) {
        formData.append("file", files[0]);
        formData.append("generateThumbnail", "true");
        formData.append("isPublic", "true");

        const response = await uploadSingle("/core/assets/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response) {
          refresh();
          toast.success("File uploaded successfully");
        }
      }
      else {
        Array.from(files).forEach(file => formData.append("files", file));
        formData.append("generateThumbnail", "true");
        formData.append("isPublic", "true");

        const response = await uploadMultiple("/core/assets/upload-multiple", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response) {
          refresh();
          toast.success(`${response.assets.length} files uploaded successfully`);
        }
      }
    }
    catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    }
    finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this asset?")) return;

    try {
      await deleteAsset(`/core/assets/${id}`);
      refresh();
      toast.success("Asset deleted successfully");
    }
    catch (error) {
      console.error("Delete failed:", error);
      toast.error("Delete failed. Please try again.");
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setEditForm({
      originalName: asset.originalName,
      tags: asset.tags.join(", "),
      isPublic: asset.isPublic,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAsset) return;

    try {
      const tags = editForm.tags.split(",").map(t => t.trim()).filter(Boolean);
      const response = await updateAsset(`/core/assets/${editingAsset.id}`, {
        originalName: editForm.originalName,
        tags,
        isPublic: editForm.isPublic,
      });

      if (response) {
        refresh();
        toast.success("Asset updated successfully");
        setEditingAsset(null);
      }
    }
    catch (error) {
      console.error("Update failed:", error);
      toast.error("Update failed. Please try again.");
    }
  };

  const handleDownload = async (asset: Asset) => {
    try {
      const response = await getDownloadUrl(`/core/assets/${asset.id}/download`);
      if (response) {
        window.open(response.url, "_blank");
      }
    }
    catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / k ** i * 100) / 100} ${sizes[i]}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "IMAGE": return "bg-blue-100 text-blue-800";
      case "DOCUMENT": return "bg-green-100 text-green-800";
      case "VIDEO": return "bg-purple-100 text-purple-800";
      case "AUDIO": return "bg-yellow-100 text-yellow-800";
      case "ARCHIVE": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "READY": return "text-green-600";
      case "UPLOADING": return "text-blue-600";
      case "PROCESSING": return "text-yellow-600";
      case "FAILED": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const filters: Filter[] = [
    {
      key: 'type',
      label: 'Type',
      options: [
        { value: '', label: 'All Types' },
        { value: 'IMAGE', label: 'Images' },
        { value: 'DOCUMENT', label: 'Documents' },
        { value: 'VIDEO', label: 'Videos' },
        { value: 'AUDIO', label: 'Audio' },
        { value: 'ARCHIVE', label: 'Archives' },
        { value: 'OTHER', label: 'Other' }
      ],
      placeholder: 'Type'
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: '', label: 'All' },
        { value: 'READY', label: 'Ready' },
        { value: 'UPLOADING', label: 'Uploading' },
        { value: 'PROCESSING', label: 'Processing' },
        { value: 'FAILED', label: 'Failed' },
        { value: 'DELETED', label: 'Deleted' }
      ],
      placeholder: 'Status'
    },
    {
      key: 'isPublic',
      label: 'Access',
      options: [
        { value: '', label: 'All' },
        { value: 'true', label: 'Public' },
        { value: 'false', label: 'Private' }
      ],
      placeholder: 'Access'
    }
  ];

  const Actions = () => {
    return (
      <label className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Upload Files
        <input
          type="file"
          multiple
          className="hidden"
          onChange={e => handleFileUpload(e.target.files)}
          disabled={uploading}
        />
      </label>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Asset Manager"
        description="Upload and manage files with R2 storage"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <Toolbar
          onSearch={handleSearch}
          searchPlaceholder="Search assets..."
          filters={filters}
          onFilterChange={handleFilterChange}
          filterValues={params.filter}
        />

        {uploading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-blue-800">Uploading files...</span>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !assets?.data || assets.data.length === 0 ? (
            <div className="text-center py-12">
              <FileIcon className="w-16 h-16 mx-auto text-text-muted mb-4" />
              <p className="text-text-muted">No assets found</p>
              <p className="text-sm text-text-muted mt-2">Upload some files to get started</p>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <div className="mb-3 text-sm text-text-muted px-2">
                {assets.meta?.total || 0} asset{(assets.meta?.total || 0) !== 1 ? "s" : ""} total
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
                {assets.data.map(asset => (
              <div
                key={asset.id}
                className="border border-border rounded overflow-hidden bg-surface hover:border-primary transition-all"
              >
                <div className="aspect-video bg-background flex items-center justify-center relative border-b border-border">
                  {asset.type === "IMAGE" && asset.thumbnailUrl ? (
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileIcon className="w-12 h-12 text-text-muted" />
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {asset.status === "READY" && (
                      <CheckCircle2 className={`w-5 h-5 ${getStatusColor(asset.status)}`} />
                    )}
                  </div>
                </div>

                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-medium text-sm text-text truncate flex-1" title={asset.originalName}>
                      {asset.originalName}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${getTypeColor(asset.type)}`}>
                      {asset.type}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3 text-xs text-text-muted">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium text-text">{formatFileSize(asset.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium text-text">{asset.mimeType}</span>
                    </div>
                    {asset.uploadedBy && (
                      <div className="flex justify-between">
                        <span>Uploaded by:</span>
                        <span className="font-medium text-text">{asset.uploadedBy.firstName} {asset.uploadedBy.lastName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-medium text-text">{new Date(asset.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b border-border">
                      {asset.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-background border border-border text-text text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="flex-1 px-3 py-1.5 border border-border hover:bg-background text-text rounded transition-colors flex items-center justify-center gap-1 text-xs"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDownload(asset)}
                      className="flex-1 px-3 py-1.5 border border-border hover:bg-background text-text rounded transition-colors flex items-center justify-center gap-1 text-xs"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="px-3 py-1.5 border border-error bg-error hover:opacity-90 text-white rounded transition-opacity flex items-center justify-center text-xs"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2 bg-background border border-border rounded text-xs">
                    <div className="text-text-muted mb-1 font-medium">CDN URL:</div>
                    <a
                      href={asset.cdnUrl || asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {asset.cdnUrl || asset.url}
                    </a>
                  </div>
                </div>
              </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded border border-border max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text">Edit Asset</h2>
              <button
                onClick={() => setEditingAsset(null)}
                className="text-text-muted hover:text-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.originalName}
                  onChange={e => setEditForm(prev => ({ ...prev, originalName: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-text text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Enter file label..."
                />
                <p className="text-xs text-text-muted mt-1.5">
                  File stored as: <span className="font-medium">{editingAsset.filename}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-text text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-xs text-text-muted mt-1.5">
                  Comma-separated tags for organization
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-background border border-border rounded">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={editForm.isPublic}
                  onChange={e => setEditForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-1 focus:ring-primary"
                />
                <label htmlFor="isPublic" className="text-sm text-text font-medium">
                  Public Access
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingAsset(null)}
                  className="flex-1 px-4 py-2 border border-border rounded text-text text-sm font-medium hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManager;
