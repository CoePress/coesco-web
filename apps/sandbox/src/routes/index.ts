import { Router } from "express";
import accountRouter from "./account.routes"
import contactRouter from "./contact.routes"
import authRouter from "./auth.routes";
import { protect } from "../middleware/protect";

const router = Router();

router.use('/auth', authRouter);

router.use(protect)
router.use('/accounts', accountRouter);
router.use('/contacts', contactRouter);

export default router;