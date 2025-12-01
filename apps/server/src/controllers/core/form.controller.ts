import type { Request, Response } from "express";

import { formConditionalRuleRepository, formFieldRepository, formPageRepository, formRepository, formSectionRepository, formSubmissionRepository } from "@/repositories";
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

    if (result.data) {
      const { employeeRepository } = await import("@/repositories");

      if (result.data.createdById && result.data.createdById !== "system") {
        const employee = await employeeRepository.getById(result.data.createdById);
        if (employee.data) {
          result.data.createdByName = `${employee.data.firstName} ${employee.data.lastName}`;
        }
      }

      if (result.data.updatedById && result.data.updatedById !== "system") {
        const employee = await employeeRepository.getById(result.data.updatedById);
        if (employee.data) {
          result.data.updatedByName = `${employee.data.firstName} ${employee.data.lastName}`;
        }
      }
    }

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

    if (result.data && Array.isArray(result.data)) {
      const { employeeRepository } = await import("@/repositories");

      for (const submission of result.data) {
        if (submission.createdById && submission.createdById !== "system") {
          const employee = await employeeRepository.getById(submission.createdById);
          if (employee.data) {
            submission.createdByName = `${employee.data.firstName} ${employee.data.lastName}`;
          }
        }

        if (submission.updatedById && submission.updatedById !== "system") {
          const employee = await employeeRepository.getById(submission.updatedById);
          if (employee.data) {
            submission.updatedByName = `${employee.data.firstName} ${employee.data.lastName}`;
          }
        }
      }
    }

    res.status(200).json(result);
  });

  getFormSubmission = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSubmissionRepository.getById(req.params.submissionId, req.query);
    res.status(200).json(result);
  });

  createFormSubmission = asyncWrapper(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const result = await formSubmissionRepository.create({ ...req.body, formId });
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
