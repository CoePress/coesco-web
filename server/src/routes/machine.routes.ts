import { Router, Request, Response } from "express";

import Services from "@/services";

export const machineRoutes = (services: Services) => {
  const router = Router();

  router.post("/", async (req: Request, res: Response) => {
    const machine = await services.machineService.createMachine(req.body);
    res.json(machine);
  });

  router.get("/", async (req: Request, res: Response) => {
    const machines = await services.machineService.getMachines();
    res.json(machines);
  });

  router.get("/connections", async (req: Request, res: Response) => {
    const machines = await services.machineService.getMachines();
    const connections = await services.connectionService.getConnections();

    const machineConnections = machines.map((machine) => {
      return {
        ...machine,
        connection: connections.find(
          (connection) => connection.machineId === machine.id
        ),
      };
    });

    res.status(200).json(machineConnections);
  });

  router.get("/:id", async (req: Request, res: Response) => {
    const machine = await services.machineService.getMachine(req.params.id);
    res.json(machine);
  });

  router.patch("/:id", async (req: Request, res: Response) => {
    const machine = await services.machineService.updateMachine(
      req.params.id,
      req.body
    );
    res.json(machine);
  });

  router.delete("/:id", async (req: Request, res: Response) => {
    const machine = await services.machineService.deleteMachine(req.params.id);
    res.json(machine);
  });

  return router;
};
