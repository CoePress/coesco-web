import { z } from "zod";

export const CreateRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isSystem: z.boolean(),
  legacy: z.record(z.any()).optional(),
});

export const UpdateRoleSchema = CreateRoleSchema.partial();

export const CreateRolePermissionSchema = z.object({
  roleId: z.string().uuid("Invalid role ID"),
  permissionId: z.string().uuid("Invalid permission ID"),
});

export const UpdateRolePermissionSchema = CreateRolePermissionSchema.partial();

export const CreateRoleAssignmentSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  roleId: z.string().uuid("Invalid role ID"),
  scope: z.string().min(1, "Scope is required"),
  scopeKey: z.string().min(1, "Scope key is required"),
});

export const UpdateRoleAssignmentSchema = CreateRoleAssignmentSchema.partial();

export const CreatePermissionSchema = z.object({
  resource: z.string().min(1, "Resource is required"),
  action: z.string().min(1, "Action is required"),
  description: z.string().optional(),
  condition: z.record(z.any()).optional(),
});

export const UpdatePermissionSchema = CreatePermissionSchema.partial();
