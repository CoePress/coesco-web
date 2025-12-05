import type { Request, Response } from "express";

import { cookieOptions } from "@/config/env";
import { authService, sessionService } from "@/services";
import { asyncWrapper } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

export class AuthController {
  login = asyncWrapper(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const result = await authService.login(username, password, req);
    res.cookie("accessToken", result.token, cookieOptions);
    res.cookie("refreshToken", result.refreshToken, cookieOptions);
    res.status(HTTP_STATUS.OK).json(result);
  });

  microsoftLogin = asyncWrapper(async (_req: Request, res: Response) => {
    const result = await authService.microsoftLogin();
    res.json(result);
  });

  microsoftCallback = asyncWrapper(async (req: Request, res: Response) => {
    const { code, state } = req.body;
    const result = await authService.microsoftCallback(
      code as string,
      state as string,
      req,
    );

    res.cookie("accessToken", result.token, cookieOptions);
    res.cookie("refreshToken", result.refreshToken, cookieOptions);
    res.status(HTTP_STATUS.OK).json(result);
  });

  logout = asyncWrapper(async (req: Request, res: Response) => {
    const { accessToken } = req.cookies;

    if (accessToken) {
      const session = await sessionService.validateSession(accessToken);
      if (session) {
        await sessionService.logout(session.id);
      }
    }

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.json({ message: "Logged out successfully" });
  });

  session = asyncWrapper(async (req: Request, res: Response) => {
    const { accessToken } = req.cookies;
    const result = await authService.session(accessToken);
    res.status(HTTP_STATUS.OK).json(result);
  });

  refresh = asyncWrapper(async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.cookies;
      const result = await authService.refreshAccessToken(refreshToken, req);
      res.cookie("accessToken", result.token, cookieOptions);
      res.cookie("refreshToken", result.refreshToken, cookieOptions);
      res.status(HTTP_STATUS.OK).json(result);
    }
    catch (error) {
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);
      throw error;
    }
  });
}
