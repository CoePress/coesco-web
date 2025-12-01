import type { Activity } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { activityRepository } from "@/repositories";
import { prisma } from "@/utils/prisma";

export class ActivityService {
  async createActivity(data: Partial<Activity>) {
    return activityRepository.create(data);
  }

  async updateActivity(id: string, data: Partial<Activity>) {
    return activityRepository.update(id, data);
  }

  async deleteActivity(id: string) {
    return activityRepository.delete(id);
  }

  async getAllActivities(params?: IQueryParams<Activity>) {
    return activityRepository.getAll(params);
  }

  async getActivityById(id: string, params?: IQueryParams<Activity>) {
    return activityRepository.getById(id, params);
  }

  async getActivitiesByCompany(companyId: string) {
    const contactIds = await prisma.contact.findMany({
      where: {
        legacyCompanyId: companyId,
        deletedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    });

    const contactIdList = contactIds.map(c => c.id);

    const activities = await prisma.activity.findMany({
      where: {
        OR: [
          {
            entityType: 'company',
            entityId: companyId
          },
          {
            entityType: 'contact',
            entityId: {
              in: contactIdList
            }
          }
        ],
        deletedAt: null
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 1000
    });

    const contactMap = new Map(contactIds.map(c => [c.id, `${c.firstName || ''} ${c.lastName || ''}`.trim()]));

    const activitiesWithContactNames = activities.map(activity => ({
      ...activity,
      _contactName: activity.entityType === 'contact' ? contactMap.get(activity.entityId || '') || null : null
    }));

    return activitiesWithContactNames;
  }
}
