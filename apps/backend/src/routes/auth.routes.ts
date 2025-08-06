import { Router } from "express";

const router = Router();

router.post("/login", () => {});
router.post("/login/microsoft", () => {});
router.post("/logout", () => { });

router.get("/callback/microsoft", () => {});
router.get("/session", () => {});

export default router;
