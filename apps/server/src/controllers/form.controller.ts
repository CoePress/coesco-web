import type { Request, Response } from "express";

import { formFieldService, formPageService, formSectionService, formService, formSubmissionService } from "@/services/repository";
import { asyncWrapper } from "@/utils";

export class FormController {
  createForm = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formService.create(req.body);
    res.status(201).json(result);
  });

  getForms = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formService.getAll(req.query);
    res.status(200).json(result);
  });

  getForm = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formService.getById(req.params.formId, req.query);
    res.status(200).json(result);
  });

  updateForm = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formService.update(req.params.formId, req.body);
    res.status(200).json(result);
  });

  deleteForm = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formService.delete(req.params.formId);
    res.status(200).json(result);
  });

  createFormPage = asyncWrapper(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const result = await formPageService.create({ ...req.body, formId });
    res.status(201).json(result);
  });

  updateFormPage = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formPageService.update(req.params.pageId, req.body);
    res.status(200).json(result);
  });

  deleteFormPage = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formPageService.delete(req.params.pageId);
    res.status(200).json(result);
  });

  createFormSection = asyncWrapper(async (req: Request, res: Response) => {
    const { pageId } = req.params;
    const result = await formSectionService.create({ ...req.body, pageId });
    res.status(201).json(result);
  });

  updateFormSection = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSectionService.update(req.params.sectionId, req.body);
    res.status(200).json(result);
  });

  deleteFormSection = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSectionService.delete(req.params.sectionId);
    res.status(200).json(result);
  });

  createFormField = asyncWrapper(async (req: Request, res: Response) => {
    const { sectionId } = req.params;
    const result = await formFieldService.create({ ...req.body, sectionId });
    res.status(201).json(result);
  });

  updateFormField = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formFieldService.update(req.params.fieldId, req.body);
    res.status(200).json(result);
  });

  deleteFormField = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formFieldService.delete(req.params.fieldId);
    res.status(200).json(result);
  });

  // Form Submissions
  getFormSubmissions = asyncWrapper(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const query = {
      ...req.query,
      filter: JSON.stringify({ formId }),
    };
    const result = await formSubmissionService.getAll(query);
    res.status(200).json(result);
  });

  getFormSubmission = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSubmissionService.getById(req.params.submissionId, req.query);
    res.status(200).json(result);
  });

  createFormSubmission = asyncWrapper(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const result = await formSubmissionService.create({ ...req.body, formId });
    res.status(201).json(result);
  });

  updateFormSubmission = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSubmissionService.update(req.params.submissionId, req.body);
    res.status(200).json(result);
  });

  deleteFormSubmission = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSubmissionService.delete(req.params.submissionId);
    res.status(200).json(result);
  });
}
