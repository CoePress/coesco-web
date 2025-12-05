import type { Request, Response, Router } from "express";
import type { z } from "zod";

import type { BaseRepository } from "@/repositories/_base.repository";
import type { IQueryParams } from "@/types";

import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

export interface CrudControllerConfig<T> {
  repository: BaseRepository<T>;
  entityName: string;
  idParam?: string;
  createSchema?: z.ZodType<any>;
  updateSchema?: z.ZodType<any>;
  defaultInclude?: Record<string, any>;
}

export interface CrudController {
  create: ReturnType<typeof asyncWrapper>;
  getAll: ReturnType<typeof asyncWrapper>;
  getById: ReturnType<typeof asyncWrapper>;
  update: ReturnType<typeof asyncWrapper>;
  delete: ReturnType<typeof asyncWrapper>;
}

export function createCrudController<T>(config: CrudControllerConfig<T>): CrudController {
  const { repository, idParam = "id", createSchema, updateSchema, defaultInclude } = config;

  return {
    create: asyncWrapper(async (req: Request, res: Response) => {
      const data = createSchema ? createSchema.parse(req.body) : req.body;
      const result = await repository.create(data);
      res.status(HTTP_STATUS.CREATED).json(result);
    }),

    getAll: asyncWrapper(async (req: Request, res: Response) => {
      const params = buildQueryParams<T>(req.query);
      const result = await repository.getAll(params as IQueryParams<T>);
      res.status(HTTP_STATUS.OK).json(result);
    }),

    getById: asyncWrapper(async (req: Request, res: Response) => {
      const params = buildQueryParams<T>(req.query);
      if (defaultInclude && !params.include) {
        params.include = defaultInclude;
      }
      const result = await repository.getById(req.params[idParam], params as IQueryParams<T>);
      res.status(HTTP_STATUS.OK).json(result);
    }),

    update: asyncWrapper(async (req: Request, res: Response) => {
      const data = updateSchema ? updateSchema.parse(req.body) : req.body;
      const result = await repository.update(req.params[idParam], data);
      res.status(HTTP_STATUS.OK).json(result);
    }),

    delete: asyncWrapper(async (req: Request, res: Response) => {
      await repository.delete(req.params[idParam]);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    }),
  };
}

export interface CrudRouteConfig {
  router: Router;
  basePath: string;
  controller: CrudController;
  idParam?: string;
}

export function registerCrudRoutes(config: CrudRouteConfig): void {
  const { router, basePath, controller, idParam = "id" } = config;
  const idPath = `${basePath}/:${idParam}`;

  router.post(basePath, controller.create);
  router.get(basePath, controller.getAll);
  router.get(idPath, controller.getById);
  router.patch(idPath, controller.update);
  router.delete(idPath, controller.delete);
}

export interface EntityConfig<T> {
  repository: BaseRepository<T>;
  entityName: string;
  basePath: string;
  idParam?: string;
  createSchema?: z.ZodType<any>;
  updateSchema?: z.ZodType<any>;
  defaultInclude?: Record<string, any>;
}

export function createCrudEntity<T>(router: Router, config: EntityConfig<T>): CrudController {
  const { repository, entityName, basePath, idParam, createSchema, updateSchema, defaultInclude } = config;

  const controller = createCrudController<T>({
    repository,
    entityName,
    idParam,
    createSchema,
    updateSchema,
    defaultInclude,
  });

  registerCrudRoutes({
    router,
    basePath,
    controller,
    idParam,
  });

  return controller;
}
