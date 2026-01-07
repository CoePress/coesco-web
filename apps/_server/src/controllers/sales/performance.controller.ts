import type { PerformanceSheet, PerformanceSheetLink, PerformanceSheetVersion } from "@prisma/client";
import type { Request, Response } from "express";

import { z } from "zod";

import { performanceService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const CreatePerformanceSheetVersionSchema = z.object({
  sections: z.any().optional(),
});

const UpdatePerformanceSheetVersionSchema = CreatePerformanceSheetVersionSchema.partial();

const CreatePerformanceSheetSchema = z.object({
  versionId: z.string().uuid("Invalid version ID"),
  name: z.string().optional(),
  data: z.any().optional(),
});

const UpdatePerformanceSheetSchema = CreatePerformanceSheetSchema.partial();

const CreatePerformanceSheetLinkSchema = z.object({
  performanceSheetId: z.string().uuid("Invalid performance sheet ID"),
  entityType: z.string().min(1, "Entity type is required"),
  entityId: z.string().min(1, "Entity ID is required"),
});

const UpdatePerformanceSheetLinkSchema = CreatePerformanceSheetLinkSchema.partial();

export class PerformanceController {
  // Performance Sheet Versions
  createPerformanceSheetVersion = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreatePerformanceSheetVersionSchema.parse(req.body);
    const result = await performanceService.createPerformanceSheetVersion(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getPerformanceSheetVersions = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<PerformanceSheetVersion>(req.query);
    const result = await performanceService.getAllPerformanceSheetVersions(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getPerformanceSheetVersion = asyncWrapper(async (req: Request, res: Response) => {
    const result = await performanceService.getPerformanceSheetVersionById(req.params.versionId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updatePerformanceSheetVersion = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdatePerformanceSheetVersionSchema.parse(req.body);
    const result = await performanceService.updatePerformanceSheetVersion(req.params.versionId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deletePerformanceSheetVersion = asyncWrapper(async (req: Request, res: Response) => {
    const result = await performanceService.deletePerformanceSheetVersion(req.params.versionId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  // Performance Sheets
  createPerformanceSheet = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreatePerformanceSheetSchema.parse(req.body);
    const result = await performanceService.createPerformanceSheet(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getPerformanceSheets = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<PerformanceSheet>(req.query);
    const result = await performanceService.getAllPerformanceSheets(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getPerformanceSheet = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<PerformanceSheet>(req.query);
    const result = await performanceService.getPerformanceSheetById(req.params.sheetId, params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updatePerformanceSheet = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdatePerformanceSheetSchema.parse(req.body);
    const result = await performanceService.updatePerformanceSheet(req.params.sheetId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deletePerformanceSheet = asyncWrapper(async (req: Request, res: Response) => {
    const result = await performanceService.deletePerformanceSheet(req.params.sheetId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  // Performance Sheet Links
  createPerformanceSheetLink = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreatePerformanceSheetLinkSchema.parse(req.body);
    const result = await performanceService.createPerformanceSheetLink(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getPerformanceSheetLinks = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<PerformanceSheetLink>(req.query);
    const result = await performanceService.getAllPerformanceSheetLinks(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getPerformanceSheetLink = asyncWrapper(async (req: Request, res: Response) => {
    const result = await performanceService.getPerformanceSheetLinkById(req.params.linkId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updatePerformanceSheetLink = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdatePerformanceSheetLinkSchema.parse(req.body);
    const result = await performanceService.updatePerformanceSheetLink(req.params.linkId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deletePerformanceSheetLink = asyncWrapper(async (req: Request, res: Response) => {
    const result = await performanceService.deletePerformanceSheetLink(req.params.linkId);
    res.status(HTTP_STATUS.OK).json(result);
  });
}
