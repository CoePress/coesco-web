// Auto-generated from Prisma schema
export interface CostCode {
  id?: string;
  jobSfx: string;
  bomItem: string;
  sequence: string;
  active: boolean;
  jobCode: number;
  jobName: string;
  needByDate: string;
  isConfirmed: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateCostCodeInput = Omit<CostCode, "id" | "createdAt" | "updatedAt">;
export type UpdateCostCodeInput = Partial<CreateCostCodeInput>;
