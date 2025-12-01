import { format } from "date-fns";
import { PlusIcon, RefreshCcwIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { TableColumn } from "@/components/ui/table";
import type { IApiResponse } from "@/utils/types";

import {
  Button,
  Modal,
  PageHeader,
  StatusBadge,
  Table,
} from "@/components";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface ExternalInvitation {
  id: string;
  token: string;
  purpose: string;
  resourceId?: string;
  resourceType?: string;
  expiresAt?: string;
  usedAt?: string;
  revokedAt?: string;
  maxUses?: number;
  useCount: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

function Invitations() {
  const [selectedInvitation, setSelectedInvitation] = useState<ExternalInvitation | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { get, response: invitations, loading, error } = useApi<IApiResponse<ExternalInvitation[]>>();

  const [params, setParams] = useState({
    sort: "createdAt" as string,
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
  });

  const queryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: params.sort,
      order: params.order,
      page: params.page.toString(),
      limit: params.limit.toString(),
    };

    return q;
  }, [params]);

  const getStatusVariant = (invitation: ExternalInvitation): "success" | "warning" | "error" | "default" => {
    if (invitation.revokedAt)
      return "error";
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date())
      return "error";
    if (invitation.maxUses && invitation.useCount >= invitation.maxUses)
      return "warning";
    return "success";
  };

  const getStatusLabel = (invitation: ExternalInvitation): string => {
    if (invitation.revokedAt)
      return "Revoked";
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date())
      return "Expired";
    if (invitation.maxUses && invitation.useCount >= invitation.maxUses)
      return "Max Uses";
    return "Active";
  };

  const columns: TableColumn<ExternalInvitation>[] = [
    {
      key: "token",
      header: "Token",
      render: (_, row) => (
        <span className="font-mono text-sm">
          {row.token.substring(0, 8)}
          ...
          {row.token.substring(row.token.length - 4)}
        </span>
      ),
    },
    {
      key: "purpose",
      header: "Purpose",
      render: (_, row) => (
        <StatusBadge
          label={row.purpose.replace(/_/g, " ")}
          variant="default"
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      render: (_, row) => (
        <StatusBadge
          label={getStatusLabel(row)}
          variant={getStatusVariant(row)}
        />
      ),
    },
    {
      key: "useCount",
      header: "Uses",
      render: (_, row) => (
        <span>
          {row.useCount}
          {row.maxUses ? ` / ${row.maxUses}` : ""}
        </span>
      ),
    },
    {
      key: "expiresAt",
      header: "Expires",
      render: (_, row) => (
        <div className="flex flex-col">
          {row.expiresAt
            ? (
                <>
                  <span>{format(new Date(row.expiresAt), "MM/dd/yyyy")}</span>
                  <span className="text-xs text-text-muted">
                    {format(new Date(row.expiresAt), "hh:mm a")}
                  </span>
                </>
              )
            : (
                <span className="text-text-muted">Never</span>
              )}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (_, row) => (
        <div className="flex flex-col">
          <span>{format(new Date(row.createdAt), "MM/dd/yyyy")}</span>
          <span className="text-xs text-text-muted">
            {format(new Date(row.createdAt), "hh:mm a")}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-1",
      sortable: false,
      render: (_, row) => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={(e) => {
            e?.stopPropagation();
            setSelectedInvitation(row);
            setIsDetailsModalOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const fetchInvitations = async () => {
    await get("/external/invitations", queryParams);
  };

  const refresh = () => {
    fetchInvitations();
  };

  useEffect(() => {
    fetchInvitations();
  }, [params]);

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          variant="secondary-outline"
        >
          <PlusIcon size={16} className="mr-2" />
          Create Invitation
        </Button>
        <Button onClick={refresh} variant="primary" className="px-2" disabled={loading}>
          <RefreshCcwIcon size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="External Invitations"
        description="Manage external access links and invitations"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <div className="flex-1 overflow-hidden">
          <Table<ExternalInvitation>
            columns={columns}
            data={invitations?.data || []}
            total={invitations?.meta?.total || 0}
            idField="id"
            pagination
            loading={loading}
            error={error}
            currentPage={invitations?.meta?.page}
            totalPages={invitations?.meta?.totalPages}
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
            emptyMessage="No invitations found"
          />
        </div>
      </div>

      {isDetailsModalOpen && selectedInvitation && (
        <InvitationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedInvitation(null);
          }}
          invitation={selectedInvitation}
          onSuccess={refresh}
        />
      )}

      {isCreateModalOpen && (
        <CreateInvitationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}

function InvitationDetailsModal({
  isOpen,
  onClose,
  invitation,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  invitation: ExternalInvitation;
  onSuccess: () => void;
}) {
  const { post: revokeInvitation, loading } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const handleRevoke = async () => {
    try {
      const response = await revokeInvitation(`/external/invitations/${invitation.id}/revoke`);

      if (response?.success) {
        toast.success("Invitation revoked successfully!");
        onClose();
        onSuccess();
      }
      else {
        toast.error("Failed to revoke invitation. Please try again.");
      }
    }
    catch (error) {
      console.error("Error revoking invitation:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const isRevoked = !!invitation.revokedAt;
  const isExpired = invitation.expiresAt && new Date(invitation.expiresAt) < new Date();
  const isMaxedOut = invitation.maxUses && invitation.useCount >= invitation.maxUses;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invitation Details"
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm text-text-muted mb-2 block">Token</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-surface border border-border rounded p-2 font-mono text-sm break-all">
                {invitation.token}
              </div>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => copyToClipboard(invitation.token)}
              >
                Copy
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Purpose</label>
            <StatusBadge label={invitation.purpose.replace(/_/g, " ")} variant="default" />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Status</label>
            <StatusBadge
              label={
                isRevoked
                  ? "Revoked"
                  : isExpired
                    ? "Expired"
                    : isMaxedOut
                      ? "Max Uses Reached"
                      : "Active"
              }
              variant={
                isRevoked || isExpired
                  ? "error"
                  : isMaxedOut
                    ? "warning"
                    : "success"
              }
            />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Use Count</label>
            <div className="text-sm">
              {invitation.useCount}
              {invitation.maxUses ? ` / ${invitation.maxUses}` : " (unlimited)"}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Created</label>
            <div className="text-sm">
              {format(new Date(invitation.createdAt), "MM/dd/yyyy hh:mm a")}
            </div>
          </div>

          {invitation.expiresAt && (
            <div>
              <label className="text-sm text-text-muted mb-2 block">Expires</label>
              <div className="text-sm">
                {format(new Date(invitation.expiresAt), "MM/dd/yyyy hh:mm a")}
              </div>
            </div>
          )}

          {invitation.usedAt && (
            <div>
              <label className="text-sm text-text-muted mb-2 block">Last Used</label>
              <div className="text-sm">
                {format(new Date(invitation.usedAt), "MM/dd/yyyy hh:mm a")}
              </div>
            </div>
          )}

          {invitation.revokedAt && (
            <div>
              <label className="text-sm text-text-muted mb-2 block">Revoked</label>
              <div className="text-sm">
                {format(new Date(invitation.revokedAt), "MM/dd/yyyy hh:mm a")}
              </div>
            </div>
          )}

          {invitation.resourceType && (
            <div>
              <label className="text-sm text-text-muted mb-2 block">Resource Type</label>
              <div className="text-sm">{invitation.resourceType}</div>
            </div>
          )}

          {invitation.resourceId && (
            <div>
              <label className="text-sm text-text-muted mb-2 block">Resource ID</label>
              <div className="text-sm font-mono">{invitation.resourceId}</div>
            </div>
          )}
        </div>

        {invitation.metadata && (
          <div>
            <label className="text-sm text-text-muted mb-2 block">Metadata</label>
            <div className="bg-surface border border-border rounded p-3 font-mono text-xs overflow-auto max-h-40">
              <pre>{JSON.stringify(invitation.metadata, null, 2)}</pre>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary-outline"
            onClick={onClose}
          >
            Close
          </Button>
          {!isRevoked && (
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={loading}
            >
              {loading ? "Revoking..." : "Revoke Invitation"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function CreateInvitationModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    purpose: "FORM_SUBMISSION",
    maxUses: "",
    expiresAt: "",
    resourceType: "",
    resourceId: "",
  });

  const { post: createInvitation, loading } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const handleChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleCreate = async () => {
    try {
      const payload: any = {
        purpose: formData.purpose,
      };

      if (formData.maxUses) {
        payload.maxUses = Number.parseInt(formData.maxUses);
      }

      if (formData.expiresAt) {
        payload.expiresAt = new Date(formData.expiresAt).toISOString();
      }

      if (formData.resourceType) {
        payload.resourceType = formData.resourceType;
      }

      if (formData.resourceId) {
        payload.resourceId = formData.resourceId;
      }

      const response = await createInvitation("/external/invitations", payload);

      if (response?.success) {
        toast.success("Invitation created successfully!");
        onClose();
        onSuccess();
      }
      else {
        toast.error("Failed to create invitation. Please try again.");
      }
    }
    catch (error) {
      console.error("Error creating invitation:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Invitation"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm text-text-muted mb-2 block">Purpose *</label>
          <select
            value={formData.purpose}
            onChange={e => handleChange({ purpose: e.target.value })}
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
          >
            <option value="FORM_SUBMISSION">Form Submission</option>
            <option value="FILE_DOWNLOAD">File Download</option>
            <option value="CUSTOMER_FEEDBACK">Customer Feedback</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">Max Uses</label>
          <input
            type="number"
            value={formData.maxUses}
            onChange={e => handleChange({ maxUses: e.target.value })}
            placeholder="Leave empty for unlimited"
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text placeholder:text-text-muted bg-surface"
          />
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">Expires At</label>
          <input
            type="datetime-local"
            value={formData.expiresAt}
            onChange={e => handleChange({ expiresAt: e.target.value })}
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text placeholder:text-text-muted bg-surface"
          />
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">Resource Type</label>
          <input
            type="text"
            value={formData.resourceType}
            onChange={e => handleChange({ resourceType: e.target.value })}
            placeholder="e.g., form, file"
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text placeholder:text-text-muted bg-surface"
          />
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">Resource ID</label>
          <input
            type="text"
            value={formData.resourceId}
            onChange={e => handleChange({ resourceId: e.target.value })}
            placeholder="UUID of the resource"
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text placeholder:text-text-muted bg-surface"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary-outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Invitation"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default Invitations;
