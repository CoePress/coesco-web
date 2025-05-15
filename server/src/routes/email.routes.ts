import { Router } from "express";
import { emailController } from "../controllers";

const router = Router();

router.get("/templates", emailController.getTemplates);
router.get("/templates/:slug", emailController.getTemplate);
router.post("/templates", emailController.saveTemplate);
router.delete("/templates/:slug", emailController.deleteTemplate);
router.post("/send", emailController.sendEmail);

export default router;
