import { IQueryParams } from "@/types/api.types";

export class BaseService<T> {
  protected model: any;
  protected entityName: string;
  protected modelName: string;

  constructor(model: any, entityName: string, modelName: string) {
    this.model = model;
    this.entityName = entityName;
    this.modelName = modelName;
  }

  async getAll(params: IQueryParams<T>) {}

  async getById(id: string) {}

  async create(data: any) {}

  async update(id: string, data: any) {}

  async delete(id: string) {}

  async audit(data: any) {}

  protected async validate(data: any) {}
}
