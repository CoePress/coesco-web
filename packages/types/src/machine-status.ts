// Auto-generated from Prisma schema
import { MachineState } from './machine-state';

export interface MachineStatus {
  id?: string;
  machineId: string;
  state: MachineState;
  execution: string;
  controller: string;
  program?: string;
  tool?: string;
  metrics?: any;
  alarmCode?: string;
  alarmMessage?: string;
  startTime: Date | string;
  endTime?: Date | string;
  duration?: number;
  createdAt?: Date | string;
}

export type CreateMachineStatusInput = Omit<MachineStatus, "id" | "createdAt" | "updatedAt">;
export type UpdateMachineStatusInput = Partial<CreateMachineStatusInput>;
