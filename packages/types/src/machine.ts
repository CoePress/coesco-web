// Auto-generated from Prisma schema
import { MachineType } from './machine-type';
import { MachineControllerType } from './machine-controller-type';

export interface Machine {
  id?: string;
  slug: string;
  name: string;
  type: MachineType;
  controllerType: MachineControllerType;
  connectionUrl?: string;
  enabled?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
  deletedById?: string;
}

export type CreateMachineInput = Omit<Machine, "id" | "createdAt" | "updatedAt">;
export type UpdateMachineInput = Partial<CreateMachineInput>;
