// Auto-generated from Prisma schema
export interface PostalCode {
  countryCode: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export type CreatePostalCodeInput = Omit<PostalCode, "id" | "createdAt" | "updatedAt">;
export type UpdatePostalCodeInput = Partial<CreatePostalCodeInput>;
