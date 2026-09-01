import express, { type Request, type Response } from "express";
import { db } from "@/prisma/db";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const users = await db.orm.public.User.all();
  res.json(users);
});

router.post("/", async (req: Request, res: Response) => {
  const { username, passwordHash, name } = req.body;
  const newUser = await db.orm.public.User.create({
    username,
    passwordHash,
    name,
  });
  res.status(201).json(newUser);
});

export default router;
