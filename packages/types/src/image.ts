// Auto-generated from Prisma schema
export interface Image {
  id?: number;
  path: string;
  uploadedAt?: Date | string;
}

export type CreateImageInput = Omit<Image, "id" | "createdAt" | "updatedAt">;
export type UpdateImageInput = Partial<CreateImageInput>;
