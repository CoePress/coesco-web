import { Router } from "express";
import { protect } from "../middleware/protect";
import crypto from "node:crypto";
import { clearAuthCookies, newRefreshToken, setAuthCookies, signAccessToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body as { username: string; password: string };

    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) return res.status(401).json({ error: { message: "Invalid credentials" } });

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
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const refresh = req.cookies?.refresh;
    if (!refresh) return res.status(401).json({ error: { message: "Unauthorized" } });

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
  } catch (err) {
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
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', protect, async (req, res) => {
  res.json({ userId: (req as any).userId });
});


export default authRouter;