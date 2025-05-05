import { RefreshCw, FileText, UserCog, Lock, Shield } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Badge from "@/components/badge";
import { IUser } from "@machining/types";
import useGetUsers from "@/hooks/user/use-get-users";
import useSyncUsers from "@/hooks/user/use-sync-users";

const UsersPage = () => {
  const [editUser, setEditUser] = useState<IUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    users,
    loading: usersLoading,
    error: usersError,
    refresh,
  } = useGetUsers();

  const {
    syncUsers,
    loading: syncUsersLoading,
    error: syncUsersError,
  } = useSyncUsers();

  const handleSyncUsers = async () => {
    await syncUsers();
    await refresh();
  };

  const handleEditUser = (user: IUser) => {
    setEditUser({ ...user });
    setShowEditModal(true);
  };

  const handleUpdateUser = () => {
    if (!editUser || !users) return;

    setShowEditModal(false);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="shrink-0 p-2 border-b">
        <div className="flex justify-between items-center">
          <h1>Users</h1>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSyncUsers}
              disabled={syncUsersLoading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${syncUsersLoading ? "animate-spin" : ""}`}
              />
              Sync Users
            </Button>
          </div>
        </div>
      </div>

      {usersError ||
        (syncUsersError && (
          <div className="p-4 mb-4 text-red-500 border border-red-200 rounded">
            Error loading users: {usersError || syncUsersError}
          </div>
        ))}

      {usersLoading ? (
        <div className="flex justify-center items-center p-8">
          <RefreshCw className="animate-spin h-8 w-8 text-gray-400" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>
                  <Badge status={user.role}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge status={user.isActive ? "active" : "inactive"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}>
                    <UserCog className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={showEditModal}
        onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserCog className="h-5 w-5 mr-2" />
              Edit User: {editUser?.name}
            </DialogTitle>
            <DialogDescription>
              Update user role and preferences
            </DialogDescription>
          </DialogHeader>

          {editUser && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-sm font-medium flex items-center mb-3">
                  <Lock className="h-4 w-4 mr-1" />
                  User Role
                </h3>
                <RadioGroup
                  value={editUser.role}
                  onValueChange={(value) =>
                    setEditUser({ ...editUser, role: value as IUser["role"] })
                  }
                  className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="admin"
                      id="role-admin"
                    />
                    <Label
                      htmlFor="role-admin"
                      className="font-medium">
                      Admin
                    </Label>
                    <span className="text-xs text-gray-500">
                      - Full system access
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="manager"
                      id="role-manager"
                    />
                    <Label
                      htmlFor="role-manager"
                      className="font-medium">
                      Manager
                    </Label>
                    <span className="text-xs text-gray-500">
                      - Department management access
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="operator"
                      id="role-operator"
                    />
                    <Label
                      htmlFor="role-operator"
                      className="font-medium">
                      Operator
                    </Label>
                    <span className="text-xs text-gray-500">
                      - Machine operation access
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="viewer"
                      id="role-viewer"
                    />
                    <Label
                      htmlFor="role-viewer"
                      className="font-medium">
                      Viewer
                    </Label>
                    <span className="text-xs text-gray-500">
                      - Read-only access
                    </span>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <h3 className="text-sm font-medium flex items-center mb-3">
                  <Shield className="h-4 w-4 mr-1" />
                  User Status
                </h3>
                <RadioGroup
                  value={editUser.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setEditUser({
                      ...editUser,
                      isActive: value === "active",
                    })
                  }
                  className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="active"
                      id="status-active"
                    />
                    <Label
                      htmlFor="status-active"
                      className="font-medium">
                      Active
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="inactive"
                      id="status-inactive"
                    />
                    <Label
                      htmlFor="status-inactive"
                      className="font-medium">
                      Inactive
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <h3 className="text-sm font-medium flex items-center mb-3">
                  <FileText className="h-4 w-4 mr-1" />
                  Preferences
                </h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="receive-reports"
                    checked={editUser.receivesReports || false}
                    onCheckedChange={(checked) =>
                      setEditUser({ ...editUser, receivesReports: !!checked })
                    }
                  />
                  <Label htmlFor="receive-reports">
                    Receive system reports via email
                  </Label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">User Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Email:</span>{" "}
                    {editUser.email}
                  </div>
                  <div>
                    <span className="text-gray-500">Department:</span>{" "}
                    {editUser.department}
                  </div>
                  <div>
                    <span className="text-gray-500">Last Login:</span>{" "}
                    {editUser.lastLogin
                      ? new Date(editUser.lastLogin).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
