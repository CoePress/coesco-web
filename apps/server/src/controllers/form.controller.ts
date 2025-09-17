import type { Request, Response } from "express";

import { formFieldService, formSectionService, formService } from "@/services/repository";
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
    await formService.delete(req.params.formId);
    res.status(204).send();
  });

  createFormSection = asyncWrapper(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const result = await formSectionService.create({ ...req.body, formId });
    res.status(201).json(result);
  });

  updateFormSection = asyncWrapper(async (req: Request, res: Response) => {
    const result = await formSectionService.update(req.params.sectionId, req.body);
    res.status(200).json(result);
  });

  deleteFormSection = asyncWrapper(async (req: Request, res: Response) => {
    await formSectionService.delete(req.params.sectionId);
    res.status(204).send();
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
    await formFieldService.delete(req.params.fieldId);
    res.status(204).send();
  });
}
