import type { LoginMethod, Session } from "@prisma/client";

import { createHash } from "node:crypto";

import { sessionRepository } from "@/repositories";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

export interface CreateSessionParams {
  userId: string;
  token: string;
  refreshToken: string;
  loginMethod: LoginMethod;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  deviceName?: string;
  location?: Record<string, any>;
  expiresIn: number;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  revokedSessions: number;
  suspiciousSessions: number;
}

export interface AdminDashboardMetrics {
  activeSessionsCount: number;
  totalSessionsCount: number;
  recentLoginActivity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  failedLoginAttempts: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  sessionsByUser: Array<{
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    activeSessionCount: number;
  }>;
  recentlyRevokedSessions: Array<{
    id: string;
    userId: string;
    username: string;
    revokedAt: Date;
    revokedReason: string | null;
    deviceName: string | null;
    ipAddress: string | null;
  }>;
  suspiciousActivityCount: number;
}

export class SessionService {
  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private parseUserAgent(userAgent?: string): { deviceType?: string; deviceName?: string } {
    if (!userAgent)
      return {};

    const ua = userAgent.toLowerCase();
    let deviceType: string | undefined;
    let deviceName: string | undefined;

    if (ua.includes("mobile")) {
      deviceType = "mobile";
    }
    else if (ua.includes("tablet") || ua.includes("ipad")) {
      deviceType = "tablet";
    }
    else {
      deviceType = "desktop";
    }

    if (ua.includes("chrome")) {
      deviceName = "Chrome";
    }
    else if (ua.includes("firefox")) {
      deviceName = "Firefox";
    }
    else if (ua.includes("safari")) {
      deviceName = "Safari";
    }
    else if (ua.includes("edge")) {
      deviceName = "Edge";
    }

    if (ua.includes("windows")) {
      deviceName = deviceName ? `${deviceName} on Windows` : "Windows";
    }
    else if (ua.includes("mac")) {
      deviceName = deviceName ? `${deviceName} on Mac` : "Mac";
    }
    else if (ua.includes("linux")) {
      deviceName = deviceName ? `${deviceName} on Linux` : "Linux";
    }
    else if (ua.includes("android")) {
      deviceName = deviceName ? `${deviceName} on Android` : "Android";
    }
    else if (ua.includes("iphone") || ua.includes("ipad")) {
      deviceName = deviceName ? `${deviceName} on iOS` : "iOS";
    }

    return { deviceType, deviceName };
  }

  async createSession(params: CreateSessionParams): Promise<Session> {
    const {
      userId,
      token,
      refreshToken,
      loginMethod,
      ipAddress,
      userAgent,
      location,
      expiresIn,
    } = params;

    const { deviceType, deviceName } = this.parseUserAgent(userAgent);
    const expiresAt = new Date(Date.now() + expiresIn);

    const result = await sessionRepository.create({
      userId,
      token: this.hashToken(token),
      refreshToken: this.hashToken(refreshToken),
      loginMethod,
      ipAddress,
      userAgent,
      deviceType: params.deviceType || deviceType,
      deviceName: params.deviceName || deviceName,
      location,
      expiresAt,
      loginAt: new Date(),
      lastActivityAt: new Date(),
      isActive: true,
      isSuspicious: false,
    });

    if (!result.success || !result.data) {
      throw new Error("Failed to create session");
    }

    logger.info(`Session created for user ${userId}: ${result.data.id}`);
    return result.data;
  }

  async validateSession(token: string): Promise<Session | null> {
    const hashedToken = this.hashToken(token);

    const result = await sessionRepository.getAll({
      filter: { token: hashedToken },
      limit: 1,
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return null;
    }

    const session = result.data[0];

    if (!session.isActive) {
      logger.warn(`Inactive session attempted: ${session.id}`);
      return null;
    }

    if (session.expiresAt < new Date()) {
      logger.info(`Expired session attempted: ${session.id}`);
      await this.expireSession(session.id);
      return null;
    }

    if (session.revokedAt) {
      logger.warn(`Revoked session attempted: ${session.id}`);
      return null;
    }

    return session;
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const hashedToken = this.hashToken(refreshToken);

    const result = await sessionRepository.getAll({
      filter: { refreshToken: hashedToken },
      limit: 1,
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return null;
    }

    const session = result.data[0];

    if (!session.isActive) {
      logger.warn(`Inactive session attempted with refresh token: ${session.id}`);
      return null;
    }

    if (session.expiresAt < new Date()) {
      logger.info(`Expired session attempted with refresh token: ${session.id}`);
      await this.expireSession(session.id);
      return null;
    }

    if (session.revokedAt) {
      logger.warn(`Revoked session attempted with refresh token: ${session.id}`);
      return null;
    }

    return session;
  }

  async updateTokens(sessionId: string, newAccessToken: string, newRefreshToken: string, expiresIn: number): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn);

    await sessionRepository.update(sessionId, {
      token: this.hashToken(newAccessToken),
      refreshToken: this.hashToken(newRefreshToken),
      expiresAt,
      lastActivityAt: new Date(),
    });

    logger.info(`Tokens updated for session: ${sessionId}`);
  }

