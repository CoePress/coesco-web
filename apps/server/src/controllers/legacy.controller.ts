import type { NextFunction, Request, Response } from "express";

import { legacyService } from "@/services";
import { buildQueryParams } from "@/utils";

export class LegacyController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { database, table } = req.params;
      const result = await legacyService.create(database, table, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { database, table } = req.params;
      const params = buildQueryParams<any>(req.query);
      const result = await legacyService.getAll(database, table, params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { database, table, id } = req.params;

      const fieldsParam = req.query.fields as string | undefined;
      const fields = fieldsParam ? fieldsParam.split(",") : null;

      const result = await legacyService.getById(database, table, id, fields);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getAllByCustomFilter(req: Request, res: Response, next: NextFunction) {
    try {
      const { database, table } = req.params;
      const { filterField, filterValue } = req.query;

      if (!filterField || !filterValue) {
        return res.status(400).json({ error: "filterField and filterValue query parameters are required" });
      }

      const params = buildQueryParams<any>(req.query);
      const result = await legacyService.getAllByCustomFilter(database, table, String(filterField), String(filterValue), params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { database, table, id } = req.params;
      const result = await legacyService.update(database, table, id, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { database, table, id } = req.params;
      const result = await legacyService.delete(database, table, id);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getTables(req: Request, res: Response, next: NextFunction) {
    try {
      const { database } = req.params;
      const result = await legacyService.getTables(database as "job" | "quote" | "std");
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getFields(req: Request, res: Response, next: NextFunction) {
    try {
      const { database, table } = req.params;
      const result = await legacyService.getFields(database, table);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
