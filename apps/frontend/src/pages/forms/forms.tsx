import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Loader2, FileText, Edit, Send, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";

interface Form {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  submissions?: unknown[];
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: Form[];
  meta?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PUBLISHED: "bg-primary/20 text-primary",
  ARCHIVED: "bg-destructive/20 text-destructive",
};

const Forms = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormDescription, setNewFormDescription] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading, error, get } = useApi<ApiResponse>();
  const { post, isLoading: isCreating } = useApi<{ success: boolean; data: Form }>();

  const fetchForms = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: "name",
      order: "asc",
    });

    if (statusFilter) {
      params.set("filter", JSON.stringify({ status: statusFilter }));
    }

    await get(`/forms?${params.toString()}`);
  };

  useEffect(() => {
    fetchForms();
  }, [page, statusFilter]);

  const handleCreateForm = async () => {
    if (!newFormName.trim()) return;

    const result = await post("/forms", {
      name: newFormName,
      description: newFormDescription,
      status: "DRAFT",
    });

    if (result.data?.success) {
      setIsCreateModalOpen(false);
      setNewFormName("");
      setNewFormDescription("");
      fetchForms();
    }
  };

  const forms = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Forms</h1>
          <p className="text-sm text-muted-foreground">
            {meta?.total || 0} total forms
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="size-4" />
          New Form
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-destructive">
            <p>Failed to load forms</p>
            <Button variant="outline" onClick={fetchForms} className="mt-2">
              Retry
            </Button>
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="size-12 mb-2 opacity-50" />
            <p>No forms found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="px-4 py-3">Form Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submissions</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {forms.map((form) => (
                <tr key={form.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to={`/forms/${form.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {form.name || `Form ${form.id.slice(-8)}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        statusColors[form.status] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {form.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {form.submissions?.length || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/forms/${form.id}/edit`)}
                        title="Edit Form"
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/forms/${form.id}/submissions`)}
                        title="View Submissions"
                      >
                        <List className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/forms/${form.id}/submit`)}
                        title="New Submission"
                      >
                        <Send className="size-4" />
                        Submit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Form Name *</label>
              <Input
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                placeholder="Enter form name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <textarea
                value={newFormDescription}
                onChange={(e) => setNewFormDescription(e.target.value)}
                placeholder="Enter form description"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateForm}
              disabled={!newFormName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Form"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Forms;
