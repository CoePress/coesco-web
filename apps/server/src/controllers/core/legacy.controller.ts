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

      if (req.query.filter && typeof req.query.filter === 'string') {
        try {
          params.filter = JSON.parse(req.query.filter);
        } catch {
          // keep it as a string for backwards compatibility
        }
      }

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
      const queryParams = { ...req.query };

      // Extract filters from query parameters
      // Support both single filter (filterField/filterValue) and multiple filters
      const filters: Record<string, string> = {};

      // Handle legacy single filter format
      if (queryParams.filterField && queryParams.filterValue) {
        filters[String(queryParams.filterField)] = String(queryParams.filterValue);
        delete queryParams.filterField;
        delete queryParams.filterValue;
      }

      // Handle multiple filters format (any query param that's not a standard param)
      const reservedParams = ["limit", "offset", "sort", "order", "fields"];
      Object.entries(queryParams).forEach(([key, value]) => {
        if (!reservedParams.includes(key) && value !== undefined) {
          filters[key] = String(value);
          delete queryParams[key];
        }
      });

      if (Object.keys(filters).length === 0) {
        return res.status(400).json({ error: "At least one filter parameter is required" });
      }

      const params = buildQueryParams<any>(queryParams);
      const result = await legacyService.getAllByCustomFilter(database, table, filters, params);
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

  async updateByCustomFilter(req: Request, res: Response, next: NextFunction) {
    try {
      const { database, table } = req.params;
      const updateData = req.body;
      const queryParams = { ...req.query };

      // Extract filters from query parameters
      const filters: Record<string, string> = {};

      // Handle legacy single filter format
      if (queryParams.filterField && queryParams.filterValue) {
        filters[String(queryParams.filterField)] = String(queryParams.filterValue);
        delete queryParams.filterField;
        delete queryParams.filterValue;
      }

      // Handle multiple filters format (any query param that's not a standard param)
      const reservedParams = ["limit", "offset", "sort", "order"];
      Object.entries(queryParams).forEach(([key, value]) => {
        if (!reservedParams.includes(key) && value !== undefined) {
          filters[key] = String(value);
          delete queryParams[key];
        }
      });

      if (Object.keys(filters).length === 0) {
        return res.status(400).json({ error: "At least one filter parameter is required" });
      }

      const result = await legacyService.updateByCustomFilter(database, table, filters, updateData);
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

  async deleteByCustomFilter(req: Request, res: Response, next: NextFunction) {
    try {
      const { database, table } = req.params;
      const queryParams = { ...req.query };

      // Extract filters from query parameters
      const filters: Record<string, string> = {};

      // Handle legacy single filter format
      if (queryParams.filterField && queryParams.filterValue) {
        filters[String(queryParams.filterField)] = String(queryParams.filterValue);
        delete queryParams.filterField;
        delete queryParams.filterValue;
      }

      // Handle multiple filters format (any query param that's not a standard param)
      const reservedParams = ["limit", "offset", "sort", "order"];
      Object.entries(queryParams).forEach(([key, value]) => {
        if (!reservedParams.includes(key) && value !== undefined) {
          filters[key] = String(value);
          delete queryParams[key];
        }
      });

      if (Object.keys(filters).length === 0) {
        return res.status(400).json({ error: "At least one filter parameter is required for deletion" });
      }

      const result = await legacyService.deleteByCustomFilter(database, table, filters);
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

  async getMaxValue(req: Request, res: Response, next: NextFunction) {
    try {
      const { database, table, field } = req.params;
      const result = await legacyService.getMaxValue(database, table, field);
      res.status(200).json({ maxValue: result });
    }
    catch (error) {
      next(error);
    }
  }
}
