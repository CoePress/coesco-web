import { QuoteRevisionStatus, QuoteStatus } from "@prisma/client";

import type { Migration } from "./migrator";

import { runMigration } from "./migrator";

export const migrateQuotes: Migration = {
  name: "Quotes",
  run: async (ctx) => {
    return runMigration({
      sourceDatabase: "quote",
      sourceTable: "QData",
      targetTable: "quote",
      fieldMappings: [
        { from: "QYear", to: "year", transform: v => v?.toString() },
        { from: "QNum", to: "number", transform: v => v?.toString() },
        { from: "CoeRSM", to: "rsmId", transform: v => v?.toString() },
        { from: "C_Company", to: "customerId", transform: v => v?.toString() },
        { from: "C_Contact", to: "customerContactId", transform: v => v?.toString() },
        { from: "C_Address", to: "customerAddressId", transform: v => v?.toString() },
        { from: "D_Company", to: "dealerId", transform: v => v?.toString() },
        { from: "D_Contact", to: "dealerContactId", transform: v => v?.toString() },
        { from: "D_Address", to: "dealerAddressId", transform: v => v?.toString() },
        { from: "Priority", to: "priority" },
        { from: "Confidence", to: "confidence" },
      ],
      beforeSave: (data, original) => {
        const closed = original.Canceled === "1" || original.LostToComp === "1" || original.Shipped === "1";

        return {
          ...data,
          status: closed ? QuoteStatus.CLOSED : QuoteStatus.OPEN,
          createdAt: new Date(original.CreateDate || original.ModifyDate),
          updatedAt: new Date(original.ModifyDate || original.CreateDate),
          createdById: original.CreateInit?.toLowerCase() || "system",
          updatedById: original.ModifyInit?.toLowerCase() || "system",
        };
      },
    }, ctx);
  },
};

export const migrateQuoteRevisions: Migration = {
  name: "Quote Revisions",
  run: async (ctx) => {
    const result = await runMigration({
      sourceDatabase: "quote",
      sourceTable: "QRev",
      targetTable: "quoteRevision",
      fieldMappings: [
        { from: "QRev", to: "revision", transform: v => v?.toString().trim(), required: true },
        { from: "QDate", to: "quoteDate", transform: v => new Date(v), required: true },
      ],
      filter: r => r.QYear && r.QNum && r.QRev,
      beforeSave: async (data, original, ctx) => {
        const quote = await ctx.findRecord<{ id: string }>("quote", {
          year: original.QYear?.toString(),
          number: original.QNum?.toString(),
        });

        if (!quote)
          return null;

        return {
          ...data,
          _quoteId: quote.id,
          quoteId: quote.id,
          status: QuoteRevisionStatus.DRAFT,
          createdAt: new Date(original.CreateDate || original.ModifyDate || Date.now()),
          updatedAt: new Date(original.ModifyDate || original.CreateDate || Date.now()),
          createdById: original.CreateInit?.toLowerCase() || "system",
          updatedById: original.ModifyInit?.toLowerCase() || "system",
        };
      },
    }, ctx);

    // Update revision statuses (mark older ones as REVISED)
    if (result.created > 0) {
      await updateRevisionStatuses(ctx);
      await updateQuoteLatestRevisions(ctx);
    }

    return result;
  },
};

export const migrateQuoteItems: Migration = {
  name: "Quote Items",
  run: async (ctx) => {
    return runMigration({
      sourceDatabase: "quote",
      sourceTable: "QRev",
      targetTable: "quoteItem",
      fieldMappings: [
        { from: "Model", to: "model", transform: v => v?.toString().trim(), required: true },
        { from: "BasePrice", to: "unitPrice", transform: v => Number.parseFloat(v) || 0, required: true },
        { from: "Sfx", to: "lineNumber", transform: v => Number.parseInt(v) || 1, required: true },
      ],
      filter: r => r.QYear && r.QNum && r.QRev && r.Sfx && r.Model?.toString().trim(),
      beforeSave: async (data, original, ctx) => {
        const quote = await ctx.findRecord<{ id: string }>("quote", {
          year: original.QYear?.toString(),
          number: original.QNum?.toString(),
        });
        if (!quote)
          return null;

        const revision = await ctx.findRecord<{ id: string }>("quoteRevision", {
          quoteId: quote.id,
          revision: original.QRev?.toString().trim(),
        });
        if (!revision)
          return null;

        return {
          ...data,
          _revisionId: revision.id,
          _lineNumber: data.lineNumber,
          quoteRevisionId: revision.id,
          createdAt: new Date(original.CreateDate || original.ModifyDate || Date.now()),
          updatedAt: new Date(original.ModifyDate || original.CreateDate || Date.now()),
          createdById: original.CreateInit?.toLowerCase() || "system",
          updatedById: original.ModifyInit?.toLowerCase() || "system",
        };
      },
    }, ctx);
  },
};

// Helper functions
function compareRevisions(a: string, b: string): number {
  const aNum = /^\d+$/.test(a);
  const bNum = /^\d+$/.test(b);

  if (aNum && bNum)
    return Number.parseInt(a) - Number.parseInt(b);
  if (aNum !== bNum)
    return aNum ? -1 : 1;
  if (a.length !== b.length)
    return a.length - b.length;
  return a.localeCompare(b);
}

async function updateRevisionStatuses(ctx: { db: any }): Promise<void> {
  const quotes = await ctx.db.quote.findMany({ select: { id: true } });

  for (const quote of quotes) {
    const revisions = await ctx.db.quoteRevision.findMany({ where: { quoteId: quote.id } });
    if (revisions.length <= 1)
      continue;

    revisions.sort((a: any, b: any) => compareRevisions(b.revision, a.revision));

    for (let i = 1; i < revisions.length; i++) {
      await ctx.db.quoteRevision.update({
        where: { id: revisions[i].id },
        data: { status: QuoteRevisionStatus.REVISED },
      });
    }
  }
}

async function updateQuoteLatestRevisions(ctx: { db: any }): Promise<void> {
  const quotes = await ctx.db.quote.findMany({ select: { id: true } });

  for (const quote of quotes) {
    const revisions = await ctx.db.quoteRevision.findMany({
      where: { quoteId: quote.id },
      include: { items: true },
    });

    if (!revisions.length)
      continue;

    revisions.sort((a: any, b: any) => compareRevisions(b.revision, a.revision));
    const latest = revisions[0];

    const total = latest.items?.reduce(
      (sum: number, item: any) => sum + Number(item.unitPrice) * item.quantity,
      0,
    ) || 0;

    await ctx.db.quote.update({
      where: { id: quote.id },
      data: {
        latestRevision: latest.revision,
        latestRevisionStatus: latest.status,
        latestRevisionTotalAmount: total,
      },
    });
  }
}

export const quoteMigrations: Migration[] = [
  migrateQuotes,
  migrateQuoteRevisions,
  migrateQuoteItems,
];
