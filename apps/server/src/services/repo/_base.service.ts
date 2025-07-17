import { IQueryParams } from "@/types/api.types";

export class BaseService<T> {
  protected model: any;
  protected entityName: string | undefined;
  protected modelName: string | undefined;

  async getAll(params: IQueryParams<T>) {}

  async getById(id: string) {}

  async create(data: any) {}

  async update(id: string, data: any) {}

  async delete(id: string) {}

  async audit(data: any) {}

  protected async validate(data: any) {}
}
