import type { IQueryParams } from "@/types";

import { prisma } from "@/utils/prisma";

interface DeletedRecord {
  id: string;
  modelName: string;
  displayName: string;
  deletedAt: Date;
  hardDeleteDate: Date;
  metadata: Record<string, any>;
}

const MODELS_WITH_SOFT_DELETE: Array<{ model: string; displayField: string | string[] }> = [
  { model: "asset", displayField: "originalName" },
  { model: "department", displayField: "name" },
  { model: "employee", displayField: ["firstName", "lastName"] },
  { model: "company", displayField: "name" },
  { model: "contact", displayField: ["firstName", "lastName"] },
  { model: "journeyContact", displayField: "id" },
  { model: "address", displayField: "addressLine1" },
  { model: "journey", displayField: "name" },
  { model: "note", displayField: "body" },
  { model: "journeyInteraction", displayField: "interactionType" },
  { model: "quote", displayField: ["year", "number"] },
  { model: "quoteRevision", displayField: "revision" },
  { model: "quoteItem", displayField: "name" },
  { model: "quoteNote", displayField: "body" },
  { model: "item", displayField: "modelNumber" },
  { model: "productClassOptionCategory", displayField: "id" },
  { model: "optionHeader", displayField: "name" },
  { model: "optionDetails", displayField: "id" },
  { model: "optionRule", displayField: "name" },
  { model: "optionRuleTarget", displayField: "id" },
  { model: "optionRuleTrigger", displayField: "id" },
  { model: "configuration", displayField: "name" },
  { model: "configurationOption", displayField: "id" },
  { model: "machine", displayField: "name" },
  { model: "performanceSheetVersion", displayField: "id" },
  { model: "performanceSheet", displayField: "name" },
  { model: "performanceSheetLink", displayField: "id" },
  { model: "formSubmission", displayField: "id" },
  { model: "chat", displayField: "name" },
  { model: "ntfyDevice", displayField: "name" },
];

export class DeletedRecordsService {
  private readonly RETENTION_DAYS = 30;

  async getAllDeletedRecords(params?: IQueryParams<any>) {
    const page = params?.page || 1;
    const limit = params?.limit || 25;
    const offset = (page - 1) * limit;
    const modelName = (params?.filter as any)?.modelName;

    const records: DeletedRecord[] = [];
    const modelsToQuery = modelName
      ? MODELS_WITH_SOFT_DELETE.filter(m => m.model === modelName)
      : MODELS_WITH_SOFT_DELETE;

    for (const { model, displayField } of modelsToQuery) {
      try {
        const deletedRecords = await (prisma[model as keyof typeof prisma] as any).findMany({
          where: {
            deletedAt: { not: null },
          },
          orderBy: { deletedAt: "desc" },
        });

        for (const record of deletedRecords) {
          const displayName = this.getDisplayName(record, displayField);
          const hardDeleteDate = new Date(record.deletedAt);
          hardDeleteDate.setDate(hardDeleteDate.getDate() + this.RETENTION_DAYS);

          records.push({
            id: record.id,
            modelName: model,
            displayName,
            deletedAt: record.deletedAt,
            hardDeleteDate,
            metadata: this.extractMetadata(record),
          });
        }
      }
      catch {
        // Skip models that don't exist or have issues
        continue;
      }
    }

    records.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());

    const total = records.length;
    const paginatedRecords = records.slice(offset, offset + limit);

    return {
      success: true,
      data: paginatedRecords,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async restoreRecord(modelName: string, id: string) {
    const modelConfig = MODELS_WITH_SOFT_DELETE.find(m => m.model === modelName);

    if (!modelConfig) {
      throw new Error(`Model ${modelName} does not support soft delete`);
    }

    const model = prisma[modelName as keyof typeof prisma] as any;

    await model.update({
      where: { id },
      data: {
        deletedAt: null,
        status: modelName === "asset" ? "READY" : undefined,
      },
    });

    return {
      success: true,
      message: "Record restored successfully",
    };
  }

  async hardDeleteRecord(modelName: string, id: string) {
    const modelConfig = MODELS_WITH_SOFT_DELETE.find(m => m.model === modelName);

    if (!modelConfig) {
      throw new Error(`Model ${modelName} does not support soft delete`);
    }

    if (modelName === "asset") {
      const { assetService } = await import("../core/asset.service");
      await assetService.deleteAsset(id, true);
    }
    else {
      const model = prisma[modelName as keyof typeof prisma] as any;
      await model.delete({ where: { id } });
    }

    return {
      success: true,
      message: "Record permanently deleted",
    };
  }

  getModelNames() {
    return MODELS_WITH_SOFT_DELETE.map(m => m.model);
  }

  private getDisplayName(record: any, displayField: string | string[]): string {
    if (Array.isArray(displayField)) {
      return displayField
        .map(field => record[field])
        .filter(Boolean)
        .join(" ") || record.id;
    }

    return record[displayField] || record.id;
  }

  private extractMetadata(record: any): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (record.createdAt)
      metadata.createdAt = record.createdAt;
    if (record.updatedAt)
      metadata.updatedAt = record.updatedAt;
    if (record.createdById)
      metadata.createdById = record.createdById;
    if (record.type)
      metadata.type = record.type;
    if (record.status)
      metadata.status = record.status;

    return metadata;
  }
}
