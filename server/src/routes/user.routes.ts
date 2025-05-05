import { Router, Request, Response } from "express";

import Services from "@/services";
import { IQueryParams } from "@/utils/types";

export const userRoutes = (services: Services) => {
  const router = Router();

  router.get("/", async (req: Request, res: Response) => {
    const params = req.query as IQueryParams;
    const users = await services.user.getUsers(params);
    res.json(users);
  });

  router.post("/sync", async (req: Request, res: Response) => {
    const syncResult = await services.user.syncMicrosoftUsers();
    res.json(syncResult);
  });

  router.patch("/:id", async (req: Request, res: Response) => {
    const user = await services.user.updateUser(req.params.id, req.body);
    res.json(user);
  });

  return router;
};
