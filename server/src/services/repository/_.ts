import { BadRequestError, NotFoundError } from "@/middleware/error.middleware";
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
    const model = tx ? (tx as any)[this.entityName.toLowerCase()] : this.model;

    const { where, orderBy, page, take, skip, select, include } = buildQuery(
      params || {},
      params?.searchFields?.map((field) => field.toString()) || []
    );

    const queryOptions: any = {
      where,
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
    const total = await model.count({ where });
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
  }

  async getById(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<TEntity>> {
    const model = tx ? (tx as any)[this.entityName.toLowerCase()] : this.model;
    const where = { id };
    const entity = await model.findUnique({ where });

    if (!entity) {
      throw new NotFoundError(`${this.entityName} not found`);
    }

    return { success: true, data: entity };
  }

  async create(
    data: Omit<TEntity, "id" | "createdAt" | "updatedAt">,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<TEntity>> {
    await this.validate(data, tx);
    const entity = await (tx
      ? (tx as any)[this.entityName.toLowerCase()].create({ data })
      : this.model.create({ data }));
    return { success: true, data: entity };
  }

  async update(
    id: string,
    data: Partial<Omit<TEntity, "id" | "createdAt" | "updatedAt">>,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<TEntity>> {
    const model = tx ? (tx as any)[this.entityName.toLowerCase()] : this.model;
    const entity = await model.findUnique({ where: { id } });

    if (!entity) {
      throw new NotFoundError(`${this.entityName} not found`);
    }

    const updatedEntity = await (tx
      ? (tx as any)[this.entityName.toLowerCase()].update({
          where: { id },
          data,
        })
      : this.model.update({ where: { id }, data }));
    return { success: true, data: updatedEntity };
  }

  async delete(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<TEntity>> {
    const model = tx ? (tx as any)[this.entityName.toLowerCase()] : this.model;
    const entity = await model.findUnique({ where: { id } });

    if (!entity) {
      throw new NotFoundError(`${this.entityName} not found`);
    }

    const deletedEntity = await model.delete({ where: { id } });
    return { success: true, data: deletedEntity };
  }

  async bulkCreate() {}

  async bulkUpdate() {}

  async exists() {}

  async count() {}

  async findBy(criteria: Partial<TEntity>) {
    const entity = await this.model.findFirst({ where: criteria });
    return { success: true, data: entity };
  }

  protected async validate(
    data: Omit<TEntity, "id" | "createdAt" | "updatedAt">,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    throw new BadRequestError("Override this method");
  }
}
