import { Router, Request, Response } from "express";

import Services from "@/services";

export const connectionRoutes = (services: Services) => {
  const router = Router();

  router.post("/", async (req: Request, res: Response) => {
    const connection = await services.connectionService.createConnection(
      req.body
    );
    res.json(connection);
  });

  router.get("/", async (req: Request, res: Response) => {
    const connections = await services.connectionService.getConnections();
    res.json(connections);
  });

  router.get("/:id", async (req: Request, res: Response) => {
    const connection = await services.connectionService.getConnection(
      req.params.id
    );
    res.json(connection);
  });

  router.patch("/:id", async (req: Request, res: Response) => {
    const connection = await services.connectionService.updateConnection(
      req.params.id,
      req.body
    );
    res.json(connection);
  });

  router.delete("/:id", async (req: Request, res: Response) => {
    const connection = await services.connectionService.deleteConnection(
      req.params.id
    );
    res.json(connection);
  });

  return router;
};
