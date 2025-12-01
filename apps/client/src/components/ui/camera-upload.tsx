import { Camera, RotateCcw, X } from "lucide-react";
import React, { useRef, useState } from "react";

import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

import Button from "./button";

interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  size: number;
}

interface CameraUploadProps {
  formId: string;
  value?: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export const CameraUpload: React.FC<CameraUploadProps> = ({
  formId,
  value = [],
  onChange,
  maxFiles = 10,
  disabled = false,
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { post } = useApi();
  const toast = useToast();

  const handleFileSelect = async (files: FileList) => {
    if (files.length === 0)
      return;

    const remainingSlots = maxFiles - value.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length < files.length) {
      toast.warning(`Only ${remainingSlots} more files can be added (max ${maxFiles})`);
    }

    setUploading(true);

    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("tags", JSON.stringify([`form:${formId}`, "form-submission"]));
      formData.append("isPublic", "false");
      formData.append("generateThumbnail", "true");

      const response = await post(`/assets/upload-multiple`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response?.assets) {
        const uploadedFiles: UploadedFile[] = response.assets.map((asset: any) => ({
          id: asset.id,
          originalName: asset.originalName,
          filename: asset.filename,
          url: asset.cdnUrl || asset.url,
          size: asset.size,
        }));

        onChange([...value, ...uploadedFiles]);
        toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
      }
      else {
        toast.error(response?.error || "Upload failed");
      }
    }
    catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    }
    finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = value.filter(file => file.id !== fileId);
    onChange(updatedFiles);
  };

  const clearAll = () => {
    onChange([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0)
      return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-sm p-6 text-center transition-colors cursor-pointer ${
          value.length > 0 ? "border-success bg-success/5" : "border-border hover:border-primary/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          {uploading
            ? (
                <>
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                  <p className="text-text-muted">Uploading files...</p>
                </>
              )
            : (
                <>
                  <Camera className="text-text-muted" size={32} />
                  <div>
                    <p className="text-text-muted mb-1">Click to upload photos</p>
                    <p className="text-xs text-text-muted">
                      or drag and drop • Max
                      {" "}
                      {maxFiles}
                      {" "}
                      files •
                      {" "}
                      {value.length}
                      /
                      {maxFiles}
                      {" "}
                      uploaded
                    </p>
                  </div>
                </>
              )}
        </div>
      </div>

      {/* Uploaded Files */}
      {value.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text">
              Uploaded Photos (
              {value.length}
              )
            </span>
            <Button
              variant="secondary-outline"
              size="sm"
              onClick={clearAll}
              disabled={disabled || uploading}
              className="flex items-center gap-1"
            >
              <RotateCcw size={14} />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {value.map(file => (
              <div
                key={file.id}
                className="relative group border border-border rounded-sm overflow-hidden"
              >
                <div className="aspect-square bg-surface flex items-center justify-center">
                  <Camera className="text-text-muted" size={24} />
                </div>

                <div className="p-2">
                  <p className="text-xs text-text truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  disabled={disabled}
                  className="absolute top-1 right-1 p-1 bg-error text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/80"
                  title="Remove file"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
