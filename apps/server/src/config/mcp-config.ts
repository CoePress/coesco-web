import type { IQueryParams, ISchema, ITool } from "@/types";

import { logger } from "@/utils/logger";

const serviceMap: Record<string, string> = {
  "address": "addressService",
  "audit-log": "auditLogService",
  "chat": "chatService",
  "coil-type": "coilTypeService",
  "company": "companyService",
  "configuration": "configurationService",
  "configuration-option": "configurationOptionService",
  "contact": "contactService",
  "draft": "draftService",
  "employee": "employeeService",
  "item": "itemService",
  "journey": "journeyService",
  "journey-interaction": "journeyInteractionService",
  "machine": "machineService",
  "machine-status": "machineStatusService",
  "message": "messageService",
  "ntfy-device": "ntfyDeviceService",
  "option-category": "optionCategoryService",
  "option-details": "optionDetailsService",
  "option-header": "optionHeaderService",
  "option-rule": "optionRuleService",
  "option-rule-target": "optionRuleTargetService",
  "option-rule-trigger": "optionRuleTriggerService",
  "performance-sheet": "performanceSheetService",
  "performance-sheet-link": "performanceSheetLinkService",
  "performance-sheet-version": "performanceSheetVersionService",
  "permission": "permissionService",
  "permission-exception": "permissionExceptionService",
  "product-class": "productClassService",
  "product-class-option-category": "productClassOptionCategoryService",
  "quote-details": "quoteDetailsService",
  "quote-header": "quoteHeaderService",
  "quote-item": "quoteItemService",
  "quote-note": "quoteNoteService",
  "quote-terms": "quoteTermsService",
  "role": "roleService",
  "role-assignment": "roleAssignmentService",
  "role-permission": "rolePermissionService",
  "user": "userService",
};

async function getServiceForEntity(entity: string) {
  const serviceName = serviceMap[entity];
  if (!serviceName) {
    throw new Error(`No service found for entity: ${entity}`);
  }

  const repositoryModule = await import("../repositories");
  return (repositoryModule as any)[serviceName];
}

async function getAll(entity: string, params?: IQueryParams<any>) {
  const service = await getServiceForEntity(entity);
  return service.getAll(params);
}

async function getById(entity: string, id: string, _include?: string[] | Record<string, any> | string) {
  const service = await getServiceForEntity(entity);
  return service.getById(id);
}

async function _create(entity: string, data: any) {
  const service = await getServiceForEntity(entity);
  return service.create(data);
}

async function _update(entity: string, id: string, data: any) {
  const service = await getServiceForEntity(entity);
  return service.update(id, data);
}

async function _deleteRecord(entity: string, id: string) {
  const service = await getServiceForEntity(entity);
  return service.delete(id);
}

export const TOOLS: ITool[] = [
  {
    name: "get_all",
    description: "Get all records for an entity",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string" },
        page: { type: "number" },
        limit: { type: "number" },
        sort: { type: "string" },
        order: { type: "string", enum: ["asc", "desc"] },
        filter: { type: ["object", "string"] },
        search: { type: "string" },
        searchFields: { type: "array", items: { type: "string" } },
        dateFrom: { type: "string" },
        dateTo: { type: "string" },
        include: { type: ["array", "object", "string"] },
        select: { type: ["array", "object", "string"] },
      },
      required: ["entity"],
    },
    handler: async (params) => {
      const { entity, ...queryParams } = params;
      return getAll(entity, queryParams);
    },
  },
  {
    name: "get_by_id",
    description: "Get record by ID for an entity",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string" },
        id: { type: "string" },
        include: { type: ["array", "object", "string"] },
      },
      required: ["entity", "id"],
    },
    handler: async params => getById(params.entity, params.id, params.include),
  },
  {
    name: "create",
    description: "Create a new record for an entity",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string" },
        data: { type: "object" },
      },
      required: ["entity", "data"],
    },
    // handler: async params => create(params.entity, params.data),
    handler: async () => logger.info("Create entity called by AI"),
  },
  {
    name: "update",
    description: "Update a record by ID for an entity",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string" },
        id: { type: "string" },
        data: { type: "object" },
      },
      required: ["entity", "id", "data"],
    },
    // handler: async params => update(params.entity, params.id, params.data),
    handler: async () => logger.info("Update entity called by AI"),
  },
  {
    name: "delete",
    description: "Delete a record by ID for an entity",
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string" },
        id: { type: "string" },
      },
      required: ["entity", "id"],
    },
    // handler: async params => deleteRecord(params.entity, params.id),
    handler: async () => logger.info("Delete entity called by AI"),
  },
  {
    name: "get_machine_states",
    description: "Get live machine states",
    inputSchema: {},
    handler: async () => { },
  },
];

