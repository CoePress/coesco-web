import { Router } from "express";

import { formController } from "@/controllers";

const router = Router();

// Forms
router.post("/", formController.createForm);
router.get("/", formController.getForms);
router.get("/:formId", formController.getForm);
router.patch("/:formId", formController.updateForm);
router.delete("/:formId", formController.deleteForm);

// Pages
router.post("/:formId/pages", formController.createFormPage);
router.patch("/:formId/pages/:pageId", formController.updateFormPage);
router.delete("/:formId/pages/:pageId", formController.deleteFormPage);

// Sections
router.post("/:formId/pages/:pageId/sections", formController.createFormSection);
router.patch("/:formId/pages/:pageId/sections/:sectionId", formController.updateFormSection);
router.delete("/:formId/pages/:pageId/sections/:sectionId", formController.deleteFormSection);

// Fields
router.post("/:formId/pages/:pageId/sections/:sectionId/fields", formController.createFormField);
router.patch("/:formId/pages/:pageId/sections/:sectionId/fields/:fieldId", formController.updateFormField);
router.delete("/:formId/pages/:pageId/sections/:sectionId/fields/:fieldId", formController.deleteFormField);

// Submission
router.post("/:formId/submissions", formController.createForm);
router.patch("/:formId/submissions/:submissionId", formController.updateForm);

export default router;
