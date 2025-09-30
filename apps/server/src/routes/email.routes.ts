import { Router } from "express";

import { emailController } from "../controllers";

const router = Router();

router.post("/send", emailController.sendEmail);
router.post("/bug-report", emailController.sendBugReport);

export default router;
