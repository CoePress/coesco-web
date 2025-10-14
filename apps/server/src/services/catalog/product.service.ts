import type { Item, ProductClass } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { itemRepository, productClassRepository } from "@/repositories";

export class ProductService {
  async createItem(data: Partial<Item>) {
    return itemRepository.create(data);
  }

  async updateItem(id: string, data: Partial<Item>) {
    return itemRepository.update(id, data);
  }

  async deleteItem(id: string) {
    return itemRepository.delete(id);
  }

  async getAllItems(params?: IQueryParams<Item>) {
    return itemRepository.getAll(params);
  }

  async getItemById(id: string, params?: IQueryParams<Item>) {
    return itemRepository.getById(id, params);
  }

  async createProductClass(data: Partial<ProductClass>) {
    return productClassRepository.create(data);
  }

  async updateProductClass(id: string, data: Partial<ProductClass>) {
    return productClassRepository.update(id, data);
  }

  async deleteProductClass(id: string) {
    return productClassRepository.delete(id);
  }

  async getAllProductClasses(params?: IQueryParams<ProductClass>) {
    return productClassRepository.getAll(params);
  }

  async getProductClassById(id: string, params?: IQueryParams<ProductClass>) {
    return productClassRepository.getById(id, params);
  }
}