  async updateActivity(sessionId: string): Promise<void> {
    await sessionRepository.update(sessionId, {
      lastActivityAt: new Date(),
    });
  }

  async revokeSession(sessionId: string, reason?: string): Promise<void> {
    const session = await sessionRepository.getById(sessionId);

    await sessionRepository.update(sessionId, {
      isActive: false,
      revokedAt: new Date(),
      revokedReason: reason,
    });

    logger.info(`Session revoked: ${sessionId}`, { reason });

    if (session.success && session.data) {
      const { socketService } = await import("@/services");
      socketService.broadcastSessionRevoked(session.data.userId, sessionId, reason);
    }
  }

  async revokeUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const result = await sessionRepository.getAll({
      filter: {
        userId,
        isActive: true,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
    });

    if (!result.success || !result.data) {
      return 0;
    }

    let count = 0;
    for (const session of result.data) {
      if (session.id !== exceptSessionId) {
        await this.revokeSession(
          session.id,
          "User requested logout from all devices",
        );
        count++;
      }
    }

    logger.info(`Revoked ${count} sessions for user ${userId}`);
    return count;
  }

  async revokeAllSessions(userId: string): Promise<number> {
    return this.revokeUserSessions(userId);
  }

  async logout(sessionId: string): Promise<void> {
    await sessionRepository.update(sessionId, {
      isActive: false,
      logoutAt: new Date(),
    });

    logger.info(`User logged out: ${sessionId}`);
  }

