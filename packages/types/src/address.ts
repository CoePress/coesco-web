// Auto-generated from Prisma schema
export interface Address {
  id?: string;
  companyId: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  isPrimary?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateAddressInput = Omit<Address, "id" | "createdAt" | "updatedAt">;
export type UpdateAddressInput = Partial<CreateAddressInput>;
