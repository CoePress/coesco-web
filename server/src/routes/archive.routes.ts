import { quoteSequelize } from "@/config/database";
import { IQueryParams } from "@/types/api.types";
import { Router, RequestHandler } from "express";

const getValidEntities = async () => {
  const result = (await quoteSequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
  )) as [{ table_name: string }[], any];

  return result.map((row) => row[0]);
};

const getEntityColumns = async (entity: string) => {
  const result = await quoteSequelize.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = '${entity}'`
  );
  return (result[0] as { column_name: string }[]).map((col) => col.column_name);
};

const router = Router();

router.get("/", async (req, res) => {
  const validEntities = await getValidEntities();
  res.status(200).json({
    message: "Valid entities",
    entities: validEntities.sort((a, b) => a.localeCompare(b)),
  });
});

router.get("/:entity", (async (req, res) => {
  const { entity } = req.params;
  const { page, limit, sort, order, search, filter, dateFrom, dateTo } =
    req.query;

  const params: IQueryParams = {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 100,
    sort: sort as string,
    order: order as "asc" | "desc",
    search: search as string,
    filter: filter as Record<string, any>,
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
  };

  const entityName = entity.toLowerCase();

  try {
    const validEntities = await getValidEntities();
    const validEntity = validEntities.find((e) => e === entityName);
    if (!validEntity) {
      return res.status(404).json({
        error: `Entity ${entityName} (${entity}) does not exist`,
      });
    }

    const columns = await getEntityColumns(entityName);

    let query = `SELECT * FROM "${entityName}"`;
    let countQuery = `SELECT COUNT(*) FROM "${entityName}"`;
    const queryParams: any[] = [];
    let whereConditions: string[] = [];

    if (params.search) {
      const searchConditions = columns.map((col, index) => {
        queryParams.push(`%${params.search}%`);
        return `CAST("${col}" AS TEXT) ILIKE $${index + 1}`;
      });
      whereConditions.push(`(${searchConditions.join(" OR ")})`);
    }

    if ((params.dateFrom || params.dateTo) && columns.includes("createdAt")) {
      if (params.dateFrom) {
        queryParams.push(params.dateFrom);
        whereConditions.push(`"createdAt" >= $${queryParams.length}`);
      }
      if (params.dateTo) {
        queryParams.push(params.dateTo);
        whereConditions.push(`"createdAt" <= $${queryParams.length}`);
      }
    }

    if (params.filter) {
      const filterObj =
        typeof params.filter === "string"
          ? JSON.parse(params.filter)
          : params.filter;

      Object.entries(filterObj).forEach(([key, value]) => {
        if (columns.includes(key)) {
          queryParams.push(value);
          whereConditions.push(`"${key}" = $${queryParams.length}`);
        }
      });
    }

    if (whereConditions.length > 0) {
      const whereClause = ` WHERE ${whereConditions.join(" AND ")}`;
      query += whereClause;
      countQuery += whereClause;
    }

    if (params.sort && columns.includes(params.sort)) {
      const sortOrder = params.order || "desc";
      query += ` ORDER BY "${params.sort}" ${sortOrder.toUpperCase()}`;
    }

    if (params.limit) {
      queryParams.push(params.limit);
      query += ` LIMIT $${queryParams.length}`;

      const offset = ((params.page || 1) - 1) * params.limit;
      queryParams.push(offset);
      query += ` OFFSET $${queryParams.length}`;
    }

    const [data, countResult] = await Promise.all([
      quoteSequelize.query(query, {
        bind: queryParams,
        type: "SELECT",
      }),
      quoteSequelize.query(countQuery, {
        bind: queryParams.slice(0, -2),
        type: "SELECT",
      }),
    ]);

    // @ts-ignore
    let total = parseInt(countResult[0].count);

    const totalPages = params.limit ? Math.ceil(total / params.limit) : 1;

    res.status(200).json({
      success: true,
      data,
      total,
      totalPages,
      page: params.page,
      limit: params.limit,
    });
  } catch (error) {
    console.error(`Error querying ${entity}:`, error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}) as RequestHandler);

export default router;
