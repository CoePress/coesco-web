import { Router } from "express";

import { __prod__, env } from "@/config/env";
import { protect } from "@/middleware/auth-middleware";
import Services from "@/services";
import { IAuthRequest } from "@/utils/types";

export const authRoutes = (services: Services) => {
  const router = Router();

  router.post("/login", async (req, res, next) => {
    try {
      const response = await services.authService.login();
      res.cookie("auth_session", response.sessionId, {
        httpOnly: true,
        secure: __prod__,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ url: response.url });
    } catch (error) {
      next(error);
    }
  });

  router.get("/microsoft/callback", async (req, res) => {
    const sessionId = req.query.state as string;
    const authSession = req.cookies.auth_session;

    if (!services.authService.validateSession(sessionId, authSession)) {
      res.clearCookie("auth_session");
      return res.redirect(
        `${env.AZURE_FAILURE_REDIRECT}?error=invalid_session`
      );
    }

    try {
      const { token } = await services.authService.handleMicrosoftCallback(
        req.query.code as string,
        sessionId
      );

      res.clearCookie("auth_session");
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.redirect(env.AZURE_SUCCESS_REDIRECT);
    } catch (error) {
      res.clearCookie("auth_session");
      const errorMessage =
        error.message?.toLowerCase().replace(/\s+/g, "_") || "unknown_error";
      return res.redirect(
        `${env.AZURE_FAILURE_REDIRECT}?error=${errorMessage}`
      );
    }
  });

  router.get("/session", protect, async (req: IAuthRequest, res, next) => {
    try {
      const response = await services.authService.getSession(req.user);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout", protect, async (req, res, next) => {
    try {
      const response = await services.authService.logout();
      res.clearCookie("auth_token");
      res.clearCookie("auth_session");
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
