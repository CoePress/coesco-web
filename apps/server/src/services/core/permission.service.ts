import { UserRole } from "@prisma/client";

export const PERMISSIONS = {
  // User Management
  users: {
    create: "users.create",
    read: "users.read",
    update: "users.update",
    delete: "users.delete",
    manage: "users.manage", // Full user management
  },
  
  // Employee Management
  employees: {
    create: "employees.create",
    read: "employees.read",
    update: "employees.update",
    delete: "employees.delete",
    manage: "employees.manage",
  },
  
  // Legacy Database Access
  legacy: {
    read: "legacy.read",
    write: "legacy.write",
    manage: "legacy.manage",
  },
  
  // Microsoft Integration
  microsoft: {
    sync: "microsoft.sync",
    configure: "microsoft.configure",
  },
  
  // System Administration
  system: {
    settings: "system.settings",
    logs: "system.logs",
    maintenance: "system.maintenance",
    all: "system.all", // Super admin
  },
  
  // Data Pipeline
  pipeline: {
    read: "pipeline.read",
    execute: "pipeline.execute",
    configure: "pipeline.configure",
  },
  
  // Quotes
  quotes: {
    create: "quotes.create",
    read: "quotes.read",
    update: "quotes.update",
    delete: "quotes.delete",
    approve: "quotes.approve",
  },
  
  // Reports
  reports: {
    view: "reports.view",
    generate: "reports.generate",
    export: "reports.export",
  },
} as const;

type PermissionValue = string;
type NestedPermissions = { [key: string]: PermissionValue | NestedPermissions };

// Flatten the permissions object to get all permission strings
function flattenPermissions(obj: NestedPermissions, prefix = ""): string[] {
  const result: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result.push(value);
    } else {
      result.push(...flattenPermissions(value, prefix ? `${prefix}.${key}` : key));
    }
  }
  
  return result;
}

export const ALL_PERMISSIONS = flattenPermissions(PERMISSIONS);

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    // Full system access
    PERMISSIONS.system.all,
    PERMISSIONS.users.manage,
    PERMISSIONS.employees.manage,
    PERMISSIONS.legacy.manage,
    PERMISSIONS.microsoft.sync,
    PERMISSIONS.microsoft.configure,
    PERMISSIONS.pipeline.configure,
    PERMISSIONS.quotes.approve,
    PERMISSIONS.reports.export,
  ],
  [UserRole.USER]: [
    // Basic user permissions
    PERMISSIONS.employees.read,
    PERMISSIONS.legacy.read,
    PERMISSIONS.pipeline.read,
    PERMISSIONS.quotes.create,
    PERMISSIONS.quotes.read,
    PERMISSIONS.quotes.update,
    PERMISSIONS.reports.view,
    PERMISSIONS.reports.generate,
  ],
};

export class PermissionService {
  /**
   * Check if a role has a specific permission
   */
  hasPermission(role: UserRole, permission: string): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    
    // Check for exact permission match
    if (rolePermissions.includes(permission)) {
      return true;
    }
    
    // Check for wildcard permissions (e.g., system.all covers system.settings)
    return rolePermissions.some(rolePermission => {
      if (rolePermission.endsWith(".all")) {
        const basePermission = rolePermission.replace(".all", "");
        return permission.startsWith(`${basePermission}.`);
      }
      if (rolePermission.endsWith(".manage")) {
        const basePermission = rolePermission.replace(".manage", "");
        return permission.startsWith(`${basePermission}.`);
      }
      return false;
    });
  }
  
  /**
   * Check if a role has any of the provided permissions
   */
  hasAnyPermission(role: UserRole, permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(role, permission));
  }
  
  /**
   * Check if a role has all of the provided permissions
   */
  hasAllPermissions(role: UserRole, permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(role, permission));
  }
  
  /**
   * Get all permissions for a role
   */
  getRolePermissions(role: UserRole): string[] {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    const expandedPermissions = new Set<string>();
    
    for (const permission of rolePermissions) {
      if (permission.endsWith(".all")) {
        const basePermission = permission.replace(".all", "");
        // Add all permissions that start with this base
        ALL_PERMISSIONS
          .filter(p => p.startsWith(`${basePermission}.`))
          .forEach(p => expandedPermissions.add(p));
      } else if (permission.endsWith(".manage")) {
        const basePermission = permission.replace(".manage", "");
        // Add all CRUD permissions for this resource
        ALL_PERMISSIONS
          .filter(p => p.startsWith(`${basePermission}.`))
          .forEach(p => expandedPermissions.add(p));
      } else {
        expandedPermissions.add(permission);
      }
    }
    
    return Array.from(expandedPermissions);
  }
  
  /**
   * Check if a permission exists in the system
   */
  isValidPermission(permission: string): boolean {
    return ALL_PERMISSIONS.includes(permission);
  }
  
  /**
   * Get permissions by category (e.g., "users", "system")
   */
  getPermissionsByCategory(category: string): string[] {
    return ALL_PERMISSIONS.filter(permission => permission.startsWith(`${category}.`));
  }
  
  /**
   * Parse permission to get category and action
   */
  parsePermission(permission: string): { category: string; action: string } {
    const parts = permission.split(".");
    if (parts.length < 2) {
      throw new Error(`Invalid permission format: ${permission}`);
    }
    
    return {
      category: parts[0],
      action: parts.slice(1).join("."),
    };
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions() {
    return {
      success: true,
      data: {
        permissions: ALL_PERMISSIONS,
        structure: PERMISSIONS,
      },
    };
  }

  /**
   * Get permissions by role with expanded view
   */
  async getAllRolePermissions() {
    const expandedRolePermissions: Record<string, string[]> = {};
    
    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      expandedRolePermissions[role] = this.getRolePermissions(role as UserRole);
    }
    
    return {
      success: true,
      data: {
        roles: expandedRolePermissions,
        raw: ROLE_PERMISSIONS,
      },
    };
  }

  /**
   * Check multiple permissions for a role
   */
  async checkPermissions(role: UserRole, permissions: string[], requireAll = false) {
    if (!Array.isArray(permissions)) {
      return {
        success: false,
        error: "Permissions must be an array",
      };
    }
    
    const results: Record<string, boolean> = {};
    
    for (const permission of permissions) {
      results[permission] = this.hasPermission(role, permission);
    }
    
    const hasAccess = requireAll 
      ? Object.values(results).every(Boolean)
      : Object.values(results).some(Boolean);
    
    return {
      success: true,
      data: {
        hasAccess,
        results,
        userRole: role,
        userPermissions: this.getRolePermissions(role),
      },
    };
  }

  /**
   * Get current user's permissions
   */
  async getUserPermissions(role: UserRole) {
    return {
      success: true,
      data: {
        role,
        permissions: this.getRolePermissions(role),
        rawPermissions: ROLE_PERMISSIONS[role] || [],
      },
    };
  }

  /**
   * Get permissions for a specific category
   */
  async getCategoryPermissions(category: string) {
    const categoryPermissions = this.getPermissionsByCategory(category);
    
    if (categoryPermissions.length === 0) {
      return {
        success: false,
        error: `Category '${category}' not found`,
      };
    }
    
    return {
      success: true,
      data: {
        category,
        permissions: categoryPermissions,
      },
    };
  }
}