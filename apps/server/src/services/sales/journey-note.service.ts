import type { JourneyNote } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { journeyNoteRepository } from "@/repositories";

export class JourneyNoteService {
  async createJourneyNote(data: Partial<JourneyNote>) {
    return journeyNoteRepository.create(data);
  }

  async updateJourneyNote(id: string, data: Partial<JourneyNote>) {
    return journeyNoteRepository.update(id, data);
  }

  async deleteJourneyNote(id: string) {
    return journeyNoteRepository.delete(id);
  }

  async getAllJourneyNotes(params?: IQueryParams<JourneyNote>) {
    return journeyNoteRepository.getAll(params);
  }

  async getJourneyNoteById(id: string, params?: IQueryParams<JourneyNote>) {
    return journeyNoteRepository.getById(id, params);
  }
}
