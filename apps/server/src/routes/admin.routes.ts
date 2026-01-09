import type { NextFunction, Request, Response } from "express";

import { Router } from "express";
import { z } from "zod";

import { requireRole } from "../middleware/protect";
import { backupService } from "../lib/backup";
import { errors } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { ListQuerySchema, UUIDSchema } from "../validators/form";

const UpdateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

const adminRouter = Router();

adminRouter.use(requireRole("ADMIN"));

// ======================= USERS =======================

// LIST USERS
adminRouter.get("/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ListQuerySchema.parse(req.query);
    const { page, limit, sort, order, filter } = query;

    const skip = (page - 1) * limit;
    const orderBy = sort ? { [sort]: order } : { createdAt: "desc" as const };

    let where = {};
    if (filter) {
      try {
        where = JSON.parse(filter);
      } catch {
        // ignore invalid filter
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// UPDATE USER (activate/deactivate, change role)
adminRouter.patch("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);
    const patch = UpdateUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw errors.notFound("User not found");
    }

    const user = await prisma.user.update({
      where: { id },
      data: patch,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ======================= EMPLOYEES =======================

// LIST EMPLOYEES
adminRouter.get("/employees", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ListQuerySchema.parse(req.query);
    const { page, limit, sort, order, filter } = query;

    const skip = (page - 1) * limit;
    const orderBy = sort ? { [sort]: order } : { lastName: "asc" as const };

    let where: any = { deletedAt: null };
    if (filter) {
      try {
        const filterObj = JSON.parse(filter);
        where = { ...where, ...filterObj };
      } catch {
        // ignore invalid filter
      }
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              isActive: true,
            },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      success: true,
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ======================= BACKUPS =======================

// LIST BACKUPS
adminRouter.get("/backups", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const backups = await backupService.listBackups();
    const stats = await backupService.getStats();

    res.json({
      success: true,
      data: backups,
      meta: {
        ...stats,
        backupDirectory: backupService.backupDirectory,
        retentionDays: backupService.retention,
      },
    });
  } catch (err) {
    next(err);
  }
});

// CREATE BACKUP
adminRouter.post("/backups", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await backupService.createBackup();

    if (!result.success) {
      throw errors.internal(result.error || "Backup failed");
    }

    res.status(201).json({
      success: true,
      data: { filename: result.filename },
    });
  } catch (err) {
    next(err);
  }
});

// VERIFY BACKUP
adminRouter.post("/backups/:filename/verify", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;

    if (!filename || !filename.endsWith(".sql.gz")) {
      throw errors.badRequest("Invalid backup filename");
    }

    const isValid = await backupService.verifyBackup(filename);

    res.json({
      success: true,
      data: { filename, valid: isValid },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE BACKUP
adminRouter.delete("/backups/:filename", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;

    if (!filename || !filename.endsWith(".sql.gz")) {
      throw errors.badRequest("Invalid backup filename");
    }

    const result = await backupService.deleteBackup(filename);

    if (!result.success) {
      throw errors.internal(result.error || "Delete failed");
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// RESTORE BACKUP (dangerous - requires confirmation)
adminRouter.post("/backups/:filename/restore", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const { confirm } = req.body;

    if (!filename || !filename.endsWith(".sql.gz")) {
      throw errors.badRequest("Invalid backup filename");
    }

    if (confirm !== "RESTORE") {
      throw errors.badRequest("Must confirm restore with body: { confirm: \"RESTORE\" }");
    }

    const result = await backupService.restoreBackup(filename);

    if (!result.success) {
      throw errors.internal(result.error || "Restore failed");
    }

    res.json({
      success: true,
      data: { filename, restored: true },
    });
  } catch (err) {
    next(err);
  }
});

export default adminRouter;
