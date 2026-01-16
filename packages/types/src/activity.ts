// Auto-generated from Prisma schema
import { ActivityType } from './activity-type';
import { ActivitySentiment } from './activity-sentiment';

export interface Activity {
  id?: string;
  activityType: ActivityType;
  sentiment: ActivitySentiment;
  timestamp: Date | string;
  description?: string;
  notes?: string;
  entityType?: string;
  entityId?: string;
  createdBy?: string;
  createdAt?: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
}

export type CreateActivityInput = Omit<Activity, "id" | "createdAt" | "updatedAt">;
export type UpdateActivityInput = Partial<CreateActivityInput>;
