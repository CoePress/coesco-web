import { useState, useEffect } from "react";
import { RefreshCw, Shield, Users, Eye, CheckCircle } from "lucide-react";

import {
  PageHeader,
  Button,
  Loader,
  StatusBadge,
  Table,
  Modal,
} from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";

interface Permission {
  category: string;
  permissions: string[];
}

interface RolePermissions {
  [role: string]: string[];
}

interface UserPermissions {
  role: string;
  permissions: string[];
  rawPermissions: string[];
}

const Permissions = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'roles' | 'me' | 'check'>('all');
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkPermissions, setCheckPermissions] = useState<string[]>(['']);
  const [checkResults, setCheckResults] = useState<any>(null);
  const [requireAll, setRequireAll] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);

  const { get, post } = useApi();

  const fetchAllPermissions = async () => {
    setLoading(true);
    const response = await get("/permissions");
    if (response?.success) {
      const permissions: Permission[] = [];
      const structure = response.data.structure;

      Object.entries(structure).forEach(([category, perms]) => {
        permissions.push({
          category,
          permissions: Array.isArray(perms) ? perms : Object.values(perms as object).flat()
        });
      });

      setAllPermissions(permissions);
    }
    setLoading(false);
  };

  const fetchRolePermissions = async () => {
    setLoading(true);
    const response = await get("/permissions/roles");
    if (response?.success) {
      setRolePermissions(response.data.roles);
    }
    setLoading(false);
  };

  const fetchUserPermissions = async () => {
    setLoading(true);
    const response = await get("/permissions/me");
    if (response?.success) {
      setUserPermissions(response.data);
    }
    setLoading(false);
  };

  const checkUserPermissions = async () => {
    if (!checkPermissions.some(p => p.trim())) return;

    const validPermissions = checkPermissions.filter(p => p.trim());
    const response = await post("/permissions/check", {
      permissions: validPermissions,
      requireAll
    });

    if (response?.success) {
      setCheckResults(response.data);
      setIsCheckModalOpen(true);
    }
  };

  useEffect(() => {
    if (activeTab === 'all') fetchAllPermissions();
    else if (activeTab === 'roles') fetchRolePermissions();
    else if (activeTab === 'me') fetchUserPermissions();
  }, [activeTab]);

  const permissionColumns: TableColumn<any>[] = [
    {
      key: "category",
      header: "Category",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          <span className="font-medium capitalize">{row.category}</span>
        </div>
      )
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (_, row) => (
        <div className="flex flex-wrap gap-1">
          {row.permissions.map((permission: string) => (
            <StatusBadge
              key={permission}
              label={permission}
              variant="default"
              className="text-xs"
            />
          ))}
        </div>
      )
    },
    {
      key: "count",
      header: "Count",
      render: (_, row) => (
        <span className="text-sm text-text-muted">{row.permissions.length}</span>
      )
    }
  ];

  const roleColumns: TableColumn<any>[] = [
    {
      key: "role",
      header: "Role",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <StatusBadge
            label={row.role}
            variant={row.role === 'ADMIN' ? 'error' : 'success'}
          />
        </div>
      )
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (_, row) => (
        <div className="flex flex-wrap gap-1 max-w-md">
          {row.permissions.slice(0, 3).map((permission: string) => (
            <StatusBadge
              key={permission}
              label={permission}
              variant="default"
              className="text-xs"
            />
          ))}
          {row.permissions.length > 3 && (
            <StatusBadge
              label={`+${row.permissions.length - 3} more`}
              variant="secondary"
              className="text-xs"
            />
          )}
        </div>
      )
    },
    {
      key: "count",
      header: "Total",
      render: (_, row) => (
        <span className="text-sm text-text-muted">{row.permissions.length}</span>
      )
    }
  ];

  const TabButton = ({ tab, label, icon: Icon }: { tab: string, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-primary text-white'
          : 'text-text-muted hover:text-text hover:bg-surface-hover'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  const Actions = () => (
    <div className="flex gap-2">
      <Button
        variant="secondary-outline"
        onClick={() => {
          if (activeTab === 'all') fetchAllPermissions();
          else if (activeTab === 'roles') fetchRolePermissions();
          else if (activeTab === 'me') fetchUserPermissions();
        }}
      >
        <RefreshCw size={16} />
        Refresh
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full flex flex-1 flex-col items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Permissions"
        description="Manage system permissions and roles"
        actions={<Actions />}
      />

      <div className="flex gap-2 mb-6">
        <TabButton tab="all" label="All Permissions" icon={Shield} />
        <TabButton tab="roles" label="Role Permissions" icon={Users} />
        <TabButton tab="me" label="My Permissions" icon={Eye} />
        <TabButton tab="check" label="Check Permissions" icon={CheckCircle} />
      </div>

      {activeTab === 'all' && (
        <Table
          columns={permissionColumns}
          data={allPermissions}
          idField="category"
        />
      )}

      {activeTab === 'roles' && (
        <Table
          columns={roleColumns}
          data={Object.entries(rolePermissions).map(([role, permissions]) => ({
            role,
            permissions
          }))}
          idField="role"
        />
      )}

      {activeTab === 'me' && userPermissions && (
        <div className="space-y-6">
          <div className="bg-surface rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users size={20} className="text-primary" />
              <div>
                <h3 className="text-lg font-medium">Your Role</h3>
                <StatusBadge
                  label={userPermissions.role}
                  variant={userPermissions.role === 'ADMIN' ? 'error' : 'success'}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-text-muted mb-2">
                  Expanded Permissions ({userPermissions.permissions.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {userPermissions.permissions.map(permission => (
                    <StatusBadge
                      key={permission}
                      label={permission}
                      variant="default"
                      className="text-xs"
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-text-muted mb-2">
                  Direct Permissions ({userPermissions.rawPermissions.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {userPermissions.rawPermissions.map(permission => (
                    <StatusBadge
                      key={permission}
                      label={permission}
                      variant="secondary"
                      className="text-xs"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'check' && (
        <div className="space-y-6">
          <div className="bg-surface rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Check Permissions</h3>

            <div className="space-y-4">
              {checkPermissions.map((permission, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter permission (e.g., users.manage)"
                    value={permission}
                    onChange={(e) => {
                      const newPermissions = [...checkPermissions];
                      newPermissions[index] = e.target.value;
                      setCheckPermissions(newPermissions);
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
                  />
                  {checkPermissions.length > 1 && (
                    <Button
                      variant="secondary-outline"
                      size="sm"
                      onClick={() => {
                        const newPermissions = checkPermissions.filter((_, i) => i !== index);
                        setCheckPermissions(newPermissions);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                <Button
                  variant="secondary-outline"
                  onClick={() => setCheckPermissions([...checkPermissions, ''])}
                >
                  Add Permission
                </Button>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requireAll"
                    checked={requireAll}
                    onChange={(e) => setRequireAll(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="requireAll" className="text-sm text-text-muted">
                    Require all permissions
                  </label>
                </div>
              </div>

              <Button onClick={checkUserPermissions} disabled={!checkPermissions.some(p => p.trim())}>
                Check Permissions
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isCheckModalOpen}
        onClose={() => setIsCheckModalOpen(false)}
        title="Permission Check Results"
        size="md"
      >
        {checkResults && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              checkResults.hasAccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle size={20} />
                <span className="font-medium">
                  Access {checkResults.hasAccess ? 'Granted' : 'Denied'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Your Role: {checkResults.userRole}</h4>
              <div className="space-y-2">
                {Object.entries(checkResults.results).map(([permission, hasAccess]) => (
                  <div key={permission} className="flex items-center justify-between p-2 bg-surface rounded">
                    <span className="text-sm font-mono">{permission}</span>
                    <StatusBadge
                      label={hasAccess ? 'Granted' : 'Denied'}
                      variant={hasAccess ? 'success' : 'error'}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setIsCheckModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Permissions;