import bcrypt from "bcryptjs";
import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";

import { clearAuthCookies, newRefreshToken, setAuthCookies, signAccessToken } from "../lib/auth";
import { errors } from "../lib/errors";
import { graphAuthService } from "../lib/graph-auth";
import logger from "../lib/logger";
import { prisma } from "../lib/prisma";
import { protect } from "../middleware/protect";

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body as { username: string; password: string };

    const user = await prisma.user.findFirst({ where: { username } });
    if (!user)
      return res.status(401).json({ error: { message: "Invalid credentials" } });

    if (!(await bcrypt.compare(password, user.password ?? ""))) {
      return res.status(401).json({ error: { message: "Invalid credentials" } });
    }

    const access = signAccessToken({ sub: user.id });
    const { token: refresh, hash } = newRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    setAuthCookies(res, access, refresh);
    res.json({ ok: true });
  }
  catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const refresh = req.cookies?.refresh;
    if (!refresh)
      return res.status(401).json({ error: { message: "Unauthorized" } });

    const hash = crypto.createHash("sha256").update(refresh).digest("hex");

    const existing = await prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
    });

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      clearAuthCookies(res);
      return res.status(401).json({ error: { message: "Unauthorized" } });
    }

    // rotate
    await prisma.refreshToken.update({
      where: { tokenHash: hash },
      data: { revokedAt: new Date() },
    });

    const { token: nextRefresh, hash: nextHash } = newRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: existing.userId,
        tokenHash: nextHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const access = signAccessToken({ sub: existing.userId });
    setAuthCookies(res, access, nextRefresh);

    res.json({ ok: true });
  }
  catch (err) {
    next(err);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const refresh = req.cookies?.refresh;
    if (refresh) {
      const hash = crypto.createHash("sha256").update(refresh).digest("hex");
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    clearAuthCookies(res);
    res.json({ ok: true });
  }
  catch (err) {
    next(err);
  }
});

authRouter.get("/me", protect, async (req, res) => {
  res.json({ userId: (req as any).userId });
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);

    // Find user by email (username is email in this system)
    const user = await prisma.user.findFirst({
      where: { username: email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ ok: true });
    }

    // Invalidate any existing reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // In production, send email with reset link
    // For now, log the token in development
    logger.info("password_reset_token_created", {
      userId: user.id,
      token, // Only log in dev - remove in production
      resetUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = ResetPasswordSchema.parse(req.body);

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw errors.badRequest("Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens for security
      prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/microsoft", async (req, res, next) => {
  try {
    const returnUrl = (req.query.returnUrl as string) || "/";
    const state = Buffer.from(JSON.stringify({ returnUrl })).toString("base64url");
    const authUrl = await graphAuthService.getAuthorizationUrl(state);
    res.redirect(authUrl);
  }
  catch (err) {
    next(err);
  }
});

authRouter.get("/microsoft/callback", async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      logger.error("microsoft.callback_error", { error, error_description });
      return res.redirect(
        `/login?error=${encodeURIComponent((error_description as string) || (error as string))}`,
      );
    }

    if (!code) {
      return res.redirect("/login?error=no_code");
    }

    const result = await graphAuthService.handleCallback(code as string);

    const access = signAccessToken({ sub: result.userId });
    const { token: refresh, hash } = newRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: result.userId,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    setAuthCookies(res, access, refresh);

    let returnUrl = "/";
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state as string, "base64url").toString());
        returnUrl = decoded.returnUrl || "/";
      }
      catch {
        // ignore invalid state
      }
    }

    res.redirect(returnUrl);
  }
  catch (err: any) {
    logger.error("microsoft.callback_failed", { error: err.message });
    res.redirect(`/login?error=${encodeURIComponent(err.message)}`);
  }
});

authRouter.post("/microsoft/disconnect", protect, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    await graphAuthService.clearTokens(userId);
    res.json({ ok: true });
  }
  catch (err) {
    next(err);
  }
});

authRouter.get("/microsoft/status", protect, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const connected = await graphAuthService.isConnected(userId);
    res.json({ connected });
  }
  catch (err) {
    next(err);
  }
});

export default authRouter;
