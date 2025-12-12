import { Router } from "express";
import { requireRole } from "../middleware/protect";

const adminRouter = Router();

adminRouter.use(requireRole("ADMIN"));
adminRouter.get("/", (req, res) => {
  res.send("Admin dashboard");
});

export default adminRouter;