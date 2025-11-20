// Auto-generated from Prisma schema
import { AssetType } from './asset-type';
import { AssetStatus } from './asset-status';

export interface Asset {
  id?: string;
  key: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: AssetType;
  status?: AssetStatus;
  storageProvider?: string;
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  metadata?: any;
  tags: string[];
  isPublic?: boolean;
  uploadedById?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
}

export type CreateAssetInput = Omit<Asset, "id" | "createdAt" | "updatedAt">;
export type UpdateAssetInput = Partial<CreateAssetInput>;
