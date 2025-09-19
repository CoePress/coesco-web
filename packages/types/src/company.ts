// Auto-generated from Prisma schema
import { Industry } from './industry';
import { CompanyStatus } from './company-status';

export interface Company {
  id?: string;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  fax?: string;
  industry?: Industry;
  yearFounded?: number;
  revenue?: number;
  employeeCount?: string;
  customerSince?: Date | string;
  paymentTerms?: string;
  creditLimit?: number;
  taxId?: string;
  logoUrl?: string;
  notes?: string;
  tags: string[];
  status?: CompanyStatus;
  legacy?: any;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateCompanyInput = Omit<Company, "id" | "createdAt" | "updatedAt">;
export type UpdateCompanyInput = Partial<CreateCompanyInput>;