  async getUserSessions(userId: string, activeOnly = false): Promise<Session[]> {
    const result = await sessionRepository.getAll({
      filter: {
        userId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      sort: "lastActivityAt",
      order: "desc",
    });

    return result.success && result.data ? result.data : [];
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await sessionRepository.getAll({
      filter: {
        expiresAt: { lt: new Date() },
        isActive: true,
      },
    });

    if (!result.success || !result.data) {
      return 0;
    }

    let count = 0;
    for (const session of result.data) {
      await sessionRepository.update(session.id, {
        isActive: false,
      });
      count++;
    }

    if (count > 0) {
      logger.info(`Cleaned up ${count} expired sessions`);
    }

    return count;
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await sessionRepository.getAll({
      filter: {
        expiresAt: { lt: new Date() },
      },
    });

    if (!result.success || !result.data) {
      return 0;
    }

    let count = 0;
    for (const session of result.data) {
      const deleteResult = await sessionRepository.delete(session.id);
      if (deleteResult.success) {
        count++;
      }
    }

    if (count > 0) {
      logger.info(`Deleted ${count} expired sessions`);
    }

    return count;
  }

  private async expireSession(sessionId: string): Promise<void> {
    await sessionRepository.update(sessionId, {
      isActive: false,
    });
  }

  async flagSuspiciousSession(sessionId: string, reason: string): Promise<void> {
    await sessionRepository.update(sessionId, {
      isSuspicious: true,
      suspiciousReason: reason,
    });

    logger.warn(`Session flagged as suspicious: ${sessionId}`, { reason });
  }

  async enforceConcurrentSessionLimit(userId: string, maxSessions: number): Promise<void> {
    const result = await sessionRepository.getAll({
      filter: {
        userId,
        isActive: true,
      },
      sort: "lastActivityAt",
      order: "asc",
    });

    if (!result.success || !result.data) {
      return;
    }

    const activeSessions = result.data;

    if (activeSessions.length > maxSessions) {
      const sessionsToRevoke = activeSessions.slice(0, activeSessions.length - maxSessions);

      for (const session of sessionsToRevoke) {
        await this.revokeSession(session.id, "Exceeded concurrent session limit");
      }

      logger.info(
        `Enforced session limit for user ${userId}: revoked ${sessionsToRevoke.length} sessions`,
      );
    }
  }

  async getActiveSessionCount(userId: string): Promise<number> {
    const result = await sessionRepository.getAll({
      filter: {
        userId,
        isActive: true,
      },
    });

    return result.success && result.data ? result.data.length : 0;
  }

  async getSessionStats(userId: string): Promise<SessionStats> {
    const allSessions = await sessionRepository.getAll({ filter: { userId } });
    const activeSessions = await sessionRepository.getAll({
      filter: { userId, isActive: true },
    });
    const expiredSessions = await sessionRepository.getAll({
      filter: { userId, expiresAt: { lt: new Date() } },
    });
    const revokedSessions = await sessionRepository.getAll({
      filter: { userId, revokedAt: { not: null } },
    });
    const suspiciousSessions = await sessionRepository.getAll({
      filter: { userId, isSuspicious: true },
    });

    return {
      totalSessions: allSessions.success && allSessions.data ? allSessions.data.length : 0,
      activeSessions: activeSessions.success && activeSessions.data ? activeSessions.data.length : 0,
      expiredSessions:
        expiredSessions.success && expiredSessions.data ? expiredSessions.data.length : 0,
      revokedSessions:
        revokedSessions.success && revokedSessions.data ? revokedSessions.data.length : 0,
      suspiciousSessions:
        suspiciousSessions.success && suspiciousSessions.data
          ? suspiciousSessions.data.length
          : 0,
    };
  }

  async getAllSessions(params: any) {
    return sessionRepository.getAll(params);
  }

  async getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      activeSessionsCount,
      totalSessionsCount,
      recentLogins24h,
      recentLogins7d,
      recentLogins30d,
      failedLogins24h,
      failedLogins7d,
      failedLogins30d,
      sessionsByUserRaw,
      recentlyRevokedRaw,
      suspiciousSessions,
    ] = await Promise.all([
      prisma.session.count({
        where: { isActive: true },
      }),
      prisma.session.count(),
      prisma.session.count({
        where: { loginAt: { gte: last24h } },
      }),
      prisma.session.count({
        where: { loginAt: { gte: last7d } },
      }),
      prisma.session.count({
        where: { loginAt: { gte: last30d } },
      }),
      prisma.loginHistory.count({
        where: {
          success: false,
          timestamp: { gte: last24h },
        },
      }),
      prisma.loginHistory.count({
        where: {
          success: false,
          timestamp: { gte: last7d },
        },
      }),
      prisma.loginHistory.count({
        where: {
          success: false,
          timestamp: { gte: last30d },
        },
      }),
      prisma.session.groupBy({
        by: ["userId"],
        where: { isActive: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.session.findMany({
        where: {
          revokedAt: { not: null },
        },
        orderBy: { revokedAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      }),
      prisma.session.count({
        where: { isSuspicious: true },
      }),
    ]);

    const userIds = sessionsByUserRaw.map(s => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const sessionsByUser = sessionsByUserRaw.map((s) => {
      const user = userMap.get(s.userId);
      return {
        userId: s.userId,
        username: user?.username || "Unknown",
        firstName: user?.employee?.firstName,
        lastName: user?.employee?.lastName,
        activeSessionCount: s._count.id,
      };
    });

    const recentlyRevokedSessions = recentlyRevokedRaw.map(s => ({
      id: s.id,
      userId: s.userId,
      username: s.user.username,
      revokedAt: s.revokedAt!,
      revokedReason: s.revokedReason,
      deviceName: s.deviceName,
      ipAddress: s.ipAddress,
    }));

    return {
      activeSessionsCount,
      totalSessionsCount,
      recentLoginActivity: {
        last24h: recentLogins24h,
        last7d: recentLogins7d,
        last30d: recentLogins30d,
      },
      failedLoginAttempts: {
        last24h: failedLogins24h,
        last7d: failedLogins7d,
        last30d: failedLogins30d,
      },
      sessionsByUser,
      recentlyRevokedSessions,
      suspiciousActivityCount: suspiciousSessions,
    };
  }
}
