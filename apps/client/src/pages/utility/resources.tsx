import { useState } from "react";
import { Button, PageHeader } from "@/components";
import { DownloadIcon, EyeIcon, FileIcon, ImageIcon, FileTextIcon } from "lucide-react";
import Table, { TableColumn } from "@/components/ui/table";
import Modal from "@/components/ui/modal";

type Resource = {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  tags: string[];
};

const mockResources: Resource[] = [
  {
    id: "1",
    name: "Project Proposal.pdf",
    type: "application/pdf",
    url: "/uploads/Project-Proposal.pdf",
    uploadedAt: "2025-08-10T14:30:00Z",
    tags: ["pdf", "project"],
  },
  {
    id: "2",
    name: "Design Mockup.png",
    type: "image/png",
    url: "/uploads/Design-Mockup.png",
    uploadedAt: "2025-08-11T09:15:00Z",
    tags: ["image", "design"],
  },
  {
    id: "3",
    name: "Meeting Notes.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    url: "/uploads/Meeting-Notes.docx",
    uploadedAt: "2025-08-13T11:00:00Z",
    tags: ["doc", "meeting"],
  },
];

const Resources = () => {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  const columns: TableColumn<Resource>[] = [
    {
      key: "name",
      header: "Name",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value as string}</span>
          <div className="flex gap-1">
            {row.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-surface text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )
    },
    {
      key: "type",
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
              link.href = row.url;
              link.download = row.name;
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

  const recentResources = [...mockResources]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 6);

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
                {getFileIcon(resource.type)}
              </div>
              <h3 className="font-medium text-sm mb-2 line-clamp-2">
                {resource.name}
              </h3>
              <div className="flex flex-wrap gap-1 mb-3">
                {resource.tags.map(tag => (
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
                    link.href = resource.url;
                    link.download = resource.name;
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
    if (resource.type.startsWith('image/')) {
      return (
        <div className="flex justify-center items-center h-full">
          <img 
            src={resource.url} 
            alt={resource.name} 
            className="max-w-full max-h-[60vh] object-contain"
          />
        </div>
      );
    } else if (resource.type.includes('pdf')) {
      return (
        <iframe
          src={resource.url}
          className="w-full h-[60vh] border-0"
          title={resource.name}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] gap-4">
          <div className="mb-3">
            {getFileIcon(resource.type)}
          </div>
          <p className="text-text-muted">Preview not available for this file type</p>
          <Button
            variant="primary"
            onClick={() => {
              const link = document.createElement('a');
              link.href = resource.url;
              link.download = resource.name;
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
      />

      <div className="w-full flex flex-1 flex-col p-2 gap-2">
        <RecentlyAdded />
        
        <div className="flex flex-col flex-1">
          <Table<Resource>
            columns={columns}
            data={mockResources}
            total={mockResources.length}
            selectable={false}
            selectedItems={selectedResources}
            onSelectionChange={(ids) => setSelectedResources(ids as string[])}
            pagination={true}
            currentPage={currentPage}
            totalPages={Math.ceil(mockResources.length / 25)}
            onPageChange={setCurrentPage}
            sort={sortBy}
            order={sortOrder}
            onSortChange={handleSortChange}
            emptyMessage="No resources found"
            className="border rounded overflow-clip"
          />
        </div>
      </div>

      <Modal
        isOpen={!!previewResource}
        onClose={() => setPreviewResource(null)}
        title={previewResource?.name || ""}
        size="lg"
      >
        {previewResource && renderPreview(previewResource)}
      </Modal>
    </div>
  );
};

export default Resources;
