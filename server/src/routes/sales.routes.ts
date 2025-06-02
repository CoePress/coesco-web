import { salesController } from "@/controllers";
import { RequestHandler, Router } from "express";

const router = Router();

router.post("/sandbox", salesController.createSandboxQuote as RequestHandler);

export default router;
