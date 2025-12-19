import { Router } from "express";

import { protect } from "../middleware/protect";
import accountRouter from "./account.routes";
import adminRouter from "./admin.routes";
import authRouter from "./auth.routes";
import contactRouter from "./contact.routes";
import formRouter from "./form.routes";

const router = Router();

router.use("/auth", authRouter);

router.use(protect);
router.use("/admin", adminRouter);
router.use("/accounts", accountRouter);
router.use("/contacts", contactRouter);
router.use("/forms", formRouter);

export default router;
