import { Router, Request, Response } from "express";

import Services from "@/services";

export const connectionRoutes = (services: Services) => {
  const router = Router();

  router.post("/", async (req: Request, res: Response) => {
    const connection = await services.connection.createConnection(req.body);
    res.json(connection);
  });

  router.get("/", async (req: Request, res: Response) => {
    const connections = await services.connection.getConnections();
    res.json(connections);
  });

  router.get("/:id", async (req: Request, res: Response) => {
    const connection = await services.connection.getConnection(req.params.id);
    res.json(connection);
  });

  router.patch("/:id", async (req: Request, res: Response) => {
    const connection = await services.connection.updateConnection(
      req.params.id,
      req.body
    );
    res.json(connection);
  });

  router.delete("/:id", async (req: Request, res: Response) => {
    const connection = await services.connection.deleteConnection(
      req.params.id
    );
    res.json(connection);
  });

  return router;
};
