// Auto-generated from Prisma schema
import { BugReportStatus } from './bug-report-status';

export interface BugReport {
  id?: string;
  title: string;
  description: string;
  userEmail?: string;
  userName?: string;
  url?: string;
  userAgent?: string;
  issueKey?: string;
  issueUrl?: string;
  status?: BugReportStatus;
  createdAt?: Date | string;
  createdById?: string;
}

export type CreateBugReportInput = Omit<BugReport, "id" | "createdAt" | "updatedAt">;
export type UpdateBugReportInput = Partial<CreateBugReportInput>;
