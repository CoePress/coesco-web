import { Router } from "express";

import Services from "@/services";
import { IQueryParams } from "@/utils/types";

export const stateRoutes = (services: Services) => {
  const router = Router();

  router.get("/", async (req, res) => {
    const params = req.query as IQueryParams;
    const states = await services.stateService.getStates(params);
    res.json(states);
  });

  router.get("/overview", async (req, res) => {
    const overview = await services.stateService.getStateOverview(
      req.query.startDate as string,
      req.query.endDate as string
    );
    res.json(overview);
  });

  router.get("/timeline", async (req, res) => {
    const timeline = await services.stateService.getStateTimeline(
      req.query.startDate as string,
      req.query.endDate as string
    );
    res.json(timeline);
  });

  return router;
};
