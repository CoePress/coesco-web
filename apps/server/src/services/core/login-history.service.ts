import type { LoginHistory, LoginMethod } from "@prisma/client";

import { loginHistoryRepository } from "@/repositories";
import { logger } from "@/utils/logger";

export interface LogLoginAttemptParams {
  userId?: string;
  username?: string;
  loginMethod: LoginMethod;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: Record<string, any>;
}

export class LoginHistoryService {
  async logAttempt(params: LogLoginAttemptParams): Promise<LoginHistory> {
    const {
      userId,
      username,
      loginMethod,
      success,
      failureReason,
      ipAddress,
      userAgent,
      location,
    } = params;

    const result = await loginHistoryRepository.create({
      userId,
      username,
      loginMethod,
      success,
      failureReason,
      ipAddress,
      userAgent,
      location,
      timestamp: new Date(),
    });

    if (!result.success || !result.data) {
      throw new Error("Failed to log login attempt");
    }

    const logMessage = success
      ? `Successful ${loginMethod} login for ${username || userId}`
      : `Failed ${loginMethod} login attempt for ${username || "unknown user"}`;

    logger.info(logMessage, {
      userId,
      username,
      loginMethod,
      success,
      ipAddress,
      failureReason,
    });

    return result.data;
  }

  async getUserLoginHistory(userId: string, limit = 50): Promise<LoginHistory[]> {
    const result = await loginHistoryRepository.getAll({
      filter: { userId },
      sort: "timestamp",
      order: "desc",
      limit,
    });

    return result.success && result.data ? result.data : [];
  }

  async getRecentFailedAttempts(
    username: string,
    since: Date,
  ): Promise<LoginHistory[]> {
    const result = await loginHistoryRepository.getAll({
      filter: {
        username,
        success: false,
        timestamp: { gte: since },
      },
      sort: "timestamp",
      order: "desc",
    });

    return result.success && result.data ? result.data : [];
  }

  async getLoginAttemptsByIp(ipAddress: string, limit = 100): Promise<LoginHistory[]> {
    const result = await loginHistoryRepository.getAll({
      filter: { ipAddress },
      sort: "timestamp",
      order: "desc",
      limit,
    });

    return result.success && result.data ? result.data : [];
  }

  async getRecentLoginAttempts(since: Date): Promise<LoginHistory[]> {
    const result = await loginHistoryRepository.getAll({
      filter: {
        timestamp: { gte: since },
      },
      sort: "timestamp",
      order: "desc",
    });

    return result.success && result.data ? result.data : [];
  }

  async getFailedLoginCount(username: string, since: Date): Promise<number> {
    const attempts = await this.getRecentFailedAttempts(username, since);
    return attempts.length;
  }

  async getAllLoginHistory(params: any) {
    return loginHistoryRepository.getAll(params);
  }
}
