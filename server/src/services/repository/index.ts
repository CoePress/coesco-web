import { BadRequestError } from "@/middleware/error.middleware";
import { IQueryParams, IServiceResult } from "@/types/auth.types";
import { buildQuery } from "@/utils/prisma";
import { Prisma } from "@prisma/client";

export abstract class BaseService<TEntity> {
  protected abstract model: any;
  protected abstract entityName: string;

  async getAll(
    params?: IQueryParams<TEntity>,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<TEntity[]>> {
    try {
      const model = tx
        ? (tx as any)[this.entityName.toLowerCase()]
        : this.model;

      const { where, orderBy, page, take, skip, select, include } = buildQuery(
        params || {},
        params?.searchFields?.map((field) => field.toString()) || []
      );

      const queryWhere = {
        ...where,
      };

      const queryOptions: any = {
        where: queryWhere,
        orderBy,
        take,
        skip,
      };

      if (select) {
        queryOptions.select = select;
      } else if (include) {
        queryOptions.include = include;
      }

      const entities = await model.findMany(queryOptions);
      const total = await model.count({ where: queryWhere });
      const totalPages = take ? Math.ceil(total / take) : 1;

      return {
        success: true,
        data: entities,
        meta: {
          page,
          limit: take,
          total,
          totalPages,
        },
      };
    } catch (error) {
      return { success: false, error: `Failed to get ${this.entityName}s` };
    }
  }

  async getById(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<TEntity>> {
    try {
      const model = tx
        ? (tx as any)[this.entityName.toLowerCase()]
        : this.model;

      const where = { id };

      const entity = await model.findUnique({ where });

      if (!entity) {
        return { success: false, error: `${this.entityName} not found` };
      }

      return { success: true, data: entity };
    } catch (error) {
      console.error("getById error:", error);
      return { success: false, error: `Failed to get ${this.entityName}` };
    }
  }

  async create(
    data: Omit<TEntity, "id" | "createdAt" | "updatedAt">,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<TEntity>> {
    try {
      await this.validate(data, tx);
      const entity = await (tx
        ? (tx as any)[this.entityName.toLowerCase()].create({ data })
        : this.model.create({ data }));
      return { success: true, data: entity };
    } catch (error) {
      console.error("Create error:", error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: `Failed to create ${this.entityName}` };
    }
  }

  async update(
    id: string,
    data: Partial<Omit<TEntity, "id" | "createdAt" | "updatedAt">>,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<TEntity>> {
    try {
      const entity = await (tx
        ? (tx as any)[this.entityName.toLowerCase()].update({
            where: { id },
            data,
          })
        : this.model.update({ where: { id }, data }));
      return { success: true, data: entity };
    } catch (error) {
      return { success: false, error: `Failed to update ${this.entityName}` };
    }
  }

  async delete(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<TEntity>> {
    try {
      const entity = await (tx
        ? (tx as any)[this.entityName.toLowerCase()].delete({ where: { id } })
        : this.model.delete({ where: { id } }));
      return { success: true, data: entity };
    } catch (error) {
      return { success: false, error: `Failed to delete ${this.entityName}` };
    }
  }

  protected async validate(
    data: Omit<TEntity, "id" | "createdAt" | "updatedAt">,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    throw new BadRequestError("Not implemented");
  }
}
