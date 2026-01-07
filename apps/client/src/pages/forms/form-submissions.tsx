import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calendar, User, Clock, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";

interface Submission {
  id: string;
  formId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  form?: {
    id: string;
    name: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: Submission[];
  meta?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-primary/20 text-primary",
  APPROVED: "bg-green-500/20 text-green-600 dark:text-green-400",
  REJECTED: "bg-destructive/20 text-destructive",
  COMPLETED: "bg-green-500/20 text-green-600 dark:text-green-400",
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const FormSubmissions = () => {
  const { id: formId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, get } = useApi<ApiResponse>();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 25;

  const fetchSubmissions = async () => {
    if (!formId) return;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: "createdAt",
      order: "desc",
      include: JSON.stringify(["form"]),
    });

    if (statusFilter) {
      params.set("filter", JSON.stringify({ status: statusFilter }));
    }

    await get(`/forms/${formId}/submissions?${params.toString()}`);
  };

  useEffect(() => {
    fetchSubmissions();
  }, [formId, page, statusFilter]);

  const submissions = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/forms/${formId}`)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Form Submissions</h1>
            <p className="text-sm text-muted-foreground">
              {meta?.total || 0} total submissions
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-md border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <p>Failed to load submissions</p>
              <Button variant="outline" onClick={fetchSubmissions} className="mt-2">
                Retry
              </Button>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="size-12 mb-2 opacity-50" />
              <p>No submissions found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left text-sm font-medium text-muted-foreground">
                  <th className="px-4 py-3">Submission ID</th>
                  <th className="px-4 py-3">Form Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted By</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {submissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/forms/${formId}/submissions/${submission.id}`}
                        className="font-mono text-sm text-primary hover:underline"
                      >
                        #{submission.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {submission.form ? (
                        <Link
                          to={`/forms/${submission.form.id}`}
                          className="text-primary hover:underline"
                        >
                          {submission.form.name}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          statusColors[submission.status] ||
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="size-4" />
                        <span>
                          {submission.createdById
                            ? submission.createdById.slice(-8).toUpperCase()
                            : "System"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-4" />
                        <span>{formatDate(submission.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="size-4" />
                        <span>{formatDate(submission.updatedAt)}</span>
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
          <div className="flex items-center justify-between text-sm mt-4">
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
      </div>
    </div>
  );
};

export default FormSubmissions;
