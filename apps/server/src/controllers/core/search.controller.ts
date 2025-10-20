import type { Request, Response } from "express";

import { z } from "zod";

import { SearchService } from "@/services/core/search.service";
import { asyncWrapper } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const searchService = new SearchService();

const SearchQuerySchema = z.object({
  entityType: z.enum(["company", "contact", "journey", "quote"]),
  query: z.string().min(1, "Search query is required"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(5),
});

export class SearchController {
  searchEntities = asyncWrapper(async (req: Request, res: Response) => {
    const validData = SearchQuerySchema.parse(req.query);
    const result = await searchService.searchEntities(
      validData.entityType,
      validData.query,
      validData.limit,
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  });
}
