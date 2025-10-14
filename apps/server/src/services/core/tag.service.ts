import type { Tag } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { tagRepository } from "@/repositories";

export class TagService {
  async createTag(data: Partial<Tag>) {
    return tagRepository.create(data);
  }

  async updateTag(id: string, data: Partial<Tag>) {
    return tagRepository.update(id, data);
  }

  async deleteTag(id: string) {
    return tagRepository.delete(id);
  }

  async getAllTags(params?: IQueryParams<Tag>) {
    return tagRepository.getAll(params);
  }

  async getTagById(id: string, params?: IQueryParams<Tag>) {
    return tagRepository.getById(id, params);
  }
}
