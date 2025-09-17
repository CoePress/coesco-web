import type { UserRole } from "@prisma/client";

import { Router } from "express";

import { permissionService } from "@/services";

const router = Router();

router.get("/", async (req: any, res) => {
  const result = await permissionService.getAllPermissions();
  res.json(result);
});

router.get("/roles", async (req: any, res) => {
  const result = await permissionService.getAllRolePermissions();
  res.json(result);
});

router.post("/check", async (req: any, res) => {
  const { permissions, requireAll = false } = req.body;
  const userRole = req.user?.role;

  if (!userRole) {
    return res.status(401).json({
      success: false,
      error: "User not authenticated",
    });
  }

  const result = await permissionService.checkPermissions(userRole, permissions, requireAll);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

router.get("/me", async (req: any, res) => {
  const userRole = req.user?.role;

  if (!userRole) {
    return res.status(401).json({
      success: false,
      error: "User not authenticated",
    });
  }

  const result = await permissionService.getUserPermissions(userRole as UserRole);
  res.json(result);
});

router.get("/categories/:category", async (req: any, res) => {
  const { category } = req.params;
  const result = await permissionService.getCategoryPermissions(category);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
});

export default router;
