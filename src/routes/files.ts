import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import jwt from "jsonwebtoken";
import { db } from "@/prisma/db";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {});

export default router;
