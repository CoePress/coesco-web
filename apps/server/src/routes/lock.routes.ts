import { Router } from "express";
import { lockController } from "@/controllers";

const router = Router();

router.post("/acquire", lockController.acquireLock.bind(lockController));
router.post("/release", lockController.releaseLock.bind(lockController));
router.post(
  "/force-release",
  lockController.forceReleaseLock.bind(lockController)
);
router.post("/extend", lockController.extendLock.bind(lockController));
router.get("/status/:docId", lockController.getLockStatus.bind(lockController));
router.get("/all", lockController.getAllLocks.bind(lockController));
router.post("/clear-all", lockController.clearAllLocks.bind(lockController));

export default router;
