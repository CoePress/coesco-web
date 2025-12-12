import { NextFunction, Request, Response, Router } from "express";
import { CreateAccountSchema } from "../validators/account";
import { prisma } from "../lib/prisma";

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = CreateAccountSchema.parse(req.body);

    const account = await prisma.account.create({
      data: {
        ...input,
      },
    });

    res.status(201).json({ account });
  } catch (err) {
    next(err);
  }
});

router.get('/', () => {});
router.get('/:id', () => {});
router.patch('/:id', () => {});
router.delete('/:id', () => {});

export default router;