import type { PostalCode } from "@prisma/client";

import { BadRequestError } from "@/middleware/error.middleware";
import { prisma } from "@/utils/prisma";

import { BaseService } from "../repository/_base.service";

type PostalCodeAttributes = Omit<PostalCode, "countryCode" | "postalCode">;

export class LocationService extends BaseService<PostalCode> {
  protected model = prisma.postalCode;
  protected entityName = "PostalCode";
  protected modelName = "postalCode";

  protected async validate(entity: PostalCodeAttributes): Promise<void> {
    if (entity.latitude === undefined || entity.latitude === null) {
      throw new BadRequestError("latitude is required");
    }
    if (entity.longitude === undefined || entity.longitude === null) {
      throw new BadRequestError("longitude is required");
    }
  }

  async getCoordinatesByPostalCode(countryCode: string, postalCode: string) {
    const result = await this.model.findFirst({
      where: {
        countryCode: countryCode.toUpperCase(),
        postalCode: postalCode.toUpperCase(),
      },
      select: {
        latitude: true,
        longitude: true,
        countryCode: true,
        postalCode: true,
      },
    });

    return {
      success: true,
      data: result,
    };
  }

  async searchPostalCodes(query: { countryCode?: string; postalCode?: string; limit?: number }) {
    const where: any = {};

    if (query.countryCode) {
      where.countryCode = query.countryCode.toUpperCase();
    }

    if (query.postalCode) {
      where.postalCode = {
        contains: query.postalCode.toUpperCase(),
      };
    }

    const results = await this.model.findMany({
      where,
      take: query.limit || 10,
      select: {
        countryCode: true,
        postalCode: true,
        latitude: true,
        longitude: true,
      },
      orderBy: {
        postalCode: "asc",
      },
    });

    return {
      success: true,
      data: results,
    };
  }
}
