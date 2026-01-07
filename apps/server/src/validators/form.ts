import { z } from "zod";

export const UUIDSchema = z.object({
  id: z.string().uuid(),
});

export const FormIdSchema = z.object({
  formId: z.string().uuid(),
});

export const SubmissionIdSchema = z.object({
  formId: z.string().uuid(),
  submissionId: z.string().uuid(),
});

export const CreateFormSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const UpdateFormSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const CreateFormPageSchema = z.object({
  title: z.string().min(1).max(255),
  sequence: z.number().int().min(0),
});

export const UpdateFormPageSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  sequence: z.number().int().min(0).optional(),
});

export const CreateFormSectionSchema = z.object({
  pageId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  sequence: z.number().int().min(0),
});

export const UpdateFormSectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  sequence: z.number().int().min(0).optional(),
});

export const CreateFormFieldSchema = z.object({
  sectionId: z.string().uuid(),
  label: z.string().min(1).max(255),
  variable: z.string().min(1).max(255),
  controlType: z.enum([
    "INPUT",
    "TEXT_AREA",
    "TEXTBOX",
    "DROPDOWN",
    "RADIO_BUTTON",
    "MULTI_SELECT",
    "BUTTON_GROUP",
    "GEO_LOCATION",
    "DATE_SELECTOR",
    "TIME_SELECTOR",
    "STAMP",
    "SKETCH_PAD",
    "CAMERA",
    "SIGNATURE_PAD",
  ]),
  dataType: z.enum([
    "TEXT",
    "EMAIL",
    "EMAIL_ADDRESS",
    "URL",
    "PHONE_NUMBER",
    "INTEGER",
    "DECIMAL",
    "CURRENCY",
    "GEO_LOCATION",
    "DATE",
    "TIME",
    "DATE_TIME",
    "IMAGE",
    "SIGNATURE",
  ]),
  options: z.any().optional(),
  isRequired: z.boolean().optional(),
  isReadOnly: z.boolean().optional(),
  isHiddenOnDevice: z.boolean().optional(),
  isHiddenOnReport: z.boolean().optional(),
  sequence: z.number().int().min(0),
});

export const UpdateFormFieldSchema = z.object({
  label: z.string().min(1).max(255).optional(),
  variable: z.string().min(1).max(255).optional(),
  controlType: z
    .enum([
      "INPUT",
      "TEXT_AREA",
      "TEXTBOX",
      "DROPDOWN",
      "RADIO_BUTTON",
      "MULTI_SELECT",
      "BUTTON_GROUP",
      "GEO_LOCATION",
      "DATE_SELECTOR",
      "TIME_SELECTOR",
      "STAMP",
      "SKETCH_PAD",
      "CAMERA",
      "SIGNATURE_PAD",
    ])
    .optional(),
  dataType: z
    .enum([
      "TEXT",
      "EMAIL",
      "EMAIL_ADDRESS",
      "URL",
      "PHONE_NUMBER",
      "INTEGER",
      "DECIMAL",
      "CURRENCY",
      "GEO_LOCATION",
      "DATE",
      "TIME",
      "DATE_TIME",
      "IMAGE",
      "SIGNATURE",
    ])
    .optional(),
  options: z.any().optional(),
  isRequired: z.boolean().optional(),
  isReadOnly: z.boolean().optional(),
  isHiddenOnDevice: z.boolean().optional(),
  isHiddenOnReport: z.boolean().optional(),
  sequence: z.number().int().min(0).optional(),
});

export const CreateFormSubmissionSchema = z.object({
  formId: z.string().uuid(),
  status: z.enum(["DRAFT", "SUBMITTED", "ARCHIVED"]).optional(),
  answers: z.record(z.any()).optional(),
});

export const UpdateFormSubmissionSchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED", "ARCHIVED"]).optional(),
  answers: z.record(z.any()).optional(),
});

export const CreateConditionalRuleSchema = z.object({
  name: z.string().optional(),
  targetType: z.enum(["PAGE", "SECTION", "FIELD"]),
  targetId: z.string().uuid(),
  action: z.enum(["SHOW", "HIDE", "ENABLE", "DISABLE", "REQUIRE", "OPTIONAL"]),
  conditions: z.any(),
  operator: z.enum(["AND", "OR"]).optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateConditionalRuleSchema = z.object({
  name: z.string().optional(),
  targetType: z.enum(["PAGE", "SECTION", "FIELD"]).optional(),
  targetId: z.string().uuid().optional(),
  action: z.enum(["SHOW", "HIDE", "ENABLE", "DISABLE", "REQUIRE", "OPTIONAL"]).optional(),
  conditions: z.any().optional(),
  operator: z.enum(["AND", "OR"]).optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  filter: z.string().optional(),
  include: z.string().optional(),
});
