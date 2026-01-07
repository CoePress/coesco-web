import { useEffect, useState } from "react";
import {
  Loader2,
  Users,
  Briefcase,
  Shield,
  ShieldCheck,
  MoreHorizontal,
  UserCheck,
  UserX,
  ShieldPlus,
  ShieldMinus,
  Clock,
  Mail,
  Plus,
  Check,
  X,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApi } from "@/hooks/use-api";

interface User {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
}

interface Employee {
  id: string;
  number: string;
  firstName: string;
  lastName: string;
  initials: string;
  email: string | null;
  phoneNumber: string | null;
  title: string;
  isActive: boolean;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    role: "ADMIN" | "USER";
    isActive: boolean;
  };
}

interface AccessRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title: string | null;
  department: string | null;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "DENIED";
  createdAt: string;
}

interface Invite {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "ADMIN" | "USER";
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T[];
  meta?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

type Tab = "users" | "employees" | "requests" | "invites";

const roleColors: Record<string, string> = {
  ADMIN: "bg-primary/20 text-primary",
  USER: "bg-muted text-muted-foreground",
};

const statusColors = {
  active: "bg-primary/20 text-primary",
  inactive: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/20 text-yellow-600",
  expired: "bg-destructive/20 text-destructive",
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [page, setPage] = useState(1);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", firstName: "", lastName: "", role: "USER" as "ADMIN" | "USER" });
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const limit = 25;

  const { data: usersData, isLoading: usersLoading, error: usersError, get: getUsers } = useApi<ApiResponse<User>>();
  const { data: employeesData, isLoading: employeesLoading, error: employeesError, get: getEmployees } = useApi<ApiResponse<Employee>>();
  const { data: requestsData, isLoading: requestsLoading, error: requestsError, get: getRequests } = useApi<ApiResponse<AccessRequest>>();
  const { data: invitesData, isLoading: invitesLoading, error: invitesError, get: getInvites } = useApi<ApiResponse<Invite>>();
  const { patch } = useApi<{ success: boolean; data: User }>();
  const { post, isLoading: isCreatingInvite } = useApi<{ success: boolean; data: { inviteUrl: string } }>();
  const { delete: del } = useApi();

  const fetchUsers = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: "username",
      order: "asc",
    });
    await getUsers(`/admin/users?${params.toString()}`);
  };

  const fetchEmployees = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: "lastName",
      order: "asc",
    });
    await getEmployees(`/admin/employees?${params.toString()}`);
  };

  const fetchRequests = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: "createdAt",
      order: "desc",
      filter: JSON.stringify({ status: "PENDING" }),
    });
    await getRequests(`/access/requests?${params.toString()}`);
  };

  const fetchInvites = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: "createdAt",
      order: "desc",
    });
    await getInvites(`/access/invites?${params.toString()}`);
  };

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    else if (activeTab === "employees") fetchEmployees();
    else if (activeTab === "requests") fetchRequests();
    else if (activeTab === "invites") fetchInvites();
  }, [activeTab, page]);

  const handleUpdateUser = async (userId: string, updates: { isActive?: boolean; role?: "ADMIN" | "USER" }) => {
    setUpdatingUserId(userId);
    try {
      const result = await patch(`/admin/users/${userId}`, updates);
      if (result.data?.success) {
        await fetchUsers();
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await post(`/access/requests/${requestId}/approve`, {});
      await fetchRequests();
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await post(`/access/requests/${requestId}/deny`, {});
      await fetchRequests();
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleCreateInvite = async () => {
    const result = await post("/access/invites", inviteForm);
    if (result.data?.success) {
      setLastInviteUrl(result.data.data.inviteUrl);
      setInviteForm({ email: "", firstName: "", lastName: "", role: "USER" });
      await fetchInvites();
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    await del(`/access/invites/${inviteId}`);
    await fetchInvites();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const users = usersData?.data || [];
  const employees = employeesData?.data || [];
  const requests = requestsData?.data || [];
  const invites = invitesData?.data || [];

  const getMeta = () => {
    if (activeTab === "users") return usersData?.meta;
    if (activeTab === "employees") return employeesData?.meta;
    if (activeTab === "requests") return requestsData?.meta;
    if (activeTab === "invites") return invitesData?.meta;
    return null;
  };

  const getIsLoading = () => {
    if (activeTab === "users") return usersLoading;
    if (activeTab === "employees") return employeesLoading;
    if (activeTab === "requests") return requestsLoading;
    if (activeTab === "invites") return invitesLoading;
    return false;
  };

  const getError = () => {
    if (activeTab === "users") return usersError;
    if (activeTab === "employees") return employeesError;
    if (activeTab === "requests") return requestsError;
    if (activeTab === "invites") return invitesError;
    return null;
  };

  const getRetry = () => {
    if (activeTab === "users") return fetchUsers;
    if (activeTab === "employees") return fetchEmployees;
    if (activeTab === "requests") return fetchRequests;
    if (activeTab === "invites") return fetchInvites;
    return () => {};
  };

  const meta = getMeta();
  const isLoading = getIsLoading();
  const error = getError();
  const retry = getRetry();

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const pendingCount = requestsData?.meta?.total || 0;

  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-muted-foreground">
            Manage users, employees, and access
          </p>
        </div>
        {activeTab === "invites" && (
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <Plus className="size-4" />
            New Invite
          </Button>
        )}
      </div>

      <div className="flex gap-2 border-b overflow-x-auto">
        <button
          onClick={() => handleTabChange("users")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield className="size-4" />
          Users
        </button>
        <button
          onClick={() => handleTabChange("employees")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "employees"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="size-4" />
          Employees
        </button>
        <button
          onClick={() => handleTabChange("requests")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "requests"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="size-4" />
          Requests
          {pendingCount > 0 && (
            <span className="flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-xs">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange("invites")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "invites"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="size-4" />
          Invites
        </button>
      </div>

      <div className="rounded-md border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-destructive">
            <p>Failed to load data</p>
            <Button variant="outline" onClick={retry} className="mt-2">
              Retry
            </Button>
          </div>
        ) : activeTab === "users" ? (
          users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="size-12 mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left text-sm font-medium text-muted-foreground">
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{user.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${roleColors[user.role]}`}>
                        {user.role === "ADMIN" ? <ShieldCheck className="size-3" /> : null}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.isActive ? statusColors.active : statusColors.inactive}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(user.lastLogin)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" disabled={updatingUserId === user.id}>
                              {updatingUserId === user.id ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {user.isActive ? (
                              <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { isActive: false })}>
                                <UserX className="size-4" />
                                Deactivate User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { isActive: true })}>
                                <UserCheck className="size-4" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {user.role === "ADMIN" ? (
                              <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { role: "USER" })}>
                                <ShieldMinus className="size-4" />
                                Remove Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { role: "ADMIN" })}>
                                <ShieldPlus className="size-4" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : activeTab === "employees" ? (
          employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Briefcase className="size-12 mb-2 opacity-50" />
              <p>No employees found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left text-sm font-medium text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                        <div className="text-xs text-muted-foreground">#{employee.number}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{employee.email || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{employee.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{employee.user?.username || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${employee.isActive ? statusColors.active : statusColors.inactive}`}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : activeTab === "requests" ? (
          requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="size-12 mb-2 opacity-50" />
              <p>No pending requests</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left text-sm font-medium text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Title / Dept</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{request.firstName} {request.lastName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{request.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {request.title || request.department ? `${request.title || ""}${request.title && request.department ? " / " : ""}${request.department || ""}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(request.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={processingRequestId === request.id}
                        >
                          {processingRequestId === request.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDenyRequest(request.id)}
                          disabled={processingRequestId === request.id}
                        >
                          <X className="size-4" />
                          Deny
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Mail className="size-12 mb-2 opacity-50" />
            <p>No invites sent</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invites.map((invite) => {
                const isExpired = new Date(invite.expiresAt) < new Date();
                const isAccepted = !!invite.acceptedAt;
                return (
                  <tr key={invite.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{invite.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {invite.firstName || invite.lastName ? `${invite.firstName || ""} ${invite.lastName || ""}`.trim() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${roleColors[invite.role]}`}>
                        {invite.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${isAccepted ? statusColors.active : isExpired ? statusColors.expired : statusColors.pending}`}>
                        {isAccepted ? "Accepted" : isExpired ? "Expired" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(invite.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {!isAccepted && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteInvite(invite.id)}
                            title="Delete invite"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isInviteModalOpen} onOpenChange={(open) => { setIsInviteModalOpen(open); if (!open) setLastInviteUrl(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lastInviteUrl ? "Invite Created" : "Send Invite"}</DialogTitle>
          </DialogHeader>
          {lastInviteUrl ? (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Share this link with the user to complete their registration:
              </p>
              <div className="flex gap-2">
                <Input value={lastInviteUrl} readOnly className="bg-muted" />
                <Button variant="outline" onClick={() => copyToClipboard(lastInviteUrl)}>
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link expires in 7 days.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First name</label>
                  <Input
                    placeholder="John"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last name</label>
                  <Input
                    placeholder="Doe"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as "ADMIN" | "USER" })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            {lastInviteUrl ? (
              <Button onClick={() => { setIsInviteModalOpen(false); setLastInviteUrl(null); }}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvite} disabled={!inviteForm.email || isCreatingInvite}>
                  {isCreatingInvite ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Invite"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
