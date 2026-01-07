import type { Note } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { noteRepository } from "@/repositories";

export class NoteService {
  async createNote(data: Partial<Note>) {
    return noteRepository.create(data);
  }

  async updateNote(id: string, data: Partial<Note>) {
    return noteRepository.update(id, data);
  }

  async deleteNote(id: string) {
    return noteRepository.delete(id);
  }

  async getAllNotes(params?: IQueryParams<Note>) {
    return noteRepository.getAll(params);
  }

  async getNoteById(id: string, params?: IQueryParams<Note>) {
    return noteRepository.getById(id, params);
  }
}
