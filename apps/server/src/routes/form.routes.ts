import type { NextFunction, Request, Response } from "express";

import { Router } from "express";

import { errors } from "../lib/errors";
import { prisma } from "../lib/prisma";
import {
  CreateConditionalRuleSchema,
  CreateFormFieldSchema,
  CreateFormPageSchema,
  CreateFormSchema,
  CreateFormSectionSchema,
  CreateFormSubmissionSchema,
  FormIdSchema,
  ListQuerySchema,
  SubmissionIdSchema,
  UUIDSchema,
  UpdateConditionalRuleSchema,
  UpdateFormFieldSchema,
  UpdateFormPageSchema,
  UpdateFormSchema,
  UpdateFormSectionSchema,
  UpdateFormSubmissionSchema,
} from "../validators/form";

const formRouter = Router();

// ======================= FORMS =======================

// LIST FORMS
formRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ListQuerySchema.parse(req.query);
    const { page, limit, sort, order, filter, include } = query;

    const skip = (page - 1) * limit;
    const orderBy = sort ? { [sort]: order } : { createdAt: "desc" as const };

    let where = {};
    if (filter) {
      try {
        where = JSON.parse(filter);
      } catch {
        // ignore invalid filter
      }
    }

    let includeRelations = {};
    if (include) {
      try {
        const includeArr = JSON.parse(include) as string[];
        includeRelations = buildInclude(includeArr);
      } catch {
        // ignore invalid include
      }
    }

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: Object.keys(includeRelations).length > 0 ? includeRelations : undefined,
      }),
      prisma.form.count({ where }),
    ]);

    res.json({
      success: true,
      data: forms,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET FORM
formRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);
    const query = ListQuerySchema.parse(req.query);

    let includeRelations = {};
    if (query.include) {
      try {
        const includeArr = JSON.parse(query.include) as string[];
        includeRelations = buildInclude(includeArr);
      } catch {
        // ignore invalid include
      }
    }

    const form = await prisma.form.findUnique({
      where: { id },
      include: Object.keys(includeRelations).length > 0 ? includeRelations : undefined,
    });

    if (!form) {
      throw errors.notFound("Form not found");
    }

    res.json({ success: true, data: form });
  } catch (err) {
    next(err);
  }
});

// CREATE FORM
formRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = CreateFormSchema.parse(req.body);

    const form = await prisma.form.create({
      data: {
        name: input.name,
        description: input.description,
        status: input.status || "DRAFT",
        createdById: "system",
        updatedById: "system",
      },
    });

    res.status(201).json({ success: true, data: form });
  } catch (err) {
    next(err);
  }
});

// UPDATE FORM
formRouter.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);
    const patch = UpdateFormSchema.parse(req.body);

    const form = await prisma.form.update({
      where: { id },
      data: {
        ...patch,
        updatedById: "system",
      },
    });

    res.json({ success: true, data: form });
  } catch (err) {
    next(err);
  }
});

// DELETE FORM
formRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);

    await prisma.form.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ======================= FORM PAGES =======================

// LIST PAGES
formRouter.get("/:id/pages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);

    const pages = await prisma.formPage.findMany({
      where: { formId: id },
      orderBy: { sequence: "asc" },
      include: {
        sections: {
          orderBy: { sequence: "asc" },
          include: {
            fields: {
              orderBy: { sequence: "asc" },
            },
          },
        },
      },
    });

    res.json({ success: true, data: pages });
  } catch (err) {
    next(err);
  }
});

// CREATE PAGE
formRouter.post("/:id/pages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);
    const input = CreateFormPageSchema.parse(req.body);

    const page = await prisma.formPage.create({
      data: {
        formId: id,
        title: input.title,
        sequence: input.sequence,
        createdById: "system",
        updatedById: "system",
      },
    });

    res.status(201).json({ success: true, data: page });
  } catch (err) {
    next(err);
  }
});

