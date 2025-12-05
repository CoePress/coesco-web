import type { Request, Response } from "express";

import { legacyService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

export class LegacyController {
  create = asyncWrapper(async (req: Request, res: Response) => {
    const { database, table } = req.params;
    const result = await legacyService.create(database, table, req.body);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getAll = asyncWrapper(async (req: Request, res: Response) => {
    const { database, table } = req.params;
    const params = buildQueryParams<any>(req.query);

    if (req.query.filter && typeof req.query.filter === "string") {
      try {
        params.filter = JSON.parse(req.query.filter);
      }
      catch {
        // keep it as a string for backwards compatibility
      }
    }

    const result = await legacyService.getAll(database, table, params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getById = asyncWrapper(async (req: Request, res: Response) => {
    const { database, table, id } = req.params;

    const fieldsParam = req.query.fields as string | undefined;
    const fields = fieldsParam ? fieldsParam.split(",") : null;

    const result = await legacyService.getById(database, table, id, fields);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getAllByCustomFilter = asyncWrapper(async (req: Request, res: Response) => {
    const { database, table } = req.params;
    const queryParams = { ...req.query };

    const filters: Record<string, string> = {};

    if (queryParams.filterField && queryParams.filterValue) {
      filters[String(queryParams.filterField)] = String(queryParams.filterValue);
      delete queryParams.filterField;
      delete queryParams.filterValue;
    }

    const reservedParams = ["limit", "offset", "sort", "order", "fields"];
    Object.entries(queryParams).forEach(([key, value]) => {
      if (!reservedParams.includes(key) && value !== undefined) {
        filters[key] = String(value);
        delete queryParams[key];
      }
    });

    if (Object.keys(filters).length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "At least one filter parameter is required" });
    }

    const params = buildQueryParams<any>(queryParams);
    const result = await legacyService.getAllByCustomFilter(database, table, filters, params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  update = asyncWrapper(async (req: Request, res: Response) => {
    const { database, table, id } = req.params;
    const result = await legacyService.update(database, table, id, req.body);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateByCustomFilter = asyncWrapper(async (req: Request, res: Response) => {
    const { database, table } = req.params;
    const updateData = req.body;
    const queryParams = { ...req.query };

    const filters: Record<string, string> = {};

    if (queryParams.filterField && queryParams.filterValue) {
      filters[String(queryParams.filterField)] = String(queryParams.filterValue);
      delete queryParams.filterField;
      delete queryParams.filterValue;
    }

    const reservedParams = ["limit", "offset", "sort", "order"];
    Object.entries(queryParams).forEach(([key, value]) => {
      if (!reservedParams.includes(key) && value !== undefined) {
        filters[key] = String(value);
        delete queryParams[key];
      }
    });

    if (Object.keys(filters).length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "At least one filter parameter is required" });
    }

    const result = await legacyService.updateByCustomFilter(database, table, filters, updateData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  delete = asyncWrapper(async (req: Request, res: Response) => {
    const { database, table, id } = req.params;
    const result = await legacyService.delete(database, table, id);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteByCustomFilter = asyncWrapper(async (req: Request, res: Response) => {
    const { database, table } = req.params;
    const queryParams = { ...req.query };

    const filters: Record<string, string> = {};

    if (queryParams.filterField && queryParams.filterValue) {
      filters[String(queryParams.filterField)] = String(queryParams.filterValue);
      delete queryParams.filterField;
      delete queryParams.filterValue;
    }

    const reservedParams = ["limit", "offset", "sort", "order"];
    Object.entries(queryParams).forEach(([key, value]) => {
      if (!reservedParams.includes(key) && value !== undefined) {
        filters[key] = String(value);
        delete queryParams[key];
      }
    });

    if (Object.keys(filters).length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "At least one filter parameter is required for deletion" });
    }

    const result = await legacyService.deleteByCustomFilter(database, table, filters);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getTables = asyncWrapper(async (req: Request, res: Response) => {
    const { database } = req.params;
    const result = await legacyService.getTables(database as "job" | "quote" | "std");
    res.status(HTTP_STATUS.OK).json(result);
  });

  getFields = asyncWrapper(async (req: Request, res: Response) => {
    const { database, table } = req.params;
    const result = await legacyService.getFields(database, table);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getMaxValue = asyncWrapper(async (req: Request, res: Response) => {
    const { database, table, field } = req.params;
    const result = await legacyService.getMaxValue(database, table, field);
    res.status(HTTP_STATUS.OK).json({ maxValue: result });
  });

  getQuoteValue = asyncWrapper(async (req: Request, res: Response) => {
    const { quoteKeyValue } = req.query;
    if (!quoteKeyValue || typeof quoteKeyValue !== "string") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "Quote key value is required" });
    }
    const result = await legacyService.getQuoteValue(quoteKeyValue);
    res.status(HTTP_STATUS.OK).json(result);
  });
}
