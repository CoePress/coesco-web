import { BadRequestError, NotFoundError } from "@/middleware/error.middleware";
import { IQueryParams, IServiceResult } from "@/types/api.types";
import { getEmployeeContext } from "@/utils/context";
import { buildQuery } from "@/utils/prisma";
import { Prisma } from "@prisma/client";

export class BaseService<T> {
  protected model: any;
  protected entityName: string | undefined;
  protected modelName: string | undefined;

  async getAll(
    params?: IQueryParams<T>,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<T[]>> {
    try {
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

      const [entities, total] = await Promise.all([
        this.model.findMany(queryOptions),
        this.model.count({ where }),
      ]);

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
    } catch (error: any) {
      console.error(`Error in ${this.entityName}.getAll:`, error);
      throw new BadRequestError(
        `Failed to fetch ${this.entityName} list: ${error.message}`
      );
    }
  }

  async getById(
    id: string,
    tx?: Prisma.TransactionClient,
    include?: any,
    throwError: boolean = false
  ): Promise<IServiceResult<T>> {
    try {
      const queryOptions: any = {
        where: { id },
      };

      if (include) {
        queryOptions.include = include;
      }

      const entity = await this.model.findUnique(queryOptions);

      if (!entity) {
        throw new NotFoundError(`${this.entityName} with id ${id} not found`);
      }

      return { success: true, data: entity };
    } catch (error: any) {
      if (throwError) {
        throw error;
      }
      return { success: false, data: null as any };
    }
  }

  async create(
    data: Omit<T, "id" | "createdAt" | "updatedAt"> | any,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<T>> {
    try {
      const employee = getEmployeeContext();
      const payload = {
        ...data,
        createdById: employee.id,
        updatedById: employee.id,
      };

      const entity = await this.model.create({ data: payload });

      if (!entity) {
        throw new BadRequestError(`Failed to create ${this.entityName}`);
      }

      return { success: true, data: entity };
    } catch (error: any) {
      console.error(`Error in ${this.entityName}.create:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new BadRequestError(
            `A ${this.entityName} with this data already exists`
          );
        }
        if (error.code === "P2003") {
          throw new BadRequestError(
            `Invalid reference in ${this.entityName} creation`
          );
        }
      }
      throw new BadRequestError(
        `Failed to create ${this.entityName}: ${error.message}`
      );
    }
  }

  async update(
    id: string,
    data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">> | any,
    tx?: Prisma.TransactionClient,
    userId?: string
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
        } else {
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
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      console.error(`Error in ${this.entityName}.update:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new BadRequestError(
            `A ${this.entityName} with this data already exists`
          );
        }
        if (error.code === "P2003") {
          throw new BadRequestError(
            `Invalid reference in ${this.entityName} update`
          );
        }
      }
      throw new BadRequestError(
        `Failed to update ${this.entityName}: ${error.message}`
      );
    }
  }

  async delete(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<IServiceResult<T>> {
    try {
      const entity = await this.model.findUnique({ where: { id } });

      if (!entity) {
        throw new NotFoundError(`${this.entityName} with id ${id} not found`);
      }

      const deletedEntity = await this.model.delete({ where: { id } });
      return { success: true, data: deletedEntity };
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;

      console.error(`Error in ${this.entityName}.delete:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003") {
          throw new BadRequestError(
            `Cannot delete ${this.entityName} because it is referenced by other records`
          );
        }
      }
      throw new BadRequestError(
        `Failed to delete ${this.entityName}: ${error.message}`
      );
    }
  }

  async audit(data: any) {}

  protected async validate(data: any) {
    // implement in child classes
  }
}
