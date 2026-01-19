// Auto-generated from Prisma schema
export interface JobCode {
  id?: string;
  jobCode: number;
  description: string;
  active?: boolean;
  clockable?: boolean;
  requiresCostCode?: boolean;
  askQuantity?: boolean;
  askSplitCode?: boolean;
  isConfirmed?: boolean;
  createdAt?: Date | string;
  updatedAt: Date | string;
}

export type CreateJobCodeInput = Omit<JobCode, "id" | "createdAt" | "updatedAt">;
export type UpdateJobCodeInput = Partial<CreateJobCodeInput>;
