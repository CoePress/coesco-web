import { CheckCircle2, Download, Edit2, FileIcon, Loader2, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState({ originalName: "", tags: "", isPublic: false });

  const { get, loading } = useApi<{ assets: Asset[]; total: number }>();
  const { post: uploadSingle } = useApi<Asset>();
  const { post: uploadMultiple } = useApi<{ assets: Asset[] }>();
  const { delete: deleteAsset } = useApi();
  const { get: getDownloadUrl } = useApi<{ url: string }>();
  const { patch: updateAsset } = useApi<Asset>();

  const fetchAssets = async () => {
    const params = new URLSearchParams();
    if (selectedType !== "all") {
      params.append("type", selectedType);
    }
    params.append("limit", "50");

    const response = await get(`/core/assets?${params.toString()}`);
    if (response) {
      setAssets(response.assets);
      setTotal(response.total);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [selectedType]);

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
          setAssets(prev => [response, ...prev]);
          setTotal(prev => prev + 1);
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
          setAssets(prev => [...response.assets, ...prev]);
          setTotal(prev => prev + response.assets.length);
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
      setAssets(prev => prev.filter(a => a.id !== id));
      setTotal(prev => prev - 1);
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
        setAssets(prev => prev.map(a => a.id === response.id ? response : a));
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

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text">Asset Manager</h1>
          <p className="text-sm text-text-muted mt-1">
            Upload and manage files with R2 storage
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-surface text-text"
          >
            <option value="all">All Types</option>
            <option value="IMAGE">Images</option>
            <option value="DOCUMENT">Documents</option>
            <option value="VIDEO">Videos</option>
            <option value="AUDIO">Audio</option>
            <option value="ARCHIVE">Archives</option>
            <option value="OTHER">Other</option>
          </select>
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
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {uploading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-blue-800">Uploading files...</span>
          </div>
        )}

        <div className="mb-4 text-sm text-text-muted">
          {total} asset{total !== 1 ? "s" : ""} total
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12">
            <FileIcon className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <p className="text-text-muted">No assets found</p>
            <p className="text-sm text-text-muted mt-2">Upload some files to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map(asset => (
              <div
                key={asset.id}
                className="border border-border rounded-lg overflow-hidden bg-surface hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                  {asset.type === "IMAGE" && asset.thumbnailUrl ? (
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileIcon className="w-16 h-16 text-text-muted" />
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {asset.status === "READY" && (
                      <CheckCircle2 className={`w-5 h-5 ${getStatusColor(asset.status)}`} />
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-sm text-text truncate flex-1" title={asset.originalName}>
                      {asset.originalName}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(asset.type)}`}>
                      {asset.type}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="text-xs text-text-muted">
                      {formatFileSize(asset.size)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {asset.mimeType}
                    </div>
                    {asset.uploadedBy && (
                      <div className="text-xs text-text-muted">
                        By: {asset.uploadedBy.firstName} {asset.uploadedBy.lastName}
                      </div>
                    )}
                    <div className="text-xs text-text-muted">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {asset.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="flex-1 px-3 py-2 bg-surface hover:bg-border text-text rounded transition-colors flex items-center justify-center"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(asset)}
                      className="flex-1 px-3 py-2 bg-surface hover:bg-border text-text rounded transition-colors flex items-center justify-center"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="px-3 py-2 bg-error hover:opacity-90 text-white rounded transition-opacity flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs break-all">
                    <div className="text-text-muted mb-1">CDN URL:</div>
                    <a
                      href={asset.cdnUrl || asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {asset.cdnUrl || asset.url}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text">Edit Asset</h2>
              <button
                onClick={() => setEditingAsset(null)}
                className="text-text-muted hover:text-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Label / Display Name
                </label>
                <input
                  type="text"
                  value={editForm.originalName}
                  onChange={e => setEditForm(prev => ({ ...prev, originalName: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter file label..."
                />
                <p className="text-xs text-text-muted mt-1">
                  This is the display name shown in the UI. File is stored as: {editingAsset.filename}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={editForm.isPublic}
                  onChange={e => setEditForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-text">
                  Public Access
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingAsset(null)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-text hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
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
