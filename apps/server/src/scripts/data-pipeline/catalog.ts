import type { ItemType } from "@prisma/client";

import type { Migration } from "./migrator";
import { runMigration } from "./migrator";

export const migrateCoilTypes: Migration = {
  name: "Coil Types",
  run: async (ctx) => {
    return runMigration({
      sourceDatabase: "quote",
      sourceTable: "CoilType",
      targetTable: "coilType",
      fieldMappings: [
        { from: "CoilDesc", to: "description", required: true },
        { from: "CoilMult", to: "multiplier", transform: v => v || 1 },
        { from: "SortOrder", to: "sortOrder", transform: v => Number.parseInt(v) || 999 },
        { from: "IsArchived", to: "isArchived", transform: v => v === "1" },
        { from: "CoilID", to: "legacyId", transform: v => v?.toString() },
      ],
    }, ctx);
  },
};

export const migrateProductClasses: Migration = {
  name: "Product Classes",
  run: async (ctx) => {
    // Parents first
    await runMigration({
      sourceDatabase: "quote",
      sourceTable: "EquGroupInfo",
      targetTable: "productClass",
      fieldMappings: [
        { from: "GroupDesc", to: "name", transform: v => v?.trim(), required: true },
      ],
      beforeSave: async (data, original) => {
        const equFamily = original.EquFamily?.toString().trim() || "";
        if (equFamily !== "") return null; // Skip children

        const equGroup = original.EquGroup?.toString().trim() || "";
        const code = equGroup || original.GroupDesc?.toString().replace(/\s+/g, "-").toUpperCase();

        return {
          ...data,
          code,
          description: original.Desc1 || original.GroupDesc || "",
          depth: 0,
          parentId: null,
        };
      },
    }, ctx);

    // Then children
    return runMigration({
      sourceDatabase: "quote",
      sourceTable: "EquGroupInfo",
      targetTable: "productClass",
      fieldMappings: [
        { from: "GroupDesc", to: "name", transform: v => v?.trim(), required: true },
      ],
      beforeSave: async (data, original, ctx) => {
        const equFamily = original.EquFamily?.toString().trim() || "";
        if (!equFamily || equFamily.toLowerCase() === "n/a") return null;

        const segments = equFamily.replace(/\s+/g, "-").split("-");
        const parentCode = segments[0];
        const childCode = segments[1] || segments[0];

        let parent = await ctx.findRecord<{ id: string }>("productClass", { code: parentCode, parentId: null });

        if (!parent) {
          parent = await ctx.db.productClass.create({
            data: { code: parentCode, name: parentCode, description: "", depth: 0, parentId: null },
          });
        }

        return {
          ...data,
          code: `${parentCode}-${childCode}`,
          parentId: parent.id,
          depth: 1,
          description: original.Desc2 || "",
        };
      },
    }, ctx);
  },
};

export const migrateItems: Migration = {
  name: "Equipment Items",
  run: async (ctx) => {
    return runMigration({
      sourceDatabase: "quote",
      sourceTable: "EquipList",
      targetTable: "item",
      sort: "Model",
      order: "ASC",
      fieldMappings: [
        { from: "Model", to: "modelNumber", transform: v => v?.trim() },
        { from: "Description", to: "description" },
      ],
      beforeSave: (data, original) => ({
        ...data,
        specifications: {
          maxWidth: original.MaxWidth,
          minThickness: original.MinThick,
          maxThickness: original.MaxThick,
          ratio: original.Ratio,
          plusRatio: original.PlusRatio,
          maxSpeed: original.MaxSpeed,
          plusMaxSpeed: original.PlusMaxSpeed,
          acceleration: original.Accel,
          rollDiameter: original.RollDiam,
          airDiameter: original.AirDiam,
          pinchDiameter: original.PinchDiam,
          rollNumber: original.RollNum,
          rollType: original.RollType,
          loopLength: original.LoopLength,
          coilOutsideDiameter: original.CoilOD,
          coilWeight: original.CoilWeight,
          stroke: original.Stroke,
          strokesPerMinute: original.SPM,
          standardCost: original.StdCost,
          percentMargin: original.PerMrg,
          price: original.Price,
          equipmentType: original.EquipType,
          commission: original.Comm,
        },
        leadTime: 112,
        type: "Equipment" as ItemType,
        createdAt: new Date(original.CreateDate || original.ModifyDate),
        updatedAt: new Date(original.ModifyDate || original.CreateDate),
        createdById: original.CreateInit?.toLowerCase() || "system",
        updatedById: original.ModifyInit?.toLowerCase() || "system",
      }),
    }, ctx);
  },
};

export const migrateOptionCategories: Migration = {
  name: "Option Categories",
  run: async (ctx) => {
    return runMigration({
      sourceDatabase: "quote",
      sourceTable: "OptGroup",
      targetTable: "optionCategory",
      fieldMappings: [
        { from: "GrpID", to: "legacyId", transform: v => v?.toString() },
        { from: "GrpName", to: "name", transform: v => v?.trim(), required: true },
        { from: "GrpDescription", to: "description", defaultValue: null },
        { from: "Multiple", to: "multiple", transform: v => v?.toLowerCase() === "multiple" },
        { from: "Mandatory", to: "mandatory", transform: v => v?.toLowerCase() === "mandatory" },
        { from: "GrpOrder", to: "displayOrder", transform: v => Number.parseInt(v) || 0 },
      ],
    }, ctx);
  },
};

export const migrateOptionHeaders: Migration = {
  name: "Option Headers",
  run: async (ctx) => {
    // Ensure archived category exists
    let archived = await ctx.findRecord<{ id: string }>("optionCategory", { name: "Archived" });
    if (!archived) {
      archived = await ctx.db.optionCategory.create({
        data: { name: "Archived", description: "Unmapped options", multiple: false, mandatory: false, displayOrder: 9999 },
      });
    }
    ctx.cache.set("archivedCategoryId", archived.id);

    return runMigration({
      sourceDatabase: "std",
      sourceTable: "StdOptDesc",
      targetTable: "optionHeader",
      fieldMappings: [
        { from: "DescID", to: "legacyId", transform: v => v?.toString() },
        { from: "Description", to: "description", transform: v => v?.trim() },
      ],
      beforeSave: async (data, original, ctx) => {
        const grpId = original.OptionGrpID?.toString();
        const category = grpId ? await ctx.findRecord<{ id: string }>("optionCategory", { legacyId: grpId }) : null;

        return {
          ...data,
          name: "Temporary Option Name",
          optionCategoryId: category?.id || ctx.cache.get("archivedCategoryId"),
          createdAt: new Date(original.CreateDate || original.ModifyDate || Date.now()),
          updatedAt: new Date(original.ModifyDate || original.CreateDate || Date.now()),
          createdById: original.CreateInit?.toLowerCase() || "system",
          updatedById: original.ModifyInit?.toLowerCase() || "system",
        };
      },
    }, ctx);
  },
};

export const catalogMigrations: Migration[] = [
  migrateCoilTypes,
  migrateProductClasses,
  migrateItems,
  migrateOptionCategories,
  migrateOptionHeaders,
];
