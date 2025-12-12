import { Router } from "express";
import accountRouter from "./account.routes"
import authRouter from "./auth.routes"
import contactRouter from "./contact.routes"

const router = Router();

router.use('/auth', authRouter);

// protect these routes
router.use('/accounts', accountRouter);
router.use('/contacts', contactRouter);

export default router;