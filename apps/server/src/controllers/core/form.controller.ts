import type { Request, Response } from "express";

import { formConditionalRuleRepository, formFieldRepository, formPageRepository, formSectionRepository, formRepository, formSubmissionRepository } from "@/repositories";
import { asyncWrapper } from "@/utils";

export class FormController {
  createForm = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formRepository.create(req.body);
    res.status(201).json(result);
  });

  getForms = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formRepository.getAll(req.query);
    res.status(200).json(result);
  });

  getForm = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formRepository.getById(req.params.formId, req.query);
    res.status(200).json(result);
  });

  updateForm = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formRepository.update(req.params.formId, req.body);
    res.status(200).json(result);
  });

  deleteForm = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formRepository.delete(req.params.formId);
    res.status(200).json(result);
  });

  createFormPage = asyncWrapper(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const result = await formPageRepository.create({ ...req.body, formId });
    res.status(201).json(result);
  });

  updateFormPage = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formPageRepository.update(req.params.pageId, req.body);
    res.status(200).json(result);
  });

  deleteFormPage = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formPageRepository.delete(req.params.pageId);
    res.status(200).json(result);
  });

  createFormSection = asyncWrapper(async (req: Request, res: Response) => {
    const { pageId } = req.params;
    const result = await formSectionRepository.create({ ...req.body, pageId });
    res.status(201).json(result);
  });

  updateFormSection = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSectionRepository.update(req.params.sectionId, req.body);
    res.status(200).json(result);
  });

  deleteFormSection = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSectionRepository.delete(req.params.sectionId);
    res.status(200).json(result);
  });

  createFormField = asyncWrapper(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    const result = await formFieldRepository.create({ ...req.body, sectionId });
    res.status(201).json(result);
  });

  updateFormField = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formFieldRepository.update(req.params.fieldId, req.body);
    res.status(200).json(result);
  });

  deleteFormField = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formFieldRepository.delete(req.params.fieldId);
    res.status(200).json(result);
  });

  // Form Submissions
  getFormSubmissions = asyncWrapper(async (req: Request, res: Response) => {
    const { formId } = req.params;

    const existingFilter = req.query.filter
      ? JSON.parse(req.query.filter as string)
      : {};

    const query = {
      ...req.query,
      filter: JSON.stringify({ ...existingFilter, formId }),
    };
    const result = await formSubmissionRepository.getAll(query);
    res.status(200).json(result);
  });

  getFormSubmission = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSubmissionRepository.getById(req.params.submissionId, req.query);
    res.status(200).json(result);
  });

  createFormSubmission = asyncWrapper(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const result = await formSubmissionRepository.create({ ...req.body, formId });
    const submission = result.data;

    // Process file uploads in answers
    if (submission.answers && typeof submission.answers === "object") {
      const answers = submission.answers as Record<string, any>;
      const updatedAnswers = { ...answers };
      let hasFileChanges = false;

      for (const [key, value] of Object.entries(answers)) {
        // Handle camera uploads (array of file references)
        // if (Array.isArray(value) && value.length > 0 && value[0]?.filename) {
        //   const { fileStorageRepository } = await import("@/repositories");

        //   // Convert temp file references to StoredFile format with actual paths
        //   const tempFiles = value.map((file: any) => ({
        //     id: file.id || "",
        //     originalName: file.originalName || file.filename,
        //     filename: file.filename,
        //     path: `uploads/forms/${submission.formId}/temp/images/${file.filename}`,
        //     mimetype: file.mimetype || "image/jpeg",
        //     size: file.size || 0,
        //     hash: "",
        //     uploadedAt: new Date(),
        //   }));

        //   const permanentFiles = await fileStorageRepository.moveTempToPermanent(
        //     submission.formId,
        //     submission.id,
        //     tempFiles,
        //   );

        //   // Update URLs to point to permanent location
        //   updatedAnswers[key] = permanentFiles.map((file: any) => ({
        //     id: file.id,
        //     originalName: file.originalName,
        //     filename: file.filename,
        //     url: fileStorageRepository.generateFileUrl(submission.formId, submission.id, file.filename),
        //     mimetype: file.mimetype,
        //     size: file.size,
        //   }));
        //   hasFileChanges = true;
        // }

        // Handle sketch pad (single file URL)
        // if (typeof value === "string" && value.includes("/temp/")) {
        //   const { fileStorageRepository } = await import("@/Repositorys");

        //   // Extract filename from temp URL
        //   const urlParts = value.split("/");
        //   const filename = urlParts[urlParts.length - 1];
        //   const category = urlParts.includes("sketches") ? "sketches" : "images";

        //   const tempFile = {
        //     id: "",
        //     originalName: filename,
        //     filename,
        //     path: `uploads/forms/${submission.formId}/temp/${category}/${filename}`,
        //     mimetype: "image/png",
        //     size: 0,
        //     hash: "",
        //     uploadedAt: new Date(),
        //   };

        //   await fileStorageRepository.moveTempToPermanent(
        //     submission.formId,
        //     submission.id,
        //     [tempFile],
        //   );

        //   // Update URL to point to permanent location
        //   updatedAnswers[key] = fileStorageRepository.generateFileUrl(
        //     submission.formId,
        //     submission.id,
        //     filename,
        //   );
        //   hasFileChanges = true;
        // }
      }

      // Update submission with new URLs if there were file changes
      if (hasFileChanges) {
        const updated = await formSubmissionRepository.update(submission.id, { answers: updatedAnswers });
        return res.status(201).json(updated);
      }
    }

    res.status(201).json(result);
  });

  updateFormSubmission = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSubmissionRepository.update(req.params.submissionId, req.body);
    res.status(200).json(result);
  });

  deleteFormSubmission = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSubmissionRepository.delete(req.params.submissionId);
    res.status(200).json(result);
  });

  // Form Conditional Rules
  getFormConditionalRules = asyncWrapper(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const query = {
      ...req.query,
      filter: JSON.stringify({ formId }),
    };
    const result = await formConditionalRuleRepository.getAll(query);
    res.status(200).json(result);
  });

  getFormConditionalRule = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formConditionalRuleRepository.getById(req.params.ruleId, req.query);
    res.status(200).json(result);
  });

  createFormConditionalRule = asyncWrapper(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const result = await formConditionalRuleRepository.create({ ...req.body, formId });
    res.status(201).json(result);
  });

  updateFormConditionalRule = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formConditionalRuleRepository.update(req.params.ruleId, req.body);
    res.status(200).json(result);
  });

  deleteFormConditionalRule = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formConditionalRuleRepository.delete(req.params.ruleId);
    res.status(200).json(result);
  });
}
