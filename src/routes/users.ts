import express, { type Request, type Response } from "express";
import { genSaltSync, hashSync, compareSync } from "bcrypt-ts";
import { db } from "@/prisma/db";

const router = express.Router();
const salt = genSaltSync(10);

router.get("/", async (req: Request, res: Response) => {
  const users = await db.orm.public.User.all();
  res.json(users);
});

router.get("/:username", async (req: Request, res: Response) => {
  const users = await db.orm.public.User.all();
  res.json(users);
});

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await db.orm.public.User.where({ username: username }).first();
  const passwordHash = user.passwordHash;

  res.status(200).json(compareSync(password, passwordHash));
});

router.post("/register", async (req: Request, res: Response) => {
  const { username, password, name } = req.body;
  const passwordHash = hashSync(password, salt);
  const newUser = await db.orm.public.User.create({
    username,
    passwordHash,
    name,
  });
  res.status(201).json(newUser);
});

export default router;
