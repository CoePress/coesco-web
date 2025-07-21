import { Router } from "express";
import { lockController } from "@/controllers";

const router = Router();

router.post("/acquire", lockController.acquireLock);
router.post("/release", lockController.releaseLock);
router.post("/force-release", lockController.forceReleaseLock);
router.post("/extend", lockController.extendLock);
router.get("/status/:recordType/:recordId", lockController.getLockStatus);
router.get("/", lockController.getAllLocks);
router.get("/:recordType", lockController.getAllLocksByRecordType);
router.post("/clear-all", lockController.clearAllLocks);

export default router;
