import {
  performanceSheetLinkService,
  performanceSheetService,
  performanceSheetVersionService,
} from "@/services/repository";
import { NextFunction, Request, Response } from "express";
import { spawn, spawnSync } from "child_process";
import { IQueryParams } from "@/types/api.types";
import { PerformanceSheetLink } from "@prisma/client";

export class PerformanceController {
  // Performance Sheets
  async getPerformanceSheets(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceSheetService.getAll({});

      const sheetsWithoutData =
        result.data?.map((sheet: any) => {
          const { data, ...metadata } = sheet;
          return metadata;
        }) || [];

      res.status(200).json({
        ...result,
        data: sheetsWithoutData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await performanceSheetService.getById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createPerformanceSheet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let versionId = req.body.versionId;

      if (!versionId) {
        const allVersions = await performanceSheetVersionService.getAll();
        const latestVersion = allVersions.data?.[0];

        if (!latestVersion) {
          return res
            .status(400)
            .json({ message: "No available performance sheet version." });
        }

        versionId = latestVersion.id;
      }

      const versionResult =
        await performanceSheetVersionService.getById(versionId);

      if (!versionResult.success || !versionResult.data) {
        return res
          .status(404)
          .json({ message: "Performance sheet version not found." });
      }

      const sections = versionResult.data.sections as any[];

      if (!Array.isArray(sections)) {
        return res
          .status(400)
          .json({ message: "Invalid version data format." });
      }

      const data = sections.reduce(
        (acc: Record<string, Record<string, null>>, section: any) => {
          acc[section.name] = (section.fields as any[]).reduce(
            (fieldAcc: Record<string, null>, field: any) => {
              fieldAcc[field.key] = null;
              return fieldAcc;
            },
            {}
          );
          return acc;
        },
        {}
      );

      const result = await performanceSheetService.create({
        ...req.body,
        versionId,
        data,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheet(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const result = await performanceSheetService.update(id, req.body);
      const updatedData = JSON.stringify(result.data);

      const pyResult = spawnSync(
        "python",
        ["src/scripts/performance-sheet.py"],
        {
          input: updatedData,
          encoding: "utf-8",
        }
      );

      if (pyResult.error) throw pyResult.error;
      if (pyResult.status !== 0)
        throw new Error(pyResult.stderr || "Script error");

      const parsed = JSON.parse(pyResult.stdout);

      res.status(200).json({
        ...result,
        parsed,
      });
    } catch (err) {
      next(err);
    }
  }

  async deletePerformanceSheet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetService.delete(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Performance Sheet Versions
  async getPerformanceSheetVersions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await performanceSheetVersionService.getAll({});

      const versionsWithoutSections = result.data?.map((version: any) => {
        const { sections, ...metadata } = version;
        return metadata;
      });

      res.status(200).json({
        ...result,
        data: versionsWithoutSections,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceSheetVersion(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetVersionService.getById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createPerformanceSheetVersion(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await performanceSheetVersionService.create(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheetVersion(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetVersionService.update(id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deletePerformanceSheetVersion(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetVersionService.delete(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Performance Sheet Links
  async getPerformanceSheetLinks(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;

      const params: IQueryParams<PerformanceSheetLink> = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<PerformanceSheetLink>,
        include: include ? JSON.parse(include as string) : undefined,
      };

      const result = await performanceSheetLinkService.getAll(params);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceSheetLink(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetLinkService.getById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createPerformanceSheetLink(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await performanceSheetLinkService.create(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePerformanceSheetLink(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetLinkService.update(id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deletePerformanceSheetLink(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await performanceSheetLinkService.delete(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
