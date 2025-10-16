import type { Journey } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { journeyRepository } from "@/repositories";

export class JourneyService {
  async createJourney(data: Partial<Journey>) {
    return journeyRepository.create(data);
  }

  async updateJourney(id: string, data: Partial<Journey>) {
    return journeyRepository.update(id, data);
  }

  async deleteJourney(id: string) {
    return journeyRepository.delete(id);
  }

  async getAllJourneys(params?: IQueryParams<Journey>) {
    return journeyRepository.getAll(params);
  }

  async getJourneyById(id: string, params?: IQueryParams<Journey>) {
    return journeyRepository.getById(id, params);
  }
}
