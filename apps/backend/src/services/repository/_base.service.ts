import { Prisma } from "@prisma/client";

import type { IQueryParams, IServiceResult } from "@/types";

import { BadRequestError, NotFoundError } from "@/middleware/error.middleware";
import { deriveTableNames } from "@/utils";
import { getEmployeeContext } from "@/utils/context";
import { buildQuery, prisma } from "@/utils/prisma";

const columnCache = new Map<string, string[]>();

export class BaseService<T> {
  protected model: any;
  protected entityName?: string;
  protected modelName?: string;

  private async getColumns(): Promise<string[]> {
    if (!this.modelName)
      return [];

    if (columnCache.has(this.modelName)) {
      return columnCache.get(this.modelName)!;
    }

    const tables = deriveTableNames(this.modelName);
    const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM   information_schema.columns
      WHERE  table_schema = 'public'
        AND  table_name   IN (${Prisma.join(tables)})
    `;

    const cols = rows.map(r => r.column_name);
    columnCache.set(this.modelName, cols);
    return cols;
  }

  private async withAuditCols(payload: any) {
    const cols = await this.getColumns();
    const employee = getEmployeeContext();

    if (cols.includes("createdById") && !payload.createdById) {
      payload.createdById = employee.id;
    }
    if (cols.includes("updatedById") && !payload.updatedById) {
      payload.updatedById = employee.id;
    }
    return payload;
  }

  /* ------------------------------------------------------------------ CRUD */

  async getAll(
    params?: IQueryParams<T>,
    tx?: Prisma.TransactionClient,
  ): Promise<IServiceResult<T[]>> {
    try {
      const { where, orderBy, page, take, skip, select, include } = buildQuery(
        params ?? {},
        params?.searchFields?.map(String) ?? [],
      );

      const query = { where, orderBy, take, skip } as any;
      if (select)
        query.select = select;
      else if (include)
        query.include = include;

      const [items, total] = await Promise.all([
        (tx ?? this.model).findMany(query),
        (tx ?? this.model).count({ where }),
      ]);

      return {
        success: true,
        data: items,
        meta: {
          page,
          limit: take,
          total,
          totalPages: take ? Math.ceil(total / (take || 1)) : 1,
        },
      };
    }
    catch (err: any) {
      console.error(`Error in ${this.entityName}.getAll:`, err);
      throw new BadRequestError(
        `Failed to fetch ${this.entityName} list: ${err.message}`,
      );
    }
  }

  async getById(
    id: string,
    tx?: Prisma.TransactionClient,
    include?: any,
    throwError = false,
  ): Promise<IServiceResult<T>> {
    try {
      const query = { where: { id }, ...(include ? { include } : {}) } as any;
      const entity = await (tx ?? this.model).findUnique(query);

      if (!entity)
        throw new NotFoundError(`${this.entityName} with id ${id} not found`);
      return { success: true, data: entity };
    }
    catch (err: any) {
      if (throwError)
        throw err;
      return { success: false, data: null as any };
    }
  }

  async create(
    data: Omit<T, "id" | "createdAt" | "updatedAt"> & Record<string, any>,
    tx?: Prisma.TransactionClient,
  ): Promise<IServiceResult<T>> {
    try {
      const payload = await this.withAuditCols({ ...data });
      const entity = await (tx ?? this.model).create({ data: payload });
      return { success: true, data: entity };
    }
    catch (err: any) {
      console.error(`Error in ${this.entityName}.create:`, err);
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002")
          throw new BadRequestError(`Duplicate ${this.entityName}`);
        if (err.code === "P2003")
          throw new BadRequestError(`Invalid reference on ${this.entityName}`);
      }
      throw new BadRequestError(
        `Failed to create ${this.entityName}: ${err.message}`,
      );
    }
  }

  async update(
    id: string,
    data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">> | any,
    tx?: Prisma.TransactionClient,
    userId?: string,
  ): Promise<IServiceResult<T>> {
    try {
      const entity = await this.model.findUnique({ where: { id } });

      if (!entity) {
        throw new NotFoundError(`${this.entityName} with id ${id} not found`);
      }

      const updateData: any = {};
      const relationsToInclude: any = {};

      for (const [key, value] of Object.entries(data)) {
        if (key.includes(".")) {
          const [relation, field] = key.split(".");
          if (!updateData[relation]) {
            updateData[relation] = {
              update: {
                where: { id: entity.userId },
                data: {},
              },
            };
          }
          updateData[relation].update.data[field] = value;
          relationsToInclude[relation] = true;
        }
        else {
          updateData[key] = value;
        }
      }

      const updatedEntity = await this.model.update({
        where: { id },
        data: updateData,
        include:
          Object.keys(relationsToInclude).length > 0
            ? relationsToInclude
            : undefined,
      });

      if (!updatedEntity) {
        throw new BadRequestError(`Failed to update ${this.entityName}`);
      }

      return { success: true, data: updatedEntity };
    }
    catch (error: any) {
      if (error instanceof NotFoundError)
        throw error;
      console.error(`Error in ${this.entityName}.update:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new BadRequestError(
            `A ${this.entityName} with this data already exists`,
          );
        }
        if (error.code === "P2003") {
          throw new BadRequestError(
            `Invalid reference in ${this.entityName} update`,
          );
        }
      }
      throw new BadRequestError(
        `Failed to update ${this.entityName}: ${error.message}`,
      );
    }
  }

  async delete(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<IServiceResult<T>> {
    try {
      const entity = await this.model.findUnique({ where: { id } });

      if (!entity) {
        throw new NotFoundError(`${this.entityName} with id ${id} not found`);
      }

      const deletedEntity = await this.model.delete({ where: { id } });
      return { success: true, data: deletedEntity };
    }
    catch (error: any) {
      if (error instanceof NotFoundError)
        throw error;

      console.error(`Error in ${this.entityName}.delete:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003") {
          throw new BadRequestError(
            `Cannot delete ${this.entityName} because it is referenced by other records`,
          );
        }
      }
      throw new BadRequestError(
        `Failed to delete ${this.entityName}: ${error.message}`,
      );
    }
  }

  async audit(data: any) {}

  protected async validate(data: any) {
    // implement in child classes
  }
}
