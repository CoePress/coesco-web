import { Router } from "express";

import { formController } from "@/controllers";

const router = Router();

// Forms
router.post("/", formController.createForm);
router.get("/", formController.getForms);
router.get("/:formId", formController.getForm);
router.patch("/:formId", formController.updateForm);
router.delete("/:formId", formController.deleteForm);

// Sections
router.post("/:formId/sections", formController.createFormSection);
router.patch("/:formId/sections/:sectionId", formController.updateFormSection);
router.delete("/:formId/sections/:sectionId", formController.deleteFormSection);

// Fields
router.post("/:formId/sections/:sectionId/fields", formController.createFormField);
router.patch("/:formId/sections/:sectionId/fields/:fieldId", formController.updateFormField);
router.delete("/:formId/sections/:sectionId/fields/:fieldId", formController.deleteFormField);

// Submission
router.post("/:formId/submissions", formController.createForm);
router.patch("/:formId/submissions/:submissionId", formController.updateForm);

export default router;