// UPDATE PAGE
formRouter.patch("/:id/pages/:pageId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pageId } = req.params;
    const patch = UpdateFormPageSchema.parse(req.body);

    const page = await prisma.formPage.update({
      where: { id: pageId },
      data: {
        ...patch,
        updatedById: "system",
      },
    });

    res.json({ success: true, data: page });
  } catch (err) {
    next(err);
  }
});

// DELETE PAGE
formRouter.delete("/:id/pages/:pageId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pageId } = req.params;

    await prisma.formPage.delete({
      where: { id: pageId },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ======================= FORM SECTIONS =======================

// CREATE SECTION (nested under page)
formRouter.post("/:id/pages/:pageId/sections", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pageId } = req.params;
    const input = CreateFormSectionSchema.omit({ pageId: true }).parse(req.body);

    const section = await prisma.formSection.create({
      data: {
        pageId,
        title: input.title,
        description: input.description,
        sequence: input.sequence,
        createdById: "system",
        updatedById: "system",
      },
    });

    res.status(201).json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
});

// UPDATE SECTION
formRouter.patch("/:id/pages/:pageId/sections/:sectionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;
    const patch = UpdateFormSectionSchema.parse(req.body);

    const section = await prisma.formSection.update({
      where: { id: sectionId },
      data: {
        ...patch,
        updatedById: "system",
      },
    });

    res.json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
});

// DELETE SECTION
formRouter.delete("/:id/pages/:pageId/sections/:sectionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;

    await prisma.formSection.delete({
      where: { id: sectionId },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ======================= FORM FIELDS =======================

// CREATE FIELD (nested under section)
formRouter.post("/:id/pages/:pageId/sections/:sectionId/fields", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;
    const input = CreateFormFieldSchema.omit({ sectionId: true }).parse(req.body);

    const field = await prisma.formField.create({
      data: {
        sectionId,
        label: input.label,
        variable: input.variable,
        controlType: input.controlType,
        dataType: input.dataType,
        options: input.options || {},
        isRequired: input.isRequired || false,
        isReadOnly: input.isReadOnly || false,
        isHiddenOnDevice: input.isHiddenOnDevice || false,
        isHiddenOnReport: input.isHiddenOnReport || false,
        sequence: input.sequence,
        createdById: "system",
        updatedById: "system",
      },
    });

    res.status(201).json({ success: true, data: field });
  } catch (err) {
    next(err);
  }
});

// UPDATE FIELD
formRouter.patch("/:id/pages/:pageId/sections/:sectionId/fields/:fieldId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fieldId } = req.params;
    const patch = UpdateFormFieldSchema.parse(req.body);

    const field = await prisma.formField.update({
      where: { id: fieldId },
      data: {
        ...patch,
        updatedById: "system",
      },
    });

    res.json({ success: true, data: field });
  } catch (err) {
    next(err);
  }
});

// DELETE FIELD
formRouter.delete("/:id/pages/:pageId/sections/:sectionId/fields/:fieldId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fieldId } = req.params;

    await prisma.formField.delete({
      where: { id: fieldId },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ======================= FORM SUBMISSIONS =======================

// LIST SUBMISSIONS
formRouter.get("/:id/submissions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);
    const query = ListQuerySchema.parse(req.query);
    const { page, limit, sort, order, filter, include } = query;

    const skip = (page - 1) * limit;
    const orderBy = sort ? { [sort]: order } : { createdAt: "desc" as const };

    let where: any = { formId: id, deletedAt: null };
    if (filter) {
      try {
        const filterObj = JSON.parse(filter);
        where = { ...where, ...filterObj };
      } catch {
        // ignore invalid filter
      }
    }

    let includeRelations: any = {};
    if (include) {
      try {
        const includeArr = JSON.parse(include) as string[];
        if (includeArr.includes("form")) {
          includeRelations.form = true;
        }
      } catch {
        // ignore invalid include
      }
    }

    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: Object.keys(includeRelations).length > 0 ? includeRelations : undefined,
      }),
      prisma.formSubmission.count({ where }),
    ]);

    res.json({
      success: true,
      data: submissions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET SUBMISSION
formRouter.get("/:formId/submissions/:submissionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId, submissionId } = SubmissionIdSchema.parse(req.params);
    const query = ListQuerySchema.parse(req.query);

    let includeRelations: any = {};
    if (query.include) {
      try {
        const includeArr = JSON.parse(query.include) as string[];
        includeRelations = buildInclude(includeArr, "submission");
      } catch {
        // ignore invalid include
      }
    }

    const submission = await prisma.formSubmission.findFirst({
      where: { id: submissionId, formId, deletedAt: null },
      include: Object.keys(includeRelations).length > 0 ? includeRelations : undefined,
    });

    if (!submission) {
      throw errors.notFound("Submission not found");
    }

    res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
});

// CREATE SUBMISSION
formRouter.post("/:id/submissions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);
    const input = CreateFormSubmissionSchema.parse(req.body);

    const submission = await prisma.formSubmission.create({
      data: {
        formId: id,
        status: input.status || "DRAFT",
        answers: input.answers || {},
        createdById: "system",
        updatedById: "system",
      },
    });

    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
});

