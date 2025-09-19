// Auto-generated from Prisma schema
export interface NtfyDevice {
  id?: string;
  name: string;
  host: string;
  pingIntervalSec?: number;
  maxMissedPings?: number;
  currentMissedPings?: number;
  enabled?: boolean;
  lastPingTime?: Date | string;
  lastPingSuccess?: boolean;
  isDown?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateNtfyDeviceInput = Omit<NtfyDevice, "id" | "createdAt" | "updatedAt">;
export type UpdateNtfyDeviceInput = Partial<CreateNtfyDeviceInput>;
