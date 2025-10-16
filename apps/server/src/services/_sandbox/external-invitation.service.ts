import type { AccessPurpose, ExternalAccessLink } from "@prisma/client";

import { randomBytes } from "node:crypto";

import type { IQueryParams } from "@/types";

import { BadRequestError, NotFoundError } from "@/middleware/error.middleware";
import { externalAccessLinkRepository } from "@/repositories";

interface CreateInvitationOptions {
  purpose: AccessPurpose;
  resourceId?: string;
  resourceType?: string;
  expiresAt?: Date;
  maxUses?: number;
  metadata?: Record<string, any>;
}

interface ValidateInvitationResult {
  valid: boolean;
  link?: ExternalAccessLink;
  reason?: string;
}

export class ExternalInvitationService {
  async getAllInvitations(params?: IQueryParams<ExternalAccessLink>) {
    return externalAccessLinkRepository.getAll(params);
  }

  async getInvitationById(id: string) {
    const result = await externalAccessLinkRepository.getById(id);
    if (!result.data) {
      throw new NotFoundError("Invitation not found");
    }
    return result;
  }

  async createInvitation(options: CreateInvitationOptions) {
    const { purpose, resourceId, resourceType, expiresAt, maxUses, metadata } = options;

    if (!purpose) {
      throw new BadRequestError("Purpose is required");
    }

    const token = this.generateToken();

    const result = await externalAccessLinkRepository.create({
      token,
      purpose,
      resourceId,
      resourceType,
      expiresAt,
      maxUses,
      metadata,
    });

    return result;
  }

  async revokeInvitation(id: string) {
    const { data: link } = await this.getInvitationById(id);

    if (link.revokedAt) {
      throw new BadRequestError("Invitation is already revoked");
    }

    return externalAccessLinkRepository.update(id, {
      revokedAt: new Date(),
    });
  }

  async validateInvitation(token: string): Promise<ValidateInvitationResult> {
    const links = await externalAccessLinkRepository.getAll({
      filter: { token },
    });

    const link = links.data?.[0];

    if (!link) {
      return { valid: false, reason: "Invalid invitation token" };
    }

    if (link.revokedAt) {
      return { valid: false, reason: "Invitation has been revoked", link };
    }

    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return { valid: false, reason: "Invitation has expired", link };
    }

    if (link.maxUses && link.useCount >= link.maxUses) {
      return { valid: false, reason: "Invitation has reached maximum uses", link };
    }

    return { valid: true, link };
  }

  async trackUsage(token: string) {
    const validation = await this.validateInvitation(token);

    if (!validation.valid || !validation.link) {
      throw new BadRequestError(validation.reason || "Invalid invitation");
    }

    const link = validation.link;

    await externalAccessLinkRepository.update(link.id, {
      useCount: link.useCount + 1,
      usedAt: new Date(),
    });

    return { success: true };
  }

  async getActiveInvitations(purpose?: AccessPurpose) {
    const now = new Date();
    const filter: any = {
      revokedAt: null,
    };

    if (purpose) {
      filter.purpose = purpose;
    }

    const result = await externalAccessLinkRepository.getAll({
      filter,
    });

    const activeInvitations = result.data.filter((link: ExternalAccessLink) => {
      if (link.expiresAt && now > new Date(link.expiresAt)) {
        return false;
      }

      if (link.maxUses && link.useCount >= link.maxUses) {
        return false;
      }

      return true;
    });

    return {
      success: true,
      data: activeInvitations,
      meta: {
        ...result.meta,
        total: activeInvitations.length,
      },
    };
  }

  async getInvitationStats() {
    const allLinks = await externalAccessLinkRepository.getAll();
    const now = new Date();

    const stats = {
      total: allLinks.data.length,
      active: 0,
      expired: 0,
      revoked: 0,
      maxedOut: 0,
      byPurpose: {} as Record<AccessPurpose, number>,
    };

    for (const link of allLinks.data) {
      const purpose = link.purpose as AccessPurpose;
      if (!stats.byPurpose[purpose]) {
        stats.byPurpose[purpose] = 0;
      }
      stats.byPurpose[purpose]++;

      if (link.revokedAt) {
        stats.revoked++;
      }
      else if (link.expiresAt && now > new Date(link.expiresAt)) {
        stats.expired++;
      }
      else if (link.maxUses && link.useCount >= link.maxUses) {
        stats.maxedOut++;
      }
      else {
        stats.active++;
      }
    }

    return stats;
  }

  private generateToken(): string {
    return randomBytes(32).toString("hex");
  }
}
