import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { CreateAccountSchema, UpdateAccountSchema, UUIDSchema } from "../validators/account";
import { prisma } from "../lib/prisma";
import { errors } from "../lib/errors";

const accountRouter = Router();

// CREATE
accountRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = CreateAccountSchema.parse(req.body);

    const account = await prisma.account.create({
      data: { ...input },
    });

    res.status(201).json({ account });
  } catch (err) {
    next(err);
  }
});

// LIST
accountRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({ accounts });
  } catch (err) {
    next(err);
  }
});

// GET ONE
accountRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);

    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      if (!account) throw errors.notFound("Account not found");
    }

    res.json({ account });
  } catch (err) {
    next(err);
  }
});

// UPDATE
accountRouter.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);
    const patch = UpdateAccountSchema.parse(req.body);

    const account = await prisma.account.update({
      where: { id },
      data: patch,
    });

    res.json({ account });
  } catch (err) {
    next(err);
  }
});

// DELETE
accountRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UUIDSchema.parse(req.params);

    await prisma.account.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default accountRouter;
