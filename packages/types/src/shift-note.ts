// Auto-generated from Prisma schema
export interface ShiftNote {
  id?: string;
  empNum: string;
  hoursId: string;
  shiftNote: string;
  dateEntered: Date | string;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateShiftNoteInput = Omit<ShiftNote, "id" | "createdAt" | "updatedAt">;
export type UpdateShiftNoteInput = Partial<CreateShiftNoteInput>;
