// Auto-generated from Prisma schema
import { ItemType } from './item-type';

export interface Item {
  id?: string;
  productClassId?: string;
  modelNumber?: string;
  name?: string;
  description?: string;
  specifications?: any;
  unitPrice?: number;
  leadTime?: number;
  type: ItemType;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateItemInput = Omit<Item, "id" | "createdAt" | "updatedAt">;
export type UpdateItemInput = Partial<CreateItemInput>;
