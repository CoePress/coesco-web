import { Router } from "express";

import { systemController } from "../controllers";

const router = Router();

router.get("/logs", systemController.getLogFiles);

router.get("/logs/:file", systemController.getLogFile);

router.get("/", (_req, res) => {
  res.send("OK");
});

export default router;
