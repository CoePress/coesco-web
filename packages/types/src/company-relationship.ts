// Auto-generated from Prisma schema
export interface CompanyRelationship {
  id?: string;
  parentId: string;
  childId: string;
  relationshipType?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  createdById: string;
  updatedById: string;
}

export type CreateCompanyRelationshipInput = Omit<CompanyRelationship, "id" | "createdAt" | "updatedAt">;
export type UpdateCompanyRelationshipInput = Partial<CreateCompanyRelationshipInput>;