// UPDATE SUBMISSION
formRouter.patch("/:formId/submissions/:submissionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { submissionId } = SubmissionIdSchema.parse(req.params);
    const patch = UpdateFormSubmissionSchema.parse(req.body);

    const submission = await prisma.formSubmission.update({
      where: { id: submissionId },
      data: {
        ...patch,
        updatedById: "system",
      },
    });

    res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
});

// DELETE SUBMISSION (soft delete)
formRouter.delete("/:formId/submissions/:submissionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { submissionId } = SubmissionIdSchema.parse(req.params);

    await prisma.formSubmission.update({
      where: { id: submissionId },
      data: {
        deletedAt: new Date(),
        updatedById: "system",
      },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ======================= CONDITIONAL RULES =======================

// LIST CONDITIONAL RULES
formRouter.get("/:id/conditional-rules", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);

    const rules = await prisma.formConditionalRule.findMany({
      where: { formId: id },
      orderBy: { priority: "asc" },
    });

    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});

// CREATE CONDITIONAL RULE
formRouter.post("/:id/conditional-rules", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);
    const input = CreateConditionalRuleSchema.parse(req.body);

    const rule = await prisma.formConditionalRule.create({
      data: {
        formId: id,
        name: input.name,
        targetType: input.targetType,
        targetId: input.targetId,
        action: input.action,
        conditions: input.conditions,
        operator: input.operator || "AND",
        priority: input.priority || 0,
        isActive: input.isActive ?? true,
        createdById: "system",
        updatedById: "system",
      },
    });

    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
});

// UPDATE CONDITIONAL RULE
formRouter.patch("/:id/conditional-rules/:ruleId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ruleId } = req.params;
    const patch = UpdateConditionalRuleSchema.parse(req.body);

    const rule = await prisma.formConditionalRule.update({
      where: { id: ruleId },
      data: {
        ...patch,
        updatedById: "system",
      },
    });

    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
});

// DELETE CONDITIONAL RULE
formRouter.delete("/:id/conditional-rules/:ruleId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ruleId } = req.params;

    await prisma.formConditionalRule.delete({
      where: { id: ruleId },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ======================= HELPERS =======================

function buildInclude(paths: string[], context: string = "form"): any {
  const result: any = {};

  for (const path of paths) {
    const parts = path.split(".");
    let current = result;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i === parts.length - 1) {
        current[part] = {
          orderBy: getOrderBy(part),
        };
      } else {
        if (!current[part]) {
          current[part] = {
            include: {},
            orderBy: getOrderBy(part),
          };
        }
        current = current[part].include;
      }
    }
  }

  return result;
}

function getOrderBy(field: string): any {
  switch (field) {
    case "pages":
    case "sections":
    case "fields":
      return { sequence: "asc" };
    default:
      return undefined;
  }
}

export default formRouter;
