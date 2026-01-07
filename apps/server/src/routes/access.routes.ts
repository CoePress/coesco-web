import type { NextFunction, Request, Response } from "express";

import bcrypt from "bcryptjs";
import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";

import { errors } from "../lib/errors";
import logger from "../lib/logger";
import { prisma } from "../lib/prisma";
import { protect, requireRole } from "../middleware/protect";
import { ListQuerySchema, UUIDSchema } from "../validators/form";

const accessRouter = Router();

// ======================= PUBLIC ROUTES =======================

const AccessRequestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  title: z.string().optional(),
  department: z.string().optional(),
  reason: z.string().optional(),
});

// Submit access request (public)
accessRouter.post("/request", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = AccessRequestSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { username: input.email },
    });

    if (existingUser) {
      // Don't reveal if user exists, but don't create duplicate request
      return res.json({ ok: true });
    }

    // Check for existing pending request
    const existingRequest = await prisma.accessRequest.findFirst({
      where: { email: input.email, status: "PENDING" },
    });

    if (existingRequest) {
      return res.json({ ok: true });
    }

    await prisma.accessRequest.create({
      data: input,
    });

    logger.info("access_request_created", { email: input.email });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Validate invite token (public)
accessRouter.get("/invite/:token", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invite = await prisma.invite.findUnique({
      where: { tokenHash },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw errors.badRequest("Invalid or expired invite");
    }

    res.json({
      success: true,
      data: {
        email: invite.email,
        firstName: invite.firstName,
        lastName: invite.lastName,
      },
    });
  } catch (err) {
    next(err);
  }
});

const RegisterWithInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

// Complete registration with invite (public)
accessRouter.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = RegisterWithInviteSchema.parse(req.body);

    const tokenHash = crypto.createHash("sha256").update(input.token).digest("hex");

    const invite = await prisma.invite.findUnique({
      where: { tokenHash },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw errors.badRequest("Invalid or expired invite");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { username: invite.email },
    });

    if (existingUser) {
      throw errors.badRequest("An account with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user and employee in transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: invite.email,
          password: hashedPassword,
          role: invite.role,
          isActive: true,
        },
      });

      // Generate employee number
      const lastEmployee = await tx.employee.findFirst({
        orderBy: { number: "desc" },
      });
      const nextNumber = lastEmployee
        ? String(parseInt(lastEmployee.number) + 1).padStart(4, "0")
        : "0001";

      await tx.employee.create({
        data: {
          userId: user.id,
          number: nextNumber,
          firstName: input.firstName,
          lastName: input.lastName,
          initials: `${input.firstName[0]}${input.lastName[0]}`.toUpperCase(),
          title: "Employee",
          email: invite.email,
          createdById: invite.createdById,
          updatedById: invite.createdById,
        },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
    });

    logger.info("user_registered_via_invite", { email: invite.email });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ======================= PROTECTED ADMIN ROUTES =======================

accessRouter.use(protect);
accessRouter.use(requireRole("ADMIN"));

// List access requests
accessRouter.get("/requests", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ListQuerySchema.parse(req.query);
    const { page, limit, sort, order, filter } = query;

    const skip = (page - 1) * limit;
    const orderBy = sort ? { [sort]: order } : { createdAt: "desc" as const };

    let where: any = {};
    if (filter) {
      try {
        where = JSON.parse(filter);
      } catch {
        // ignore invalid filter
      }
    }

    const [requests, total] = await Promise.all([
      prisma.accessRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.accessRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: requests,
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

const ApproveRequestSchema = z.object({
  employeeNumber: z.string().optional(),
  title: z.string().optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

// Approve access request
accessRouter.post("/requests/:id/approve", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);
    const input = ApproveRequestSchema.parse(req.body);
    const adminId = (req as any).userId;

    const request = await prisma.accessRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw errors.notFound("Access request not found");
    }

    if (request.status !== "PENDING") {
      throw errors.badRequest("Request has already been processed");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { username: request.email },
    });

    if (existingUser) {
      throw errors.badRequest("A user with this email already exists");
    }

    // Create user and employee
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: request.email,
          role: input.role || "USER",
          isActive: true,
        },
      });

      // Generate employee number
      let employeeNumber = input.employeeNumber;
      if (!employeeNumber) {
        const lastEmployee = await tx.employee.findFirst({
          orderBy: { number: "desc" },
        });
        employeeNumber = lastEmployee
          ? String(parseInt(lastEmployee.number) + 1).padStart(4, "0")
          : "0001";
      }

      await tx.employee.create({
        data: {
          userId: user.id,
          number: employeeNumber,
          firstName: request.firstName,
          lastName: request.lastName,
          initials: `${request.firstName[0]}${request.lastName[0]}`.toUpperCase(),
          title: input.title || request.title || "Employee",
          email: request.email,
          createdById: adminId,
          updatedById: adminId,
        },
      });

      await tx.accessRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: adminId,
        },
      });
    });

    logger.info("access_request_approved", { requestId: id, email: request.email });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const DenyRequestSchema = z.object({
  reason: z.string().optional(),
});

// Deny access request
accessRouter.post("/requests/:id/deny", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);
    const input = DenyRequestSchema.parse(req.body);
    const adminId = (req as any).userId;

    const request = await prisma.accessRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw errors.notFound("Access request not found");
    }

    if (request.status !== "PENDING") {
      throw errors.badRequest("Request has already been processed");
    }

    await prisma.accessRequest.update({
      where: { id },
      data: {
        status: "DENIED",
        reviewedAt: new Date(),
        reviewedBy: adminId,
        reviewNotes: input.reason,
      },
    });

    logger.info("access_request_denied", { requestId: id, email: request.email });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// List invites
accessRouter.get("/invites", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ListQuerySchema.parse(req.query);
    const { page, limit, sort, order } = query;

    const skip = (page - 1) * limit;
    const orderBy = sort ? { [sort]: order } : { createdAt: "desc" as const };

    const [invites, total] = await Promise.all([
      prisma.invite.findMany({
        skip,
        take: limit,
        orderBy,
      }),
      prisma.invite.count(),
    ]);

    res.json({
      success: true,
      data: invites,
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

const CreateInviteSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

// Create invite
accessRouter.post("/invites", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = CreateInviteSchema.parse(req.body);
    const adminId = (req as any).userId;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { username: input.email },
    });

    if (existingUser) {
      throw errors.badRequest("A user with this email already exists");
    }

    // Invalidate any existing invites for this email
    await prisma.invite.updateMany({
      where: { email: input.email, acceptedAt: null },
      data: { acceptedAt: new Date() }, // Mark as used
    });

    // Generate invite token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invite = await prisma.invite.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role || "USER",
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdById: adminId,
      },
    });

    const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/register?token=${token}`;

    logger.info("invite_created", {
      inviteId: invite.id,
      email: input.email,
      token, // Only log in dev
      inviteUrl,
    });

    res.json({
      success: true,
      data: {
        id: invite.id,
        email: invite.email,
        inviteUrl, // In production, send via email instead
      },
    });
  } catch (err) {
    next(err);
  }
});

// Delete/revoke invite
accessRouter.delete("/invites/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);

    await prisma.invite.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default accessRouter;