export const SCHEMAS: ISchema[] = [
  {
    name: "address",
    description: "Schema for Address entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      companyId: {
        type: "string",
        required: true,
      },
      addressLine1: {
        type: "string",
        required: true,
      },
      addressLine2: {
        type: "string",
        required: false,
      },
      city: {
        type: "string",
        required: false,
      },
      state: {
        type: "string",
        required: false,
      },
      zip: {
        type: "string",
        required: false,
      },
      country: {
        type: "string",
        required: false,
      },
      isPrimary: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "asset",
    description: "Schema for Asset entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      key: {
        type: "string",
        required: true,
      },
      filename: {
        type: "string",
        required: true,
      },
      originalName: {
        type: "string",
        required: true,
      },
      mimeType: {
        type: "string",
        required: true,
      },
      size: {
        type: "int",
        required: true,
      },
      type: {
        type: "assettype",
        required: true,
      },
      status: {
        type: "assetstatus",
        required: true,
        hasDefault: true,
      },
      storageProvider: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      url: {
        type: "string",
        required: true,
      },
      cdnUrl: {
        type: "string",
        required: false,
      },
      thumbnailUrl: {
        type: "string",
        required: false,
      },
      metadata: {
        type: "json",
        required: false,
      },
      tags: {
        type: "string",
        required: true,
        isList: true,
      },
      isPublic: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      uploadedById: {
        type: "string",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
    },
  },
  {
    name: "audit-log",
    description: "Schema for AuditLog entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      action: {
        type: "auditaction",
        required: true,
      },
      model: {
        type: "string",
        required: true,
      },
      recordId: {
        type: "string",
        required: true,
      },
      changedBy: {
        type: "string",
        required: true,
      },
      diff: {
        type: "json",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
    },
  },
  {
    name: "bug-report",
    description: "Schema for BugReport entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      title: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: true,
      },
      userEmail: {
        type: "string",
        required: false,
      },
      userName: {
        type: "string",
        required: false,
      },
      url: {
        type: "string",
        required: false,
      },
      userAgent: {
        type: "string",
        required: false,
      },
      issueKey: {
        type: "string",
        required: false,
      },
      issueUrl: {
        type: "string",
        required: false,
      },
      status: {
        type: "bugreportstatus",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      createdById: {
        type: "string",
        required: false,
      },
    },
  },
  {
    name: "chat",
    description: "Schema for Chat entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      employeeId: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "coil-type",
    description: "Schema for CoilType entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      description: {
        type: "string",
        required: false,
      },
      multiplier: {
        type: "decimal",
        required: true,
        hasDefault: true,
      },
      sortOrder: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      isArchived: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      legacyId: {
        type: "string",
        required: false,
      },
    },
  },
  {
    name: "company",
    description: "Schema for Company entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      name: {
        type: "string",
        required: true,
      },
      website: {
        type: "string",
        required: false,
      },
      email: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      fax: {
        type: "string",
        required: false,
      },
      industry: {
        type: "industry",
        required: false,
      },
      yearFounded: {
        type: "int",
        required: false,
      },
      revenue: {
        type: "int",
        required: false,
      },
      employeeCount: {
        type: "string",
        required: false,
      },
      customerSince: {
        type: "datetime",
        required: false,
      },
      paymentTerms: {
        type: "string",
        required: false,
      },
      creditLimit: {
        type: "int",
        required: false,
      },
      taxId: {
        type: "string",
        required: false,
      },
      logoUrl: {
        type: "string",
        required: false,
      },
      notes: {
        type: "string",
        required: false,
      },
      tags: {
        type: "string",
        required: true,
        isList: true,
      },
      status: {
        type: "companystatus",
        required: true,
        hasDefault: true,
      },
      legacy: {
        type: "json",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "company-relationship",
    description: "Schema for CompanyRelationship entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      parentId: {
        type: "string",
        required: true,
      },
      childId: {
        type: "string",
        required: true,
      },
      relationshipType: {
        type: "string",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "configuration",
    description: "Schema for Configuration entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      productClassId: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: false,
      },
      isTemplate: {
        type: "boolean",
        required: true,
      },
      isActive: {
        type: "boolean",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "configuration-option",
    description: "Schema for ConfigurationOption entity",
    schema: {
      configurationId: {
        type: "string",
        required: true,
      },
      optionId: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "contact",
    description: "Schema for Contact entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      addressId: {
        type: "string",
        required: false,
      },
      companyId: {
        type: "string",
        required: true,
      },
      legacyCompanyId: {
        type: "string",
        required: false,
      },
      firstName: {
        type: "string",
        required: true,
      },
      lastName: {
        type: "string",
        required: false,
      },
      owner: {
        type: "string",
        required: false,
      },
      email: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      phoneExtension: {
        type: "string",
        required: false,
      },
      title: {
        type: "string",
        required: false,
      },
      type: {
        type: "contacttype",
        required: true,
        hasDefault: true,
      },
      isPrimary: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      imageId: {
        type: "int",
        required: false,
      },
      profileUrl: {
        type: "string",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "department",
    description: "Schema for Department entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      name: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: false,
      },
      code: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "draft",
    description: "Schema for Draft entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      entityType: {
        type: "string",
        required: true,
      },
      entityId: {
        type: "string",
        required: false,
      },
      data: {
        type: "json",
        required: true,
      },
      createdById: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
    },
  },
  {
    name: "email-log",
    description: "Schema for EmailLog entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      to: {
        type: "string",
        required: true,
      },
      subject: {
        type: "string",
        required: true,
      },
      template: {
        type: "string",
        required: false,
      },
      status: {
        type: "emailstatus",
        required: true,
        hasDefault: true,
      },
      sentAt: {
        type: "datetime",
        required: false,
      },
      error: {
        type: "string",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
    },
  },
  {
    name: "employee",
    description: "Schema for Employee entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      userId: {
        type: "string",
        required: true,
      },
      number: {
        type: "string",
        required: true,
      },
      firstName: {
        type: "string",
        required: true,
      },
      lastName: {
        type: "string",
        required: true,
      },
      initials: {
        type: "string",
        required: true,
      },
      email: {
        type: "string",
        required: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
      },
      title: {
        type: "string",
        required: true,
      },
      hireDate: {
        type: "datetime",
        required: false,
      },
      startDate: {
        type: "datetime",
        required: false,
      },
      terminationDate: {
        type: "datetime",
        required: false,
      },
      departmentId: {
        type: "string",
        required: false,
      },
      managerId: {
        type: "string",
        required: false,
      },
      isSalaried: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      isActive: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "external-access-link",
    description: "Schema for ExternalAccessLink entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      token: {
        type: "string",
        required: true,
      },
      purpose: {
        type: "accesspurpose",
        required: true,
      },
      resourceId: {
        type: "string",
        required: false,
      },
      resourceType: {
        type: "string",
        required: false,
      },
      expiresAt: {
        type: "datetime",
        required: false,
      },
      usedAt: {
        type: "datetime",
        required: false,
      },
      revokedAt: {
        type: "datetime",
        required: false,
      },
      maxUses: {
        type: "int",
        required: false,
      },
      useCount: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      metadata: {
        type: "json",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      createdById: {
        type: "string",
        required: false,
      },
      updatedById: {
        type: "string",
        required: false,
      },
    },
  },
  {
    name: "form",
    description: "Schema for Form entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      name: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: false,
      },
      status: {
        type: "formstatus",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "form-conditional-rule",
    description: "Schema for FormConditionalRule entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      formId: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: false,
      },
      targetType: {
        type: "conditionaltarget",
        required: true,
      },
      targetId: {
        type: "string",
        required: true,
      },
      action: {
        type: "conditionalaction",
        required: true,
      },
      conditions: {
        type: "json",
        required: true,
      },
      operator: {
        type: "conditionaloperator",
        required: true,
        hasDefault: true,
      },
      priority: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      isActive: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "form-field",
    description: "Schema for FormField entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      sectionId: {
        type: "string",
        required: true,
      },
      label: {
        type: "string",
        required: true,
      },
      variable: {
        type: "string",
        required: true,
      },
      controlType: {
        type: "formfieldcontroltype",
        required: true,
      },
      dataType: {
        type: "formfielddatatype",
        required: true,
      },
      options: {
        type: "json",
        required: true,
        hasDefault: true,
      },
      isRequired: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      isReadOnly: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      isHiddenOnDevice: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      isHiddenOnReport: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      sequence: {
        type: "int",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "form-page",
    description: "Schema for FormPage entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      formId: {
        type: "string",
        required: true,
      },
      title: {
        type: "string",
        required: true,
      },
      sequence: {
        type: "int",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "form-section",
    description: "Schema for FormSection entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      pageId: {
        type: "string",
        required: true,
      },
      title: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: false,
      },
      sequence: {
        type: "int",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "form-submission",
    description: "Schema for FormSubmission entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      formId: {
        type: "string",
        required: true,
      },
      status: {
        type: "formsubmissionstatus",
        required: true,
        hasDefault: true,
      },
      answers: {
        type: "json",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "image",
    description: "Schema for Image entity",
    schema: {
      id: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      path: {
        type: "string",
        required: true,
      },
      uploadedAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
    },
  },
  {
    name: "item",
    description: "Schema for Item entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      productClassId: {
        type: "string",
        required: false,
      },
      modelNumber: {
        type: "string",
        required: false,
      },
      name: {
        type: "string",
        required: false,
      },
      description: {
        type: "string",
        required: false,
      },
      specifications: {
        type: "json",
        required: true,
        hasDefault: true,
      },
      unitPrice: {
        type: "float",
        required: true,
        hasDefault: true,
      },
      leadTime: {
        type: "int",
        required: false,
      },
      type: {
        type: "itemtype",
        required: true,
      },
      isActive: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "journey",
    description: "Schema for Journey entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      name: {
        type: "string",
        required: false,
      },
      rsmId: {
        type: "string",
        required: false,
      },
      customerId: {
        type: "string",
        required: false,
      },
      customerAddressId: {
        type: "string",
        required: false,
      },
      customerContactId: {
        type: "string",
        required: false,
      },
      dealerId: {
        type: "string",
        required: false,
      },
      dealerAddressId: {
        type: "string",
        required: false,
      },
      dealerContactId: {
        type: "string",
        required: false,
      },
      startDate: {
        type: "datetime",
        required: false,
      },
      status: {
        type: "journeystatus",
        required: false,
      },
      type: {
        type: "journeytype",
        required: false,
      },
      source: {
        type: "journeysource",
        required: false,
      },
      priority: {
        type: "journeypriority",
        required: false,
      },
      confidence: {
        type: "int",
        required: false,
      },
      notes: {
        type: "string",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "journey-contact",
    description: "Schema for JourneyContact entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      journeyId: {
        type: "string",
        required: true,
      },
      contactId: {
        type: "string",
        required: true,
      },
      isPrimary: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "journey-interaction",
    description: "Schema for JourneyInteraction entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      journeyId: {
        type: "string",
        required: true,
      },
      interactionType: {
        type: "journeyinteractiontype",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "login-history",
    description: "Schema for LoginHistory entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      userId: {
        type: "string",
        required: false,
      },
      username: {
        type: "string",
        required: false,
      },
      loginMethod: {
        type: "loginmethod",
        required: true,
      },
      success: {
        type: "boolean",
        required: true,
      },
      failureReason: {
        type: "string",
        required: false,
      },
      ipAddress: {
        type: "string",
        required: false,
      },
      userAgent: {
        type: "string",
        required: false,
      },
      location: {
        type: "json",
        required: false,
      },
      timestamp: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
    },
  },
  {
    name: "machine",
    description: "Schema for Machine entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      slug: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: true,
      },
      type: {
        type: "machinetype",
        required: true,
      },
      controllerType: {
        type: "machinecontrollertype",
        required: true,
      },
      connectionUrl: {
        type: "string",
        required: false,
      },
      enabled: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
      deletedById: {
        type: "string",
        required: false,
      },
    },
  },
  {
    name: "machine-status",
    description: "Schema for MachineStatus entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      machineId: {
        type: "string",
        required: true,
      },
      state: {
        type: "machinestate",
        required: true,
      },
      execution: {
        type: "string",
        required: true,
      },
      controller: {
        type: "string",
        required: true,
      },
      program: {
        type: "string",
        required: false,
      },
      tool: {
        type: "string",
        required: false,
      },
      metrics: {
        type: "json",
        required: false,
      },
      alarmCode: {
        type: "string",
        required: false,
      },
      alarmMessage: {
        type: "string",
        required: false,
      },
      startTime: {
        type: "datetime",
        required: true,
      },
      endTime: {
        type: "datetime",
        required: false,
      },
      duration: {
        type: "int",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
    },
  },
  {
    name: "message",
    description: "Schema for Message entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      chatId: {
        type: "string",
        required: true,
      },
      role: {
        type: "string",
        required: true,
      },
      content: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      fileUrl: {
        type: "string",
        required: false,
      },
    },
  },
  {
    name: "note",
    description: "Schema for Note entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      entityId: {
        type: "string",
        required: true,
      },
      entityType: {
        type: "string",
        required: true,
      },
      type: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      body: {
        type: "string",
        required: true,
      },
      createdBy: {
        type: "string",
        required: false,
      },
      updatedBy: {
        type: "string",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
    },
  },
  {
    name: "ntfy-device",
    description: "Schema for NtfyDevice entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      name: {
        type: "string",
        required: true,
      },
      host: {
        type: "string",
        required: true,
      },
      pingIntervalSec: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      maxMissedPings: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      currentMissedPings: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      enabled: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      lastPingTime: {
        type: "datetime",
        required: false,
      },
      lastPingSuccess: {
        type: "boolean",
        required: false,
      },
      isDown: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "option-category",
    description: "Schema for OptionCategory entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      name: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: false,
      },
      multiple: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      mandatory: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      standard: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      displayOrder: {
        type: "int",
        required: true,
      },
      legacyId: {
        type: "string",
        required: false,
      },
    },
  },
  {
    name: "option-details",
    description: "Schema for OptionDetails entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      optionHeaderId: {
        type: "string",
        required: true,
      },
      productClassId: {
        type: "string",
        required: false,
      },
      itemId: {
        type: "string",
        required: false,
      },
      price: {
        type: "decimal",
        required: true,
      },
      isActive: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "option-header",
    description: "Schema for OptionHeader entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      optionCategoryId: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: false,
      },
      legacyId: {
        type: "string",
        required: false,
      },
      displayOrder: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      isActive: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "option-rule",
    description: "Schema for OptionRule entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      name: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: false,
      },
      action: {
        type: "optionruleaction",
        required: true,
      },
      priority: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      isActive: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      condition: {
        type: "json",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "option-rule-target",
    description: "Schema for OptionRuleTarget entity",
    schema: {
      ruleId: {
        type: "string",
        required: true,
      },
      optionId: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "option-rule-trigger",
    description: "Schema for OptionRuleTrigger entity",
    schema: {
      ruleId: {
        type: "string",
        required: true,
      },
      optionId: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "performance-sheet",
    description: "Schema for PerformanceSheet entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      versionId: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: false,
      },
      data: {
        type: "json",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "performance-sheet-link",
    description: "Schema for PerformanceSheetLink entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      performanceSheetId: {
        type: "string",
        required: true,
      },
      entityType: {
        type: "string",
        required: true,
      },
      entityId: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "performance-sheet-version",
    description: "Schema for PerformanceSheetVersion entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      sections: {
        type: "json",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "permission",
    description: "Schema for Permission entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      resource: {
        type: "string",
        required: true,
      },
      action: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: false,
      },
      condition: {
        type: "json",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
    },
  },
  {
    name: "permission-exception",
    description: "Schema for PermissionException entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      userId: {
        type: "string",
        required: true,
      },
      permissionId: {
        type: "string",
        required: true,
      },
      scope: {
        type: "json",
        required: true,
      },
      scopeKey: {
        type: "string",
        required: true,
      },
      reason: {
        type: "string",
        required: false,
      },
      expiresAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
    },
  },
  {
    name: "postal-code",
    description: "Schema for PostalCode entity",
    schema: {
      countryCode: {
        type: "string",
        required: true,
      },
      postalCode: {
        type: "string",
        required: true,
      },
      latitude: {
        type: "float",
        required: true,
      },
      longitude: {
        type: "float",
        required: true,
      },
    },
  },
  {
    name: "product-class",
    description: "Schema for ProductClass entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      code: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: false,
      },
      parentId: {
        type: "string",
        required: false,
      },
      depth: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      isActive: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
    },
  },
  {
    name: "product-class-option-category",
    description: "Schema for ProductClassOptionCategory entity",
    schema: {
      productClassId: {
        type: "string",
        required: true,
      },
      optionCategoryId: {
        type: "string",
        required: true,
      },
      displayOrder: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      isRequired: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "quote",
    description: "Schema for Quote entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      journeyId: {
        type: "string",
        required: false,
      },
      year: {
        type: "string",
        required: true,
      },
      number: {
        type: "string",
        required: true,
      },
      rsmId: {
        type: "string",
        required: false,
      },
      customerId: {
        type: "string",
        required: false,
      },
      customerContactId: {
        type: "string",
        required: false,
      },
      customerAddressId: {
        type: "string",
        required: false,
      },
      dealerId: {
        type: "string",
        required: false,
      },
      dealerContactId: {
        type: "string",
        required: false,
      },
      dealerAddressId: {
        type: "string",
        required: false,
      },
      priority: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      confidence: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      status: {
        type: "quotestatus",
        required: true,
        hasDefault: true,
      },
      latestRevision: {
        type: "string",
        required: false,
      },
      latestRevisionStatus: {
        type: "quoterevisionstatus",
        required: false,
      },
      latestRevisionTotalAmount: {
        type: "decimal",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
      legacy: {
        type: "json",
        required: true,
        hasDefault: true,
      },
    },
  },
  {
    name: "quote-item",
    description: "Schema for QuoteItem entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      quoteRevisionId: {
        type: "string",
        required: true,
      },
      configurationId: {
        type: "string",
        required: false,
      },
      itemId: {
        type: "string",
        required: false,
      },
      model: {
        type: "string",
        required: false,
      },
      name: {
        type: "string",
        required: false,
      },
      description: {
        type: "string",
        required: false,
      },
      quantity: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      unitPrice: {
        type: "decimal",
        required: true,
      },
      lineNumber: {
        type: "int",
        required: true,
      },
      isCustom: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "quote-note",
    description: "Schema for QuoteNote entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      quoteRevisionId: {
        type: "string",
        required: true,
      },
      body: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "quote-revision",
    description: "Schema for QuoteRevision entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      quoteId: {
        type: "string",
        required: true,
      },
      revision: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      quoteDate: {
        type: "datetime",
        required: false,
      },
      status: {
        type: "quoterevisionstatus",
        required: true,
        hasDefault: true,
      },
      approvedById: {
        type: "string",
        required: false,
      },
      sentById: {
        type: "string",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
      deletedAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: true,
      },
      updatedById: {
        type: "string",
        required: true,
      },
    },
  },
  {
    name: "quote-terms",
    description: "Schema for QuoteTerms entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      quoteRevisionId: {
        type: "string",
        required: true,
      },
      percentage: {
        type: "int",
        required: false,
      },
      netDays: {
        type: "int",
        required: true,
        hasDefault: true,
      },
      amount: {
        type: "decimal",
        required: false,
      },
      verbiage: {
        type: "string",
        required: false,
      },
      dueOrder: {
        type: "int",
        required: false,
      },
      customTerms: {
        type: "string",
        required: false,
      },
      notToExceed: {
        type: "decimal",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
    },
  },
  {
    name: "role",
    description: "Schema for Role entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      name: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
        required: false,
      },
      isSystem: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
    },
  },
  {
    name: "role-assignment",
    description: "Schema for RoleAssignment entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      userId: {
        type: "string",
        required: true,
      },
      roleId: {
        type: "string",
        required: true,
      },
      scope: {
        type: "json",
        required: true,
      },
      scopeKey: {
        type: "string",
        required: true,
      },
      expiresAt: {
        type: "datetime",
        required: false,
      },
      createdById: {
        type: "string",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
    },
  },
  {
    name: "role-permission",
    description: "Schema for RolePermission entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      roleId: {
        type: "string",
        required: true,
      },
      permissionId: {
        type: "string",
        required: true,
      },
      condition: {
        type: "json",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
    },
  },
  {
    name: "session",
    description: "Schema for Session entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      userId: {
        type: "string",
        required: true,
      },
      token: {
        type: "string",
        required: true,
      },
      refreshToken: {
        type: "string",
        required: false,
      },
      ipAddress: {
        type: "string",
        required: false,
      },
      userAgent: {
        type: "string",
        required: false,
      },
      deviceType: {
        type: "string",
        required: false,
      },
      deviceName: {
        type: "string",
        required: false,
      },
      location: {
        type: "json",
        required: false,
      },
      loginMethod: {
        type: "loginmethod",
        required: true,
      },
      loginAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      lastActivityAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      expiresAt: {
        type: "datetime",
        required: true,
      },
      revokedAt: {
        type: "datetime",
        required: false,
      },
      revokedReason: {
        type: "string",
        required: false,
      },
      logoutAt: {
        type: "datetime",
        required: false,
      },
      isActive: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      isSuspicious: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      suspiciousReason: {
        type: "string",
        required: false,
      },
      metadata: {
        type: "json",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
    },
  },
  {
    name: "tag",
    description: "Schema for Tag entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      description: {
        type: "string",
        required: true,
      },
      parentTable: {
        type: "string",
        required: true,
      },
      parentId: {
        type: "string",
        required: true,
      },
      createdBy: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
    },
  },
  {
    name: "token",
    description: "Schema for Token entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      userId: {
        type: "string",
        required: true,
      },
      type: {
        type: "tokentype",
        required: true,
      },
      token: {
        type: "string",
        required: true,
      },
      expiresAt: {
        type: "datetime",
        required: true,
      },
      used: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
    },
  },
  {
    name: "user",
    description: "Schema for User entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      username: {
        type: "string",
        required: true,
      },
      password: {
        type: "string",
        required: false,
      },
      microsoftId: {
        type: "string",
        required: false,
      },
      role: {
        type: "userrole",
        required: true,
        hasDefault: true,
      },
      isActive: {
        type: "boolean",
        required: true,
        hasDefault: true,
      },
      lastLogin: {
        type: "datetime",
        required: false,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
    },
  },
  {
    name: "user-settings",
    description: "Schema for UserSettings entity",
    schema: {
      id: {
        type: "string",
        required: true,
        hasDefault: true,
      },
      userId: {
        type: "string",
        required: true,
      },
      settings: {
        type: "json",
        required: true,
        hasDefault: true,
      },
      createdAt: {
        type: "datetime",
        required: true,
        hasDefault: true,
      },
      updatedAt: {
        type: "datetime",
        required: true,
      },
    },
  },
];
