import { Router } from "express";

import { protect } from "../middleware/protect";
import accessRouter from "./access.routes";
import accountRouter from "./account.routes";
import adminRouter from "./admin.routes";
import authRouter from "./auth.routes";
import formRouter from "./form.routes";
import systemRouter from "./system.routes";

const router = Router();

export { systemRouter };

router.use("/auth", authRouter);
router.use("/access", accessRouter); // Has both public and protected routes

router.use(protect);
router.use("/admin", adminRouter);
router.use("/accounts", accountRouter);
router.use("/forms", formRouter);

export default router;
