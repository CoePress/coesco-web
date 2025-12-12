import { Router } from "express";
import accountRouter from "./account.routes"
import contactRouter from "./contact.routes"
import authRouter from "./auth.routes";
import { protect } from "../middleware/protect";
import adminRouter from "./admin.routes";

const router = Router();

router.use('/auth', authRouter);

router.use(protect)
router.use('/admin', adminRouter);
router.use('/accounts', accountRouter);
router.use('/contacts', contactRouter);

export default router;