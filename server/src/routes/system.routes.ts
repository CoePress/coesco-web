import Services from "@/services";
import { Router } from "express";

export const systemRoutes = (services: Services) => {
  const router = Router();

  router.get("/status", (req, res) => {
    res.status(204).json({
      status: "Good",
    });
  });

  router.post("/start-fanuc", async (req, res) => {
    try {
      const status = await services.socket.sendStartToFanuc(req.body.data);
      res.status(200).json({
        message: status,
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  });

  router.post("/stop-fanuc", async (req, res) => {
    try {
      const status = await services.socket.sendStopToFanuc(req.body.data);
      res.status(200).json({
        message: status,
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  });

  return router;
};
