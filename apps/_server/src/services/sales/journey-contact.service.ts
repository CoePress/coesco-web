import type { JourneyContact } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { journeyContactRepository } from "@/repositories";
import { legacyService } from "@/services";
import { prisma } from "@/utils/prisma";

export class JourneyContactService {
  async createJourneyContact(data: Partial<JourneyContact>) {
    if (data.isPrimary) {
      await this.clearPrimaryContacts(data.journeyId!);
    }

    const result = await journeyContactRepository.create(data);
    return result;
  }

  async updateJourneyContact(id: string, data: Partial<JourneyContact>) {
    try {
      if (data.isPrimary) {
        const result = await journeyContactRepository.getById(id);
        if (!result.success || !result.data) {
          console.error("JourneyContact not found:", id);
          throw new Error(`JourneyContact ${id} not found`);
        }
        await this.clearPrimaryContacts(result.data.journeyId);
      }

      const result = await journeyContactRepository.update(id, data);
      return result;
    }
    catch (error) {
      console.error("Error in updateJourneyContact:", error);
      throw error;
    }
  }

  async deleteJourneyContact(id: string) {
    return journeyContactRepository.delete(id);
  }

  async getAllJourneyContacts(params?: IQueryParams<JourneyContact>) {
    return journeyContactRepository.getAll(params);
  }

  async getJourneyContactById(id: string, params?: IQueryParams<JourneyContact>) {
    return journeyContactRepository.getById(id, params);
  }

  private async clearPrimaryContacts(journeyId: string) {
    await Promise.all([
      // Only update Prisma journey contacts where isPrimary is currently true
      prisma.journeyContact.updateMany({
        where: {
          journeyId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      }),
      // Update all legacy Journey_Contact records (legacy DB doesn't have the same constraint)
      legacyService.updateByCustomFilter(
        "std",
        "Journey_Contact",
        { Jrn_ID: journeyId },
        { IsPrimary: 0 },
      ).catch((err) => {
        console.error("Error updating legacy Journey_Contact:", err);
      }),
    ]);
  }
}
