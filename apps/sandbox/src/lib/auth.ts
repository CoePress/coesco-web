import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { Response } from "express";
import env, { __prod__ } from "./env";

export type AccessClaims = {
  sub: string; // userId
};

export function signAccessToken(claims: AccessClaims) {
  return jwt.sign(claims, env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): AccessClaims {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessClaims;
}

// refresh token is just a random secret; store only hash server-side
export function newRefreshToken() {
  const token = crypto.randomBytes(48).toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: __prod__,
    sameSite: "lax" as const,
    path: "/",
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("access", accessToken, { ...cookieOptions(), maxAge: 15 * 60 * 1000 });
  res.cookie("refresh", refreshToken, { ...cookieOptions(), maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("access", { ...cookieOptions() });
  res.clearCookie("refresh", { ...cookieOptions() });
}
