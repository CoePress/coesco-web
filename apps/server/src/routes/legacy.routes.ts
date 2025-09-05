import { Router } from "express";

import { legacyController } from "@/controllers";

const router = Router();

router.get("/:database/tables", legacyController.getTables);
router.get("/:database/:table/fields", legacyController.getFields);

router.post("/:database/:table", legacyController.create);
router.get("/:database/:table", legacyController.getAll);
router.get("/:database/:table/:id", legacyController.getById);
router.patch("/:database/:table/:id", legacyController.update);
router.delete("/:database/:table/:id", legacyController.delete);

router.get("/:database/:table/filter/custom", legacyController.getAllByCustomFilter);

export default router;
