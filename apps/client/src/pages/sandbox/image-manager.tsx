import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface Image {
  id: number;
  url: string;
  uploadedAt: string;
}

function ImageManager() {
  const [images, setImages] = useState<Image[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { get, post, delete: del } = useApi();
  const { success, error } = useToast();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const result = await get("/core/images");
    if (result) {
      setImages(result);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      error("Please select at least one image to upload");
      return;
    }

    setUploadProgress(true);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const result = await post("/core/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (result) {
        success(`Successfully uploaded ${selectedFiles.length} image(s)`);
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchImages();
      }
      else {
        error("Failed to upload images");
      }
    }
    catch (err) {
      error("An error occurred during upload");
    }
    finally {
      setUploadProgress(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    const result = await del(`/core/images/${imageId}`);
    if (result !== null) {
      success("Image deleted successfully");
      fetchImages();
    }
    else {
      error("Failed to delete image");
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-background h-full">
      <div className="bg-foreground rounded-lg p-6" style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
        <h2 className="text-2xl font-bold text-text mb-6">Image Manager</h2>

        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-muted mb-2">
                Select Images
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="w-full text-sm px-3 py-2 rounded border focus:outline-none focus:border-primary bg-foreground text-text border-border"
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploadProgress}
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              {uploadProgress ? "Uploading..." : "Upload"}
            </Button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="bg-surface rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-text">
                  {selectedFiles.length}
                  {" "}
                  file(s) selected
                </p>
                <Button
                  onClick={clearSelection}
                  variant="ghost"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
              <div className="text-xs text-text-muted space-y-1">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ImageIcon size={12} />
                    <span>{file.name}</span>
                    <span className="text-text-muted">
                      (
                      {(file.size / 1024 / 1024).toFixed(2)}
                      {" "}
                      MB)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-text-muted space-y-1 bg-surface p-3 rounded">
            <p>
              <strong>Note:</strong>
              {" "}
              Images will be automatically converted to WebP format
            </p>
            <p>Maximum file size: 20MB per image (before compression)</p>
            <p>Images will be compressed to maintain quality at 85% with a 2MB limit after compression</p>
          </div>
        </div>
      </div>

      <div className="bg-foreground rounded-lg p-6 flex-1" style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
        <h3 className="text-xl font-semibold text-text mb-4">Uploaded Images</h3>

        {images.length === 0
          ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <ImageIcon size={48} className="mb-4 opacity-50" />
                <p>No images uploaded yet</p>
              </div>
            )
          : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {images.map(image => (
                  <div
                    key={image.id}
                    className="group relative bg-surface rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                  >
                    <div className="aspect-square">
                      <img
                        src={`${import.meta.env.VITE_API_URL.replace("/v1", "")}${image.url}`}
                        alt={`Image ${image.id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="text-xs text-text-muted truncate">
                        ID:
                        {" "}
                        {image.id}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {new Date(image.uploadedAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDelete(image.id)}
                          variant="destructive"
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-1"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigator.clipboard.writeText(image.url)}
                        className="bg-background/80 backdrop-blur-sm text-text px-2 py-1 rounded text-xs hover:bg-background"
                        title="Copy URL"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>
    </div>
  );
}

export default ImageManager;
