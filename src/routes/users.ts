import express, { type Request, type Response } from "express";
import { genSaltSync, hashSync, compareSync } from "bcrypt-ts";
import jwt from "jsonwebtoken";
import { db } from "@/prisma/db";
import authenticateToken from "@/middleware/auth";

const router = express.Router();
const salt = genSaltSync(10);

router.get("/", async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    console.log("User model keys:", Object.keys(db.orm.public.User));
    console.log(
      "User prototype keys:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(db.orm.public.User)),
    );
    const users = await db.orm.public.User.limit(10).all();

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get(
  "/:username",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      const user = await db.orm.public.User.where({
        username: username,
      }).first();

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await db.orm.public.User.where({ username: username }).first();

    if (!user) {
      return res
        .status(400)
        .json({ message: "Incorrect username or password" });
    }

    if (!compareSync(password, user.passwordHash)) {
      return res
        .status(400)
        .json({ message: "Incorrect username or password" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    res.status(200).json(token);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  const { username, password, name } = req.body;
  const passwordHash = hashSync(password, salt);

  try {
    const newUser = await db.orm.public.User.create({
      username,
      passwordHash,
      name,
    });

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    res.status(201).json([newUser, token]);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
